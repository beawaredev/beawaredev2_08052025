import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enum-like string unions (kept as plain text columns, validated at the app layer)
export type ScamType = "phone" | "email" | "business";
export type Role = "admin" | "user" | "lawyer";
export type AuthProvider = "local" | "google";
export type LawyerSpecialization =
  | "consumer_fraud"
  | "identity_theft"
  | "financial_recovery"
  | "general_practice"
  | "cyber_crime";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type RequestStatus = "pending" | "accepted" | "rejected" | "completed";
export type UrgencyLevel = "low" | "medium" | "high";
export type ContactMethod = "email" | "phone" | "either";
export type SecurityChecklistCategory =
  | "identity_protection"
  | "password_security"
  | "account_security"
  | "device_security"
  | "network_security"
  | "financial_security";
export type ScamCheckType =
  | "phone"
  | "email"
  | "url"
  | "darkweb"
  | "ip"
  | "domain";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  beawareUsername: varchar("beaware_username", { length: 100 }).unique(),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  authProvider: varchar("auth_provider", { length: 50 })
    .notNull()
    .default("local"),
  googleId: varchar("google_id", { length: 255 }),
  isActive: boolean("is_active").default(true),
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token", {
    length: 255,
  }),
  lastLoginAt: timestamp("last_login_at"),
  lastVisitedPage: varchar("last_visited_page", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scam reports table
export const scamReports = pgTable("scam_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  scamType: varchar("scam_type", { length: 50 }).notNull(),
  scamPhoneNumber: varchar("scam_phone_number", { length: 50 }),
  scamEmail: varchar("scam_email", { length: 255 }),
  scamBusinessName: varchar("scam_business_name", { length: 255 }),
  incidentDate: date("incident_date").notNull(),
  country: varchar("country", { length: 100 }).notNull().default("USA"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  zipCode: varchar("zip_code", { length: 20 }),
  description: text("description").notNull(),
  hasProofDocument: boolean("has_proof_document").default(false),
  proofFilePath: varchar("proof_file_path", { length: 500 }),
  proofFileName: varchar("proof_file_name", { length: 255 }),
  proofFileType: varchar("proof_file_type", { length: 100 }),
  proofFileSize: integer("proof_file_size"),
  reportedAt: timestamp("reported_at").defaultNow(),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: integer("verified_by"),
  verifiedAt: timestamp("verified_at"),
  isPublished: boolean("is_published").default(true),
  publishedBy: integer("published_by"),
  publishedAt: timestamp("published_at"),
});

// Scam comments table
export const scamComments = pgTable("scam_comments", {
  id: serial("id").primaryKey(),
  scamReportId: integer("scam_report_id").notNull(),
  userId: integer("user_id").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Consolidated scams table
export const consolidatedScams = pgTable("consolidated_scams", {
  id: serial("id").primaryKey(),
  scamType: varchar("scam_type", { length: 50 }).notNull(),
  identifier: varchar("identifier", { length: 255 }).notNull().unique(),
  reportCount: integer("report_count").notNull().default(1),
  firstReported: timestamp("first_reported").defaultNow(),
  lastReported: timestamp("last_reported").defaultNow(),
  isVerified: boolean("is_verified").default(false),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by"),
  riskLevel: varchar("risk_level", { length: 50 }).default("medium"),
  description: text("description"),
  commonPatterns: text("common_patterns"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scam report consolidations table
export const scamReportConsolidations = pgTable(
  "scam_report_consolidations",
  {
    id: serial("id").primaryKey(),
    scamReportId: integer("scam_report_id").notNull(),
    consolidatedScamId: integer("consolidated_scam_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
);

// Scam statistics table
export const scamStats = pgTable("scam_stats", {
  id: serial("id").primaryKey(),
  totalReports: integer("total_reports").notNull().default(0),
  verifiedReports: integer("verified_reports").notNull().default(0),
  phoneScams: integer("phone_scams").notNull().default(0),
  emailScams: integer("email_scams").notNull().default(0),
  businessScams: integer("business_scams").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scam videos table
export const scamVideos = pgTable("scam_videos", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  video_url: varchar("video_url", { length: 2048 }).notNull(),
  thumbnail_url: varchar("thumbnail_url", { length: 2048 }),
  scam_type: varchar("scam_type", { length: 50 }),
  consolidated_scam_id: integer("consolidated_scam_id"),
  is_featured: boolean("is_featured").default(false),
  view_count: integer("view_count").default(0),
  duration: integer("duration"),
  created_by: integer("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Books table
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }),
  description: text("description"),
  link: varchar("link", { length: 2048 }).notNull(),
  cover_image_url: varchar("cover_image_url", { length: 2048 }),
  is_published: boolean("is_published").default(true),
  sort_order: integer("sort_order").default(0),
  created_by: integer("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Lawyer profiles table
export const lawyerProfiles = pgTable("lawyer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  lawFirm: varchar("law_firm", { length: 255 }),
  barNumber: varchar("bar_number", { length: 100 }).notNull(),
  barState: varchar("bar_state", { length: 100 }).notNull(),
  specialization: varchar("specialization", { length: 100 }).notNull(),
  yearsExperience: integer("years_experience"),
  bio: text("bio"),
  phoneNumber: varchar("phone_number", { length: 50 }),
  email: varchar("email", { length: 255 }).notNull(),
  hourlyRate: integer("hourly_rate"),
  verificationStatus: varchar("verification_status", { length: 50 })
    .notNull()
    .default("pending"),
  verifiedBy: integer("verified_by"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lawyer requests table
export const lawyerRequests = pgTable("lawyer_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  scamReportId: integer("scam_report_id"),
  lawyerProfileId: integer("lawyer_profile_id"),
  requestType: varchar("request_type", { length: 100 }).notNull(),
  description: text("description").notNull(),
  urgencyLevel: varchar("urgency_level", { length: 50 })
    .notNull()
    .default("medium"),
  preferredContactMethod: varchar("preferred_contact_method", { length: 50 })
    .notNull()
    .default("email"),
  contactInfo: varchar("contact_info", { length: 255 }).notNull(),
  estimatedLoss: integer("estimated_loss"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  assignedAt: timestamp("assigned_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Security checklist items table (static checklist items)
export const securityChecklistItems = pgTable("security_checklist_items", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  priority: varchar("priority", { length: 50 }).notNull().default("medium"), // high, medium, low
  recommendationText: text("recommendation_text").notNull(),
  helpUrl: varchar("help_url", { length: 500 }),
  toolLaunchUrl: varchar("tool_launch_url", { length: 500 }),
  youtubeVideoUrl: varchar("youtube_video_url", { length: 500 }),
  estimatedTimeMinutes: integer("estimated_time_minutes"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User security checklist progress table
export const userSecurityProgress = pgTable("user_security_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  checklistItemId: integer("checklist_item_id").notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userChecklistItemUnique: unique().on(table.userId, table.checklistItemId),
}));

// API configurations table for scam data lookup services
export const apiConfigs = pgTable("api_configs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "IPQS", "VirusTotal", "AbuseIPDB"
  type: varchar("type", { length: 50 }).notNull(), // phone, email, url, darkweb, ip, domain
  url: varchar("url", { length: 2048 }).notNull(), // API endpoint URL
  apiKey: varchar("api_key", { length: 500 }).notNull(), // Encrypted API key
  enabled: boolean("enabled").default(true),
  description: text("description"),
  rateLimit: integer("rate_limit").default(60), // requests per minute
  timeout: integer("timeout").default(30), // seconds
  parameterMapping: text("parameter_mapping"), // JSON mapping of parameters with runtime variables
  headers: text("headers"), // JSON object of HTTP headers
  organizationName: varchar("organization_name", { length: 255 }), // Name of the organization providing the data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Password resets table
export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  resetToken: varchar("reset_token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Page visit analytics table
export const pageVisits = pgTable("page_visits", {
  id: serial("id").primaryKey(),
  pagePath: varchar("page_path", { length: 255 }).notNull().unique(),
  visitCount: integer("visit_count").default(0),
  lastVisitedAt: timestamp("last_visited_at").defaultNow(),
});

// Daily site-visit analytics table
export const siteStats = pgTable("site_stats", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  guestVisits: integer("guest_visits").default(0),
  userVisits: integer("user_visits").default(0),
  totalVisits: integer("total_visits").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// "Worries" feature: top-level worry topics shown to users
export const worries = pgTable("worries", {
  id: serial("id").primaryKey(),
  worryKey: varchar("worry_key", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 128 }).notNull(),
  blurb: varchar("blurb", { length: 256 }),
  iconName: varchar("icon_name", { length: 64 }),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Randomized empathetic headlines shown per worry
export const worryResponseLines = pgTable("worry_response_lines", {
  id: serial("id").primaryKey(),
  worryId: integer("worry_id").notNull(),
  lineText: varchar("line_text", { length: 512 }).notNull(),
});

// Recommendations shown for a given worry
export const worryRecommendations = pgTable("worry_recommendations", {
  id: serial("id").primaryKey(),
  worryId: integer("worry_id").notNull(),
  slug: varchar("slug", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  rationale: text("rationale").notNull(),
  pointsText: varchar("points_text", { length: 32 }),
  estText: varchar("est_text", { length: 32 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Keywords used to match a recommendation to a security checklist item
export const worryRecommendationKeywords = pgTable(
  "worry_recommendation_keywords",
  {
    id: serial("id").primaryKey(),
    recommendationId: integer("recommendation_id").notNull(),
    keyword: varchar("keyword", { length: 64 }).notNull(),
  },
);

// Analytics: every time a user (or guest) views a worry's detail page
export const userWorryEvents = pgTable("user_worry_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  worryId: integer("worry_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  scamReports: many(scamReports),
  scamComments: many(scamComments),
  lawyerProfile: one(lawyerProfiles, {
    fields: [users.id],
    references: [lawyerProfiles.userId],
  }),
  lawyerRequests: many(lawyerRequests),
}));

export const scamReportsRelations = relations(scamReports, ({ one, many }) => ({
  user: one(users, {
    fields: [scamReports.userId],
    references: [users.id],
  }),
  comments: many(scamComments),
  consolidation: one(scamReportConsolidations, {
    fields: [scamReports.id],
    references: [scamReportConsolidations.scamReportId],
  }),
}));

export const scamCommentsRelations = relations(scamComments, ({ one }) => ({
  scamReport: one(scamReports, {
    fields: [scamComments.scamReportId],
    references: [scamReports.id],
  }),
  user: one(users, {
    fields: [scamComments.userId],
    references: [users.id],
  }),
}));

export const consolidatedScamsRelations = relations(
  consolidatedScams,
  ({ many }) => ({
    consolidations: many(scamReportConsolidations),
    videos: many(scamVideos),
  }),
);

export const scamReportConsolidationsRelations = relations(
  scamReportConsolidations,
  ({ one }) => ({
    scamReport: one(scamReports, {
      fields: [scamReportConsolidations.scamReportId],
      references: [scamReports.id],
    }),
    consolidatedScam: one(consolidatedScams, {
      fields: [scamReportConsolidations.consolidatedScamId],
      references: [consolidatedScams.id],
    }),
  }),
);

export const scamVideosRelations = relations(scamVideos, ({ one }) => ({
  consolidatedScam: one(consolidatedScams, {
    fields: [scamVideos.consolidated_scam_id],
    references: [consolidatedScams.id],
  }),
  creator: one(users, {
    fields: [scamVideos.created_by],
    references: [users.id],
  }),
}));

export const lawyerProfilesRelations = relations(
  lawyerProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [lawyerProfiles.userId],
      references: [users.id],
    }),
    requests: many(lawyerRequests),
  }),
);

export const lawyerRequestsRelations = relations(lawyerRequests, ({ one }) => ({
  user: one(users, {
    fields: [lawyerRequests.userId],
    references: [users.id],
  }),
  scamReport: one(scamReports, {
    fields: [lawyerRequests.scamReportId],
    references: [scamReports.id],
  }),
  lawyerProfile: one(lawyerProfiles, {
    fields: [lawyerRequests.lawyerProfileId],
    references: [lawyerProfiles.id],
  }),
}));

export const userSecurityProgressRelations = relations(
  userSecurityProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [userSecurityProgress.userId],
      references: [users.id],
    }),
    checklistItem: one(securityChecklistItems, {
      fields: [userSecurityProgress.checklistItemId],
      references: [securityChecklistItems.id],
    }),
  }),
);

export const securityChecklistItemsRelations = relations(
  securityChecklistItems,
  ({ many }) => ({
    userProgress: many(userSecurityProgress),
  }),
);

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}));

export const worriesRelations = relations(worries, ({ many }) => ({
  responseLines: many(worryResponseLines),
  recommendations: many(worryRecommendations),
  events: many(userWorryEvents),
}));

export const worryResponseLinesRelations = relations(
  worryResponseLines,
  ({ one }) => ({
    worry: one(worries, {
      fields: [worryResponseLines.worryId],
      references: [worries.id],
    }),
  }),
);

export const worryRecommendationsRelations = relations(
  worryRecommendations,
  ({ one, many }) => ({
    worry: one(worries, {
      fields: [worryRecommendations.worryId],
      references: [worries.id],
    }),
    keywords: many(worryRecommendationKeywords),
  }),
);

export const worryRecommendationKeywordsRelations = relations(
  worryRecommendationKeywords,
  ({ one }) => ({
    recommendation: one(worryRecommendations, {
      fields: [worryRecommendationKeywords.recommendationId],
      references: [worryRecommendations.id],
    }),
  }),
);

export const userWorryEventsRelations = relations(
  userWorryEvents,
  ({ one }) => ({
    worry: one(worries, {
      fields: [userWorryEvents.worryId],
      references: [worries.id],
    }),
    user: one(users, {
      fields: [userWorryEvents.userId],
      references: [users.id],
    }),
  }),
);

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ScamReport = typeof scamReports.$inferSelect;
export type InsertScamReport = typeof scamReports.$inferInsert;
export type ScamComment = typeof scamComments.$inferSelect;
export type InsertScamComment = typeof scamComments.$inferInsert;
export type ConsolidatedScam = typeof consolidatedScams.$inferSelect;
export type InsertConsolidatedScam = typeof consolidatedScams.$inferInsert;
export type ScamReportConsolidation =
  typeof scamReportConsolidations.$inferSelect;
export type InsertScamReportConsolidation =
  typeof scamReportConsolidations.$inferInsert;
export type ScamStat = typeof scamStats.$inferSelect;
export type InsertScamStat = typeof scamStats.$inferInsert;
export type ScamVideo = typeof scamVideos.$inferSelect;
export type InsertScamVideo = typeof scamVideos.$inferInsert;
export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;
export type LawyerProfile = typeof lawyerProfiles.$inferSelect;
export type InsertLawyerProfile = typeof lawyerProfiles.$inferInsert;
export type LawyerRequest = typeof lawyerRequests.$inferSelect;
export type InsertLawyerRequest = typeof lawyerRequests.$inferInsert;
export type SecurityChecklistItem = typeof securityChecklistItems.$inferSelect;
export type InsertSecurityChecklistItem =
  typeof securityChecklistItems.$inferInsert;
export type UserSecurityProgress = typeof userSecurityProgress.$inferSelect;
export type InsertUserSecurityProgress =
  typeof userSecurityProgress.$inferInsert;
export type ApiConfig = typeof apiConfigs.$inferSelect;
export type InsertApiConfig = typeof apiConfigs.$inferInsert;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type InsertPasswordReset = typeof passwordResets.$inferInsert;
export type PageVisit = typeof pageVisits.$inferSelect;
export type InsertPageVisit = typeof pageVisits.$inferInsert;
export type SiteStat = typeof siteStats.$inferSelect;
export type InsertSiteStat = typeof siteStats.$inferInsert;
export type Worry = typeof worries.$inferSelect;
export type InsertWorry = typeof worries.$inferInsert;
export type WorryResponseLine = typeof worryResponseLines.$inferSelect;
export type InsertWorryResponseLine = typeof worryResponseLines.$inferInsert;
export type WorryRecommendation = typeof worryRecommendations.$inferSelect;
export type InsertWorryRecommendation =
  typeof worryRecommendations.$inferInsert;
export type WorryRecommendationKeyword =
  typeof worryRecommendationKeywords.$inferSelect;
export type InsertWorryRecommendationKeyword =
  typeof worryRecommendationKeywords.$inferInsert;
export type UserWorryEvent = typeof userWorryEvents.$inferSelect;
export type InsertUserWorryEvent = typeof userWorryEvents.$inferInsert;

// Zod schemas - simplified to avoid type inference issues
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertScamReportSchema = createInsertSchema(scamReports).omit({
  id: true,
  reportedAt: true,
  verifiedBy: true,
  verifiedAt: true,
  publishedBy: true,
  publishedAt: true,
});

export const insertScamCommentSchema = createInsertSchema(scamComments).omit({
  id: true,
});

export const insertConsolidatedScamSchema = createInsertSchema(
  consolidatedScams,
).omit({
  id: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertScamVideoSchema = (() => {
  // Accept BOTH snake_case (DB) and camelCase (older client) and normalize to snake_case
  const ScamTypeEnum = z.enum(["phone", "email", "business"]);

  // Snake-case shape (matches DB column names and your Replit schema)
  const snake = z.object({
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    video_url: z.string().url(),
    thumbnail_url: z.string().url().optional().nullable(),
    scam_type: ScamTypeEnum.optional().nullable(),
    consolidated_scam_id: z.number().int().optional().nullable(),
    is_featured: z.boolean().optional().default(false),
    view_count: z.number().int().nonnegative().optional().default(0),
    duration: z.number().int().positive().optional().nullable(),
    created_by: z.number().int(),
  });

  // CamelCase shape (what the Azure-deployed schema is enforcing right now)
  const camel = z
    .object({
      title: z.string().min(1),
      description: z.string().optional().nullable(),
      videoUrl: z.string().url(),
      thumbnailUrl: z.string().url().optional().nullable(),
      scamType: ScamTypeEnum.optional().nullable(),
      consolidatedScamId: z.number().int().optional().nullable(),
      isFeatured: z.boolean().optional().default(false),
      viewCount: z.number().int().nonnegative().optional().default(0),
      duration: z.number().int().positive().optional().nullable(),
      createdBy: z.number().int(),
    })
    // Normalize camelCase → snake_case so the rest of the code & DB stay unchanged
    .transform((v) => ({
      title: v.title,
      description: v.description ?? null,
      video_url: v.videoUrl,
      thumbnail_url: v.thumbnailUrl ?? null,
      scam_type: v.scamType ?? null,
      consolidated_scam_id: v.consolidatedScamId ?? null,
      is_featured: v.isFeatured ?? false,
      view_count: v.viewCount ?? 0,
      duration: v.duration ?? null,
      created_by: v.createdBy,
    }));

  // Accept either; always output snake_case
  return z
    .union([snake, camel])
    .transform((v: any) => ("video_url" in v ? v : v));
})();

export const insertLawyerProfileSchema = createInsertSchema(
  lawyerProfiles,
).omit({
  id: true,
  verifiedBy: true,
  verifiedAt: true,
});

export const insertLawyerRequestSchema = createInsertSchema(
  lawyerRequests,
).omit({
  id: true,
  assignedAt: true,
});

export const insertSecurityChecklistItemSchema = createInsertSchema(
  securityChecklistItems,
).omit({
  id: true,
  createdAt: true,
});

export const insertUserSecurityProgressSchema = createInsertSchema(
  userSecurityProgress,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiConfigSchema = createInsertSchema(apiConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPasswordResetSchema = createInsertSchema(
  passwordResets,
).omit({
  id: true,
  createdAt: true,
});

export const insertWorrySchema = createInsertSchema(worries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorryResponseLineSchema = createInsertSchema(
  worryResponseLines,
).omit({
  id: true,
});

export const insertWorryRecommendationSchema = createInsertSchema(
  worryRecommendations,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorryRecommendationKeywordSchema = createInsertSchema(
  worryRecommendationKeywords,
).omit({
  id: true,
});
