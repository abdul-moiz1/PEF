import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  addDoc,
  serverTimestamp,
  deleteField
} from "firebase/firestore";
import { db } from "./firebase-admin";
import { db as pgDb } from "./db";
import { leaders, galleryImages, membershipTiers, membershipApplications } from "@shared/schema";
import { eq, desc, and, asc } from "drizzle-orm";
import { 
  type User,
  type UserProfile,
  type UserRoles,
  type Opportunity,
  type Application,
  type InsertUser,
  type InsertUserProfile,
  type InsertUserRoles,
  type InsertOpportunity,
  type InsertApplication,
  type InsertProfessionalProfile,
  type InsertJobSeekerProfile,
  type InsertEmployerProfile,
  type InsertBusinessOwnerProfile,
  type InsertInvestorProfile,
  type ProfessionalProfile,
  type JobSeekerProfile,
  type Video,
  type InsertVideo,
  type Leader,
  type InsertLeader,
  type GalleryImage,
  type InsertGalleryImage,
  type MembershipTier,
  type InsertMembershipTier,
  type MembershipApplication,
  type InsertMembershipApplication,
  insertMembershipApplicationSchema,
  type Country,
  type InsertCountry,
  type City,
  type InsertCity,
  type FirestoreCountry,
  type FirestoreCity,
  type InsertFirestoreCountry,
  type InsertFirestoreCity,
} from "@shared/schema";
import { toFirestoreRoles } from "@shared/roleUtils";

// Helper function to convert Firestore Timestamps to Date objects
function normalizeDate(value: any): Date {
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

// Helper function to normalize document data with dates
function normalizeDocData<T>(data: any): T {
  const normalized = { ...data };
  if (data.createdAt) normalized.createdAt = normalizeDate(data.createdAt);
  if (data.updatedAt) normalized.updatedAt = normalizeDate(data.updatedAt);
  if (data.lastLogin) normalized.lastLogin = normalizeDate(data.lastLogin);
  if (data.appliedAt) normalized.appliedAt = normalizeDate(data.appliedAt);
  if (data.publishedAt) normalized.publishedAt = normalizeDate(data.publishedAt);
  if (data.eventDate) normalized.eventDate = normalizeDate(data.eventDate);
  return normalized as T;
}

export interface RegistrationData {
  userId: string;
  email: string;
  displayName: string;
  profile: Omit<InsertUserProfile, "userId">;
  roles: Omit<InsertUserRoles, "userId">;
}

export interface TalentProfile {
  user: User;
  profile: UserProfile;
  roleSpecificProfile: ProfessionalProfile | JobSeekerProfile | null;
}

export interface IStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserWithRoles(id: string): Promise<{ user: User; roles: UserRoles | null } | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: string): Promise<void>;
  
  completeRegistration(data: RegistrationData): Promise<{ user: User; profile: UserProfile }>;
  
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  createUserRoles(roles: InsertUserRoles): Promise<UserRoles>;
  updateUserRoles(userId: string, roles: Omit<InsertUserRoles, "userId">): Promise<void>;
  
  createProfessionalProfile(profile: InsertProfessionalProfile): Promise<void>;
  createJobSeekerProfile(profile: InsertJobSeekerProfile): Promise<void>;
  createEmployerProfile(profile: InsertEmployerProfile): Promise<void>;
  createBusinessOwnerProfile(profile: InsertBusinessOwnerProfile): Promise<void>;
  createInvestorProfile(profile: InsertInvestorProfile): Promise<void>;
  
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  getOpportunityById(id: string): Promise<Opportunity | undefined>;
  getOpportunitiesByUserId(userId: string): Promise<Opportunity[]>;
  getPublicOpportunities(type?: string): Promise<Opportunity[]>;
  getAllOpportunities(): Promise<Opportunity[]>;
  updateOpportunity(id: string, data: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;
  deleteOpportunity(id: string): Promise<void>;
  bulkUpdateOpportunityApprovalStatus(opportunityIds: string[], status: "pending" | "approved" | "rejected"): Promise<void>;
  bulkUpdateOpportunityStatus(opportunityIds: string[], status: "open" | "closed"): Promise<void>;
  bulkDeleteOpportunities(opportunityIds: string[]): Promise<void>;
  
  createApplication(application: InsertApplication): Promise<Application>;
  getApplicationsByUser(userId: string): Promise<Array<Application & { opportunity: Opportunity }>>;
  getApplicationsByOpportunity(opportunityId: string): Promise<Array<Application & { user: User }>>;
  updateApplicationStatus(id: string, status: Application['status']): Promise<Application | undefined>;
  checkExistingApplication(userId: string, opportunityId: string): Promise<Application | undefined>;
  
  getTalentByRole(role: "professional" | "jobSeeker"): Promise<TalentProfile[]>;
  
  createVideo(video: InsertVideo): Promise<Video>;
  getAllVideos(): Promise<Video[]>;
  getVideoById(id: string): Promise<Video | undefined>;
  updateVideo(id: string, data: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: string): Promise<void>;
  
  createLeader(leader: InsertLeader): Promise<Leader>;
  getAllLeaders(): Promise<Leader[]>;
  getLeaderById(id: string): Promise<Leader | undefined>;
  updateLeader(id: string, data: Partial<InsertLeader>): Promise<Leader | undefined>;
  deleteLeader(id: string): Promise<void>;
  
  createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage>;
  getAllGalleryImages(): Promise<GalleryImage[]>;
  getGalleryImageById(id: string): Promise<GalleryImage | undefined>;
  updateGalleryImage(id: string, data: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined>;
  deleteGalleryImage(id: string): Promise<void>;
  
  createMembershipTier(tier: InsertMembershipTier): Promise<MembershipTier>;
  getAllMembershipTiers(): Promise<MembershipTier[]>;
  getMembershipTierById(id: string): Promise<MembershipTier | undefined>;
  updateMembershipTier(id: string, data: Partial<InsertMembershipTier>): Promise<MembershipTier | undefined>;
  deleteMembershipTier(id: string): Promise<void>;
  
  createMembershipApplication(application: InsertMembershipApplication): Promise<MembershipApplication>;
  getAllMembershipApplications(): Promise<MembershipApplication[]>;
  getMembershipApplicationById(id: string): Promise<MembershipApplication | undefined>;
  updateMembershipApplication(id: string, data: Partial<InsertMembershipApplication>): Promise<MembershipApplication | undefined>;
  deleteMembershipApplication(id: string): Promise<void>;
  
  // Country/City management
  createCountry(country: InsertCountry): Promise<Country>;
  getAllCountries(): Promise<Country[]>;
  getEnabledCountries(): Promise<Country[]>;
  getCountryById(id: string): Promise<Country | undefined>;
  updateCountry(id: string, data: Partial<InsertCountry>): Promise<Country | undefined>;
  deleteCountry(id: string): Promise<void>;
  bulkCreateCountries(countriesData: InsertCountry[]): Promise<Country[]>;
  
  createCity(city: InsertCity): Promise<City>;
  getCitiesByCountryId(countryId: string): Promise<City[]>;
  getEnabledCitiesByCountryId(countryId: string): Promise<City[]>;
  getCityById(id: string): Promise<City | undefined>;
  updateCity(id: string, data: Partial<InsertCity>): Promise<City | undefined>;
  deleteCity(id: string): Promise<void>;
  bulkCreateCities(citiesData: InsertCity[]): Promise<City[]>;
}

export class FirestoreStorage implements IStorage {
  private generateId(): string {
    return doc(collection(db, "temp")).id;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return normalizeDocData<User>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return normalizeDocData<User>({ id: doc.id, ...doc.data() });
    }
    return undefined;
  }

  async getUserWithRoles(id: string): Promise<{ user: User; roles: UserRoles | null } | undefined> {
    const userDocRef = doc(db, "users", id);
    const userSnap = await getDoc(userDocRef);
    
    if (!userSnap.exists()) {
      return undefined;
    }
    
    const userData = userSnap.data();
    const user = normalizeDocData<User>({ id: userSnap.id, ...userData });

    // Get roles from nested field in user document (consolidated structure)
    let roles: UserRoles | null = null;
    
    if (userData.roles) {
      // Roles embedded in user document
      // Support both new (professional, jobSeeker, admin) and legacy (isProfessional, isJobSeeker, isAdmin) naming conventions
      roles = {
        id,
        userId: id,
        professional: userData.roles.professional || userData.roles.isProfessional || false,
        jobSeeker: userData.roles.jobSeeker || userData.roles.isJobSeeker || false,
        employer: userData.roles.employer || userData.roles.isEmployer || false,
        businessOwner: userData.roles.businessOwner || userData.roles.isBusinessOwner || false,
        investor: userData.roles.investor || userData.roles.isInvestor || false,
        admin: userData.roles.admin || userData.roles.isAdmin || false,
        createdAt: normalizeDate(userData.createdAt),
      };
    }
    
    return {
      user,
      roles,
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const userData: User = {
      id: insertUser.id,
      email: insertUser.email,
      displayName: insertUser.displayName || null,
      createdAt: new Date(),
      lastLogin: null,
      approvalStatus: insertUser.approvalStatus || "approved",
      preRegistered: insertUser.preRegistered || false,
      preRegisteredAt: insertUser.preRegisteredAt || null,
      registrationSource: insertUser.registrationSource || null,
    };
    
    await setDoc(doc(db, "users", insertUser.id), userData);
    return userData;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    const userRef = doc(db, "users", id);
    await updateDoc(userRef, {
      lastLogin: new Date(),
    });
  }

  async completeRegistration(data: RegistrationData): Promise<{ user: User; profile: UserProfile }> {
    try {
      // Get existing user document to preserve fields like name, status, lastUpdated
      const existingUserSnap = await getDoc(doc(db, "users", data.userId));
      const existingUserData = existingUserSnap.exists() ? existingUserSnap.data() : {};
      
      // Consolidated structure: everything in one users document
      // Use merge to preserve existing fields set during registration
      const consolidatedUserData = {
        id: data.userId,
        email: data.email,
        displayName: data.displayName,
        createdAt: new Date(),
        lastLogin: null,
        // Auto-approve all new users - no admin approval needed
        approvalStatus: "approved",
        // Preserve existing fields
        name: existingUserData.name || data.profile.fullName,
        status: "approved",
        lastUpdated: new Date(),
        profile: {
          fullName: data.profile.fullName,
          phone: data.profile.phone || null,
          country: data.profile.country,
          city: data.profile.city || null,
          languages: data.profile.languages || null,
          headline: data.profile.headline || null,
          bio: data.profile.bio || null,
          linkedinUrl: data.profile.linkedinUrl || null,
          websiteUrl: data.profile.websiteUrl || null,
          portfolioUrl: data.profile.portfolioUrl || null,
        },
        roles: toFirestoreRoles(data.roles),
        professionalData: existingUserData.professionalData || {},
        jobSeekerData: existingUserData.jobSeekerData || {},
        employerData: existingUserData.employerData || {},
        businessOwnerData: existingUserData.businessOwnerData || {},
        investorData: existingUserData.investorData || {},
      };
      
      // Use merge to preserve any existing fields
      await setDoc(doc(db, "users", data.userId), consolidatedUserData, { merge: true });

      const user: User = {
        id: data.userId,
        email: data.email,
        displayName: data.displayName,
        createdAt: new Date(),
        lastLogin: null,
        approvalStatus: "approved",
        preRegistered: false,
        preRegisteredAt: null,
        registrationSource: null,
      };

      const profileId = this.generateId();
      const profile: UserProfile = {
        id: profileId,
        userId: data.userId,
        fullName: data.profile.fullName,
        phone: data.profile.phone || null,
        country: data.profile.country,
        city: data.profile.city || null,
        languages: data.profile.languages || null,
        headline: data.profile.headline || null,
        bio: data.profile.bio || null,
        linkedinUrl: data.profile.linkedinUrl || null,
        websiteUrl: data.profile.websiteUrl || null,
        portfolioUrl: data.profile.portfolioUrl || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return { user, profile };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async createUserProfile(insertProfile: InsertUserProfile): Promise<UserProfile> {
    // Update nested profile field in user document (consolidated structure)
    const userRef = doc(db, "users", insertProfile.userId);
    await updateDoc(userRef, {
      profile: {
        fullName: insertProfile.fullName,
        phone: insertProfile.phone || null,
        country: insertProfile.country,
        city: insertProfile.city || null,
        languages: insertProfile.languages || null,
        headline: insertProfile.headline || null,
        bio: insertProfile.bio || null,
        linkedinUrl: insertProfile.linkedinUrl || null,
        websiteUrl: insertProfile.websiteUrl || null,
        portfolioUrl: insertProfile.portfolioUrl || null,
      }
    });
    
    const profileId = this.generateId();
    const profile: UserProfile = {
      id: profileId,
      userId: insertProfile.userId,
      fullName: insertProfile.fullName,
      phone: insertProfile.phone || null,
      country: insertProfile.country,
      city: insertProfile.city || null,
      languages: insertProfile.languages || null,
      headline: insertProfile.headline || null,
      bio: insertProfile.bio || null,
      linkedinUrl: insertProfile.linkedinUrl || null,
      websiteUrl: insertProfile.websiteUrl || null,
      portfolioUrl: insertProfile.portfolioUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return profile;
  }

  async createUserRoles(insertRoles: InsertUserRoles): Promise<UserRoles> {
    // Update nested roles field in user document (consolidated structure)
    const userRef = doc(db, "users", insertRoles.userId);
    await updateDoc(userRef, {
      "roles.isProfessional": insertRoles.professional || false,
      "roles.isJobSeeker": insertRoles.jobSeeker || false,
      "roles.isEmployer": insertRoles.employer || false,
      "roles.isBusinessOwner": insertRoles.businessOwner || false,
      "roles.isInvestor": insertRoles.investor || false,
      "roles.isAdmin": insertRoles.admin || false,
    });
    
    const roles: UserRoles = {
      id: insertRoles.userId,
      userId: insertRoles.userId,
      professional: insertRoles.professional || false,
      jobSeeker: insertRoles.jobSeeker || false,
      employer: insertRoles.employer || false,
      businessOwner: insertRoles.businessOwner || false,
      investor: insertRoles.investor || false,
      admin: insertRoles.admin || false,
      createdAt: new Date(),
    };
    
    return roles;
  }

  async updateUserRoles(userId: string, roles: Omit<InsertUserRoles, "userId">): Promise<void> {
    // Update nested roles field in user document (consolidated structure)
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      "roles.isProfessional": roles.professional || false,
      "roles.isJobSeeker": roles.jobSeeker || false,
      "roles.isEmployer": roles.employer || false,
      "roles.isBusinessOwner": roles.businessOwner || false,
      "roles.isInvestor": roles.investor || false,
      "roles.isAdmin": roles.admin || false,
      // Mark that role selection is complete
      needsRoleSelection: false,
      skipBackendSync: false,
      // Clean up legacy non-prefixed field names if they exist
      "roles.professional": deleteField(),
      "roles.jobSeeker": deleteField(),
      "roles.employer": deleteField(),
      "roles.businessOwner": deleteField(),
      "roles.investor": deleteField(),
      "roles.admin": deleteField(),
    });
  }

  async createProfessionalProfile(profile: InsertProfessionalProfile): Promise<void> {
    // Store in nested field within user document (consolidated structure)
    const userRef = doc(db, "users", profile.userId);
    await updateDoc(userRef, {
      professionalData: {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }

  async createJobSeekerProfile(profile: InsertJobSeekerProfile): Promise<void> {
    // Store in nested field within user document (consolidated structure)
    const userRef = doc(db, "users", profile.userId);
    await updateDoc(userRef, {
      jobSeekerData: {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }

  async createEmployerProfile(profile: InsertEmployerProfile): Promise<void> {
    // Store in nested field within user document (consolidated structure)
    const userRef = doc(db, "users", profile.userId);
    await updateDoc(userRef, {
      employerData: {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }

  async createBusinessOwnerProfile(profile: InsertBusinessOwnerProfile): Promise<void> {
    // Store in nested field within user document (consolidated structure)
    const userRef = doc(db, "users", profile.userId);
    await updateDoc(userRef, {
      businessOwnerData: {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }

  async createInvestorProfile(profile: InsertInvestorProfile): Promise<void> {
    // Store in nested field within user document (consolidated structure)
    const userRef = doc(db, "users", profile.userId);
    await updateDoc(userRef, {
      investorData: {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }

  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    const opportunityId = this.generateId();
    const newOpportunity: Opportunity = {
      id: opportunityId,
      userId: opportunity.userId,
      type: opportunity.type,
      title: opportunity.title,
      description: opportunity.description,
      sector: opportunity.sector || null,
      country: opportunity.country || null,
      city: opportunity.city || null,
      budgetOrSalary: opportunity.budgetOrSalary || null,
      contactPreference: opportunity.contactPreference || null,
      details: opportunity.details || null,
      status: opportunity.status || "open",
      approvalStatus: opportunity.approvalStatus || "approved",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log("Creating opportunity with approvalStatus:", newOpportunity.approvalStatus, "status:", newOpportunity.status);
    await setDoc(doc(db, "opportunities", opportunityId), newOpportunity);
    return newOpportunity;
  }

  async getOpportunityById(id: string): Promise<Opportunity | undefined> {
    const docRef = doc(db, "opportunities", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return normalizeDocData<Opportunity>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getOpportunitiesByUserId(userId: string): Promise<Opportunity[]> {
    const q = query(collection(db, "opportunities"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => 
      normalizeDocData<Opportunity>({ id: doc.id, ...doc.data() })
    );
  }

  async getPublicOpportunities(type?: string): Promise<Opportunity[]> {
    let q;
    if (type) {
      q = query(
        collection(db, "opportunities"),
        where("approvalStatus", "==", "approved"),
        where("status", "==", "open"),
        where("type", "==", type)
      );
    } else {
      q = query(
        collection(db, "opportunities"),
        where("approvalStatus", "==", "approved"),
        where("status", "==", "open")
      );
    }
    
    const querySnapshot = await getDocs(q);
    const opportunities = querySnapshot.docs.map(doc => 
      normalizeDocData<Opportunity>({ id: doc.id, ...doc.data() })
    );
    
    console.log(`Found ${opportunities.length} public opportunities (type: ${type || 'all'})`);
    opportunities.forEach(opp => {
      console.log(`  - ${opp.title} | status: ${opp.status} | approvalStatus: ${opp.approvalStatus}`);
    });
    
    return opportunities;
  }

  async getAllOpportunities(): Promise<Opportunity[]> {
    const querySnapshot = await getDocs(collection(db, "opportunities"));
    return querySnapshot.docs.map(doc => 
      normalizeDocData<Opportunity>({ id: doc.id, ...doc.data() })
    );
  }

  async updateOpportunity(id: string, data: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const docRef = doc(db, "opportunities", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date(),
    });
    
    return this.getOpportunityById(id);
  }

  async deleteOpportunity(id: string): Promise<void> {
    const docRef = doc(db, "opportunities", id);
    await deleteDoc(docRef);
  }

  async bulkUpdateOpportunityApprovalStatus(opportunityIds: string[], status: "pending" | "approved" | "rejected"): Promise<void> {
    const { writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    
    for (const id of opportunityIds) {
      const docRef = doc(db, "opportunities", id);
      batch.update(docRef, {
        approvalStatus: status,
        updatedAt: new Date(),
      });
    }
    
    await batch.commit();
  }

  async bulkUpdateOpportunityStatus(opportunityIds: string[], status: "open" | "closed"): Promise<void> {
    const { writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    
    for (const id of opportunityIds) {
      const docRef = doc(db, "opportunities", id);
      batch.update(docRef, {
        status: status,
        updatedAt: new Date(),
      });
    }
    
    await batch.commit();
  }

  async bulkDeleteOpportunities(opportunityIds: string[]): Promise<void> {
    const { writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    
    for (const id of opportunityIds) {
      const docRef = doc(db, "opportunities", id);
      batch.delete(docRef);
    }
    
    await batch.commit();
  }

  async createApplication(insertApplication: InsertApplication): Promise<Application> {
    const applicationId = this.generateId();
    const newApplication: Application = {
      id: applicationId,
      userId: insertApplication.userId,
      opportunityId: insertApplication.opportunityId,
      status: insertApplication.status || "applied",
      metadata: insertApplication.metadata || null,
      appliedAt: new Date(),
      updatedAt: new Date(),
    };
    
    await setDoc(doc(db, "applications", applicationId), newApplication);
    return newApplication;
  }

  async getApplicationsByUser(userId: string): Promise<Array<Application & { opportunity: Opportunity }>> {
    const q = query(collection(db, "applications"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const results: Array<Application & { opportunity: Opportunity }> = [];
    
    for (const appDoc of querySnapshot.docs) {
      const application = normalizeDocData<Application>({ id: appDoc.id, ...appDoc.data() });
      const opportunity = await this.getOpportunityById(application.opportunityId);
      
      if (opportunity) {
        results.push({ ...application, opportunity });
      }
    }
    
    return results;
  }

  async getApplicationsByOpportunity(opportunityId: string): Promise<Array<Application & { user: User }>> {
    const q = query(collection(db, "applications"), where("opportunityId", "==", opportunityId));
    const querySnapshot = await getDocs(q);
    
    const results: Array<Application & { user: User }> = [];
    
    for (const appDoc of querySnapshot.docs) {
      const application = normalizeDocData<Application>({ id: appDoc.id, ...appDoc.data() });
      const user = await this.getUserById(application.userId);
      
      if (user) {
        results.push({ ...application, user });
      }
    }
    
    return results;
  }

  async updateApplicationStatus(id: string, status: Application['status']): Promise<Application | undefined> {
    const docRef = doc(db, "applications", id);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date(),
    });
    
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return normalizeDocData<Application>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async checkExistingApplication(userId: string, opportunityId: string): Promise<Application | undefined> {
    const q = query(
      collection(db, "applications"),
      where("userId", "==", userId),
      where("opportunityId", "==", opportunityId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return normalizeDocData<Application>({ id: doc.id, ...doc.data() });
    }
    return undefined;
  }

  async getTalentByRole(role: "professional" | "jobSeeker"): Promise<TalentProfile[]> {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const results: TalentProfile[] = [];
    
    console.log(`🔍 getTalentByRole called for role: ${role}`);
    console.log(`📚 Total users in collection: ${usersSnapshot.docs.length}`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      console.log(`👤 Checking user ${userData.email}:`, {
        roles: userData.roles,
        approvalStatus: userData.approvalStatus,
        hasProfessionalRole: userData.roles?.professional,
        hasJobSeekerRole: userData.roles?.jobSeeker,
      });
      
      // Check if user has the requested role
      const hasRole = role === "professional" 
        ? userData.roles?.professional 
        : userData.roles?.jobSeeker;
      
      if (!hasRole) {
        console.log(`  ❌ User ${userData.email} does not have ${role} role`);
        continue;
      }
      
      // Only include approved users
      if (userData.approvalStatus !== "approved") {
        console.log(`  ⚠️  User ${userData.email} has ${role} role but approvalStatus is ${userData.approvalStatus}`);
        continue;
      }
      
      console.log(`  ✅ User ${userData.email} matches criteria!`);
      
      // Debug logging to see what fields are available
      console.log(`📊 Talent user ${userData.email}:`, {
        hasProfessionalData: !!userData.professionalData,
        hasJobSeekerData: !!userData.jobSeekerData,
        professionalDataKeys: userData.professionalData ? Object.keys(userData.professionalData) : [],
        jobSeekerDataKeys: userData.jobSeekerData ? Object.keys(userData.jobSeekerData) : [],
      });
      
      const user = normalizeDocData<User>({ id: userDoc.id, ...userData });
      
      // Create profile from user data
      const profile: UserProfile = {
        id: userDoc.id,
        userId: userDoc.id,
        fullName: userData.profile?.fullName || userData.displayName || "",
        phone: userData.profile?.phone || null,
        country: userData.profile?.country || "",
        city: userData.profile?.city || null,
        languages: userData.profile?.languages || null,
        headline: userData.profile?.headline || null,
        bio: userData.profile?.bio || null,
        linkedinUrl: userData.profile?.linkedinUrl || null,
        websiteUrl: userData.profile?.websiteUrl || null,
        portfolioUrl: userData.profile?.portfolioUrl || null,
        createdAt: userData.createdAt?.toDate?.() || new Date(),
        updatedAt: userData.lastUpdated?.toDate?.() || new Date(),
      };
      
      // Get role-specific profile data
      let roleSpecificProfile = null;
      
      if (role === "professional" && userData.professionalData) {
        roleSpecificProfile = {
          id: userDoc.id,
          userId: userDoc.id,
          yearsOfExperience: userData.professionalData.yearsOfExperience || null,
          industry: userData.professionalData.industry || null,
          skills: userData.professionalData.skills || null,
          certifications: userData.professionalData.certifications || null,
          currentJobTitle: userData.professionalData.currentJobTitle || null,
          currentEmployer: userData.professionalData.currentEmployer || null,
          createdAt: userData.professionalData.createdAt?.toDate?.() || new Date(),
          updatedAt: userData.professionalData.updatedAt?.toDate?.() || new Date(),
        } as ProfessionalProfile;
      } else if (role === "jobSeeker" && userData.jobSeekerData) {
        roleSpecificProfile = {
          id: userDoc.id,
          userId: userDoc.id,
          targetJobTitles: userData.jobSeekerData.targetJobTitles || null,
          preferredIndustries: userData.jobSeekerData.preferredIndustries || null,
          employmentType: userData.jobSeekerData.employmentType || null,
          salaryExpectationMin: userData.jobSeekerData.salaryExpectationMin || null,
          salaryExpectationMax: userData.jobSeekerData.salaryExpectationMax || null,
          availability: userData.jobSeekerData.availability || null,
          willingToRelocate: userData.jobSeekerData.willingToRelocate || null,
          targetCountries: userData.jobSeekerData.targetCountries || null,
          createdAt: userData.jobSeekerData.createdAt?.toDate?.() || new Date(),
          updatedAt: userData.jobSeekerData.updatedAt?.toDate?.() || new Date(),
        } as JobSeekerProfile;
      }
      
      results.push({
        user,
        profile,
        roleSpecificProfile
      });
    }
    
    return results;
  }

  async getInvestors(): Promise<Array<{user: User; investorData: any}>> {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const results: Array<{user: User; investorData: any}> = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Check if user has investor role
      if (userData.roles?.investor || userData.roles?.investor) {
        const user = normalizeDocData<User>({ id: userDoc.id, ...userData });
        
        // Only include approved users
        if (user.approvalStatus === "approved") {
          results.push({
            user: {
              id: user.id,
              email: user.email,
              displayName: user.displayName,
              approvalStatus: user.approvalStatus,
              createdAt: user.createdAt,
              lastLogin: user.lastLogin,
              preRegistered: user.preRegistered,
              preRegisteredAt: user.preRegisteredAt,
              registrationSource: user.registrationSource,
            },
            investorData: userData.investorData || {}
          });
        }
      }
    }
    
    return results;
  }

  async getBusinessOwners(): Promise<Array<{user: User; businessOwnerData: any}>> {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const results: Array<{user: User; businessOwnerData: any}> = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Check if user has business owner role
      if (userData.roles?.businessOwner || userData.roles?.businessOwner) {
        const user = normalizeDocData<User>({ id: userDoc.id, ...userData });
        
        // Only include approved users
        if (user.approvalStatus === "approved") {
          results.push({
            user: {
              id: user.id,
              email: user.email,
              displayName: user.displayName,
              approvalStatus: user.approvalStatus,
              createdAt: user.createdAt,
              lastLogin: user.lastLogin,
              preRegistered: user.preRegistered,
              preRegisteredAt: user.preRegisteredAt,
              registrationSource: user.registrationSource,
            },
            businessOwnerData: userData.businessOwnerData || {}
          });
        }
      }
    }
    
    return results;
  }

  async getAllUsers(): Promise<Array<any>> {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users: Array<any> = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      users.push({
        uid: userDoc.id,
        ...userData,
        createdAt: normalizeDate(userData.createdAt),
        lastUpdated: normalizeDate(userData.lastUpdated),
      });
    }
    
    return users;
  }

  async getAdminStats(): Promise<any> {
    const usersSnapshot = await getDocs(collection(db, "users"));
    
    const stats = {
      totalUsers: 0,
      professionals: 0,
      jobSeekers: 0,
      employers: 0,
      businessOwners: 0,
      investors: 0,
      admins: 0,
      pendingApprovals: 0,
      approved: 0,
      rejected: 0,
    };
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      stats.totalUsers++;
      
      if (userData.roles?.professional || userData.roles?.professional) stats.professionals++;
      if (userData.roles?.jobSeeker || userData.roles?.jobSeeker) stats.jobSeekers++;
      if (userData.roles?.employer || userData.roles?.employer) stats.employers++;
      if (userData.roles?.businessOwner || userData.roles?.businessOwner) stats.businessOwners++;
      if (userData.roles?.investor || userData.roles?.investor) stats.investors++;
      if (userData.roles?.admin || userData.roles?.admin) stats.admins++;
      
      if (userData.status === "pending") stats.pendingApprovals++;
      if (userData.status === "approved") stats.approved++;
      if (userData.status === "rejected") stats.rejected++;
    }
    
    return stats;
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      status,
      lastUpdated: new Date(),
    });
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const videoData = {
      title: video.title,
      description: video.description || null,
      youtubeId: video.youtubeId,
      thumbnailUrl: video.thumbnailUrl || null,
      publishedAt: video.publishedAt || null,
      featured: video.featured || false,
      visible: video.visible !== undefined ? video.visible : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const docRef = await addDoc(collection(db, "videos"), videoData);
    
    return {
      id: docRef.id,
      ...videoData,
    };
  }

  async getAllVideos(): Promise<Video[]> {
    const videosSnapshot = await getDocs(collection(db, "videos"));
    const videos: Video[] = [];
    
    for (const videoDoc of videosSnapshot.docs) {
      const videoData = videoDoc.data();
      videos.push(normalizeDocData<Video>({
        id: videoDoc.id,
        ...videoData,
      }));
    }
    
    return videos.sort((a, b) => {
      const dateA = a.publishedAt || a.createdAt;
      const dateB = b.publishedAt || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });
  }

  async getVideoById(id: string): Promise<Video | undefined> {
    const docRef = doc(db, "videos", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return normalizeDocData<Video>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async updateVideo(id: string, data: Partial<InsertVideo>): Promise<Video | undefined> {
    const docRef = doc(db, "videos", id);
    
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.youtubeId !== undefined) updateData.youtubeId = data.youtubeId;
    if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl || null;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.visible !== undefined) updateData.visible = data.visible;
    
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt || null;
    }
    
    await updateDoc(docRef, updateData);
    
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return normalizeDocData<Video>({ id: updatedDoc.id, ...updatedDoc.data() });
    }
    return undefined;
  }

  async deleteVideo(id: string): Promise<void> {
    const docRef = doc(db, "videos", id);
    await deleteDoc(docRef);
  }

  async createLeader(leader: InsertLeader): Promise<Leader> {
    const leaderData = {
      name: leader.name,
      title: leader.title,
      bio: leader.bio ?? null,
      imageUrl: leader.imageUrl ?? null,
      linkedinUrl: leader.linkedinUrl ?? null,
      order: leader.order ?? null,
      visible: leader.visible ?? true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, "leaders"), leaderData);
    
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return normalizeDocData<Leader>({ id: docSnap.id, ...docSnap.data() });
    }
    
    return {
      id: docRef.id,
      ...normalizeDocData(leaderData),
    };
  }

  async getAllLeaders(): Promise<Leader[]> {
    const leadersSnapshot = await getDocs(collection(db, "leaders"));
    const leadersList: Leader[] = [];
    
    for (const leaderDoc of leadersSnapshot.docs) {
      const leaderData = leaderDoc.data();
      if (leaderData.visible === true || leaderData.visible === undefined) {
        leadersList.push(normalizeDocData<Leader>({
          id: leaderDoc.id,
          ...leaderData,
        }));
      }
    }
    
    return leadersList.sort((a, b) => {
      if (a.order !== b.order) {
        return (a.order || 0) - (b.order || 0);
      }
      const dateA = a.createdAt;
      const dateB = b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });
  }

  async getLeaderById(id: string): Promise<Leader | undefined> {
    const docRef = doc(db, "leaders", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return normalizeDocData<Leader>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async updateLeader(id: string, data: Partial<InsertLeader>): Promise<Leader | undefined> {
    const docRef = doc(db, "leaders", id);
    
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.visible !== undefined) updateData.visible = data.visible;
    
    await updateDoc(docRef, updateData);
    
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return normalizeDocData<Leader>({ id: updatedDoc.id, ...updatedDoc.data() });
    }
    return undefined;
  }

  async deleteLeader(id: string): Promise<void> {
    const docRef = doc(db, "leaders", id);
    await deleteDoc(docRef);
  }

  async createGalleryImage(image: InsertGalleryImage): Promise<GalleryImage> {
    const imageData = {
      title: image.title,
      description: image.description ?? null,
      imageUrl: image.imageUrl,
      category: image.category ?? null,
      eventDate: image.eventDate ?? null,
      visible: image.visible ?? true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(collection(db, "gallery"), imageData);
    
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return normalizeDocData<GalleryImage>({ id: docSnap.id, ...docSnap.data() });
    }
    
    return {
      id: docRef.id,
      ...normalizeDocData(imageData),
    };
  }

  async getAllGalleryImages(): Promise<GalleryImage[]> {
    const gallerySnapshot = await getDocs(collection(db, "gallery"));
    const galleryList: GalleryImage[] = [];
    
    for (const galleryDoc of gallerySnapshot.docs) {
      const galleryData = galleryDoc.data();
      if (galleryData.visible === true || galleryData.visible === undefined) {
        galleryList.push(normalizeDocData<GalleryImage>({
          id: galleryDoc.id,
          ...galleryData,
        }));
      }
    }
    
    return galleryList.sort((a, b) => {
      const dateA = a.eventDate || a.createdAt;
      const dateB = b.eventDate || b.createdAt;
      return dateB.getTime() - dateA.getTime();
    });
  }

  async getGalleryImageById(id: string): Promise<GalleryImage | undefined> {
    const docRef = doc(db, "gallery", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return normalizeDocData<GalleryImage>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async updateGalleryImage(id: string, data: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined> {
    const docRef = doc(db, "gallery", id);
    
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.eventDate !== undefined) updateData.eventDate = data.eventDate;
    if (data.visible !== undefined) updateData.visible = data.visible;
    
    await updateDoc(docRef, updateData);
    
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      return normalizeDocData<GalleryImage>({ id: updatedDoc.id, ...updatedDoc.data() });
    }
    return undefined;
  }

  async deleteGalleryImage(id: string): Promise<void> {
    const docRef = doc(db, "gallery", id);
    await deleteDoc(docRef);
  }

  async createMembershipTier(tier: InsertMembershipTier): Promise<MembershipTier> {
    const [newTier] = await pgDb.insert(membershipTiers).values(tier).returning();
    return newTier;
  }

  async getAllMembershipTiers(): Promise<MembershipTier[]> {
    const result = await pgDb.select().from(membershipTiers).where(eq(membershipTiers.visible, true)).orderBy(membershipTiers.order);
    return result;
  }

  async getMembershipTierById(id: string): Promise<MembershipTier | undefined> {
    const [tier] = await pgDb.select().from(membershipTiers).where(eq(membershipTiers.id, id));
    return tier;
  }

  async updateMembershipTier(id: string, data: Partial<InsertMembershipTier>): Promise<MembershipTier | undefined> {
    const [updated] = await pgDb.update(membershipTiers).set({ ...data, updatedAt: new Date() }).where(eq(membershipTiers.id, id)).returning();
    return updated;
  }

  async deleteMembershipTier(id: string): Promise<void> {
    await pgDb.delete(membershipTiers).where(eq(membershipTiers.id, id));
  }

  async createMembershipApplication(application: InsertMembershipApplication): Promise<MembershipApplication> {
    const [newApplication] = await pgDb.insert(membershipApplications).values(application).returning();
    return newApplication;
  }

  async getAllMembershipApplications(): Promise<MembershipApplication[]> {
    // Fetch from Firestore 'registrations' collection (Join Now form submissions)
    const registrationsRef = collection(db, "registrations");
    const q = query(registrationsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    // Transform Firestore data to match MembershipApplication format
    const applications: MembershipApplication[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        id: doc.id,
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || null,
        country: data.country || "",
        city: data.city || null,
        languages: data.languages || null,
        headline: data.headline || null,
        bio: data.bio || null,
        linkedinUrl: data.linkedinUrl || null,
        websiteUrl: data.websiteUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        roles: data.roles || null,
        status: data.status || "pending",
        createdAt: normalizeDate(data.createdAt),
        updatedAt: normalizeDate(data.updatedAt || data.createdAt),
      };
    });
    
    return applications;
  }

  async getMembershipApplicationById(id: string): Promise<MembershipApplication | undefined> {
    // Fetch from Firestore 'registrations' collection
    const docRef = doc(db, "registrations", id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return undefined;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      fullName: data.fullName || "",
      email: data.email || "",
      phone: data.phone || null,
      country: data.country || "",
      city: data.city || null,
      languages: data.languages || null,
      headline: data.headline || null,
      bio: data.bio || null,
      linkedinUrl: data.linkedinUrl || null,
      websiteUrl: data.websiteUrl || null,
      portfolioUrl: data.portfolioUrl || null,
      roles: data.roles || null,
      status: data.status || "pending",
      createdAt: normalizeDate(data.createdAt),
      updatedAt: normalizeDate(data.updatedAt || data.createdAt),
    };
  }

  async updateMembershipApplication(id: string, data: Partial<InsertMembershipApplication>): Promise<MembershipApplication | undefined> {
    // Update in Firestore 'registrations' collection
    const docRef = doc(db, "registrations", id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return undefined;
    }
    
    // Validate the update data using the schema (partial)
    // This ensures enum constraints (like status) are enforced
    const validatedData = insertMembershipApplicationSchema.partial().parse(data);
    
    // Filter out undefined values and prepare update payload
    const updatePayload: Record<string, any> = {};
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert Date objects to Firestore Timestamps
        if (value instanceof Date) {
          updatePayload[key] = Timestamp.fromDate(value);
        } else {
          updatePayload[key] = value;
        }
      }
    });
    
    // Always update the updatedAt timestamp
    updatePayload.updatedAt = Timestamp.now();
    
    // Update the document
    await updateDoc(docRef, updatePayload);
    
    // Fetch and return the updated document using the getter for consistency
    return this.getMembershipApplicationById(id);
  }

  async deleteMembershipApplication(id: string): Promise<void> {
    // Delete from Firestore 'registrations' collection
    const docRef = doc(db, "registrations", id);
    await deleteDoc(docRef);
  }

  // Country/City management methods using Firestore
  // Structure: countries collection with cities as embedded array in each country document
  
  async createCountry(country: InsertCountry): Promise<Country> {
    const countryId = this.generateId();
    const now = new Date();
    const newCountry: FirestoreCountry = {
      id: countryId,
      code: country.code,
      name: country.name,
      displayName: country.displayName || null,
      phoneCode: country.phoneCode || null,
      enabled: country.enabled ?? false,
      sortOrder: country.sortOrder ?? 0,
      cities: [],
      createdAt: now,
      updatedAt: now,
    };
    
    await setDoc(doc(db, "countries", countryId), newCountry);
    
    return {
      id: countryId,
      code: country.code,
      name: country.name,
      displayName: country.displayName || null,
      phoneCode: country.phoneCode || null,
      enabled: country.enabled ?? false,
      sortOrder: country.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAllCountries(): Promise<Country[]> {
    const querySnapshot = await getDocs(collection(db, "countries"));
    const countriesList = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return normalizeDocData<Country>({
        id: docSnap.id,
        code: data.code,
        name: data.name,
        displayName: data.displayName || null,
        phoneCode: data.phoneCode || null,
        enabled: data.enabled ?? false,
        sortOrder: data.sortOrder ?? 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });
    
    return countriesList.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }

  async getEnabledCountries(): Promise<Country[]> {
    const q = query(collection(db, "countries"), where("enabled", "==", true));
    const querySnapshot = await getDocs(q);
    const countriesList = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return normalizeDocData<Country>({
        id: docSnap.id,
        code: data.code,
        name: data.name,
        displayName: data.displayName || null,
        phoneCode: data.phoneCode || null,
        enabled: data.enabled ?? false,
        sortOrder: data.sortOrder ?? 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });
    
    return countriesList.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }

  async getCountryById(id: string): Promise<Country | undefined> {
    const docRef = doc(db, "countries", id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return undefined;
    
    const data = docSnap.data();
    return normalizeDocData<Country>({
      id: docSnap.id,
      code: data.code,
      name: data.name,
      displayName: data.displayName || null,
      phoneCode: data.phoneCode || null,
      enabled: data.enabled ?? false,
      sortOrder: data.sortOrder ?? 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async updateCountry(id: string, data: Partial<InsertCountry>): Promise<Country | undefined> {
    const docRef = doc(db, "countries", id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return undefined;
    
    const updateData: Record<string, any> = { ...data, updatedAt: new Date() };
    await updateDoc(docRef, updateData);
    
    return this.getCountryById(id);
  }

  async deleteCountry(id: string): Promise<void> {
    const docRef = doc(db, "countries", id);
    await deleteDoc(docRef);
  }

  async bulkCreateCountries(countriesData: InsertCountry[]): Promise<Country[]> {
    if (countriesData.length === 0) return [];
    
    const { writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    const createdCountries: Country[] = [];
    const now = new Date();
    
    for (const country of countriesData) {
      const countryId = this.generateId();
      const newCountry: FirestoreCountry = {
        id: countryId,
        code: country.code,
        name: country.name,
        displayName: country.displayName || null,
        phoneCode: country.phoneCode || null,
        enabled: country.enabled ?? false,
        sortOrder: country.sortOrder ?? 0,
        cities: [],
        createdAt: now,
        updatedAt: now,
      };
      
      batch.set(doc(db, "countries", countryId), newCountry);
      
      createdCountries.push({
        id: countryId,
        code: country.code,
        name: country.name,
        displayName: country.displayName || null,
        phoneCode: country.phoneCode || null,
        enabled: country.enabled ?? false,
        sortOrder: country.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    await batch.commit();
    return createdCountries;
  }

  async createCity(city: InsertCity): Promise<City> {
    const { arrayUnion } = await import("firebase/firestore");
    const countryRef = doc(db, "countries", city.countryId);
    const countrySnap = await getDoc(countryRef);
    
    if (!countrySnap.exists()) {
      throw new Error(`Country with id ${city.countryId} not found`);
    }
    
    const cityId = this.generateId();
    const now = new Date();
    const newCity: FirestoreCity = {
      id: cityId,
      name: city.name,
      displayName: city.displayName || null,
      enabled: city.enabled ?? false,
      sortOrder: city.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    
    await updateDoc(countryRef, { 
      cities: arrayUnion(newCity),
      updatedAt: now
    });
    
    return {
      id: cityId,
      countryId: city.countryId,
      name: city.name,
      displayName: city.displayName || null,
      enabled: city.enabled ?? false,
      sortOrder: city.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getCitiesByCountryId(countryId: string): Promise<City[]> {
    const countryRef = doc(db, "countries", countryId);
    const countrySnap = await getDoc(countryRef);
    
    if (!countrySnap.exists()) return [];
    
    const countryData = countrySnap.data();
    const cities = (countryData.cities || []).map((city: FirestoreCity) => ({
      id: city.id,
      countryId: countryId,
      name: city.name,
      displayName: city.displayName || null,
      enabled: city.enabled ?? false,
      sortOrder: city.sortOrder ?? 0,
      createdAt: normalizeDate(city.createdAt),
      updatedAt: normalizeDate(city.updatedAt),
    }));
    
    return cities.sort((a: City, b: City) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });
  }

  async getEnabledCitiesByCountryId(countryId: string): Promise<City[]> {
    const allCities = await this.getCitiesByCountryId(countryId);
    return allCities.filter(city => city.enabled);
  }

  async getCityById(id: string): Promise<City | undefined> {
    const querySnapshot = await getDocs(collection(db, "countries"));
    
    for (const countryDoc of querySnapshot.docs) {
      const countryData = countryDoc.data();
      const cities = countryData.cities || [];
      const city = cities.find((c: FirestoreCity) => c.id === id);
      
      if (city) {
        return {
          id: city.id,
          countryId: countryDoc.id,
          name: city.name,
          displayName: city.displayName || null,
          enabled: city.enabled ?? false,
          sortOrder: city.sortOrder ?? 0,
          createdAt: normalizeDate(city.createdAt),
          updatedAt: normalizeDate(city.updatedAt),
        };
      }
    }
    
    return undefined;
  }

  async updateCity(id: string, data: Partial<InsertCity>): Promise<City | undefined> {
    const querySnapshot = await getDocs(collection(db, "countries"));
    
    for (const countryDoc of querySnapshot.docs) {
      const countryData = countryDoc.data();
      const cities = countryData.cities || [];
      const cityIndex = cities.findIndex((c: FirestoreCity) => c.id === id);
      
      if (cityIndex !== -1) {
        const now = new Date();
        const updatedCity = {
          ...cities[cityIndex],
          ...data,
          updatedAt: now,
        };
        delete (updatedCity as any).countryId;
        
        cities[cityIndex] = updatedCity;
        
        await updateDoc(doc(db, "countries", countryDoc.id), {
          cities: cities,
          updatedAt: now,
        });
        
        return {
          id: updatedCity.id,
          countryId: countryDoc.id,
          name: updatedCity.name,
          displayName: updatedCity.displayName || null,
          enabled: updatedCity.enabled ?? false,
          sortOrder: updatedCity.sortOrder ?? 0,
          createdAt: normalizeDate(updatedCity.createdAt),
          updatedAt: normalizeDate(updatedCity.updatedAt),
        };
      }
    }
    
    return undefined;
  }

  async deleteCity(id: string): Promise<void> {
    const querySnapshot = await getDocs(collection(db, "countries"));
    
    for (const countryDoc of querySnapshot.docs) {
      const countryData = countryDoc.data();
      const cities = countryData.cities || [];
      const cityIndex = cities.findIndex((c: FirestoreCity) => c.id === id);
      
      if (cityIndex !== -1) {
        cities.splice(cityIndex, 1);
        
        await updateDoc(doc(db, "countries", countryDoc.id), {
          cities: cities,
          updatedAt: new Date(),
        });
        
        return;
      }
    }
  }

  async bulkCreateCities(citiesData: InsertCity[]): Promise<City[]> {
    if (citiesData.length === 0) return [];
    
    const now = new Date();
    const createdCities: City[] = [];
    
    const citiesByCountry = new Map<string, InsertCity[]>();
    for (const city of citiesData) {
      const existing = citiesByCountry.get(city.countryId) || [];
      existing.push(city);
      citiesByCountry.set(city.countryId, existing);
    }
    
    for (const [countryId, cities] of Array.from(citiesByCountry)) {
      const countryRef = doc(db, "countries", countryId);
      const countrySnap = await getDoc(countryRef);
      
      if (!countrySnap.exists()) continue;
      
      const countryData = countrySnap.data();
      const existingCities = countryData.cities || [];
      
      for (const city of cities) {
        const cityId = this.generateId();
        const newCity: FirestoreCity = {
          id: cityId,
          name: city.name,
          displayName: city.displayName || null,
          enabled: city.enabled ?? false,
          sortOrder: city.sortOrder ?? 0,
          createdAt: now,
          updatedAt: now,
        };
        
        existingCities.push(newCity);
        
        createdCities.push({
          id: cityId,
          countryId: countryId,
          name: city.name,
          displayName: city.displayName || null,
          enabled: city.enabled ?? false,
          sortOrder: city.sortOrder ?? 0,
          createdAt: now,
          updatedAt: now,
        });
      }
      
      await updateDoc(countryRef, {
        cities: existingCities,
        updatedAt: now,
      });
    }
    
    return createdCities;
  }
}

export const storage = new FirestoreStorage();
