import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Type definitions for SQL Server enums (since drizzle-orm/mssql doesn't support enums directly)
export type ScamType = "phone" | "email" | "business";
export type Role = "admin" | "user" | "lawyer";
export type AuthProvider = "local" | "google";
export type LawyerSpecialization = "consumer_fraud" | "identity_theft" | "financial_recovery" | "general_practice" | "cyber_crime";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type RequestStatus = "pending" | "accepted" | "rejected" | "completed";
export type UrgencyLevel = "low" | "medium" | "high";
export type ContactMethod = "email" | "phone" | "either";
export type SecurityChecklistCategory = "identity_protection" | "password_security" | "account_security" | "device_security" | "network_security" | "financial_security";
export type ScamCheckType = "phone" | "email" | "url" | "darkweb" | "ip" | "domain";

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password"),
  displayName: text("display_name").notNull(),
  beawareUsername: text("beaware_username").unique(),
  role: text("role").notNull().default("user"),
  authProvider: text("auth_provider").notNull().default("local"),
  googleId: text("google_id"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Scam reports table
export const scamReports = sqliteTable("scam_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  scamType: text("scam_type").notNull(),
  scamPhoneNumber: text("scam_phone_number"),
  scamEmail: text("scam_email"),
  scamBusinessName: text("scam_business_name"),
  incidentDate: text("incident_date").notNull(),
  country: text("country").notNull().default("USA"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  description: text("description").notNull(),
  hasProofDocument: integer("has_proof_document", { mode: "boolean" }).default(false),
  proofFilePath: text("proof_file_path"),
  proofFileName: text("proof_file_name"),
  proofFileType: text("proof_file_type"),
  proofFileSize: integer("proof_file_size"),
  reportedAt: text("reported_at").default("CURRENT_TIMESTAMP"),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  verifiedBy: integer("verified_by"),
  verifiedAt: text("verified_at"),
  isPublished: integer("is_published", { mode: "boolean" }).default(true),
  publishedBy: integer("published_by"),
  publishedAt: text("published_at"),
});

// Scam comments table
export const scamComments = sqliteTable("scam_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scamReportId: integer("scam_report_id").notNull(),
  userId: integer("user_id").notNull(),
  comment: text("comment").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Consolidated scams table
export const consolidatedScams = sqliteTable("consolidated_scams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scamType: text("scam_type").notNull(),
  identifier: text("identifier").notNull().unique(),
  reportCount: integer("report_count").notNull().default(1),
  firstReported: text("first_reported").default("CURRENT_TIMESTAMP"),
  lastReported: text("last_reported").default("CURRENT_TIMESTAMP"),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false),
  verifiedAt: text("verified_at"),
  verifiedBy: integer("verified_by"),
  riskLevel: text("risk_level").default("medium"),
  description: text("description"),
  commonPatterns: text("common_patterns"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Scam report consolidations table
export const scamReportConsolidations = sqliteTable("scam_report_consolidations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scamReportId: integer("scam_report_id").notNull(),
  consolidatedScamId: integer("consolidated_scam_id").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Scam statistics table
export const scamStats = sqliteTable("scam_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  totalReports: integer("total_reports").notNull().default(0),
  verifiedReports: integer("verified_reports").notNull().default(0),
  phoneScams: integer("phone_scams").notNull().default(0),
  emailScams: integer("email_scams").notNull().default(0),
  businessScams: integer("business_scams").notNull().default(0),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Scam videos table
export const scamVideos = sqliteTable("scam_videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  video_url: text("video_url").notNull(),
  thumbnail_url: text("thumbnail_url"),
  scam_type: text("scam_type"),
  consolidated_scam_id: integer("consolidated_scam_id"),
  is_featured: integer("is_featured", { mode: "boolean" }).default(false),
  view_count: integer("view_count").default(0),
  duration: integer("duration"),
  created_by: integer("created_by").notNull(),
  created_at: text("created_at").default("CURRENT_TIMESTAMP"),
  updated_at: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Lawyer profiles table
export const lawyerProfiles = sqliteTable("lawyer_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  lawFirm: text("law_firm"),
  barNumber: text("bar_number").notNull(),
  barState: text("bar_state").notNull(),
  specialization: text("specialization").notNull(),
  yearsExperience: integer("years_experience"),
  bio: text("bio"),
  phoneNumber: text("phone_number"),
  email: text("email").notNull(),
  hourlyRate: integer("hourly_rate"),
  verificationStatus: text("verification_status").notNull().default("pending"),
  verifiedBy: integer("verified_by"),
  verifiedAt: text("verified_at"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Lawyer requests table
export const lawyerRequests = sqliteTable("lawyer_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  scamReportId: integer("scam_report_id"),
  lawyerProfileId: integer("lawyer_profile_id"),
  requestType: text("request_type").notNull(),
  description: text("description").notNull(),
  urgencyLevel: text("urgency_level").notNull().default("medium"),
  preferredContactMethod: text("preferred_contact_method").notNull().default("email"),
  contactInfo: text("contact_info").notNull(),
  estimatedLoss: integer("estimated_loss"),
  status: text("status").notNull().default("pending"),
  assignedAt: text("assigned_at"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// Security checklist items table (static checklist items)
export const securityChecklistItems = sqliteTable("security_checklist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("medium"), // high, medium, low
  recommendationText: text("recommendation_text").notNull(),
  helpUrl: text("help_url"),
  toolLaunchUrl: text("tool_launch_url"),
  youtubeVideoUrl: text("youtube_video_url"),
  estimatedTimeMinutes: integer("estimated_time_minutes"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// User security checklist progress table
export const userSecurityProgress = sqliteTable("user_security_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  checklistItemId: integer("checklist_item_id").notNull(),
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  completedAt: text("completed_at"),
  notes: text("notes"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// API configurations table for scam data lookup services
export const apiConfigs = sqliteTable("api_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // e.g., "IPQS", "VirusTotal", "AbuseIPDB"
  type: text("type").notNull(), // phone, email, url, darkweb, ip, domain
  url: text("url").notNull(), // API endpoint URL
  apiKey: text("api_key").notNull(), // Encrypted API key
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  description: text("description"),
  rateLimit: integer("rate_limit").default(60), // requests per minute
  timeout: integer("timeout").default(30), // seconds
  parameterMapping: text("parameter_mapping"), // JSON mapping of parameters with runtime variables
  headers: text("headers"), // JSON object of HTTP headers
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
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

export const consolidatedScamsRelations = relations(consolidatedScams, ({ many }) => ({
  consolidations: many(scamReportConsolidations),
  videos: many(scamVideos),
}));

export const scamReportConsolidationsRelations = relations(scamReportConsolidations, ({ one }) => ({
  scamReport: one(scamReports, {
    fields: [scamReportConsolidations.scamReportId],
    references: [scamReports.id],
  }),
  consolidatedScam: one(consolidatedScams, {
    fields: [scamReportConsolidations.consolidatedScamId],
    references: [consolidatedScams.id],
  }),
}));

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

export const lawyerProfilesRelations = relations(lawyerProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [lawyerProfiles.userId],
    references: [users.id],
  }),
  requests: many(lawyerRequests),
}));

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

export const userSecurityProgressRelations = relations(userSecurityProgress, ({ one }) => ({
  user: one(users, {
    fields: [userSecurityProgress.userId],
    references: [users.id],
  }),
  checklistItem: one(securityChecklistItems, {
    fields: [userSecurityProgress.checklistItemId],
    references: [securityChecklistItems.id],
  }),
}));

export const securityChecklistItemsRelations = relations(securityChecklistItems, ({ many }) => ({
  userProgress: many(userSecurityProgress),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ScamReport = typeof scamReports.$inferSelect;
export type InsertScamReport = typeof scamReports.$inferInsert;
export type ScamComment = typeof scamComments.$inferSelect;
export type InsertScamComment = typeof scamComments.$inferInsert;
export type ConsolidatedScam = typeof consolidatedScams.$inferSelect;
export type InsertConsolidatedScam = typeof consolidatedScams.$inferInsert;
export type ScamReportConsolidation = typeof scamReportConsolidations.$inferSelect;
export type InsertScamReportConsolidation = typeof scamReportConsolidations.$inferInsert;
export type ScamStat = typeof scamStats.$inferSelect;
export type InsertScamStat = typeof scamStats.$inferInsert;
export type ScamVideo = typeof scamVideos.$inferSelect;
export type InsertScamVideo = typeof scamVideos.$inferInsert;
export type LawyerProfile = typeof lawyerProfiles.$inferSelect;
export type InsertLawyerProfile = typeof lawyerProfiles.$inferInsert;
export type LawyerRequest = typeof lawyerRequests.$inferSelect;
export type InsertLawyerRequest = typeof lawyerRequests.$inferInsert;
export type SecurityChecklistItem = typeof securityChecklistItems.$inferSelect;
export type InsertSecurityChecklistItem = typeof securityChecklistItems.$inferInsert;
export type UserSecurityProgress = typeof userSecurityProgress.$inferSelect;
export type InsertUserSecurityProgress = typeof userSecurityProgress.$inferInsert;
export type ApiConfig = typeof apiConfigs.$inferSelect;
export type InsertApiConfig = typeof apiConfigs.$inferInsert;

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

export const insertConsolidatedScamSchema = createInsertSchema(consolidatedScams).omit({
  id: true,
});

export const insertScamVideoSchema = createInsertSchema(scamVideos).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertLawyerProfileSchema = createInsertSchema(lawyerProfiles).omit({
  id: true,
  verifiedBy: true,
  verifiedAt: true,
});

export const insertLawyerRequestSchema = createInsertSchema(lawyerRequests).omit({
  id: true,
  assignedAt: true,
});

export const insertSecurityChecklistItemSchema = createInsertSchema(securityChecklistItems).omit({
  id: true,
  createdAt: true,
});

export const insertUserSecurityProgressSchema = createInsertSchema(userSecurityProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertApiConfigSchema = createInsertSchema(apiConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});