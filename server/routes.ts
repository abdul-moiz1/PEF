import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserProfileSchema, insertUserRolesSchema, insertOpportunitySchema, insertApplicationSchema, jobDetailsSchema, insertVideoSchema, insertLeaderSchema, insertGalleryImageSchema, insertMembershipTierSchema, insertMembershipApplicationSchema, type InsertOpportunity } from "@shared/schema";
import { Resend } from "resend";
import { verifyIdToken } from "./firebase-admin";
import { db } from "./firebase-admin";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { linkedInService } from "./linkedin-service";
import crypto from "crypto";
import multer from "multer";
import { Client as ObjectStorageClient } from "@replit/object-storage";
import { EmailService } from "./services/email.service";

const AUTO_APPROVE_JOBS = true;

const oauthStateStore = new Map<string, { timestamp: number; returnUrl?: string }>();

setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  oauthStateStore.forEach((value, key) => {
    if (now - value.timestamp > 10 * 60 * 1000) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => oauthStateStore.delete(key));
}, 60 * 1000);

async function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable not set');
  }
  
  return {
    client: new Resend(apiKey),
    fromEmail: "onboarding@resend.dev"
  };
}

async function verifyAuthToken(token: string): Promise<string> {
  if (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      throw new Error("Invalid or expired token");
    }
    return decodedToken.uid;
  } else {
    console.warn("⚠️ WARNING: Firebase Admin SDK not configured. Token verification is DISABLED. This is INSECURE for production!");
    const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return decodedToken.user_id;
  }
}

const completeRegistrationSchema = z.object({
  profile: insertUserProfileSchema.omit({ userId: true }),
  roles: z.object({
    professional: z.boolean().optional(),
    jobSeeker: z.boolean().optional(),
    employer: z.boolean().optional(),
    businessOwner: z.boolean().optional(),
    investor: z.boolean().optional(),
    admin: z.boolean().optional(),
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/complete-registration", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validationResult = completeRegistrationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: validationResult.error.issues 
        });
      }

      const { profile, roles } = validationResult.data;

      const token = authHeader.substring(7);
      
      let uid: string;
      let email: string;
      let displayName: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        console.warn("WARNING: Firebase Admin SDK not configured. Token verification is DISABLED. This is INSECURE for production!");
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
          email = decodedToken.email;
          displayName = profile.fullName;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet. Please contact support." });
      }

      // Allow registration to proceed even if user exists - completeRegistration will merge data
      const result = await storage.completeRegistration({
        userId: uid,
        email,
        displayName,
        profile,
        roles: {
          professional: roles.professional || false,
          jobSeeker: roles.jobSeeker || false,
          employer: roles.employer || false,
          businessOwner: roles.businessOwner || false,
          investor: roles.investor || false,
          admin: roles.admin || false,
        },
      });

      return res.json({
        success: true,
        message: "Registration completed successfully. Welcome!",
        user: result.user,
        profile: result.profile,
        roles: result.roles,
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ 
        error: "Registration failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        uid = decodedToken.user_id;
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const result = await storage.getUserWithRoles(uid);
      if (!result) {
        return res.status(404).json({ error: "User not found" });
      }

      await storage.updateUserLastLogin(uid);

      return res.json({ 
        user: result.user,
        roles: result.roles 
      });
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.get("/api/auth/linkedin", async (req, res) => {
    try {
      if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
        return res.status(500).json({ 
          error: "LinkedIn OAuth not configured. Please set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET." 
        });
      }

      const state = crypto.randomBytes(32).toString('hex');
      const requestedReturnUrl = (req.query.returnUrl as string) || '/register';
      
      const allowedReturnUrls = ['/register', '/'];
      const returnUrl = allowedReturnUrls.includes(requestedReturnUrl) 
        ? requestedReturnUrl 
        : '/register';
      
      oauthStateStore.set(state, { 
        timestamp: Date.now(),
        returnUrl 
      });
      
      const authUrl = linkedInService.getAuthorizationUrl(state);
      
      return res.json({ authUrl, state });
    } catch (error) {
      console.error("LinkedIn auth initiation error:", error);
      return res.status(500).json({ error: "Failed to initiate LinkedIn authorization" });
    }
  });

  app.get("/api/auth/linkedin/callback", async (req, res) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`/register?linkedin_error=${encodeURIComponent(error as string)}`);
      }

      if (!code || !state) {
        return res.redirect('/register?linkedin_error=missing_parameters');
      }

      const stateData = oauthStateStore.get(state as string);
      if (!stateData) {
        console.error('Invalid or expired OAuth state');
        return res.redirect('/register?linkedin_error=invalid_state');
      }

      oauthStateStore.delete(state as string);

      const accessToken = await linkedInService.getAccessToken(code as string);
      const profile = await linkedInService.getUserProfile(accessToken);

      const sessionToken = crypto.randomBytes(32).toString('hex');
      oauthStateStore.set(`profile_${sessionToken}`, {
        timestamp: Date.now(),
        returnUrl: JSON.stringify({
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          profilePicture: profile.profilePicture,
          headline: profile.headline,
          location: profile.location,
        })
      });

      const returnUrl = stateData.returnUrl || '/register';
      return res.redirect(`${returnUrl}?linkedin_session=${sessionToken}`);
    } catch (error) {
      console.error("LinkedIn callback error:", error);
      return res.redirect('/register?linkedin_error=auth_failed');
    }
  });

  app.get("/api/auth/linkedin/profile", async (req, res) => {
    try {
      const { session } = req.query;
      
      if (!session) {
        return res.status(400).json({ error: "Missing session token" });
      }

      const profileData = oauthStateStore.get(`profile_${session}`);
      if (!profileData || !profileData.returnUrl) {
        return res.status(404).json({ error: "Session not found or expired" });
      }

      oauthStateStore.delete(`profile_${session}`);

      return res.json(JSON.parse(profileData.returnUrl));
    } catch (error) {
      console.error("Error fetching LinkedIn profile:", error);
      return res.status(500).json({ error: "Failed to fetch profile data" });
    }
  });

  app.post("/api/opportunities", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        uid = decodedToken.user_id;
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || (!userWithRoles.roles?.employer && !userWithRoles.roles?.businessOwner)) {
        return res.status(403).json({ error: "Only employers and business owners can post opportunities" });
      }

      const opportunityType = req.body.type as string;
      
      if (userWithRoles.roles?.employer && !userWithRoles.roles?.businessOwner && opportunityType !== "job") {
        return res.status(403).json({ error: "Employers can only post job opportunities" });
      }

      if (userWithRoles.roles?.businessOwner && !userWithRoles.roles?.employer && opportunityType === "job") {
        return res.status(403).json({ error: "Business owners cannot post job opportunities (select employer role to post jobs)" });
      }

      if (req.body.details && opportunityType === "job") {
        const detailsValidation = jobDetailsSchema.safeParse(req.body.details);
        if (!detailsValidation.success) {
          return res.status(400).json({
            error: "Invalid job details",
            details: detailsValidation.error.issues
          });
        }
      }

      const approvalStatus = AUTO_APPROVE_JOBS ? "approved" : "pending";

      const opportunityData = {
        ...req.body,
        userId: uid,
      };

      const validationResult = insertOpportunitySchema.safeParse({
        ...opportunityData,
        approvalStatus,
      });

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: validationResult.error.issues 
        });
      }

      const opportunity = await storage.createOpportunity(validationResult.data);
      return res.json(opportunity);
    } catch (error) {
      console.error("Opportunity creation error:", error);
      return res.status(500).json({ error: "Failed to create opportunity" });
    }
  });

  app.get("/api/opportunities", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const type = req.query.type as string | undefined;
      const myOpportunities = req.query.myOpportunities === "true";

      if (myOpportunities) {
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.substring(7);
        let uid: string;

        if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } else {
          return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
        }

        const userWithRoles = await storage.getUserWithRoles(uid);
        if (!userWithRoles || (!userWithRoles.roles?.employer && !userWithRoles.roles?.businessOwner)) {
          return res.status(403).json({ error: "Only employers and business owners can view their posted opportunities" });
        }

        const opportunities = await storage.getOpportunitiesByUserId(uid);
        return res.json(opportunities);
      }

      const opportunities = await storage.getPublicOpportunities(type);
      return res.json(opportunities);
    } catch (error) {
      console.error("Opportunities fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  });

  app.patch("/api/opportunities/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        uid = decodedToken.user_id;
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const { id } = req.params;
      const opportunity = await storage.getOpportunityById(id);

      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }

      if (opportunity.userId !== uid) {
        return res.status(403).json({ error: "Not authorized to update this opportunity" });
      }

      const updateData = { ...req.body };
      delete updateData.approvalStatus;
      delete updateData.userId;
      delete updateData.id;

      if (updateData.details) {
        const detailsValidation = jobDetailsSchema.safeParse(updateData.details);
        if (!detailsValidation.success) {
          return res.status(400).json({
            error: "Invalid job details",
            details: detailsValidation.error.issues
          });
        }
      }

      const updated = await storage.updateOpportunity(id, updateData);
      return res.json(updated);
    } catch (error) {
      console.error("Opportunity update error:", error);
      return res.status(500).json({ error: "Failed to update opportunity" });
    }
  });

  app.delete("/api/opportunities/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        uid = decodedToken.user_id;
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const { id } = req.params;
      const opportunity = await storage.getOpportunityById(id);

      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }

      if (opportunity.userId !== uid) {
        return res.status(403).json({ error: "Not authorized to delete this opportunity" });
      }

      await storage.deleteOpportunity(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Opportunity deletion error:", error);
      return res.status(500).json({ error: "Failed to delete opportunity" });
    }
  });

  app.get("/api/admin/opportunities", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const opportunities = await storage.getAllOpportunities();
      return res.json(opportunities);
    } catch (error) {
      console.error("Admin opportunities fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  });

  app.post("/api/admin/opportunities", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      console.log("📝 Admin creating opportunity - received data:", { 
        type: req.body.type, 
        title: req.body.title,
        status: req.body.status,
        approvalStatus: req.body.approvalStatus 
      });

      const validationResult = insertOpportunitySchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request data",
          details: validationResult.error.issues
        });
      }

      console.log("✅ Validated data:", {
        type: validationResult.data.type,
        title: validationResult.data.title,
        status: validationResult.data.status,
        approvalStatus: validationResult.data.approvalStatus
      });

      const opportunity = await storage.createOpportunity(validationResult.data);
      console.log("🎉 Created opportunity:", {
        id: opportunity.id,
        title: opportunity.title,
        status: opportunity.status,
        approvalStatus: opportunity.approvalStatus
      });
      return res.json(opportunity);
    } catch (error) {
      console.error("Admin opportunity creation error:", error);
      return res.status(500).json({ error: "Failed to create opportunity" });
    }
  });

  app.patch("/api/admin/opportunities/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const opportunity = await storage.getOpportunityById(id);

      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }

      const allowedFields: Array<keyof InsertOpportunity> = [
        'type', 'title', 'description', 'sector', 'country', 'city',
        'budgetOrSalary', 'contactPreference', 'details', 'status', 'approvalStatus'
      ];

      const updateData: Partial<InsertOpportunity> = {};
      for (const field of allowedFields) {
        if (field in req.body) {
          updateData[field] = req.body[field];
        }
      }

      const updated = await storage.updateOpportunity(id, updateData);
      return res.json(updated);
    } catch (error) {
      console.error("Admin opportunity update error:", error);
      return res.status(500).json({ error: "Failed to update opportunity" });
    }
  });

  app.delete("/api/admin/opportunities/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const opportunity = await storage.getOpportunityById(id);

      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }

      await storage.deleteOpportunity(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Admin opportunity deletion error:", error);
      return res.status(500).json({ error: "Failed to delete opportunity" });
    }
  });

  // Bulk operations for opportunities
  app.post("/api/admin/opportunities/bulk-approve", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { opportunityIds } = req.body;
      if (!Array.isArray(opportunityIds) || opportunityIds.length === 0) {
        return res.status(400).json({ error: "Invalid opportunity IDs" });
      }

      await storage.bulkUpdateOpportunityApprovalStatus(opportunityIds, "approved");
      return res.json({ success: true });
    } catch (error) {
      console.error("Bulk approve error:", error);
      return res.status(500).json({ error: "Failed to approve opportunities" });
    }
  });

  app.post("/api/admin/opportunities/bulk-reject", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { opportunityIds } = req.body;
      if (!Array.isArray(opportunityIds) || opportunityIds.length === 0) {
        return res.status(400).json({ error: "Invalid opportunity IDs" });
      }

      await storage.bulkUpdateOpportunityApprovalStatus(opportunityIds, "rejected");
      return res.json({ success: true });
    } catch (error) {
      console.error("Bulk reject error:", error);
      return res.status(500).json({ error: "Failed to reject opportunities" });
    }
  });

  app.post("/api/admin/opportunities/bulk-delete", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { opportunityIds } = req.body;
      if (!Array.isArray(opportunityIds) || opportunityIds.length === 0) {
        return res.status(400).json({ error: "Invalid opportunity IDs" });
      }

      await storage.bulkDeleteOpportunities(opportunityIds);
      return res.json({ success: true });
    } catch (error) {
      console.error("Bulk delete error:", error);
      return res.status(500).json({ error: "Failed to delete opportunities" });
    }
  });

  app.post("/api/admin/opportunities/bulk-status", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { opportunityIds, status } = req.body;
      if (!Array.isArray(opportunityIds) || opportunityIds.length === 0) {
        return res.status(400).json({ error: "Invalid opportunity IDs" });
      }
      if (!status || !["open", "closed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await storage.bulkUpdateOpportunityStatus(opportunityIds, status);
      return res.json({ success: true });
    } catch (error) {
      console.error("Bulk status update error:", error);
      return res.status(500).json({ error: "Failed to update opportunity status" });
    }
  });

  app.post("/api/applications", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        uid = decodedToken.user_id;
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const validationResult = insertApplicationSchema.safeParse({
        opportunityId: req.body.opportunityId,
        userId: uid,
        status: req.body.status || "applied",
        metadata: req.body.metadata,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request data",
          details: validationResult.error.issues
        });
      }

      const opportunity = await storage.getOpportunityById(validationResult.data.opportunityId);

      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }

      if (opportunity.type !== "job") {
        return res.status(400).json({ error: "Can only apply to job opportunities" });
      }

      if (opportunity.status !== "open") {
        return res.status(400).json({ error: "This opportunity is no longer open" });
      }

      if (opportunity.approvalStatus !== "approved") {
        return res.status(400).json({ error: "This opportunity is not yet approved" });
      }

      const existingApplication = await storage.checkExistingApplication(
        uid,
        validationResult.data.opportunityId
      );

      if (existingApplication) {
        return res.status(409).json({ error: "You have already applied to this opportunity" });
      }

      const application = await storage.createApplication(validationResult.data);
      return res.json(application);
    } catch (error) {
      console.error("Application creation error:", error);
      
      if (error instanceof Error && error.message.includes("duplicate key")) {
        return res.status(409).json({ error: "You have already applied to this opportunity" });
      }
      
      return res.status(500).json({ error: "Failed to create application" });
    }
  });

  app.get("/api/applications/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        uid = decodedToken.user_id;
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const applications = await storage.getApplicationsByUser(uid);
      return res.json(applications);
    } catch (error) {
      console.error("Applications fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.get("/api/talent", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            return res.status(401).json({ error: "Invalid token format" });
          }
          const decodedToken = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          console.error("Token decode error:", decodeError);
          return res.status(401).json({ error: "Invalid token" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.employer) {
        return res.status(403).json({ error: "Only employers can browse talent" });
      }

      const role = req.query.role as "professional" | "jobSeeker";
      if (!role || (role !== "professional" && role !== "jobSeeker")) {
        return res.status(400).json({ error: "Valid role parameter required (professional or jobSeeker)" });
      }

      const talent = await storage.getTalentByRole(role);
      return res.json(talent);
    } catch (error) {
      console.error("Talent fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch talent" });
    }
  });

  app.get("/api/investors", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        uid = decodedToken.user_id;
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.businessOwner) {
        return res.status(403).json({ error: "Only business owners can view investors" });
      }

      const investors = await storage.getInvestors();
      return res.json(investors);
    } catch (error) {
      console.error("Investors fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch investors" });
    }
  });

  app.get("/api/business-owners", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        uid = decodedToken.user_id;
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.investor) {
        return res.status(403).json({ error: "Only investors can view business owners" });
      }

      const businessOwners = await storage.getBusinessOwners();
      return res.json(businessOwners);
    } catch (error) {
      console.error("Business owners fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch business owners" });
    }
  });

  app.post("/api/users/assign-roles", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        uid = decodedToken.user_id;
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const { roles } = req.body;
      if (!roles || typeof roles !== "object") {
        return res.status(400).json({ error: "Roles object is required" });
      }

      const currentUser = await storage.getUserWithRoles(uid);
      const currentAdminStatus = currentUser?.roles?.admin || false;

      await storage.updateUserRoles(uid, {
        professional: roles.professional || false,
        jobSeeker: roles.jobSeeker || false,
        employer: roles.employer || false,
        businessOwner: roles.businessOwner || false,
        investor: roles.investor || false,
        admin: currentAdminStatus,
      });

      return res.json({ success: true, message: "Roles updated successfully" });
    } catch (error) {
      console.error("Role assignment error:", error);
      return res.status(500).json({ error: "Failed to assign roles" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        uid = decodedToken.user_id;
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      return res.json(users);
    } catch (error) {
      console.error("Admin users fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        uid = decodedToken.user_id;
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const stats = await storage.getAdminStats();
      return res.json(stats);
    } catch (error) {
      console.error("Admin stats fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users/download-csv", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      let users = await storage.getAllUsers();
      
      const countryFilter = req.query.country as string | undefined;
      if (countryFilter) {
        users = users.filter((user: any) => {
          const userCountry = user.profile?.country;
          return userCountry && userCountry === countryFilter;
        });
      }

      const safeDate = (dateValue: any): string => {
        if (!dateValue) return "";
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return "";
          return date.toISOString();
        } catch {
          return "";
        }
      };

      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return "";
        
        let str: string;
        let isArray = false;
        
        if (Array.isArray(value)) {
          str = value.map(item => String(item)).join("; ");
          isArray = true;
        } else {
          str = String(value);
        }
        
        const needsQuoting = isArray || str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r");
        
        if (needsQuoting) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvHeaders = [
        "User ID",
        "Email",
        "Display Name",
        "Approval Status",
        "Created At",
        "Last Login",
        "Pre-Registered",
        "Registration Source",
        "Full Name",
        "Phone",
        "Country",
        "City",
        "Languages",
        "Headline",
        "Bio",
        "LinkedIn URL",
        "Website URL",
        "Portfolio URL",
        "Is Professional",
        "Is Job Seeker",
        "Is Employer",
        "Is Business Owner",
        "Is Investor",
        "Is Admin",
        "Years of Experience",
        "Industry",
        "Skills",
        "Certifications",
        "Current Job Title",
        "Current Employer",
        "Target Job Titles",
        "Preferred Industries",
        "Employment Type",
        "Salary Expectation Min",
        "Salary Expectation Max",
        "Availability",
        "Willing to Relocate",
        "Target Countries",
        "Company Name",
        "Employer Industry",
        "Business Name",
        "Business Industry",
        "Company Size",
        "Years in Operation",
        "Business Country",
        "Business City",
        "Looking For",
        "Revenue Range",
        "Capital Required",
        "Expansion Countries",
        "Investment Range Min",
        "Investment Range Max",
        "Preferred Sectors",
        "Preferred Investment Countries",
        "Investment Stage",
        "Investment Type",
        "Investment Thesis",
        "Contact Preference"
      ];

      const csvRows = users.map(user => {
        const profile = user.profile || {};
        const roles = user.roles || {};
        const professionalData = user.professionalData || {};
        const jobSeekerData = user.jobSeekerData || {};
        const employerData = user.employerData || {};
        const businessOwnerData = user.businessOwnerData || {};
        const investorData = user.investorData || {};

        return [
          user.uid,
          user.email,
          user.displayName,
          user.approvalStatus,
          safeDate(user.createdAt),
          safeDate(user.lastLogin),
          user.preRegistered,
          user.registrationSource,
          profile.fullName,
          profile.phone,
          profile.country,
          profile.city,
          profile.languages,
          profile.headline,
          profile.bio,
          profile.linkedinUrl,
          profile.websiteUrl,
          profile.portfolioUrl,
          roles.isProfessional || roles.professional,
          roles.isJobSeeker || roles.jobSeeker,
          roles.isEmployer || roles.employer,
          roles.isBusinessOwner || roles.businessOwner,
          roles.isInvestor || roles.investor,
          roles.isAdmin || roles.admin,
          professionalData.yearsOfExperience,
          professionalData.industry,
          professionalData.skills,
          professionalData.certifications,
          professionalData.currentJobTitle,
          professionalData.currentEmployer,
          jobSeekerData.targetJobTitles,
          jobSeekerData.preferredIndustries,
          jobSeekerData.employmentType,
          jobSeekerData.salaryExpectationMin,
          jobSeekerData.salaryExpectationMax,
          jobSeekerData.availability,
          jobSeekerData.willingToRelocate,
          jobSeekerData.targetCountries,
          employerData.companyName,
          employerData.industry,
          businessOwnerData.businessName,
          businessOwnerData.industry,
          businessOwnerData.companySize,
          businessOwnerData.yearsInOperation,
          businessOwnerData.country,
          businessOwnerData.city,
          businessOwnerData.lookingFor,
          businessOwnerData.revenueRange,
          businessOwnerData.capitalRequired,
          businessOwnerData.expansionCountries,
          investorData.investmentRangeMin,
          investorData.investmentRangeMax,
          investorData.preferredSectors,
          investorData.preferredCountries,
          investorData.investmentStage,
          investorData.investmentType,
          investorData.investmentThesis,
          investorData.contactPreference
        ].map(escapeCSV).join(",");
      });

      const csv = [csvHeaders.join(","), ...csvRows].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    } catch (error) {
      console.error("CSV export error:", error);
      return res.status(500).json({ error: "Failed to export users" });
    }
  });

  app.post("/api/admin/users/:userId/status", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        uid = decodedToken.user_id;
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not configured yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { userId } = req.params;
      const { status } = req.body;

      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      await storage.updateUserStatus(userId, status);
      return res.json({ success: true, message: "User status updated successfully" });
    } catch (error) {
      console.error("Admin status update error:", error);
      return res.status(500).json({ error: "Failed to update user status" });
    }
  });

  app.post("/api/admin/users/:userId/roles", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { userId } = req.params;
      const { roles } = req.body;

      if (!roles || typeof roles !== "object") {
        return res.status(400).json({ error: "Roles object is required" });
      }

      await storage.updateUserRoles(userId, {
        professional: roles.professional || false,
        jobSeeker: roles.jobSeeker || false,
        employer: roles.employer || false,
        businessOwner: roles.businessOwner || false,
        investor: roles.investor || false,
        admin: roles.admin || false,
      });

      return res.json({ success: true, message: "User roles updated successfully" });
    } catch (error) {
      console.error("Admin role update error:", error);
      return res.status(500).json({ error: "Failed to update user roles" });
    }
  });

  app.post("/api/public-opportunities", async (req, res) => {
    try {
      const publicOpportunitySchema = z.object({
        name: z.string().trim().min(1, "Name is required"),
        email: z.string().trim().email("Valid email is required"),
        type: z.enum(["job", "investment", "partnership", "collaboration"], {
          errorMap: () => ({ message: "Please select a valid opportunity type" }),
        }),
        title: z.string().trim().min(10, "Title must be at least 10 characters"),
        description: z.string().trim().min(20, "Description must be at least 20 characters"),
        sector: z.string().trim().optional(),
        country: z.string().trim().min(1, "Country is required"),
        city: z.string().trim().optional(),
        budgetOrSalary: z.string().trim().optional(),
        contactPreference: z.string().trim().optional(),
        employmentType: z.enum(["full-time", "part-time", "remote", "contract"]).optional(),
        experienceRequired: z.string().trim().optional(),
        skills: z.string().trim().optional(),
        benefits: z.string().trim().optional(),
        applicationEmail: z.union([z.string().trim().email(), z.literal("")]).optional(),
        investmentAmount: z.string().trim().optional(),
        investmentType: z.string().trim().optional(),
        partnershipType: z.string().trim().optional(),
      });

      const validationResult = publicOpportunitySchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: "Invalid request data",
          details: validationResult.error.issues,
        });
      }

      const { 
        name, 
        email, 
        type, 
        title, 
        description,
        sector,
        country,
        city,
        budgetOrSalary,
        contactPreference,
        employmentType,
        experienceRequired,
        skills,
        benefits,
        applicationEmail,
        investmentAmount,
        investmentType,
        partnershipType,
      } = validationResult.data;

      if (type === "job") {
        if (!applicationEmail) {
          return res.status(400).json({
            error: "Application email is required for job postings",
          });
        }
        if (!employmentType) {
          return res.status(400).json({
            error: "Employment type is required for job postings",
          });
        }
      }

      const details: any = {};
      
      if (type === "job") {
        if (employmentType) details.employmentType = employmentType;
        if (experienceRequired) details.experienceRequired = experienceRequired;
        if (skills) details.skills = skills.split(",").map(s => s.trim()).filter(Boolean);
        if (benefits) details.benefits = benefits.split(",").map(b => b.trim()).filter(Boolean);
        if (applicationEmail) details.applicationEmail = applicationEmail;
      } else if (type === "investment") {
        if (investmentAmount) details.investmentAmount = investmentAmount;
        if (investmentType) details.investmentType = investmentType;
      } else if (type === "partnership") {
        if (partnershipType) details.partnershipType = partnershipType;
      }

      const opportunitiesRef = collection(db, "opportunities");
      const newOpportunity = {
        submitterName: name,
        submitterEmail: email,
        type,
        title,
        description,
        sector: sector || null,
        country,
        city: city || null,
        budgetOrSalary: budgetOrSalary || null,
        contactPreference: contactPreference || null,
        details: Object.keys(details).length > 0 ? details : null,
        status: "open",
        approvalStatus: AUTO_APPROVE_JOBS ? "approved" : "pending",
        views: 0,
        interested: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(opportunitiesRef, newOpportunity);

      console.log("=== OPPORTUNITY SUBMISSION ===");
      console.log("Submitter:", name, "-", email);
      console.log("Type:", type);
      console.log("Title:", title);
      console.log("Description:", description);
      console.log("Country:", country, city ? `(${city})` : "");
      console.log("Status:", newOpportunity.status);
      console.log("Approval Status:", newOpportunity.approvalStatus);
      console.log("Document ID:", docRef.id);
      console.log("==============================");

      // Send email notifications
      try {
        await EmailService.sendOpportunitySubmissionNotification({
          submitterName: name,
          submitterEmail: email,
          opportunityType: type,
          opportunityTitle: title,
          opportunityId: docRef.id,
        });

        await EmailService.sendOpportunitySubmissionConfirmation({
          submitterName: name,
          submitterEmail: email,
          opportunityType: type,
          opportunityTitle: title,
        });

        console.log(`✅ Opportunity notification emails sent successfully`);
      } catch (emailError: any) {
        console.error("❌ Failed to send opportunity notification emails:", emailError);
        console.log("Note: Check server logs above for full opportunity details");
      }

      return res.json({
        success: true,
        message: "Opportunity submitted successfully. It will be reviewed and published soon.",
      });
    } catch (error) {
      console.error("Public opportunity submission error:", error);
      return res.status(500).json({ error: "Failed to submit opportunity" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const contactSchema = z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Valid email is required"),
        country: z.string().min(1, "Country is required"),
        message: z.string().min(10, "Message must be at least 10 characters"),
      });

      const validationResult = contactSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid request data", 
          details: validationResult.error.issues 
        });
      }

      const { name, email, country, message } = validationResult.data;

      console.log("=== CONTACT FORM SUBMISSION ===");
      console.log("Name:", name);
      console.log("Email:", email);
      console.log("Country:", country);
      console.log("Message:", message);
      console.log("===============================");

      try {
        await EmailService.sendContactFormNotification({
          name,
          email,
          country,
          message,
        });
        
        await EmailService.sendContactFormConfirmation({
          name,
          email,
        });

        console.log(`✅ Contact form emails sent successfully`);
      } catch (emailError: any) {
        console.error("❌ Failed to send contact form emails:", emailError);
        console.log("Note: Check server logs above for full contact details");
      }

      return res.json({ 
        success: true, 
        message: "Contact form submitted successfully. We'll get back to you soon!" 
      });
    } catch (error) {
      console.error("Contact form error:", error);
      return res.status(500).json({ error: "Failed to submit contact form" });
    }
  });

  // TEMPORARY ADMIN ENDPOINT - Delete all opportunities
  app.delete("/api/admin/delete-all-opportunities", async (req, res) => {
    try {
      const { getDocs, query, collection, deleteDoc, doc } = await import("firebase/firestore");
      const q = query(collection(db, "opportunities"));
      const querySnapshot = await getDocs(q);
      
      let deleteCount = 0;
      for (const document of querySnapshot.docs) {
        await deleteDoc(doc(db, "opportunities", document.id));
        deleteCount++;
      }
      
      console.log(`Deleted ${deleteCount} opportunities`);
      return res.json({ success: true, message: `Deleted ${deleteCount} opportunities` });
    } catch (error) {
      console.error("Error deleting opportunities:", error);
      return res.status(500).json({ error: "Failed to delete opportunities" });
    }
  });

  // Video endpoints
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      return res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      return res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const video = await storage.getVideoById(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      return res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      return res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  app.post("/api/videos", async (req, res) => {
    try {
      const validationResult = insertVideoSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid video data", 
          details: validationResult.error.issues 
        });
      }

      const video = await storage.createVideo(validationResult.data);
      return res.status(201).json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      return res.status(500).json({ error: "Failed to create video" });
    }
  });

  app.patch("/api/videos/:id", async (req, res) => {
    try {
      const partialVideoSchema = insertVideoSchema.partial();
      const validationResult = partialVideoSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid video data", 
          details: validationResult.error.issues 
        });
      }

      const video = await storage.updateVideo(req.params.id, validationResult.data);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      return res.json(video);
    } catch (error) {
      console.error("Error updating video:", error);
      return res.status(500).json({ error: "Failed to update video" });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    try {
      await storage.deleteVideo(req.params.id);
      return res.json({ success: true, message: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      return res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // Leader endpoints
  app.get("/api/leaders", async (req, res) => {
    try {
      const leaders = await storage.getAllLeaders();
      return res.json(leaders);
    } catch (error) {
      console.error("Error fetching leaders:", error);
      return res.status(500).json({ error: "Failed to fetch leaders" });
    }
  });

  app.get("/api/leaders/:id", async (req, res) => {
    try {
      const leader = await storage.getLeaderById(req.params.id);
      if (!leader) {
        return res.status(404).json({ error: "Leader not found" });
      }
      return res.json(leader);
    } catch (error) {
      console.error("Error fetching leader:", error);
      return res.status(500).json({ error: "Failed to fetch leader" });
    }
  });

  app.post("/api/leaders", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validationResult = insertLeaderSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid leader data", 
          details: validationResult.error.issues 
        });
      }

      const leader = await storage.createLeader(validationResult.data);
      return res.status(201).json(leader);
    } catch (error) {
      console.error("Error creating leader:", error);
      return res.status(500).json({ error: "Failed to create leader" });
    }
  });

  app.patch("/api/leaders/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const partialLeaderSchema = insertLeaderSchema.partial();
      const validationResult = partialLeaderSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid leader data", 
          details: validationResult.error.issues 
        });
      }

      const leader = await storage.updateLeader(req.params.id, validationResult.data);
      if (!leader) {
        return res.status(404).json({ error: "Leader not found" });
      }
      return res.json(leader);
    } catch (error) {
      console.error("Error updating leader:", error);
      return res.status(500).json({ error: "Failed to update leader" });
    }
  });

  app.delete("/api/leaders/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.deleteLeader(req.params.id);
      return res.json({ success: true, message: "Leader deleted successfully" });
    } catch (error) {
      console.error("Error deleting leader:", error);
      return res.status(500).json({ error: "Failed to delete leader" });
    }
  });

  // Gallery endpoints
  app.get("/api/gallery", async (req, res) => {
    try {
      const images = await storage.getAllGalleryImages();
      return res.json(images);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      return res.status(500).json({ error: "Failed to fetch gallery images" });
    }
  });

  app.get("/api/gallery/:id", async (req, res) => {
    try {
      const image = await storage.getGalleryImageById(req.params.id);
      if (!image) {
        return res.status(404).json({ error: "Gallery image not found" });
      }
      return res.json(image);
    } catch (error) {
      console.error("Error fetching gallery image:", error);
      return res.status(500).json({ error: "Failed to fetch gallery image" });
    }
  });

  app.post("/api/gallery", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validationResult = insertGalleryImageSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid gallery image data", 
          details: validationResult.error.issues 
        });
      }

      const image = await storage.createGalleryImage(validationResult.data);
      return res.status(201).json(image);
    } catch (error) {
      console.error("Error creating gallery image:", error);
      return res.status(500).json({ error: "Failed to create gallery image" });
    }
  });

  app.patch("/api/gallery/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const partialGalleryImageSchema = insertGalleryImageSchema.partial();
      const validationResult = partialGalleryImageSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid gallery image data", 
          details: validationResult.error.issues 
        });
      }

      const image = await storage.updateGalleryImage(req.params.id, validationResult.data);
      if (!image) {
        return res.status(404).json({ error: "Gallery image not found" });
      }
      return res.json(image);
    } catch (error) {
      console.error("Error updating gallery image:", error);
      return res.status(500).json({ error: "Failed to update gallery image" });
    }
  });

  app.delete("/api/gallery/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.deleteGalleryImage(req.params.id);
      return res.json({ success: true, message: "Gallery image deleted successfully" });
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      return res.status(500).json({ error: "Failed to delete gallery image" });
    }
  });

  // Membership Tier endpoints
  app.get("/api/membership-tiers", async (req, res) => {
    try {
      const tiers = await storage.getAllMembershipTiers();
      return res.json(tiers);
    } catch (error) {
      console.error("Error fetching membership tiers:", error);
      return res.status(500).json({ error: "Failed to fetch membership tiers" });
    }
  });

  app.get("/api/membership-tiers/:id", async (req, res) => {
    try {
      const tier = await storage.getMembershipTierById(req.params.id);
      if (!tier) {
        return res.status(404).json({ error: "Membership tier not found" });
      }
      return res.json(tier);
    } catch (error) {
      console.error("Error fetching membership tier:", error);
      return res.status(500).json({ error: "Failed to fetch membership tier" });
    }
  });

  app.post("/api/membership-tiers", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validationResult = insertMembershipTierSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid membership tier data", 
          details: validationResult.error.issues 
        });
      }

      const tier = await storage.createMembershipTier(validationResult.data);
      return res.status(201).json(tier);
    } catch (error) {
      console.error("Error creating membership tier:", error);
      return res.status(500).json({ error: "Failed to create membership tier" });
    }
  });

  app.patch("/api/membership-tiers/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const partialMembershipTierSchema = insertMembershipTierSchema.partial();
      const validationResult = partialMembershipTierSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid membership tier data", 
          details: validationResult.error.issues 
        });
      }

      const tier = await storage.updateMembershipTier(req.params.id, validationResult.data);
      if (!tier) {
        return res.status(404).json({ error: "Membership tier not found" });
      }
      return res.json(tier);
    } catch (error) {
      console.error("Error updating membership tier:", error);
      return res.status(500).json({ error: "Failed to update membership tier" });
    }
  });

  app.delete("/api/membership-tiers/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.deleteMembershipTier(req.params.id);
      return res.json({ success: true, message: "Membership tier deleted successfully" });
    } catch (error) {
      console.error("Error deleting membership tier:", error);
      return res.status(500).json({ error: "Failed to delete membership tier" });
    }
  });

  // Membership Application endpoints
  app.get("/api/membership-applications", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const applications = await storage.getAllMembershipApplications();
      return res.json(applications);
    } catch (error) {
      console.error("Error fetching membership applications:", error);
      return res.status(500).json({ error: "Failed to fetch membership applications" });
    }
  });

  app.get("/api/membership-applications/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const application = await storage.getMembershipApplicationById(req.params.id);
      if (!application) {
        return res.status(404).json({ error: "Membership application not found" });
      }
      return res.json(application);
    } catch (error) {
      console.error("Error fetching membership application:", error);
      return res.status(500).json({ error: "Failed to fetch membership application" });
    }
  });

  app.post("/api/membership-applications", async (req, res) => {
    try {
      const validationResult = insertMembershipApplicationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid membership application data", 
          details: validationResult.error.issues 
        });
      }

      const application = await storage.createMembershipApplication(validationResult.data);
      return res.status(201).json(application);
    } catch (error) {
      console.error("Error creating membership application:", error);
      return res.status(500).json({ error: "Failed to create membership application" });
    }
  });

  app.patch("/api/membership-applications/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const partialMembershipApplicationSchema = insertMembershipApplicationSchema.partial();
      const validationResult = partialMembershipApplicationSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid membership application data", 
          details: validationResult.error.issues 
        });
      }

      const application = await storage.updateMembershipApplication(req.params.id, validationResult.data);
      if (!application) {
        return res.status(404).json({ error: "Membership application not found" });
      }

      // When approving an application, also update the user's status
      if (validationResult.data.status === "approved" && application.email) {
        const user = await storage.getUserByEmail(application.email.toLowerCase());
        if (user) {
          await storage.updateUserStatus(user.id, "approved");
        } else {
          // User hasn't created an account yet - this is okay
          console.log(`Application approved for ${application.email}, but user account not found yet`);
        }
      }

      return res.json(application);
    } catch (error) {
      console.error("Error updating membership application:", error);
      return res.status(500).json({ error: "Failed to update membership application" });
    }
  });

  app.delete("/api/membership-applications/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        return res.status(500).json({ error: "Firebase Admin SDK not implemented yet" });
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      await storage.deleteMembershipApplication(req.params.id);
      return res.json({ success: true, message: "Membership application deleted successfully" });
    } catch (error) {
      console.error("Error deleting membership application:", error);
      return res.status(500).json({ error: "Failed to delete membership application" });
    }
  });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'));
      }
    },
  });

  app.get("/api/files/images/*", async (req, res) => {
    try {
      const filePath = (req.params as any)[0] as string;
      
      if (filePath.includes('..') || filePath.startsWith('/')) {
        return res.status(400).json({ error: "Invalid file path" });
      }
      
      const fullPath = `images/${filePath}`;
      const objectStorage = new ObjectStorageClient();
      
      const result = await objectStorage.downloadAsBytes(fullPath);
      if (!result.ok) {
        return res.status(404).json({ error: "File not found" });
      }

      const ext = filePath.split('.').pop()?.toLowerCase();
      const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      if (!ext || !allowedTypes.includes(ext)) {
        return res.status(400).json({ error: "Unsupported file type" });
      }

      const contentTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
      };

      res.setHeader('Content-Type', contentTypes[ext]);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.end(result.value);
    } catch (error) {
      console.error("Error serving file:", error);
      return res.status(500).json({ error: "Failed to serve file" });
    }
  });

  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      let uid: string;

      if (!process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
        console.warn("WARNING: Firebase Admin SDK not configured. Upload endpoint using INSECURE client-side JWT decoding.");
        try {
          const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          uid = decodedToken.user_id;
        } catch (decodeError) {
          return res.status(401).json({ error: "Invalid token format" });
        }
      } else {
        const decoded = await verifyIdToken(token);
        if (!decoded) {
          return res.status(401).json({ error: "Invalid token" });
        }
        uid = decoded.uid;
      }

      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
      };

      const fileExtension = mimeToExt[req.file.mimetype] || 'jpg';
      const objectStorage = new ObjectStorageClient();
      const timestamp = Date.now();
      const fileName = `${timestamp}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;
      const filePath = `images/${fileName}`;

      const uploadResult = await objectStorage.uploadFromBytes(filePath, req.file.buffer);
      if (!uploadResult.ok) {
        throw new Error(uploadResult.error?.message || "Upload failed");
      }

      const publicUrl = `/api/files/images/${fileName}`;

      return res.json({ 
        success: true, 
        url: publicUrl,
        fileName: fileName
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      return res.status(500).json({ 
        error: "Failed to upload file",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Public endpoints for country/city dropdowns
  app.get("/api/locations/countries", async (_req, res) => {
    try {
      const countriesList = await storage.getEnabledCountries();
      return res.json(countriesList.map(c => ({
        id: c.id,
        code: c.code,
        name: c.displayName || c.name,
        phoneCode: c.phoneCode,
        isPrimary: c.isPrimary ?? false,
        comingSoon: c.comingSoon ?? false
      })));
    } catch (error) {
      console.error("Error fetching countries:", error);
      return res.status(500).json({ error: "Failed to fetch countries" });
    }
  });

  app.get("/api/locations/countries/:countryId/cities", async (req, res) => {
    try {
      const { countryId } = req.params;
      const citiesList = await storage.getEnabledCitiesByCountryId(countryId);
      return res.json(citiesList.map(c => ({
        id: c.id,
        name: c.displayName || c.name
      })));
    } catch (error) {
      console.error("Error fetching cities:", error);
      return res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  // Admin endpoints for country management
  app.get("/api/admin/countries", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);
      
      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const countriesList = await storage.getAllCountries();
      return res.json(countriesList);
    } catch (error) {
      console.error("Error fetching countries:", error);
      return res.status(500).json({ error: "Failed to fetch countries" });
    }
  });

  app.patch("/api/admin/countries/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);
      
      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const { enabled, displayName, sortOrder, isPrimary, comingSoon } = req.body;
      
      const updateData: any = {};
      if (enabled !== undefined) updateData.enabled = enabled;
      if (displayName !== undefined) updateData.displayName = displayName;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
      if (isPrimary !== undefined) updateData.isPrimary = isPrimary;
      if (comingSoon !== undefined) updateData.comingSoon = comingSoon;

      const updated = await storage.updateCountry(id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Country not found" });
      }
      
      return res.json(updated);
    } catch (error) {
      console.error("Error updating country:", error);
      return res.status(500).json({ error: "Failed to update country" });
    }
  });

  // Admin endpoints for city management
  app.get("/api/admin/countries/:countryId/cities", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);
      
      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { countryId } = req.params;
      const citiesList = await storage.getCitiesByCountryId(countryId);
      return res.json(citiesList);
    } catch (error) {
      console.error("Error fetching cities:", error);
      return res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  app.post("/api/admin/countries/:countryId/cities", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);
      
      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { countryId } = req.params;
      const { name, enabled, sortOrder } = req.body;

      if (!name) {
        return res.status(400).json({ error: "City name is required" });
      }

      const newCity = await storage.createCity({
        countryId,
        name,
        enabled: enabled ?? false,
        sortOrder: sortOrder ?? 0
      });
      
      return res.json(newCity);
    } catch (error) {
      console.error("Error creating city:", error);
      return res.status(500).json({ error: "Failed to create city" });
    }
  });

  app.patch("/api/admin/cities/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);
      
      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      const { enabled, displayName, sortOrder } = req.body;
      
      const updateData: any = {};
      if (enabled !== undefined) updateData.enabled = enabled;
      if (displayName !== undefined) updateData.displayName = displayName;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

      const updated = await storage.updateCity(id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "City not found" });
      }
      
      return res.json(updated);
    } catch (error) {
      console.error("Error updating city:", error);
      return res.status(500).json({ error: "Failed to update city" });
    }
  });

  app.delete("/api/admin/cities/:id", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);
      
      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { id } = req.params;
      await storage.deleteCity(id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting city:", error);
      return res.status(500).json({ error: "Failed to delete city" });
    }
  });

  // Seed countries endpoint (admin only, one-time use)
  app.post("/api/admin/seed-countries", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.substring(7);
      const uid = await verifyAuthToken(token);
      
      const userWithRoles = await storage.getUserWithRoles(uid);
      if (!userWithRoles || !userWithRoles.roles?.admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Check if countries already exist
      const existingCountries = await storage.getAllCountries();
      if (existingCountries.length > 0) {
        return res.status(400).json({ error: "Countries already seeded", count: existingCountries.length });
      }

      // Import and seed countries using ES modules
      const fs = await import('fs/promises');
      const path = await import('path');
      const countriesPath = path.join(process.cwd(), 'server', 'data', 'countries.json');
      const countriesJson = await fs.readFile(countriesPath, 'utf-8');
      const countriesData = JSON.parse(countriesJson);
      const createdCountries = await storage.bulkCreateCountries(countriesData);
      
      return res.json({ success: true, count: createdCountries.length });
    } catch (error) {
      console.error("Error seeding countries:", error);
      return res.status(500).json({ error: "Failed to seed countries" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
