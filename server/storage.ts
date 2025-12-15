import { getAdminDb, Timestamp, FieldValue } from "./firebase-admin";
import { db as pgDb } from "./db";
import { leaders, galleryImages, membershipTiers, membershipApplications } from "@shared/schema";
import { eq, desc, and, asc, count } from "drizzle-orm";
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
  type FieldsConfig,
  type InsertFieldsConfig,
  type RoleUpgradeRequest,
  type InsertRoleUpgradeRequest,
  type ChapterAdmin,
  type InsertChapterAdmin,
} from "@shared/schema";
import { toFirestoreRoles } from "@shared/roleUtils";

function normalizeDate(value: any): Date {
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return new Date();
}

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

function normalizeRoleUpgradeRequest(data: any): RoleUpgradeRequest {
  const normalized = normalizeDocData<RoleUpgradeRequest>(data);
  if (!normalized.status) {
    normalized.status = "pending";
  }
  if (data.reviewedAt) normalized.reviewedAt = normalizeDate(data.reviewedAt);
  return normalized;
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
  
  completeRegistration(data: RegistrationData): Promise<{ user: User; profile: UserProfile; roles: { professional: boolean; jobSeeker: boolean; employer: boolean; businessOwner: boolean; investor: boolean; admin: boolean } }>;
  
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
  
  createFieldConfig(field: InsertFieldsConfig): Promise<FieldsConfig>;
  getAllFieldsConfig(): Promise<FieldsConfig[]>;
  getMainFields(): Promise<FieldsConfig[]>;
  getSubFieldsByParentId(parentId: string): Promise<FieldsConfig[]>;
  getFieldConfigById(id: string): Promise<FieldsConfig | undefined>;
  updateFieldConfig(id: string, data: Partial<InsertFieldsConfig>): Promise<FieldsConfig | undefined>;
  deleteFieldConfig(id: string): Promise<void>;
  
  createRoleUpgradeRequest(request: InsertRoleUpgradeRequest): Promise<RoleUpgradeRequest>;
  getAllRoleUpgradeRequests(): Promise<RoleUpgradeRequest[]>;
  getPendingRoleUpgradeRequests(): Promise<RoleUpgradeRequest[]>;
  getRoleUpgradeRequestById(id: string): Promise<RoleUpgradeRequest | undefined>;
  getRoleUpgradeRequestsByUserId(userId: string): Promise<RoleUpgradeRequest[]>;
  updateRoleUpgradeRequest(id: string, data: Partial<InsertRoleUpgradeRequest>): Promise<RoleUpgradeRequest | undefined>;
  approveRoleUpgradeRequest(id: string, adminId: string): Promise<RoleUpgradeRequest | undefined>;
  rejectRoleUpgradeRequest(id: string, adminId: string, notes?: string): Promise<RoleUpgradeRequest | undefined>;
  
  createChapterAdmin(chapterAdmin: InsertChapterAdmin): Promise<ChapterAdmin>;
  getAllChapterAdmins(): Promise<ChapterAdmin[]>;
  getChapterAdminById(id: string): Promise<ChapterAdmin | undefined>;
  getChapterAdminByUserId(userId: string): Promise<ChapterAdmin | undefined>;
  updateChapterAdmin(id: string, data: Partial<InsertChapterAdmin>): Promise<ChapterAdmin | undefined>;
  deleteChapterAdmin(id: string): Promise<void>;
}

export class FirestoreStorage implements IStorage {
  private generateId(): string {
    return getAdminDb().collection("temp").doc().id;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const docRef = getAdminDb().collection("users").doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return normalizeDocData<User>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const querySnapshot = await getAdminDb().collection("users").where("email", "==", email).get();
    
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return normalizeDocData<User>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getUserWithRoles(id: string): Promise<{ user: User; roles: UserRoles | null } | undefined> {
    const userDocRef = getAdminDb().collection("users").doc(id);
    const userSnap = await userDocRef.get();
    
    if (!userSnap.exists) {
      return undefined;
    }
    
    const userData = userSnap.data()!;
    const user = normalizeDocData<User>({ id: userSnap.id, ...userData });

    let roles: UserRoles | null = null;
    
    if (userData.roles) {
      roles = {
        id,
        userId: id,
        professional: userData.roles.professional || userData.roles.isProfessional || false,
        jobSeeker: userData.roles.jobSeeker || userData.roles.isJobSeeker || false,
        employer: userData.roles.employer || userData.roles.isEmployer || false,
        businessOwner: userData.roles.businessOwner || userData.roles.isBusinessOwner || false,
        investor: userData.roles.investor || userData.roles.isInvestor || false,
        admin: userData.roles.admin || userData.roles.isAdmin || false,
        chapterAdmin: userData.roles.chapterAdmin || userData.roles.isChapterAdmin || false,
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
    
    await getAdminDb().collection("users").doc(insertUser.id).set(userData);
    return userData;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    const userRef = getAdminDb().collection("users").doc(id);
    await userRef.update({
      lastLogin: new Date(),
    });
  }

  async completeRegistration(data: RegistrationData): Promise<{ user: User; profile: UserProfile; roles: { professional: boolean; jobSeeker: boolean; employer: boolean; businessOwner: boolean; investor: boolean; admin: boolean } }> {
    try {
      const existingUserSnap = await getAdminDb().collection("users").doc(data.userId).get();
      const existingUserData = existingUserSnap.exists ? existingUserSnap.data()! : {};
      
      const existingRoles = existingUserData.roles || {};
      const wasAdmin = existingRoles.isAdmin === true || existingRoles.admin === true;
      
      const newRoles = toFirestoreRoles(data.roles);
      if (wasAdmin) {
        newRoles.isAdmin = true;
      }
      
      const preservedRoles = {
        professional: data.roles.professional || false,
        jobSeeker: data.roles.jobSeeker || false,
        employer: data.roles.employer || false,
        businessOwner: data.roles.businessOwner || false,
        investor: data.roles.investor || false,
        admin: wasAdmin || data.roles.admin || false,
      };
      
      const existingApprovalStatus = existingUserData.approvalStatus;
      const existingStatus = existingUserData.status;
      const wasRejected = existingApprovalStatus === "rejected" || existingStatus === "rejected";
      
      const consolidatedUserData = {
        id: data.userId,
        email: data.email,
        displayName: data.displayName,
        createdAt: existingUserData.createdAt || new Date(),
        lastLogin: null,
        approvalStatus: wasRejected ? "rejected" : (existingApprovalStatus || "approved"),
        name: existingUserData.name || data.profile.fullName,
        status: wasRejected ? "rejected" : (existingStatus || "approved"),
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
        roles: newRoles,
        professionalData: existingUserData.professionalData || {},
        jobSeekerData: existingUserData.jobSeekerData || {},
        employerData: existingUserData.employerData || {},
        businessOwnerData: existingUserData.businessOwnerData || {},
        investorData: existingUserData.investorData || {},
      };
      
      await getAdminDb().collection("users").doc(data.userId).set(consolidatedUserData, { merge: true });

      const user: User = {
        id: data.userId,
        email: data.email,
        displayName: data.displayName,
        createdAt: existingUserData.createdAt || new Date(),
        lastLogin: null,
        approvalStatus: wasRejected ? "rejected" : (existingApprovalStatus || "approved"),
        preRegistered: false,
        preRegisteredAt: null,
        registrationSource: null,
      };

      const profileId = this.generateId();
      const profile: UserProfile = {
        id: profileId,
        userId: data.userId,
        fullName: data.profile.fullName,
        countryCode: data.profile.countryCode || null,
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

      return { user, profile, roles: preservedRoles };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async createUserProfile(insertProfile: InsertUserProfile): Promise<UserProfile> {
    const userRef = getAdminDb().collection("users").doc(insertProfile.userId);
    await userRef.update({
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
      countryCode: insertProfile.countryCode || null,
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
    const userRef = getAdminDb().collection("users").doc(insertRoles.userId);
    await userRef.update({
      "roles.isProfessional": insertRoles.professional || false,
      "roles.isJobSeeker": insertRoles.jobSeeker || false,
      "roles.isEmployer": insertRoles.employer || false,
      "roles.isBusinessOwner": insertRoles.businessOwner || false,
      "roles.isInvestor": insertRoles.investor || false,
      "roles.isAdmin": insertRoles.admin || false,
      "roles.isChapterAdmin": insertRoles.chapterAdmin || false,
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
      chapterAdmin: insertRoles.chapterAdmin || false,
      createdAt: new Date(),
    };
    
    return roles;
  }

  async updateUserRoles(userId: string, roles: Omit<InsertUserRoles, "userId">): Promise<void> {
    const userRef = getAdminDb().collection("users").doc(userId);
    await userRef.update({
      "roles.isProfessional": roles.professional || false,
      "roles.isJobSeeker": roles.jobSeeker || false,
      "roles.isEmployer": roles.employer || false,
      "roles.isBusinessOwner": roles.businessOwner || false,
      "roles.isInvestor": roles.investor || false,
      "roles.isAdmin": roles.admin || false,
      needsRoleSelection: false,
      skipBackendSync: false,
      "roles.professional": admin.firestore.FieldValue.delete(),
      "roles.jobSeeker": admin.firestore.FieldValue.delete(),
      "roles.employer": admin.firestore.FieldValue.delete(),
      "roles.businessOwner": admin.firestore.FieldValue.delete(),
      "roles.investor": admin.firestore.FieldValue.delete(),
      "roles.admin": admin.firestore.FieldValue.delete(),
    });
  }

  async createProfessionalProfile(profile: InsertProfessionalProfile): Promise<void> {
    const userRef = getAdminDb().collection("users").doc(profile.userId);
    await userRef.update({
      professionalData: {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }

  async createJobSeekerProfile(profile: InsertJobSeekerProfile): Promise<void> {
    const userRef = getAdminDb().collection("users").doc(profile.userId);
    await userRef.update({
      jobSeekerData: {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }

  async createEmployerProfile(profile: InsertEmployerProfile): Promise<void> {
    const userRef = getAdminDb().collection("users").doc(profile.userId);
    await userRef.update({
      employerData: {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }

  async createBusinessOwnerProfile(profile: InsertBusinessOwnerProfile): Promise<void> {
    const userRef = getAdminDb().collection("users").doc(profile.userId);
    await userRef.update({
      businessOwnerData: {
        ...profile,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });
  }

  async createInvestorProfile(profile: InsertInvestorProfile): Promise<void> {
    const userRef = getAdminDb().collection("users").doc(profile.userId);
    await userRef.update({
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
    await getAdminDb().collection("opportunities").doc(opportunityId).set(newOpportunity);
    return newOpportunity;
  }

  async getOpportunityById(id: string): Promise<Opportunity | undefined> {
    const docRef = getAdminDb().collection("opportunities").doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return normalizeDocData<Opportunity>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getOpportunitiesByUserId(userId: string): Promise<Opportunity[]> {
    const querySnapshot = await getAdminDb().collection("opportunities").where("userId", "==", userId).get();
    
    return querySnapshot.docs.map(docSnap => 
      normalizeDocData<Opportunity>({ id: docSnap.id, ...docSnap.data() })
    );
  }

  async getPublicOpportunities(type?: string): Promise<Opportunity[]> {
    let queryRef = getAdminDb().collection("opportunities")
      .where("approvalStatus", "==", "approved")
      .where("status", "==", "open");
    
    if (type) {
      queryRef = queryRef.where("type", "==", type) as any;
    }
    
    const querySnapshot = await queryRef.get();
    const opportunities = querySnapshot.docs.map(docSnap => 
      normalizeDocData<Opportunity>({ id: docSnap.id, ...docSnap.data() })
    );
    
    console.log(`Found ${opportunities.length} public opportunities (type: ${type || 'all'})`);
    opportunities.forEach(opp => {
      console.log(`  - ${opp.title} | status: ${opp.status} | approvalStatus: ${opp.approvalStatus}`);
    });
    
    return opportunities;
  }

  async getAllOpportunities(): Promise<Opportunity[]> {
    const querySnapshot = await getAdminDb().collection("opportunities").get();
    return querySnapshot.docs.map(docSnap => 
      normalizeDocData<Opportunity>({ id: docSnap.id, ...docSnap.data() })
    );
  }

  async updateOpportunity(id: string, data: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const docRef = getAdminDb().collection("opportunities").doc(id);
    await docRef.update({
      ...data,
      updatedAt: new Date(),
    });
    
    return this.getOpportunityById(id);
  }

  async deleteOpportunity(id: string): Promise<void> {
    const docRef = getAdminDb().collection("opportunities").doc(id);
    await docRef.delete();
  }

  async bulkUpdateOpportunityApprovalStatus(opportunityIds: string[], status: "pending" | "approved" | "rejected"): Promise<void> {
    const batch = getAdminDb().batch();
    
    for (const id of opportunityIds) {
      const docRef = getAdminDb().collection("opportunities").doc(id);
      batch.update(docRef, {
        approvalStatus: status,
        updatedAt: new Date(),
      });
    }
    
    await batch.commit();
  }

  async bulkUpdateOpportunityStatus(opportunityIds: string[], status: "open" | "closed"): Promise<void> {
    const batch = getAdminDb().batch();
    
    for (const id of opportunityIds) {
      const docRef = getAdminDb().collection("opportunities").doc(id);
      batch.update(docRef, {
        status: status,
        updatedAt: new Date(),
      });
    }
    
    await batch.commit();
  }

  async bulkDeleteOpportunities(opportunityIds: string[]): Promise<void> {
    const batch = getAdminDb().batch();
    
    for (const id of opportunityIds) {
      const docRef = getAdminDb().collection("opportunities").doc(id);
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
    
    await getAdminDb().collection("applications").doc(applicationId).set(newApplication);
    return newApplication;
  }

  async getApplicationsByUser(userId: string): Promise<Array<Application & { opportunity: Opportunity }>> {
    const querySnapshot = await getAdminDb().collection("applications").where("userId", "==", userId).get();
    
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
    const querySnapshot = await getAdminDb().collection("applications").where("opportunityId", "==", opportunityId).get();
    
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
    const docRef = getAdminDb().collection("applications").doc(id);
    await docRef.update({
      status,
      updatedAt: new Date(),
    });
    
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return normalizeDocData<Application>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async checkExistingApplication(userId: string, opportunityId: string): Promise<Application | undefined> {
    const querySnapshot = await getAdminDb().collection("applications")
      .where("userId", "==", userId)
      .where("opportunityId", "==", opportunityId)
      .get();
    
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return normalizeDocData<Application>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getTalentByRole(role: "professional" | "jobSeeker"): Promise<TalentProfile[]> {
    const usersSnapshot = await getAdminDb().collection("users").get();
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
      
      const hasRole = role === "professional" 
        ? userData.roles?.professional 
        : userData.roles?.jobSeeker;
      
      if (!hasRole) {
        console.log(`  ❌ User ${userData.email} does not have ${role} role`);
        continue;
      }
      
      if (userData.approvalStatus !== "approved") {
        console.log(`  ⚠️  User ${userData.email} has ${role} role but approvalStatus is ${userData.approvalStatus}`);
        continue;
      }
      
      console.log(`  ✅ User ${userData.email} matches criteria!`);
      
      console.log(`📊 Talent user ${userData.email}:`, {
        hasProfessionalData: !!userData.professionalData,
        hasJobSeekerData: !!userData.jobSeekerData,
        professionalDataKeys: userData.professionalData ? Object.keys(userData.professionalData) : [],
        jobSeekerDataKeys: userData.jobSeekerData ? Object.keys(userData.jobSeekerData) : [],
      });
      
      const user = normalizeDocData<User>({ id: userDoc.id, ...userData });
      
      const profile: UserProfile = {
        id: userDoc.id,
        userId: userDoc.id,
        fullName: userData.profile?.fullName || userData.displayName || "",
        countryCode: userData.profile?.countryCode || null,
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
      
      let roleSpecificProfile = null;
      
      if (role === "professional" && userData.professionalData) {
        roleSpecificProfile = {
          id: userDoc.id,
          userId: userDoc.id,
          currentTitle: userData.professionalData.currentTitle || null,
          company: userData.professionalData.company || null,
          industry: userData.professionalData.industry || null,
          yearsExperience: userData.professionalData.yearsExperience || null,
          expertise: userData.professionalData.expertise || null,
          availability: userData.professionalData.availability || null,
          createdAt: userData.professionalData.createdAt?.toDate?.() || new Date(),
          updatedAt: userData.professionalData.updatedAt?.toDate?.() || new Date(),
        } as ProfessionalProfile;
      } else if (role === "jobSeeker" && userData.jobSeekerData) {
        roleSpecificProfile = {
          id: userDoc.id,
          userId: userDoc.id,
          currentTitle: userData.jobSeekerData.currentTitle || null,
          desiredTitle: userData.jobSeekerData.desiredTitle || null,
          skills: userData.jobSeekerData.skills || null,
          experienceLevel: userData.jobSeekerData.experienceLevel || null,
          availability: userData.jobSeekerData.availability || null,
          resumeUrl: userData.jobSeekerData.resumeUrl || null,
          createdAt: userData.jobSeekerData.createdAt?.toDate?.() || new Date(),
          updatedAt: userData.jobSeekerData.updatedAt?.toDate?.() || new Date(),
        } as JobSeekerProfile;
      }
      
      results.push({ user, profile, roleSpecificProfile });
    }
    
    console.log(`✅ Total matching talent: ${results.length}`);
    return results;
  }

  async getAllUsers(): Promise<User[]> {
    const usersSnapshot = await getAdminDb().collection("users").get();
    const users: User[] = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      users.push(normalizeDocData<User>({ id: userDoc.id, ...userData }));
    }
    
    return users;
  }

  async getAdminStats(): Promise<any> {
    const usersSnapshot = await getAdminDb().collection("users").get();
    
    const registrationsSnapshot = await getAdminDb().collection("registrations").get();
    
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
      totalApplications: registrationsSnapshot.size,
    };
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      stats.totalUsers++;
      
      const roles = userData.roles || {};
      if (roles.professional || roles.isProfessional || userData.isProfessional) stats.professionals++;
      if (roles.jobSeeker || roles.isJobSeeker || userData.isJobSeeker) stats.jobSeekers++;
      if (roles.employer || roles.isEmployer || userData.isEmployer) stats.employers++;
      if (roles.businessOwner || roles.isBusinessOwner || userData.isBusinessOwner) stats.businessOwners++;
      if (roles.investor || roles.isInvestor || userData.isInvestor) stats.investors++;
      if (roles.admin || roles.isAdmin || userData.isAdmin) stats.admins++;
      
      if (userData.status === "pending") stats.pendingApprovals++;
      if (userData.status === "approved") stats.approved++;
      if (userData.status === "rejected") stats.rejected++;
    }
    
    return stats;
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    const userRef = getAdminDb().collection("users").doc(userId);
    await userRef.update({
      status,
      approvalStatus: status,
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
    
    const docRef = await getAdminDb().collection("videos").add(videoData);
    
    return {
      id: docRef.id,
      ...videoData,
    };
  }

  async getAllVideos(): Promise<Video[]> {
    const videosSnapshot = await getAdminDb().collection("videos").get();
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
    const docRef = getAdminDb().collection("videos").doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return normalizeDocData<Video>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async updateVideo(id: string, data: Partial<InsertVideo>): Promise<Video | undefined> {
    const docRef = getAdminDb().collection("videos").doc(id);
    
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
    
    await docRef.update(updateData);
    
    const updatedDoc = await docRef.get();
    if (updatedDoc.exists) {
      return normalizeDocData<Video>({ id: updatedDoc.id, ...updatedDoc.data() });
    }
    return undefined;
  }

  async deleteVideo(id: string): Promise<void> {
    const docRef = getAdminDb().collection("videos").doc(id);
    await docRef.delete();
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
    
    const docRef = await getAdminDb().collection("leaders").add(leaderData);
    
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return normalizeDocData<Leader>({ id: docSnap.id, ...docSnap.data() });
    }
    
    return {
      id: docRef.id,
      ...normalizeDocData(leaderData),
    };
  }

  async getAllLeaders(): Promise<Leader[]> {
    const leadersSnapshot = await getAdminDb().collection("leaders").get();
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
    const docRef = getAdminDb().collection("leaders").doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return normalizeDocData<Leader>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async updateLeader(id: string, data: Partial<InsertLeader>): Promise<Leader | undefined> {
    const docRef = getAdminDb().collection("leaders").doc(id);
    
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
    
    await docRef.update(updateData);
    
    const updatedDoc = await docRef.get();
    if (updatedDoc.exists) {
      return normalizeDocData<Leader>({ id: updatedDoc.id, ...updatedDoc.data() });
    }
    return undefined;
  }

  async deleteLeader(id: string): Promise<void> {
    const docRef = getAdminDb().collection("leaders").doc(id);
    await docRef.delete();
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
    
    const docRef = await getAdminDb().collection("gallery").add(imageData);
    
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return normalizeDocData<GalleryImage>({ id: docSnap.id, ...docSnap.data() });
    }
    
    return {
      id: docRef.id,
      ...normalizeDocData(imageData),
    };
  }

  async getAllGalleryImages(): Promise<GalleryImage[]> {
    const gallerySnapshot = await getAdminDb().collection("gallery").get();
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
    const docRef = getAdminDb().collection("gallery").doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return normalizeDocData<GalleryImage>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async updateGalleryImage(id: string, data: Partial<InsertGalleryImage>): Promise<GalleryImage | undefined> {
    const docRef = getAdminDb().collection("gallery").doc(id);
    
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.eventDate !== undefined) updateData.eventDate = data.eventDate;
    if (data.visible !== undefined) updateData.visible = data.visible;
    
    await docRef.update(updateData);
    
    const updatedDoc = await docRef.get();
    if (updatedDoc.exists) {
      return normalizeDocData<GalleryImage>({ id: updatedDoc.id, ...updatedDoc.data() });
    }
    return undefined;
  }

  async deleteGalleryImage(id: string): Promise<void> {
    const docRef = getAdminDb().collection("gallery").doc(id);
    await docRef.delete();
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
    const registrationsRef = getAdminDb().collection("registrations");
    const querySnapshot = await registrationsRef.orderBy("createdAt", "desc").get();
    
    const applications: MembershipApplication[] = querySnapshot.docs.map(docSnap => {
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
    });
    
    return applications;
  }

  async getMembershipApplicationById(id: string): Promise<MembershipApplication | undefined> {
    const docRef = getAdminDb().collection("registrations").doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return undefined;
    }
    
    const data = docSnap.data()!;
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
    const docRef = getAdminDb().collection("registrations").doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return undefined;
    }
    
    const validatedData = insertMembershipApplicationSchema.partial().parse(data);
    
    const updatePayload: Record<string, any> = {};
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value instanceof Date) {
          updatePayload[key] = Timestamp.fromDate(value);
        } else {
          updatePayload[key] = value;
        }
      }
    });
    
    updatePayload.updatedAt = Timestamp.now();
    
    await docRef.update(updatePayload);
    
    return this.getMembershipApplicationById(id);
  }

  async deleteMembershipApplication(id: string): Promise<void> {
    const docRef = getAdminDb().collection("registrations").doc(id);
    await docRef.delete();
  }

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
      isPrimary: country.isPrimary ?? false,
      comingSoon: country.comingSoon ?? false,
      sortOrder: country.sortOrder ?? 0,
      cities: [],
      createdAt: now,
      updatedAt: now,
    };
    
    await getAdminDb().collection("countries").doc(countryId).set(newCountry);
    
    return {
      id: countryId,
      code: country.code,
      name: country.name,
      displayName: country.displayName || null,
      phoneCode: country.phoneCode || null,
      enabled: country.enabled ?? false,
      isPrimary: country.isPrimary ?? false,
      comingSoon: country.comingSoon ?? false,
      sortOrder: country.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAllCountries(): Promise<Country[]> {
    const querySnapshot = await getAdminDb().collection("countries").get();
    const countriesList = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return normalizeDocData<Country>({
        id: docSnap.id,
        code: data.code,
        name: data.name,
        displayName: data.displayName || null,
        phoneCode: data.phoneCode || null,
        enabled: data.enabled ?? false,
        isPrimary: data.isPrimary ?? false,
        comingSoon: data.comingSoon ?? false,
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
    const querySnapshot = await getAdminDb().collection("countries").where("enabled", "==", true).get();
    const countriesList = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return normalizeDocData<Country>({
        id: docSnap.id,
        code: data.code,
        name: data.name,
        displayName: data.displayName || null,
        phoneCode: data.phoneCode || null,
        enabled: data.enabled ?? false,
        isPrimary: data.isPrimary ?? false,
        comingSoon: data.comingSoon ?? false,
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
    const docRef = getAdminDb().collection("countries").doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) return undefined;
    
    const data = docSnap.data()!;
    return normalizeDocData<Country>({
      id: docSnap.id,
      code: data.code,
      name: data.name,
      displayName: data.displayName || null,
      phoneCode: data.phoneCode || null,
      enabled: data.enabled ?? false,
      isPrimary: data.isPrimary ?? false,
      comingSoon: data.comingSoon ?? false,
      sortOrder: data.sortOrder ?? 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async updateCountry(id: string, data: Partial<InsertCountry>): Promise<Country | undefined> {
    const docRef = getAdminDb().collection("countries").doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) return undefined;
    
    const updateData: Record<string, any> = { ...data, updatedAt: new Date() };
    await docRef.update(updateData);
    
    return this.getCountryById(id);
  }

  async deleteCountry(id: string): Promise<void> {
    const docRef = getAdminDb().collection("countries").doc(id);
    await docRef.delete();
  }

  async bulkCreateCountries(countriesData: InsertCountry[]): Promise<Country[]> {
    if (countriesData.length === 0) return [];
    
    const batch = getAdminDb().batch();
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
        isPrimary: country.isPrimary ?? false,
        comingSoon: country.comingSoon ?? false,
        sortOrder: country.sortOrder ?? 0,
        cities: [],
        createdAt: now,
        updatedAt: now,
      };
      
      batch.set(getAdminDb().collection("countries").doc(countryId), newCountry);
      
      createdCountries.push({
        id: countryId,
        code: country.code,
        name: country.name,
        displayName: country.displayName || null,
        phoneCode: country.phoneCode || null,
        enabled: country.enabled ?? false,
        isPrimary: country.isPrimary ?? false,
        comingSoon: country.comingSoon ?? false,
        sortOrder: country.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    await batch.commit();
    return createdCountries;
  }

  async createCity(city: InsertCity): Promise<City> {
    const countryRef = getAdminDb().collection("countries").doc(city.countryId);
    const countrySnap = await countryRef.get();
    
    if (!countrySnap.exists) {
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
    
    await countryRef.update({ 
      cities: admin.firestore.FieldValue.arrayUnion(newCity),
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
    const countryRef = getAdminDb().collection("countries").doc(countryId);
    const countrySnap = await countryRef.get();
    
    if (!countrySnap.exists) return [];
    
    const countryData = countrySnap.data()!;
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
    const cities = await this.getCitiesByCountryId(countryId);
    return cities.filter(city => city.enabled);
  }

  async getCityById(id: string): Promise<City | undefined> {
    const countriesSnapshot = await getAdminDb().collection("countries").get();
    
    for (const countryDoc of countriesSnapshot.docs) {
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
    const countriesSnapshot = await getAdminDb().collection("countries").get();
    
    for (const countryDoc of countriesSnapshot.docs) {
      const countryData = countryDoc.data();
      const cities = countryData.cities || [];
      const cityIndex = cities.findIndex((c: FirestoreCity) => c.id === id);
      
      if (cityIndex !== -1) {
        const updatedCity = {
          ...cities[cityIndex],
          ...data,
          updatedAt: new Date(),
        };
        cities[cityIndex] = updatedCity;
        
        await getAdminDb().collection("countries").doc(countryDoc.id).update({
          cities,
          updatedAt: new Date(),
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
    const countriesSnapshot = await getAdminDb().collection("countries").get();
    
    for (const countryDoc of countriesSnapshot.docs) {
      const countryData = countryDoc.data();
      const cities = countryData.cities || [];
      const cityIndex = cities.findIndex((c: FirestoreCity) => c.id === id);
      
      if (cityIndex !== -1) {
        cities.splice(cityIndex, 1);
        
        await getAdminDb().collection("countries").doc(countryDoc.id).update({
          cities,
          updatedAt: new Date(),
        });
        
        return;
      }
    }
  }

  async bulkCreateCities(citiesData: InsertCity[]): Promise<City[]> {
    if (citiesData.length === 0) return [];
    
    const citiesByCountry = new Map<string, InsertCity[]>();
    for (const city of citiesData) {
      const existing = citiesByCountry.get(city.countryId) || [];
      existing.push(city);
      citiesByCountry.set(city.countryId, existing);
    }
    
    const createdCities: City[] = [];
    const now = new Date();
    
    for (const [countryId, cities] of citiesByCountry) {
      const countryRef = getAdminDb().collection("countries").doc(countryId);
      const countrySnap = await countryRef.get();
      
      if (!countrySnap.exists) continue;
      
      const newCities: FirestoreCity[] = cities.map(city => ({
        id: this.generateId(),
        name: city.name,
        displayName: city.displayName || null,
        enabled: city.enabled ?? false,
        sortOrder: city.sortOrder ?? 0,
        createdAt: now,
        updatedAt: now,
      }));
      
      await countryRef.update({
        cities: admin.firestore.FieldValue.arrayUnion(...newCities),
        updatedAt: now,
      });
      
      for (const newCity of newCities) {
        createdCities.push({
          id: newCity.id,
          countryId,
          name: newCity.name,
          displayName: newCity.displayName || null,
          enabled: newCity.enabled ?? false,
          sortOrder: newCity.sortOrder ?? 0,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    
    return createdCities;
  }

  async createFieldConfig(field: InsertFieldsConfig): Promise<FieldsConfig> {
    const fieldId = this.generateId();
    const now = new Date();
    const newField: FieldsConfig = {
      id: fieldId,
      fieldType: field.fieldType,
      name: field.name,
      displayName: field.displayName || null,
      parentId: field.parentId || null,
      enabled: field.enabled ?? true,
      sortOrder: field.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    
    await getAdminDb().collection("fieldsConfig").doc(fieldId).set(newField);
    return newField;
  }

  async getAllFieldsConfig(): Promise<FieldsConfig[]> {
    const querySnapshot = await getAdminDb().collection("fieldsConfig").get();
    return querySnapshot.docs.map(docSnap => 
      normalizeDocData<FieldsConfig>({ id: docSnap.id, ...docSnap.data() })
    );
  }

  async getMainFields(): Promise<FieldsConfig[]> {
    const querySnapshot = await getAdminDb().collection("fieldsConfig")
      .where("parentId", "==", null)
      .get();
    
    const fields = querySnapshot.docs.map(docSnap => 
      normalizeDocData<FieldsConfig>({ id: docSnap.id, ...docSnap.data() })
    );
    
    return fields.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getSubFieldsByParentId(parentId: string): Promise<FieldsConfig[]> {
    const querySnapshot = await getAdminDb().collection("fieldsConfig")
      .where("parentId", "==", parentId)
      .get();
    
    const fields = querySnapshot.docs.map(docSnap => 
      normalizeDocData<FieldsConfig>({ id: docSnap.id, ...docSnap.data() })
    );
    
    return fields.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getFieldConfigById(id: string): Promise<FieldsConfig | undefined> {
    const docRef = getAdminDb().collection("fieldsConfig").doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return normalizeDocData<FieldsConfig>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async updateFieldConfig(id: string, data: Partial<InsertFieldsConfig>): Promise<FieldsConfig | undefined> {
    const docRef = getAdminDb().collection("fieldsConfig").doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) return undefined;
    
    await docRef.update({
      ...data,
      updatedAt: new Date(),
    });
    
    return this.getFieldConfigById(id);
  }

  async deleteFieldConfig(id: string): Promise<void> {
    const docRef = getAdminDb().collection("fieldsConfig").doc(id);
    await docRef.delete();
  }

  async createRoleUpgradeRequest(request: InsertRoleUpgradeRequest): Promise<RoleUpgradeRequest> {
    const requestId = this.generateId();
    const now = new Date();
    const newRequest: RoleUpgradeRequest = {
      id: requestId,
      userId: request.userId,
      requestedRoles: request.requestedRoles,
      reason: request.reason || null,
      status: request.status || "pending",
      reviewedBy: request.reviewedBy || null,
      reviewedAt: request.reviewedAt || null,
      adminNotes: request.adminNotes || null,
      createdAt: now,
      updatedAt: now,
    };
    
    await getAdminDb().collection("roleUpgradeRequests").doc(requestId).set(newRequest);
    return newRequest;
  }

  async getAllRoleUpgradeRequests(): Promise<RoleUpgradeRequest[]> {
    const querySnapshot = await getAdminDb().collection("roleUpgradeRequests").get();
    return querySnapshot.docs.map(docSnap => 
      normalizeRoleUpgradeRequest({ id: docSnap.id, ...docSnap.data() })
    );
  }

  async getPendingRoleUpgradeRequests(): Promise<RoleUpgradeRequest[]> {
    const querySnapshot = await getAdminDb().collection("roleUpgradeRequests")
      .where("status", "==", "pending")
      .get();
    
    return querySnapshot.docs.map(docSnap => 
      normalizeRoleUpgradeRequest({ id: docSnap.id, ...docSnap.data() })
    );
  }

  async getRoleUpgradeRequestById(id: string): Promise<RoleUpgradeRequest | undefined> {
    const docRef = getAdminDb().collection("roleUpgradeRequests").doc(id);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return normalizeRoleUpgradeRequest({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getRoleUpgradeRequestsByUserId(userId: string): Promise<RoleUpgradeRequest[]> {
    const querySnapshot = await getAdminDb().collection("roleUpgradeRequests")
      .where("userId", "==", userId)
      .get();
    
    return querySnapshot.docs.map(docSnap => 
      normalizeRoleUpgradeRequest({ id: docSnap.id, ...docSnap.data() })
    );
  }

  async updateRoleUpgradeRequest(id: string, data: Partial<InsertRoleUpgradeRequest>): Promise<RoleUpgradeRequest | undefined> {
    const docRef = getAdminDb().collection("roleUpgradeRequests").doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) return undefined;
    
    await docRef.update({
      ...data,
      updatedAt: new Date(),
    });
    
    return this.getRoleUpgradeRequestById(id);
  }

  async approveRoleUpgradeRequest(id: string, adminId: string): Promise<RoleUpgradeRequest | undefined> {
    const request = await this.getRoleUpgradeRequestById(id);
    if (!request) return undefined;
    
    const now = new Date();
    await getAdminDb().collection("roleUpgradeRequests").doc(id).update({
      status: "approved",
      reviewedBy: adminId,
      reviewedAt: now,
      updatedAt: now,
    });
    
    const requestedRoles = request.requestedRoles as Record<string, boolean>;
    const userRef = getAdminDb().collection("users").doc(request.userId);
    const updatePayload: Record<string, boolean> = {};
    
    if (requestedRoles.professional) updatePayload["roles.isProfessional"] = true;
    if (requestedRoles.jobSeeker) updatePayload["roles.isJobSeeker"] = true;
    if (requestedRoles.employer) updatePayload["roles.isEmployer"] = true;
    if (requestedRoles.businessOwner) updatePayload["roles.isBusinessOwner"] = true;
    if (requestedRoles.investor) updatePayload["roles.isInvestor"] = true;
    
    if (Object.keys(updatePayload).length > 0) {
      await userRef.update(updatePayload);
    }
    
    const updatedSnap = await getAdminDb().collection("roleUpgradeRequests").doc(id).get();
    return normalizeRoleUpgradeRequest({ id: updatedSnap.id, ...updatedSnap.data() });
  }

  async rejectRoleUpgradeRequest(id: string, adminId: string, notes?: string): Promise<RoleUpgradeRequest | undefined> {
    const request = await this.getRoleUpgradeRequestById(id);
    if (!request) return undefined;
    
    const now = new Date();
    await getAdminDb().collection("roleUpgradeRequests").doc(id).update({
      status: "rejected",
      reviewedBy: adminId,
      reviewedAt: now,
      adminNotes: notes || null,
      updatedAt: now,
    });
    
    const updatedSnap = await getAdminDb().collection("roleUpgradeRequests").doc(id).get();
    return normalizeRoleUpgradeRequest({ id: updatedSnap.id, ...updatedSnap.data() });
  }

  async createChapterAdmin(chapterAdmin: InsertChapterAdmin): Promise<ChapterAdmin> {
    const adminId = this.generateId();
    const now = new Date();
    const newAdmin: ChapterAdmin = {
      id: adminId,
      userId: chapterAdmin.userId,
      countryId: chapterAdmin.countryId || null,
      cityId: chapterAdmin.cityId || null,
      permissions: chapterAdmin.permissions || null,
      createdAt: now,
      updatedAt: now,
    };
    
    await getAdminDb().collection("chapterAdmins").doc(adminId).set(newAdmin);
    
    await getAdminDb().collection("users").doc(chapterAdmin.userId).update({
      "roles.isChapterAdmin": true,
    });
    
    return newAdmin;
  }

  async getAllChapterAdmins(): Promise<ChapterAdmin[]> {
    const querySnapshot = await getAdminDb().collection("chapterAdmins").get();
    return querySnapshot.docs.map(docSnap => normalizeDocData<ChapterAdmin>({ id: docSnap.id, ...docSnap.data() }));
  }

  async getChapterAdminById(id: string): Promise<ChapterAdmin | undefined> {
    const docRef = getAdminDb().collection("chapterAdmins").doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return normalizeDocData<ChapterAdmin>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async getChapterAdminByUserId(userId: string): Promise<ChapterAdmin | undefined> {
    const querySnapshot = await getAdminDb().collection("chapterAdmins").where("userId", "==", userId).get();
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return normalizeDocData<ChapterAdmin>({ id: docSnap.id, ...docSnap.data() });
    }
    return undefined;
  }

  async updateChapterAdmin(id: string, data: Partial<InsertChapterAdmin>): Promise<ChapterAdmin | undefined> {
    const docRef = getAdminDb().collection("chapterAdmins").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return undefined;
    
    await docRef.update({
      ...data,
      updatedAt: new Date(),
    });
    
    const updatedSnap = await docRef.get();
    return normalizeDocData<ChapterAdmin>({ id: updatedSnap.id, ...updatedSnap.data() });
  }

  async deleteChapterAdmin(id: string): Promise<void> {
    const chapterAdmin = await this.getChapterAdminById(id);
    if (chapterAdmin) {
      await getAdminDb().collection("users").doc(chapterAdmin.userId).update({
        "roles.isChapterAdmin": false,
      });
    }
    await getAdminDb().collection("chapterAdmins").doc(id).delete();
  }
}

export const storage = new FirestoreStorage();
