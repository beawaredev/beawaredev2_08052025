"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertUserSecurityProgressSchema = exports.insertSecurityChecklistItemSchema = exports.insertLawyerRequestSchema = exports.insertLawyerProfileSchema = exports.insertScamVideoSchema = exports.insertConsolidatedScamSchema = exports.insertScamCommentSchema = exports.insertScamReportSchema = exports.insertUserSchema = exports.securityChecklistItemsRelations = exports.userSecurityProgressRelations = exports.lawyerRequestsRelations = exports.lawyerProfilesRelations = exports.scamVideosRelations = exports.scamReportConsolidationsRelations = exports.consolidatedScamsRelations = exports.scamCommentsRelations = exports.scamReportsRelations = exports.usersRelations = exports.userSecurityProgress = exports.securityChecklistItems = exports.lawyerRequests = exports.lawyerProfiles = exports.scamVideos = exports.scamStats = exports.scamReportConsolidations = exports.consolidatedScams = exports.scamComments = exports.scamReports = exports.users = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_zod_1 = require("drizzle-zod");
const drizzle_orm_1 = require("drizzle-orm");
// Users table
exports.users = (0, sqlite_core_1.sqliteTable)("users", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    email: (0, sqlite_core_1.text)("email").notNull().unique(),
    password: (0, sqlite_core_1.text)("password"),
    displayName: (0, sqlite_core_1.text)("display_name").notNull(),
    beawareUsername: (0, sqlite_core_1.text)("beaware_username").unique(),
    role: (0, sqlite_core_1.text)("role").notNull().default("user"),
    authProvider: (0, sqlite_core_1.text)("auth_provider").notNull().default("local"),
    googleId: (0, sqlite_core_1.text)("google_id"),
    createdAt: (0, sqlite_core_1.text)("created_at").default("CURRENT_TIMESTAMP"),
});
// Scam reports table
exports.scamReports = (0, sqlite_core_1.sqliteTable)("scam_reports", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)("user_id").notNull(),
    scamType: (0, sqlite_core_1.text)("scam_type").notNull(),
    scamPhoneNumber: (0, sqlite_core_1.text)("scam_phone_number"),
    scamEmail: (0, sqlite_core_1.text)("scam_email"),
    scamBusinessName: (0, sqlite_core_1.text)("scam_business_name"),
    incidentDate: (0, sqlite_core_1.text)("incident_date").notNull(),
    country: (0, sqlite_core_1.text)("country").notNull().default("USA"),
    city: (0, sqlite_core_1.text)("city"),
    state: (0, sqlite_core_1.text)("state"),
    zipCode: (0, sqlite_core_1.text)("zip_code"),
    description: (0, sqlite_core_1.text)("description").notNull(),
    hasProofDocument: (0, sqlite_core_1.integer)("has_proof_document", { mode: "boolean" }).default(false),
    proofFilePath: (0, sqlite_core_1.text)("proof_file_path"),
    proofFileName: (0, sqlite_core_1.text)("proof_file_name"),
    proofFileType: (0, sqlite_core_1.text)("proof_file_type"),
    proofFileSize: (0, sqlite_core_1.integer)("proof_file_size"),
    reportedAt: (0, sqlite_core_1.text)("reported_at").default("CURRENT_TIMESTAMP"),
    isVerified: (0, sqlite_core_1.integer)("is_verified", { mode: "boolean" }).default(false),
    verifiedBy: (0, sqlite_core_1.integer)("verified_by"),
    verifiedAt: (0, sqlite_core_1.text)("verified_at"),
    isPublished: (0, sqlite_core_1.integer)("is_published", { mode: "boolean" }).default(true),
    publishedBy: (0, sqlite_core_1.integer)("published_by"),
    publishedAt: (0, sqlite_core_1.text)("published_at"),
});
// Scam comments table
exports.scamComments = (0, sqlite_core_1.sqliteTable)("scam_comments", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    scamReportId: (0, sqlite_core_1.integer)("scam_report_id").notNull(),
    userId: (0, sqlite_core_1.integer)("user_id").notNull(),
    comment: (0, sqlite_core_1.text)("comment").notNull(),
    createdAt: (0, sqlite_core_1.text)("created_at").default("CURRENT_TIMESTAMP"),
});
// Consolidated scams table
exports.consolidatedScams = (0, sqlite_core_1.sqliteTable)("consolidated_scams", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    scamType: (0, sqlite_core_1.text)("scam_type").notNull(),
    identifier: (0, sqlite_core_1.text)("identifier").notNull().unique(),
    reportCount: (0, sqlite_core_1.integer)("report_count").notNull().default(1),
    firstReported: (0, sqlite_core_1.text)("first_reported").default("CURRENT_TIMESTAMP"),
    lastReported: (0, sqlite_core_1.text)("last_reported").default("CURRENT_TIMESTAMP"),
    isVerified: (0, sqlite_core_1.integer)("is_verified", { mode: "boolean" }).default(false),
    verifiedAt: (0, sqlite_core_1.text)("verified_at"),
    verifiedBy: (0, sqlite_core_1.integer)("verified_by"),
    riskLevel: (0, sqlite_core_1.text)("risk_level").default("medium"),
    description: (0, sqlite_core_1.text)("description"),
    commonPatterns: (0, sqlite_core_1.text)("common_patterns"),
    createdAt: (0, sqlite_core_1.text)("created_at").default("CURRENT_TIMESTAMP"),
    updatedAt: (0, sqlite_core_1.text)("updated_at").default("CURRENT_TIMESTAMP"),
});
// Scam report consolidations table
exports.scamReportConsolidations = (0, sqlite_core_1.sqliteTable)("scam_report_consolidations", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    scamReportId: (0, sqlite_core_1.integer)("scam_report_id").notNull(),
    consolidatedScamId: (0, sqlite_core_1.integer)("consolidated_scam_id").notNull(),
    createdAt: (0, sqlite_core_1.text)("created_at").default("CURRENT_TIMESTAMP"),
});
// Scam statistics table
exports.scamStats = (0, sqlite_core_1.sqliteTable)("scam_stats", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    totalReports: (0, sqlite_core_1.integer)("total_reports").notNull().default(0),
    verifiedReports: (0, sqlite_core_1.integer)("verified_reports").notNull().default(0),
    phoneScams: (0, sqlite_core_1.integer)("phone_scams").notNull().default(0),
    emailScams: (0, sqlite_core_1.integer)("email_scams").notNull().default(0),
    businessScams: (0, sqlite_core_1.integer)("business_scams").notNull().default(0),
    updatedAt: (0, sqlite_core_1.text)("updated_at").default("CURRENT_TIMESTAMP"),
});
// Scam videos table
exports.scamVideos = (0, sqlite_core_1.sqliteTable)("scam_videos", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    title: (0, sqlite_core_1.text)("title").notNull(),
    description: (0, sqlite_core_1.text)("description"),
    videoUrl: (0, sqlite_core_1.text)("video_url").notNull(),
    thumbnailUrl: (0, sqlite_core_1.text)("thumbnail_url"),
    scamType: (0, sqlite_core_1.text)("scam_type"),
    consolidatedScamId: (0, sqlite_core_1.integer)("consolidated_scam_id"),
    isFeatured: (0, sqlite_core_1.integer)("is_featured", { mode: "boolean" }).default(false),
    viewCount: (0, sqlite_core_1.integer)("view_count").default(0),
    duration: (0, sqlite_core_1.integer)("duration"),
    createdBy: (0, sqlite_core_1.integer)("created_by").notNull(),
    createdAt: (0, sqlite_core_1.text)("created_at").default("CURRENT_TIMESTAMP"),
    updatedAt: (0, sqlite_core_1.text)("updated_at").default("CURRENT_TIMESTAMP"),
});
// Lawyer profiles table
exports.lawyerProfiles = (0, sqlite_core_1.sqliteTable)("lawyer_profiles", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)("user_id").notNull().unique(),
    firstName: (0, sqlite_core_1.text)("first_name").notNull(),
    lastName: (0, sqlite_core_1.text)("last_name").notNull(),
    lawFirm: (0, sqlite_core_1.text)("law_firm"),
    barNumber: (0, sqlite_core_1.text)("bar_number").notNull(),
    barState: (0, sqlite_core_1.text)("bar_state").notNull(),
    specialization: (0, sqlite_core_1.text)("specialization").notNull(),
    yearsExperience: (0, sqlite_core_1.integer)("years_experience"),
    bio: (0, sqlite_core_1.text)("bio"),
    phoneNumber: (0, sqlite_core_1.text)("phone_number"),
    email: (0, sqlite_core_1.text)("email").notNull(),
    hourlyRate: (0, sqlite_core_1.integer)("hourly_rate"),
    verificationStatus: (0, sqlite_core_1.text)("verification_status").notNull().default("pending"),
    verifiedBy: (0, sqlite_core_1.integer)("verified_by"),
    verifiedAt: (0, sqlite_core_1.text)("verified_at"),
    createdAt: (0, sqlite_core_1.text)("created_at").default("CURRENT_TIMESTAMP"),
    updatedAt: (0, sqlite_core_1.text)("updated_at").default("CURRENT_TIMESTAMP"),
});
// Lawyer requests table
exports.lawyerRequests = (0, sqlite_core_1.sqliteTable)("lawyer_requests", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)("user_id").notNull(),
    scamReportId: (0, sqlite_core_1.integer)("scam_report_id"),
    lawyerProfileId: (0, sqlite_core_1.integer)("lawyer_profile_id"),
    requestType: (0, sqlite_core_1.text)("request_type").notNull(),
    description: (0, sqlite_core_1.text)("description").notNull(),
    urgencyLevel: (0, sqlite_core_1.text)("urgency_level").notNull().default("medium"),
    preferredContactMethod: (0, sqlite_core_1.text)("preferred_contact_method").notNull().default("email"),
    contactInfo: (0, sqlite_core_1.text)("contact_info").notNull(),
    estimatedLoss: (0, sqlite_core_1.integer)("estimated_loss"),
    status: (0, sqlite_core_1.text)("status").notNull().default("pending"),
    assignedAt: (0, sqlite_core_1.text)("assigned_at"),
    createdAt: (0, sqlite_core_1.text)("created_at").default("CURRENT_TIMESTAMP"),
    updatedAt: (0, sqlite_core_1.text)("updated_at").default("CURRENT_TIMESTAMP"),
});
// Security checklist items table (static checklist items)
exports.securityChecklistItems = (0, sqlite_core_1.sqliteTable)("security_checklist_items", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    title: (0, sqlite_core_1.text)("title").notNull(),
    description: (0, sqlite_core_1.text)("description").notNull(),
    category: (0, sqlite_core_1.text)("category").notNull(),
    priority: (0, sqlite_core_1.text)("priority").notNull().default("medium"), // high, medium, low
    recommendationText: (0, sqlite_core_1.text)("recommendation_text").notNull(),
    helpUrl: (0, sqlite_core_1.text)("help_url"),
    estimatedTimeMinutes: (0, sqlite_core_1.integer)("estimated_time_minutes"),
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).default(true),
    sortOrder: (0, sqlite_core_1.integer)("sort_order").default(0),
    createdAt: (0, sqlite_core_1.text)("created_at").default("CURRENT_TIMESTAMP"),
});
// User security checklist progress table
exports.userSecurityProgress = (0, sqlite_core_1.sqliteTable)("user_security_progress", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    userId: (0, sqlite_core_1.integer)("user_id").notNull(),
    checklistItemId: (0, sqlite_core_1.integer)("checklist_item_id").notNull(),
    isCompleted: (0, sqlite_core_1.integer)("is_completed", { mode: "boolean" }).default(false),
    completedAt: (0, sqlite_core_1.text)("completed_at"),
    notes: (0, sqlite_core_1.text)("notes"),
    createdAt: (0, sqlite_core_1.text)("created_at").default("CURRENT_TIMESTAMP"),
    updatedAt: (0, sqlite_core_1.text)("updated_at").default("CURRENT_TIMESTAMP"),
});
// Relations
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many, one }) => ({
    scamReports: many(exports.scamReports),
    scamComments: many(exports.scamComments),
    lawyerProfile: one(exports.lawyerProfiles, {
        fields: [exports.users.id],
        references: [exports.lawyerProfiles.userId],
    }),
    lawyerRequests: many(exports.lawyerRequests),
}));
exports.scamReportsRelations = (0, drizzle_orm_1.relations)(exports.scamReports, ({ one, many }) => ({
    user: one(exports.users, {
        fields: [exports.scamReports.userId],
        references: [exports.users.id],
    }),
    comments: many(exports.scamComments),
    consolidation: one(exports.scamReportConsolidations, {
        fields: [exports.scamReports.id],
        references: [exports.scamReportConsolidations.scamReportId],
    }),
}));
exports.scamCommentsRelations = (0, drizzle_orm_1.relations)(exports.scamComments, ({ one }) => ({
    scamReport: one(exports.scamReports, {
        fields: [exports.scamComments.scamReportId],
        references: [exports.scamReports.id],
    }),
    user: one(exports.users, {
        fields: [exports.scamComments.userId],
        references: [exports.users.id],
    }),
}));
exports.consolidatedScamsRelations = (0, drizzle_orm_1.relations)(exports.consolidatedScams, ({ many }) => ({
    consolidations: many(exports.scamReportConsolidations),
    videos: many(exports.scamVideos),
}));
exports.scamReportConsolidationsRelations = (0, drizzle_orm_1.relations)(exports.scamReportConsolidations, ({ one }) => ({
    scamReport: one(exports.scamReports, {
        fields: [exports.scamReportConsolidations.scamReportId],
        references: [exports.scamReports.id],
    }),
    consolidatedScam: one(exports.consolidatedScams, {
        fields: [exports.scamReportConsolidations.consolidatedScamId],
        references: [exports.consolidatedScams.id],
    }),
}));
exports.scamVideosRelations = (0, drizzle_orm_1.relations)(exports.scamVideos, ({ one }) => ({
    consolidatedScam: one(exports.consolidatedScams, {
        fields: [exports.scamVideos.consolidatedScamId],
        references: [exports.consolidatedScams.id],
    }),
    creator: one(exports.users, {
        fields: [exports.scamVideos.createdBy],
        references: [exports.users.id],
    }),
}));
exports.lawyerProfilesRelations = (0, drizzle_orm_1.relations)(exports.lawyerProfiles, ({ one, many }) => ({
    user: one(exports.users, {
        fields: [exports.lawyerProfiles.userId],
        references: [exports.users.id],
    }),
    requests: many(exports.lawyerRequests),
}));
exports.lawyerRequestsRelations = (0, drizzle_orm_1.relations)(exports.lawyerRequests, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.lawyerRequests.userId],
        references: [exports.users.id],
    }),
    scamReport: one(exports.scamReports, {
        fields: [exports.lawyerRequests.scamReportId],
        references: [exports.scamReports.id],
    }),
    lawyerProfile: one(exports.lawyerProfiles, {
        fields: [exports.lawyerRequests.lawyerProfileId],
        references: [exports.lawyerProfiles.id],
    }),
}));
exports.userSecurityProgressRelations = (0, drizzle_orm_1.relations)(exports.userSecurityProgress, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.userSecurityProgress.userId],
        references: [exports.users.id],
    }),
    checklistItem: one(exports.securityChecklistItems, {
        fields: [exports.userSecurityProgress.checklistItemId],
        references: [exports.securityChecklistItems.id],
    }),
}));
exports.securityChecklistItemsRelations = (0, drizzle_orm_1.relations)(exports.securityChecklistItems, ({ many }) => ({
    userProgress: many(exports.userSecurityProgress),
}));
// Zod schemas - simplified to avoid type inference issues
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).omit({
    id: true,
});
exports.insertScamReportSchema = (0, drizzle_zod_1.createInsertSchema)(exports.scamReports).omit({
    id: true,
    reportedAt: true,
    verifiedBy: true,
    verifiedAt: true,
    publishedBy: true,
    publishedAt: true,
});
exports.insertScamCommentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.scamComments).omit({
    id: true,
});
exports.insertConsolidatedScamSchema = (0, drizzle_zod_1.createInsertSchema)(exports.consolidatedScams).omit({
    id: true,
});
exports.insertScamVideoSchema = (0, drizzle_zod_1.createInsertSchema)(exports.scamVideos).omit({
    id: true,
});
exports.insertLawyerProfileSchema = (0, drizzle_zod_1.createInsertSchema)(exports.lawyerProfiles).omit({
    id: true,
    verifiedBy: true,
    verifiedAt: true,
});
exports.insertLawyerRequestSchema = (0, drizzle_zod_1.createInsertSchema)(exports.lawyerRequests).omit({
    id: true,
    assignedAt: true,
});
exports.insertSecurityChecklistItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.securityChecklistItems).omit({
    id: true,
    createdAt: true,
});
exports.insertUserSecurityProgressSchema = (0, drizzle_zod_1.createInsertSchema)(exports.userSecurityProgress).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
