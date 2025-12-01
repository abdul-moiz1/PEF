import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  boolean, 
  integer,
  json,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);
export const employmentTypeEnum = pgEnum("employment_type", ["full-time", "part-time", "remote", "contract"]);
export const availabilityEnum = pgEnum("availability", ["immediately", "30-days", "60-days"]);
export const hiringUrgencyEnum = pgEnum("hiring_urgency", ["low", "medium", "high"]);
export const investmentStageEnum = pgEnum("investment_stage", ["idea", "startup", "growth", "mature"]);
export const investmentTypeEnum = pgEnum("investment_type", ["equity", "partnership", "joint-venture"]);
export const opportunityTypeEnum = pgEnum("opportunity_type", ["job", "investment", "partnership", "collaboration"]);
export const opportunityStatusEnum = pgEnum("opportunity_status", ["open", "closed"]);
export const applicationStatusEnum = pgEnum("application_status", ["applied", "under_review", "interview", "offer", "rejected", "withdrawn"]);

export const users = pgTable("users", {
  id: varchar("id", { length: 128 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  approvalStatus: approvalStatusEnum("approval_status").default("pending").notNull(),
  preRegistered: boolean("pre_registered").default(false),
  preRegisteredAt: timestamp("pre_registered_at"),
  registrationSource: varchar("registration_source", { length: 50 }),
});

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  phone: varchar("phone", { length: 50 }),
  country: varchar("country", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }),
  languages: text("languages").array(),
  headline: text("headline"),
  bio: text("bio"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  portfolioUrl: text("portfolio_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  professional: boolean("professional").default(false).notNull(),
  jobSeeker: boolean("job_seeker").default(false).notNull(),
  employer: boolean("employer").default(false).notNull(),
  businessOwner: boolean("business_owner").default(false).notNull(),
  investor: boolean("investor").default(false).notNull(),
  admin: boolean("admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const professionalProfiles = pgTable("professional_profiles", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  yearsOfExperience: integer("years_of_experience"),
  industry: varchar("industry", { length: 255 }),
  skills: text("skills").array(),
  certifications: text("certifications").array(),
  currentJobTitle: text("current_job_title"),
  currentEmployer: text("current_employer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobSeekerProfiles = pgTable("job_seeker_profiles", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  targetJobTitles: text("target_job_titles").array(),
  preferredIndustries: text("preferred_industries").array(),
  employmentType: employmentTypeEnum("employment_type"),
  salaryExpectationMin: integer("salary_expectation_min"),
  salaryExpectationMax: integer("salary_expectation_max"),
  availability: availabilityEnum("availability"),
  willingToRelocate: boolean("willing_to_relocate"),
  targetCountries: text("target_countries").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const employerProfiles = pgTable("employer_profiles", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  industry: varchar("industry", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const businessOwnerProfiles = pgTable("business_owner_profiles", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull(),
  industry: varchar("industry", { length: 255 }),
  companySize: varchar("company_size", { length: 50 }),
  yearsInOperation: integer("years_in_operation"),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  lookingFor: text("looking_for").array(),
  revenueRange: varchar("revenue_range", { length: 100 }),
  capitalRequired: varchar("capital_required", { length: 100 }),
  expansionCountries: text("expansion_countries").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const investorProfiles = pgTable("investor_profiles", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  investmentRangeMin: integer("investment_range_min"),
  investmentRangeMax: integer("investment_range_max"),
  preferredSectors: text("preferred_sectors").array(),
  preferredCountries: text("preferred_countries").array(),
  investmentStage: investmentStageEnum("investment_stage"),
  investmentType: investmentTypeEnum("investment_type"),
  investmentThesis: text("investment_thesis"),
  contactPreference: text("contact_preference"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const opportunities = pgTable("opportunities", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  type: opportunityTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sector: varchar("sector", { length: 255 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  budgetOrSalary: varchar("budget_or_salary", { length: 100 }),
  contactPreference: text("contact_preference"),
  details: json("details"),
  status: opportunityStatusEnum("status").default("open").notNull(),
  approvalStatus: approvalStatusEnum("approval_status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 128 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  opportunityId: varchar("opportunity_id", { length: 128 }).notNull().references(() => opportunities.id, { onDelete: "cascade" }),
  status: applicationStatusEnum("status").default("applied").notNull(),
  metadata: json("metadata"),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserOpportunity: sql`UNIQUE (${table.userId}, ${table.opportunityId})`,
}));

export const videos = pgTable("videos", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  youtubeId: varchar("youtube_id", { length: 50 }).notNull(),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: timestamp("published_at"),
  featured: boolean("featured").default(false).notNull(),
  visible: boolean("visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leaders = pgTable("leaders", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  title: text("title").notNull(),
  bio: text("bio"),
  imageUrl: text("image_url"),
  linkedinUrl: text("linkedin_url"),
  order: integer("order").default(0).notNull(),
  visible: boolean("visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const galleryImages = pgTable("gallery_images", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  category: varchar("category", { length: 100 }),
  eventDate: timestamp("event_date"),
  visible: boolean("visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipTiers = pgTable("membership_tiers", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  features: text("features").array(),
  highlighted: boolean("highlighted").default(false).notNull(),
  visible: boolean("visible").default(true).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const membershipApplications = pgTable("membership_applications", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  country: varchar("country", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }),
  languages: text("languages").array(),
  headline: text("headline"),
  bio: text("bio"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  portfolioUrl: text("portfolio_url"),
  roles: json("roles"),
  status: approvalStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const countries = pgTable("countries", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 3 }).notNull().unique(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  phoneCode: varchar("phone_code", { length: 10 }),
  enabled: boolean("enabled").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cities = pgTable("cities", {
  id: varchar("id", { length: 128 }).primaryKey().default(sql`gen_random_uuid()`),
  countryId: varchar("country_id", { length: 128 }).notNull().references(() => countries.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  displayName: text("display_name"),
  enabled: boolean("enabled").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true, lastLogin: true });
export const selectUserSchema = createSelectSchema(users);

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const selectUserProfileSchema = createSelectSchema(userProfiles);

export const insertUserRolesSchema = createInsertSchema(userRoles).omit({ id: true, createdAt: true });
export const selectUserRolesSchema = createSelectSchema(userRoles);

export const insertProfessionalProfileSchema = createInsertSchema(professionalProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const selectProfessionalProfileSchema = createSelectSchema(professionalProfiles);

export const insertJobSeekerProfileSchema = createInsertSchema(jobSeekerProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const selectJobSeekerProfileSchema = createSelectSchema(jobSeekerProfiles);

export const insertEmployerProfileSchema = createInsertSchema(employerProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const selectEmployerProfileSchema = createSelectSchema(employerProfiles);

export const insertBusinessOwnerProfileSchema = createInsertSchema(businessOwnerProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const selectBusinessOwnerProfileSchema = createSelectSchema(businessOwnerProfiles);

export const insertInvestorProfileSchema = createInsertSchema(investorProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const selectInvestorProfileSchema = createSelectSchema(investorProfiles);

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({ id: true, createdAt: true, updatedAt: true });
export const selectOpportunitySchema = createSelectSchema(opportunities);

export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, appliedAt: true, updatedAt: true });
export const selectApplicationSchema = createSelectSchema(applications);

export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, createdAt: true, updatedAt: true });
export const selectVideoSchema = createSelectSchema(videos);

export const insertLeaderSchema = createInsertSchema(leaders).omit({ id: true, createdAt: true, updatedAt: true });
export const selectLeaderSchema = createSelectSchema(leaders);

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({ id: true, createdAt: true, updatedAt: true });
export const selectGalleryImageSchema = createSelectSchema(galleryImages);

export const insertMembershipTierSchema = createInsertSchema(membershipTiers).omit({ id: true, createdAt: true, updatedAt: true });
export const selectMembershipTierSchema = createSelectSchema(membershipTiers);

export const insertMembershipApplicationSchema = createInsertSchema(membershipApplications).omit({ id: true, createdAt: true, updatedAt: true });
export const selectMembershipApplicationSchema = createSelectSchema(membershipApplications);

export const insertCountrySchema = createInsertSchema(countries).omit({ id: true, createdAt: true, updatedAt: true });
export const selectCountrySchema = createSelectSchema(countries);

export const insertCitySchema = createInsertSchema(cities).omit({ id: true, createdAt: true, updatedAt: true });
export const selectCitySchema = createSelectSchema(cities);

export const jobDetailsSchema = z.object({
  employmentType: z.enum(["full-time", "part-time", "remote", "contract"]).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().optional(),
  experienceRequired: z.string().optional(),
  skills: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  applicationUrl: z.string().url().optional(),
  applicationEmail: z.string().email().optional(),
});

export type JobDetails = z.infer<typeof jobDetailsSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type UserRoles = typeof userRoles.$inferSelect;
export type InsertUserRoles = z.infer<typeof insertUserRolesSchema>;

export type ProfessionalProfile = typeof professionalProfiles.$inferSelect;
export type InsertProfessionalProfile = z.infer<typeof insertProfessionalProfileSchema>;

export type JobSeekerProfile = typeof jobSeekerProfiles.$inferSelect;
export type InsertJobSeekerProfile = z.infer<typeof insertJobSeekerProfileSchema>;

export type EmployerProfile = typeof employerProfiles.$inferSelect;
export type InsertEmployerProfile = z.infer<typeof insertEmployerProfileSchema>;

export type BusinessOwnerProfile = typeof businessOwnerProfiles.$inferSelect;
export type InsertBusinessOwnerProfile = z.infer<typeof insertBusinessOwnerProfileSchema>;

export type InvestorProfile = typeof investorProfiles.$inferSelect;
export type InsertInvestorProfile = z.infer<typeof insertInvestorProfileSchema>;

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Leader = typeof leaders.$inferSelect;
export type InsertLeader = z.infer<typeof insertLeaderSchema>;

export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;

export type MembershipTier = typeof membershipTiers.$inferSelect;
export type InsertMembershipTier = z.infer<typeof insertMembershipTierSchema>;

export type MembershipApplication = typeof membershipApplications.$inferSelect;
export type InsertMembershipApplication = z.infer<typeof insertMembershipApplicationSchema>;

export type Country = typeof countries.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;

export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;

export const firestoreCitySchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().nullable().optional(),
  enabled: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const firestoreCountrySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  displayName: z.string().nullable().optional(),
  phoneCode: z.string().nullable().optional(),
  enabled: z.boolean().default(false),
  sortOrder: z.number().default(0),
  cities: z.array(firestoreCitySchema).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type FirestoreCity = z.infer<typeof firestoreCitySchema>;
export type FirestoreCountry = z.infer<typeof firestoreCountrySchema>;
export type InsertFirestoreCity = Omit<FirestoreCity, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertFirestoreCountry = Omit<FirestoreCountry, 'id' | 'createdAt' | 'updatedAt' | 'cities'>;
