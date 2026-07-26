import { eq, and, or, desc, asc, sql, count, isNull } from "drizzle-orm";
import { pgDb, pgPool } from "./pgClient.js";
import {
  users,
  scamReports,
  scamComments,
  consolidatedScams,
  scamReportConsolidations,
  scamVideos,
  books,
  lawyerProfiles,
  lawyerRequests,
  securityChecklistItems,
  userSecurityProgress,
  apiConfigs,
  passwordResets,
  pageVisits,
  siteStats,
} from "../shared/schema.js";
import { IStorage } from "./storage.js";
import {
  InsertUser,
  User,
  InsertScamReport,
  ScamReport,
  InsertScamComment,
  ScamComment,
  ConsolidatedScam,
  InsertConsolidatedScam,
  ScamReportConsolidation,
  InsertScamReportConsolidation,
  LawyerProfile,
  InsertLawyerProfile,
  LawyerRequest,
  InsertLawyerRequest,
  InsertScamVideo,
  ScamVideo,
  ScamStat,
  RequestStatus,
  SecurityChecklistItem,
  InsertSecurityChecklistItem,
  UserSecurityProgress,
  InsertUserSecurityProgress,
  ApiConfig,
  InsertApiConfig,
  Book,
  InsertBook,
  PasswordReset,
} from "../shared/schema.js";

// Note: this intentionally does NOT define verifyConsolidatedScam, getConsolidatedScamsByType,
// getScamReportsForConsolidatedScam, updateScamStats, getVerifiedLawyerProfiles, updateLawyerProfile,
// verifyLawyerProfile, getPendingLawyerRequests, getAllLawyerRequests, getLawyerRequestsByLawyer,
// assignLawyerToRequest, or getScamVideosForConsolidatedScam. routes.ts calls these on `storage`,
// but they never existed on AzureStorage or IStorage either — those endpoints already throw
// TypeError in production today. Preserved as-is rather than silently invented here.
export class PgStorage implements IStorage {
  // ---- User methods ----
  async getUser(id: number): Promise<User | undefined> {
    try {
      if (!id || isNaN(id)) return undefined;
      const [row] = await pgDb.select().from(users).where(eq(users.id, id)).limit(1);
      return row ?? undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [row] = await pgDb.select().from(users).where(eq(users.email, email)).limit(1);
      return row ?? undefined;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    try {
      const [row] = await pgDb.select().from(users).where(eq(users.googleId, googleId)).limit(1);
      return row ?? undefined;
    } catch (error) {
      console.error("Error getting user by Google ID:", error);
      return undefined;
    }
  }

  async getUserByBeawareUsername(username: string): Promise<User | undefined> {
    try {
      const [row] = await pgDb
        .select()
        .from(users)
        .where(eq(users.beawareUsername, username))
        .limit(1);
      return row ?? undefined;
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async createUser(userData: any): Promise<User> {
    try {
      const isEmailVerified = userData.authProvider === "google";
      const [row] = await pgDb
        .insert(users)
        .values({
          email: userData.email,
          password: userData.password ?? null,
          displayName: userData.displayName || "",
          beawareUsername: userData.beawareUsername ?? null,
          role: userData.role || "user",
          authProvider: userData.authProvider || "local",
          googleId: userData.googleId ?? null,
          isEmailVerified,
          emailVerificationToken: userData.emailVerificationToken ?? null,
        })
        .returning();
      return row;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async verifyUserEmail(token: string): Promise<boolean> {
    try {
      const rows = await pgDb
        .update(users)
        .set({ isEmailVerified: true, emailVerificationToken: null })
        .where(eq(users.emailVerificationToken, token))
        .returning({ id: users.id });
      return rows.length > 0;
    } catch (error) {
      console.error("Error verifying user email:", error);
      return false;
    }
  }

  async updateUserVerificationToken(userId: number, token: string): Promise<boolean> {
    try {
      const rows = await pgDb
        .update(users)
        .set({ emailVerificationToken: token })
        .where(eq(users.id, userId))
        .returning({ id: users.id });
      return rows.length > 0;
    } catch (error) {
      console.error("Error updating verification token:", error);
      return false;
    }
  }

  async createSecurityChecklistItem(
    insertItem: InsertSecurityChecklistItem,
  ): Promise<SecurityChecklistItem | undefined> {
    try {
      const [row] = await pgDb
        .insert(securityChecklistItems)
        .values({
          title: insertItem.title,
          description: insertItem.description ?? "",
          recommendationText: insertItem.recommendationText ?? "",
          helpUrl: insertItem.helpUrl ?? null,
          toolLaunchUrl: insertItem.toolLaunchUrl ?? null,
          youtubeVideoUrl: insertItem.youtubeVideoUrl ?? null,
          estimatedTimeMinutes: insertItem.estimatedTimeMinutes ?? null,
          category: insertItem.category,
          priority: insertItem.priority ?? "medium",
          sortOrder: insertItem.sortOrder ?? 0,
          isActive: true,
        })
        .returning();
      return row ?? undefined;
    } catch (error) {
      console.error("Error creating security checklist item:", error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await pgDb.select().from(users).orderBy(desc(users.createdAt));
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  // ---- Scam report methods ----
  async createScamReport(reportData: any): Promise<ScamReport> {
    try {
      let incidentDate = new Date();
      if (reportData.incidentDate) {
        const parsed = new Date(reportData.incidentDate);
        if (!isNaN(parsed.getTime())) incidentDate = parsed;
      }

      const [row] = await pgDb
        .insert(scamReports)
        .values({
          userId: reportData.userId,
          scamType: reportData.scamType,
          scamPhoneNumber: reportData.scamPhoneNumber || null,
          scamEmail: reportData.scamEmail || null,
          scamBusinessName: reportData.scamBusinessName || null,
          incidentDate: incidentDate.toISOString().split("T")[0],
          country: reportData.country,
          city: reportData.city || null,
          state: reportData.state || null,
          zipCode: reportData.zipCode || null,
          description: reportData.description,
          isVerified: false,
          isPublished: false,
          hasProofDocument: reportData.hasProofDocument || false,
          proofFilePath: reportData.proofFilePath || null,
          proofFileName: reportData.proofFileName || null,
          proofFileType: reportData.proofFileType || null,
          proofFileSize: reportData.proofFileSize || null,
        })
        .returning();
      return row;
    } catch (error) {
      console.error("Error creating scam report:", error);
      console.error("Report data received:", JSON.stringify(reportData, null, 2));
      throw error;
    }
  }

  async getScamReport(id: number): Promise<ScamReport | undefined> {
    try {
      const [row] = await pgDb.select().from(scamReports).where(eq(scamReports.id, id)).limit(1);
      return row ?? undefined;
    } catch (error) {
      console.error("Error getting scam report:", error);
      return undefined;
    }
  }

  async getAllScamReports(page: number = 1, limit: number = 50): Promise<ScamReport[]> {
    try {
      const offset = (page - 1) * limit;
      return await pgDb
        .select()
        .from(scamReports)
        .orderBy(desc(scamReports.reportedAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error getting all scam reports:", error);
      return [];
    }
  }

  async getRecentScamReports(
    limit: number,
    includeUnpublished: boolean = false,
  ): Promise<ScamReport[]> {
    try {
      const query = pgDb.select().from(scamReports);
      const rows = includeUnpublished
        ? await query.orderBy(desc(scamReports.reportedAt)).limit(limit)
        : await query
            .where(eq(scamReports.isPublished, true))
            .orderBy(desc(scamReports.reportedAt))
            .limit(limit);
      return rows;
    } catch (error) {
      console.error("Error getting recent scam reports:", error);
      return [];
    }
  }

  async getUnverifiedScamReports(page: number = 1, limit: number = 50): Promise<ScamReport[]> {
    try {
      const offset = (page - 1) * limit;
      return await pgDb
        .select()
        .from(scamReports)
        .where(eq(scamReports.isVerified, false))
        .orderBy(desc(scamReports.reportedAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error getting unverified scam reports:", error);
      return [];
    }
  }

  async getVerifiedScamReports(page: number = 1, limit: number = 50): Promise<ScamReport[]> {
    try {
      const offset = (page - 1) * limit;
      return await pgDb
        .select()
        .from(scamReports)
        .where(eq(scamReports.isVerified, true))
        .orderBy(desc(scamReports.reportedAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error getting verified scam reports:", error);
      return [];
    }
  }

  async getPublishedScamReports(page: number = 1, limit: number = 50): Promise<ScamReport[]> {
    try {
      const offset = (page - 1) * limit;
      return await pgDb
        .select()
        .from(scamReports)
        .where(eq(scamReports.isPublished, true))
        .orderBy(desc(scamReports.reportedAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error getting published scam reports:", error);
      return [];
    }
  }

  async getTotalScamReportsCount(): Promise<number> {
    try {
      const [row] = await pgDb.select({ total: count() }).from(scamReports);
      return Number(row.total);
    } catch (error) {
      console.error("Error getting total scam reports count:", error);
      return 0;
    }
  }

  async getPublishedScamReportsCount(): Promise<number> {
    try {
      const [row] = await pgDb
        .select({ total: count() })
        .from(scamReports)
        .where(eq(scamReports.isPublished, true));
      return Number(row.total);
    } catch (error) {
      console.error("Error getting published scam reports count:", error);
      return 0;
    }
  }

  async getVerifiedScamReportsCount(): Promise<number> {
    try {
      const [row] = await pgDb
        .select({ total: count() })
        .from(scamReports)
        .where(eq(scamReports.isVerified, true));
      return Number(row.total);
    } catch (error) {
      console.error("Error getting verified scam reports count:", error);
      return 0;
    }
  }

  async getUnverifiedScamReportsCount(): Promise<number> {
    try {
      const [row] = await pgDb
        .select({ total: count() })
        .from(scamReports)
        .where(eq(scamReports.isVerified, false));
      return Number(row.total);
    } catch (error) {
      console.error("Error getting unverified scam reports count:", error);
      return 0;
    }
  }

  async getUnpublishedScamReports(page: number = 1, limit: number = 50): Promise<ScamReport[]> {
    try {
      const offset = (page - 1) * limit;
      return await pgDb
        .select()
        .from(scamReports)
        .where(eq(scamReports.isPublished, false))
        .orderBy(desc(scamReports.reportedAt))
        .limit(limit)
        .offset(offset);
    } catch (error) {
      console.error("Error getting unpublished scam reports:", error);
      return [];
    }
  }

  async getConsolidationForScamReport(scamReportId: number): Promise<any> {
    try {
      const [row] = await pgDb
        .select()
        .from(scamReportConsolidations)
        .where(eq(scamReportConsolidations.scamReportId, scamReportId))
        .limit(1);
      return row ?? null;
    } catch (error) {
      console.error("Error getting consolidation for scam report:", error);
      return null;
    }
  }

  async getScamReportsByUser(userId: number): Promise<ScamReport[]> {
    try {
      return await pgDb
        .select()
        .from(scamReports)
        .where(eq(scamReports.userId, userId))
        .orderBy(desc(scamReports.reportedAt));
    } catch (error) {
      console.error("Error getting scam reports by user:", error);
      return [];
    }
  }

  async getScamReportsByType(type: string): Promise<ScamReport[]> {
    try {
      return await pgDb
        .select()
        .from(scamReports)
        .where(eq(scamReports.scamType, type))
        .orderBy(desc(scamReports.reportedAt));
    } catch (error) {
      console.error("Error getting scam reports by type:", error);
      return [];
    }
  }

  async verifyScamReport(id: number, verifiedBy: number): Promise<ScamReport | undefined> {
    try {
      const [row] = await pgDb
        .update(scamReports)
        .set({ isVerified: true, verifiedBy, verifiedAt: new Date() })
        .where(eq(scamReports.id, id))
        .returning();
      return row ?? undefined;
    } catch (error) {
      console.error("Error verifying scam report:", error);
      return undefined;
    }
  }

  async publishScamReport(id: number, publishedBy: number): Promise<ScamReport | undefined> {
    try {
      const [row] = await pgDb
        .update(scamReports)
        .set({ isPublished: true, publishedBy, publishedAt: new Date() })
        .where(eq(scamReports.id, id))
        .returning();
      return row ?? undefined;
    } catch (error) {
      console.error("Error publishing scam report:", error);
      return undefined;
    }
  }

  async unpublishScamReport(id: number, unpublishedBy: number): Promise<ScamReport | undefined> {
    try {
      const [row] = await pgDb
        .update(scamReports)
        .set({ isPublished: false, publishedBy: unpublishedBy, publishedAt: null })
        .where(eq(scamReports.id, id))
        .returning();
      return row ?? undefined;
    } catch (error) {
      console.error("Error unpublishing scam report:", error);
      return undefined;
    }
  }

  // ---- Comment methods ----
  async createScamComment(commentData: any): Promise<ScamComment> {
    try {
      const [row] = await pgDb
        .insert(scamComments)
        .values({
          scamReportId: commentData.scamReportId,
          userId: commentData.userId,
          comment: commentData.comment,
        })
        .returning();
      return row;
    } catch (error) {
      console.error("Error creating scam comment:", error);
      throw error;
    }
  }

  async getCommentsForScamReport(reportId: number): Promise<ScamComment[]> {
    try {
      return await pgDb
        .select()
        .from(scamComments)
        .where(eq(scamComments.scamReportId, reportId))
        .orderBy(asc(scamComments.createdAt));
    } catch (error) {
      console.error("Error getting comments for scam report:", error);
      return [];
    }
  }

  // ---- Stats ----
  async getScamStats(): Promise<any> {
    try {
      const [row] = await pgDb
        .select({
          totalReports: count(),
          verifiedReports: sql<string>`sum(case when ${scamReports.isVerified} then 1 else 0 end)`,
          phoneScams: sql<string>`sum(case when ${scamReports.scamType} = 'phone' then 1 else 0 end)`,
          emailScams: sql<string>`sum(case when ${scamReports.scamType} = 'email' then 1 else 0 end)`,
          businessScams: sql<string>`sum(case when ${scamReports.scamType} = 'business' then 1 else 0 end)`,
        })
        .from(scamReports);
      return {
        id: 1,
        updatedAt: new Date().toISOString(),
        totalReports: Number(row.totalReports),
        verifiedReports: Number(row.verifiedReports),
        phoneScams: Number(row.phoneScams),
        emailScams: Number(row.emailScams),
        businessScams: Number(row.businessScams),
      };
    } catch (error) {
      console.error("Error getting scam stats:", error);
      return {
        id: 1,
        updatedAt: new Date().toISOString(),
        totalReports: 0,
        verifiedReports: 0,
        phoneScams: 0,
        emailScams: 0,
        businessScams: 0,
      };
    }
  }

  // ---- IStorage compatibility wrappers ----
  async updateScamReportVerification(
    id: number,
    isVerified: boolean,
    verifiedBy: number,
  ): Promise<ScamReport | undefined> {
    return isVerified ? this.verifyScamReport(id, verifiedBy) : undefined;
  }

  async toggleScamReportPublished(
    id: number,
    isPublished: boolean,
    publishedBy: number,
  ): Promise<ScamReport | undefined> {
    return isPublished ? this.publishScamReport(id, publishedBy) : undefined;
  }

  async addScamComment(comment: any): Promise<ScamComment> {
    return this.createScamComment(comment);
  }

  async getScamComments(scamReportId: number): Promise<ScamComment[]> {
    return this.getCommentsForScamReport(scamReportId);
  }

  // ---- Security checklist ----
  async getAllSecurityChecklistItems(): Promise<SecurityChecklistItem[]> {
    try {
      return await pgDb
        .select()
        .from(securityChecklistItems)
        .where(eq(securityChecklistItems.isActive, true))
        .orderBy(asc(securityChecklistItems.sortOrder));
    } catch (error) {
      console.error("Error getting security checklist items from database:", error);
      return [];
    }
  }

  async getSecurityChecklistItem(id: number): Promise<SecurityChecklistItem | undefined> {
    try {
      const [row] = await pgDb
        .select()
        .from(securityChecklistItems)
        .where(eq(securityChecklistItems.id, id))
        .limit(1);
      return row ?? undefined;
    } catch (error) {
      console.error("Error fetching security checklist item:", error);
      return undefined;
    }
  }

  async deleteSecurityChecklistItem(itemId: number): Promise<boolean> {
    try {
      // Soft delete by setting is_active to false instead of actual deletion
      const rows = await pgDb
        .update(securityChecklistItems)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(eq(securityChecklistItems.id, itemId), eq(securityChecklistItems.isActive, true)),
        )
        .returning({ id: securityChecklistItems.id });
      return rows.length > 0;
    } catch (error) {
      console.error("Error deleting security checklist item:", error);
      return false;
    }
  }

  async updateSecurityChecklistItem(
    itemId: number,
    updates: Partial<SecurityChecklistItem>,
  ): Promise<SecurityChecklistItem | null> {
    try {
      const setObj: Record<string, any> = {};
      if (updates.title !== undefined) setObj.title = updates.title;
      if (updates.description !== undefined) setObj.description = updates.description;
      if (updates.recommendationText !== undefined)
        setObj.recommendationText = updates.recommendationText;
      if (updates.helpUrl !== undefined) setObj.helpUrl = updates.helpUrl;
      if (updates.toolLaunchUrl !== undefined) setObj.toolLaunchUrl = updates.toolLaunchUrl;
      if (updates.youtubeVideoUrl !== undefined) setObj.youtubeVideoUrl = updates.youtubeVideoUrl;
      if (updates.estimatedTimeMinutes !== undefined)
        setObj.estimatedTimeMinutes = updates.estimatedTimeMinutes;
      if (updates.category !== undefined) setObj.category = updates.category;
      if (updates.priority !== undefined) setObj.priority = updates.priority;

      if (Object.keys(setObj).length === 0) {
        return (await this.getSecurityChecklistItem(itemId)) ?? null;
      }
      setObj.updatedAt = new Date();

      const [row] = await pgDb
        .update(securityChecklistItems)
        .set(setObj)
        .where(eq(securityChecklistItems.id, itemId))
        .returning();
      return row ?? null;
    } catch (error) {
      console.error("Error updating security checklist item:", error);
      return null;
    }
  }

  async getUserSecurityProgress(userId: number): Promise<UserSecurityProgress[]> {
    try {
      return await pgDb
        .select()
        .from(userSecurityProgress)
        .where(eq(userSecurityProgress.userId, userId))
        .orderBy(asc(userSecurityProgress.checklistItemId));
    } catch (error) {
      console.error("Error getting user security progress from database:", error);
      return [];
    }
  }

  async updateUserSecurityProgress(
    userId: number,
    checklistItemId: number,
    isCompleted: boolean,
    notes?: string,
  ): Promise<UserSecurityProgress> {
    try {
      const completedAt = isCompleted ? new Date() : null;
      const [row] = await pgDb
        .insert(userSecurityProgress)
        .values({
          userId,
          checklistItemId,
          isCompleted,
          completedAt,
          notes: notes ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [userSecurityProgress.userId, userSecurityProgress.checklistItemId],
          set: { isCompleted, completedAt, notes: notes ?? null, updatedAt: new Date() },
        })
        .returning();
      return row;
    } catch (error) {
      console.error("Error updating user security progress in database:", error);
      throw error;
    }
  }

  async getUserSecurityProgressForItem(
    userId: number,
    checklistItemId: number,
  ): Promise<UserSecurityProgress | undefined> {
    try {
      const [row] = await pgDb
        .select()
        .from(userSecurityProgress)
        .where(
          and(
            eq(userSecurityProgress.userId, userId),
            eq(userSecurityProgress.checklistItemId, checklistItemId),
          ),
        )
        .limit(1);
      return row ?? undefined;
    } catch (error) {
      console.error("Error getting user security progress for item:", error);
      return undefined;
    }
  }

  // ---- Stub methods to satisfy IStorage interface (unimplemented in AzureStorage too) ----
  async getConsolidatedScam(id: number): Promise<ConsolidatedScam | undefined> {
    return undefined;
  }

  async getConsolidatedScamByIdentifier(identifier: string): Promise<ConsolidatedScam | undefined> {
    return undefined;
  }

  async getAllConsolidatedScams(): Promise<ConsolidatedScam[]> {
    return [];
  }

  async searchConsolidatedScams(query: string): Promise<ConsolidatedScam[]> {
    return [];
  }

  async createLawyerProfile(profile: InsertLawyerProfile): Promise<LawyerProfile> {
    throw new Error("Not implemented");
  }

  async getLawyerProfile(id: number): Promise<LawyerProfile | undefined> {
    return undefined;
  }

  async getLawyerProfileByUserId(userId: number): Promise<LawyerProfile | undefined> {
    return undefined;
  }

  async getAllLawyerProfiles(): Promise<LawyerProfile[]> {
    return [];
  }

  async createLawyerRequest(request: InsertLawyerRequest): Promise<LawyerRequest> {
    throw new Error("Not implemented");
  }

  async getLawyerRequest(id: number): Promise<LawyerRequest | undefined> {
    return undefined;
  }

  async getLawyerRequestsByUser(userId: number): Promise<LawyerRequest[]> {
    return [];
  }

  async updateLawyerRequestStatus(
    id: number,
    status: RequestStatus,
    lawyerProfileId?: number,
  ): Promise<LawyerRequest | undefined> {
    return undefined;
  }

  // ---- Scam videos ----
  async getScamVideo(id: number): Promise<ScamVideo | undefined> {
    try {
      const [row] = await pgDb.select().from(scamVideos).where(eq(scamVideos.id, id)).limit(1);
      return row ?? undefined;
    } catch (error) {
      console.error("Error in getScamVideo:", error);
      throw error;
    }
  }

  async getAllScamVideos(): Promise<ScamVideo[]> {
    try {
      return await pgDb.select().from(scamVideos).orderBy(desc(scamVideos.created_at));
    } catch (error) {
      console.error("Error in getAllScamVideos:", error);
      throw error;
    }
  }

  async getFeaturedScamVideos(): Promise<ScamVideo[]> {
    try {
      return await pgDb
        .select()
        .from(scamVideos)
        .where(eq(scamVideos.is_featured, true))
        .orderBy(desc(scamVideos.created_at));
    } catch (error) {
      console.error("Error in getFeaturedScamVideos:", error);
      throw error;
    }
  }

  async addScamVideo(video: InsertScamVideo): Promise<ScamVideo | undefined> {
    try {
      // Accept UI camelCase aliases but write snake_case
      const v: any = video as any;
      const title = video.title;
      const description = video.description ?? null;
      const video_url = video.video_url ?? v.youtubeUrl ?? v.videoUrl;
      const thumbnail_url = video.thumbnail_url ?? v.thumbnailUrl ?? null;
      const scam_type = video.scam_type ?? v.scamType ?? null;
      const consolidated_scam_id = video.consolidated_scam_id ?? v.consolidatedScamId ?? null;
      const is_featured = !!(video.is_featured ?? v.featured ?? false);
      const view_count = video.view_count ?? v.viewCount ?? 0;
      const duration = video.duration ?? null;
      const created_by = video.created_by ?? v.createdBy;

      if (!title || !video_url || created_by == null) {
        throw new Error("title, video_url, and created_by are required");
      }

      const [row] = await pgDb
        .insert(scamVideos)
        .values({
          title,
          description,
          video_url,
          thumbnail_url,
          scam_type,
          consolidated_scam_id,
          is_featured,
          view_count,
          duration,
          created_by,
        })
        .returning();
      return row ?? undefined;
    } catch (error) {
      console.error("Error creating scam video:", error);
      return undefined;
    }
  }

  async updateScamVideo(
    id: number,
    patch: {
      title?: string;
      description?: string;
      video_url?: string;
      youtubeUrl?: string;
      videoUrl?: string;
      thumbnail_url?: string;
      thumbnailUrl?: string;
      scam_type?: string;
      scamType?: string;
      consolidated_scam_id?: number;
      consolidatedScamId?: number;
      is_featured?: boolean;
      featured?: boolean;
      view_count?: number;
      viewCount?: number;
      duration?: number;
    },
  ): Promise<ScamVideo | undefined> {
    try {
      const setObj: Record<string, any> = { updated_at: new Date() };

      const title = typeof patch.title === "string" ? patch.title.trim() : undefined;
      if (title !== undefined) setObj.title = title;

      if (typeof patch.description === "string") setObj.description = patch.description;

      const video_url = patch.video_url || patch.youtubeUrl || patch.videoUrl;
      if (video_url) setObj.video_url = video_url;

      const thumbnail_url = patch.thumbnail_url || patch.thumbnailUrl;
      if (thumbnail_url) setObj.thumbnail_url = thumbnail_url;

      const scam_type = patch.scam_type || patch.scamType;
      if (scam_type) setObj.scam_type = scam_type;

      const consolidated_scam_id =
        typeof patch.consolidated_scam_id === "number"
          ? patch.consolidated_scam_id
          : typeof patch.consolidatedScamId === "number"
            ? patch.consolidatedScamId
            : undefined;
      if (consolidated_scam_id !== undefined) setObj.consolidated_scam_id = consolidated_scam_id;

      const is_featured =
        typeof patch.is_featured === "boolean"
          ? patch.is_featured
          : typeof patch.featured === "boolean"
            ? patch.featured
            : undefined;
      if (is_featured !== undefined) setObj.is_featured = is_featured;

      const view_count =
        typeof patch.view_count === "number"
          ? patch.view_count
          : typeof patch.viewCount === "number"
            ? patch.viewCount
            : undefined;
      if (view_count !== undefined) setObj.view_count = view_count;

      if (typeof patch.duration === "number") setObj.duration = patch.duration;

      const [row] = await pgDb
        .update(scamVideos)
        .set(setObj)
        .where(eq(scamVideos.id, id))
        .returning();
      return row ?? undefined;
    } catch (error) {
      console.error("Error updating scam video:", error);
      return undefined;
    }
  }

  async deleteScamVideo(id: number): Promise<boolean> {
    try {
      const rows = await pgDb
        .delete(scamVideos)
        .where(eq(scamVideos.id, id))
        .returning({ id: scamVideos.id });
      return rows.length > 0;
    } catch (error) {
      console.error("Error deleting scam video:", error);
      return false;
    }
  }

  // ---- Books ----
  async getBook(id: number): Promise<Book | undefined> {
    try {
      const [row] = await pgDb.select().from(books).where(eq(books.id, id)).limit(1);
      return row ?? undefined;
    } catch (error) {
      console.error("Error in getBook:", error);
      throw error;
    }
  }

  async getAllBooks(): Promise<Book[]> {
    try {
      return await pgDb.select().from(books).orderBy(asc(books.sort_order), desc(books.created_at));
    } catch (error) {
      console.error("Error in getAllBooks:", error);
      throw error;
    }
  }

  async getPublishedBooks(): Promise<Book[]> {
    try {
      return await pgDb
        .select()
        .from(books)
        .where(eq(books.is_published, true))
        .orderBy(asc(books.sort_order), desc(books.created_at));
    } catch (error) {
      console.error("Error in getPublishedBooks:", error);
      throw error;
    }
  }

  async addBook(book: InsertBook): Promise<Book> {
    const b: any = book as any;
    const [row] = await pgDb
      .insert(books)
      .values({
        title: b.title,
        author: b.author ?? null,
        description: b.description ?? null,
        link: b.link,
        cover_image_url: b.cover_image_url ?? null,
        is_published: b.is_published ?? true,
        sort_order: b.sort_order ?? 0,
        created_by: b.created_by,
      })
      .returning();
    return row;
  }

  async updateBook(id: number, updates: Partial<Book>): Promise<Book | undefined> {
    try {
      const setObj: Record<string, any> = { updated_at: new Date() };
      if (typeof updates.title === "string") setObj.title = updates.title;
      if (typeof updates.author === "string") setObj.author = updates.author;
      if (typeof updates.description === "string") setObj.description = updates.description;
      if (typeof updates.link === "string") setObj.link = updates.link;
      if (typeof updates.cover_image_url === "string")
        setObj.cover_image_url = updates.cover_image_url;
      if (typeof updates.is_published === "boolean") setObj.is_published = updates.is_published;
      if (typeof updates.sort_order === "number") setObj.sort_order = updates.sort_order;

      const [row] = await pgDb.update(books).set(setObj).where(eq(books.id, id)).returning();
      return row ?? undefined;
    } catch (error) {
      console.error("Error updating book:", error);
      return undefined;
    }
  }

  async deleteBook(id: number): Promise<boolean> {
    try {
      const rows = await pgDb.delete(books).where(eq(books.id, id)).returning({ id: books.id });
      return rows.length > 0;
    } catch (error) {
      console.error("Error deleting book:", error);
      return false;
    }
  }

  // ---- Password reset ----
  async createPasswordReset(userId: number, resetToken: string): Promise<PasswordReset> {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Invalidate any existing reset tokens for this user
      await pgDb
        .update(passwordResets)
        .set({ used: true })
        .where(and(eq(passwordResets.userId, userId), eq(passwordResets.used, false)));

      const [row] = await pgDb
        .insert(passwordResets)
        .values({ userId, resetToken, expiresAt })
        .returning();

      return {
        ...row,
        expiresAt: row.expiresAt.toISOString() as any,
        createdAt: row.createdAt?.toISOString() as any,
      };
    } catch (error) {
      console.error("Error creating password reset:", error);
      throw error;
    }
  }

  async getPasswordReset(resetToken: string): Promise<PasswordReset | undefined> {
    try {
      const [row] = await pgDb
        .select()
        .from(passwordResets)
        .where(
          and(
            eq(passwordResets.resetToken, resetToken),
            eq(passwordResets.used, false),
            sql`${passwordResets.expiresAt} > now()`,
          ),
        )
        .limit(1);
      if (!row) return undefined;
      return {
        ...row,
        expiresAt: row.expiresAt.toISOString() as any,
        createdAt: row.createdAt?.toISOString() as any,
      };
    } catch (error) {
      console.error("Error getting password reset:", error);
      throw error;
    }
  }

  async usePasswordReset(resetToken: string): Promise<boolean> {
    try {
      const rows = await pgDb
        .update(passwordResets)
        .set({ used: true })
        .where(
          and(
            eq(passwordResets.resetToken, resetToken),
            eq(passwordResets.used, false),
            sql`${passwordResets.expiresAt} > now()`,
          ),
        )
        .returning({ id: passwordResets.id });
      return rows.length > 0;
    } catch (error) {
      console.error("Error using password reset:", error);
      throw error;
    }
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      const rows = await pgDb
        .update(users)
        .set({ password: newPassword })
        .where(eq(users.id, userId))
        .returning({ id: users.id });
      return rows.length > 0;
    } catch (error) {
      console.error("Error updating user password:", error);
      throw error;
    }
  }

  async updateUser(userId: number, updateData: any): Promise<User | undefined> {
    try {
      const setObj: Record<string, any> = {};
      if (updateData.displayName !== undefined) setObj.displayName = updateData.displayName || "";
      if (updateData.beawareUsername !== undefined)
        setObj.beawareUsername = updateData.beawareUsername || "";
      if (updateData.role !== undefined) setObj.role = updateData.role || "user";

      if (Object.keys(setObj).length === 0) {
        throw new Error("No fields to update");
      }

      const [row] = await pgDb.update(users).set(setObj).where(eq(users.id, userId)).returning();
      return row ?? undefined;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async fixEmptyUsernames(): Promise<number> {
    try {
      const rows = await pgDb
        .update(users)
        .set({ beawareUsername: sql`concat('user_', ${users.id})` })
        .where(
          or(
            isNull(users.beawareUsername),
            eq(users.beawareUsername, ""),
            eq(sql`length(trim(${users.beawareUsername}))`, 0),
          ),
        )
        .returning({ id: users.id });
      console.log(`Fixed ${rows.length} users with empty usernames`);
      return rows.length;
    } catch (error) {
      console.error("Error fixing empty usernames:", error);
      throw error;
    }
  }

  async removeUsernameUniqueConstraint(): Promise<void> {
    try {
      const { rows } = await pgPool.query(`
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
        WHERE tc.table_name = 'users'
          AND tc.constraint_type = 'UNIQUE'
          AND kcu.column_name = 'beaware_username'
      `);

      for (const row of rows) {
        await pgPool.query(`ALTER TABLE users DROP CONSTRAINT "${row.constraint_name}"`);
        console.log(`Dropped constraint: ${row.constraint_name}`);
      }

      if (rows.length === 0) {
        console.log("No unique constraint found on beaware_username or already removed");
      }
    } catch (error) {
      console.error("Error removing username constraint:", error);
      throw error;
    }
  }

  generateUniqueUsername(): string {
    const adjectives = [
      "brave", "clever", "swift", "wise", "bold",
      "keen", "bright", "calm", "kind", "strong",
    ];
    const animals = [
      "fox", "eagle", "wolf", "bear", "lion",
      "owl", "hawk", "tiger", "deer", "dolphin",
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const number = Math.floor(Math.random() * 1000);
    const timestamp = Date.now().toString().slice(-3);

    return `${adjective}_${animal}_${number}_${timestamp}`;
  }

  // ---- API configuration ----
  async getApiConfigs(): Promise<ApiConfig[]> {
    try {
      const rows = await pgDb.select().from(apiConfigs).orderBy(asc(apiConfigs.name));
      return rows.map((row) => ({ ...row, enabled: Boolean(row.enabled) }));
    } catch (error) {
      console.error("Error fetching API configs:", error);
      return [];
    }
  }

  async getApiConfigByType(type: string): Promise<ApiConfig | undefined> {
    try {
      const [row] = await pgDb
        .select()
        .from(apiConfigs)
        .where(and(eq(apiConfigs.type, type), eq(apiConfigs.enabled, true)))
        .orderBy(desc(apiConfigs.id))
        .limit(1);
      if (!row) return undefined;
      return { ...row, enabled: Boolean(row.enabled) };
    } catch (error) {
      console.error("Error fetching API config by type:", error);
      return undefined;
    }
  }

  async createApiConfig(config: InsertApiConfig): Promise<ApiConfig> {
    try {
      const [row] = await pgDb
        .insert(apiConfigs)
        .values({
          name: config.name,
          type: config.type,
          url: config.url,
          apiKey: config.apiKey,
          enabled: config.enabled ?? true,
          description: config.description || null,
          rateLimit: config.rateLimit ?? 60,
          timeout: config.timeout ?? 30,
          parameterMapping: config.parameterMapping || null,
          headers: config.headers || null,
          organizationName: config.organizationName || null,
        })
        .returning();
      return { ...row, enabled: Boolean(row.enabled) };
    } catch (error) {
      console.error("Error creating API config:", error);
      throw error;
    }
  }

  async updateApiConfig(id: number, updates: Partial<ApiConfig>): Promise<ApiConfig | undefined> {
    try {
      const setObj: Record<string, any> = {};
      if (updates.name !== undefined) setObj.name = updates.name;
      if (updates.type !== undefined) setObj.type = updates.type;
      if (updates.url !== undefined) setObj.url = updates.url;
      if (updates.apiKey !== undefined) setObj.apiKey = updates.apiKey;
      if (updates.enabled !== undefined) setObj.enabled = updates.enabled;
      if (updates.description !== undefined) setObj.description = updates.description;
      if (updates.rateLimit !== undefined) setObj.rateLimit = updates.rateLimit;
      if (updates.timeout !== undefined) setObj.timeout = updates.timeout;
      if (updates.parameterMapping !== undefined) setObj.parameterMapping = updates.parameterMapping;
      if (updates.headers !== undefined) setObj.headers = updates.headers;
      if (updates.organizationName !== undefined)
        setObj.organizationName = updates.organizationName;

      if (Object.keys(setObj).length === 0) {
        throw new Error("No updates provided");
      }
      setObj.updatedAt = new Date();

      const [row] = await pgDb
        .update(apiConfigs)
        .set(setObj)
        .where(eq(apiConfigs.id, id))
        .returning();
      if (!row) return undefined;
      return { ...row, enabled: Boolean(row.enabled) };
    } catch (error) {
      console.error("Error updating API config:", error);
      return undefined;
    }
  }

  async deleteApiConfig(id: number): Promise<boolean> {
    try {
      const rows = await pgDb
        .delete(apiConfigs)
        .where(eq(apiConfigs.id, id))
        .returning({ id: apiConfigs.id });
      return rows.length > 0;
    } catch (error) {
      console.error("Error deleting API config:", error);
      return false;
    }
  }

  // ---- Admin user management & stats ----
  async getAllUsersAdmin(): Promise<User[]> {
    try {
      return await pgDb.select().from(users).orderBy(desc(users.createdAt));
    } catch (error) {
      console.error("Error getting all users for admin:", error);
      return [];
    }
  }

  async updateUserStatus(userId: number, isActive: boolean): Promise<boolean> {
    try {
      const rows = await pgDb
        .update(users)
        .set({ isActive })
        .where(eq(users.id, userId))
        .returning({ id: users.id });
      return rows.length > 0;
    } catch (error) {
      console.error("Error updating user status:", error);
      return false;
    }
  }

  async logUserActivity(userId: number, pagePath?: string): Promise<void> {
    try {
      const setObj: Record<string, any> = { lastLoginAt: new Date() };
      if (pagePath) setObj.lastVisitedPage = pagePath;
      await pgDb.update(users).set(setObj).where(eq(users.id, userId));
    } catch (error) {
      console.error("Error logging user activity:", error);
    }
  }

  async getAdminStats(): Promise<any> {
    try {
      const today = new Date().toISOString().split("T")[0];

      const [statsRow] = await pgDb
        .select()
        .from(siteStats)
        .where(eq(siteStats.date, today))
        .limit(1);

      const dailyStats = statsRow
        ? {
            guestVisits: statsRow.guestVisits || 0,
            userVisits: statsRow.userVisits || 0,
            totalVisits: statsRow.totalVisits || 0,
          }
        : { guestVisits: 0, userVisits: 0, totalVisits: 0 };

      const pageRows = await pgDb
        .select()
        .from(pageVisits)
        .orderBy(desc(pageVisits.visitCount))
        .limit(10);
      const topPages = pageRows.map((row) => ({ path: row.pagePath, count: row.visitCount }));

      const [userCounts] = await pgDb
        .select({
          total: count(),
          admins: sql<string>`sum(case when ${users.role} = 'admin' then 1 else 0 end)`,
          lawyers: sql<string>`sum(case when ${users.role} = 'lawyer' then 1 else 0 end)`,
        })
        .from(users);

      const total = Number(userCounts.total);
      const admins = Number(userCounts.admins);
      const lawyers = Number(userCounts.lawyers);

      return {
        users: { total, admins, lawyers, regular: total - admins - lawyers },
        visits: dailyStats,
        topPages,
      };
    } catch (error) {
      console.error("Error getting admin stats:", error);
      return {
        users: { total: 0, admins: 0, lawyers: 0, regular: 0 },
        visits: { guestVisits: 0, userVisits: 0, totalVisits: 0 },
        topPages: [],
      };
    }
  }

  async trackPageVisit(path: string): Promise<void> {
    try {
      await pgDb
        .insert(pageVisits)
        .values({ pagePath: path, visitCount: 1, lastVisitedAt: new Date() })
        .onConflictDoUpdate({
          target: pageVisits.pagePath,
          set: {
            visitCount: sql`${pageVisits.visitCount} + 1`,
            lastVisitedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("Error tracking page visit:", error);
    }
  }

  async trackUserVisit(userId: number | null): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const isGuest = userId === null;

      await pgDb
        .insert(siteStats)
        .values({
          date: today,
          guestVisits: isGuest ? 1 : 0,
          userVisits: isGuest ? 0 : 1,
          totalVisits: 1,
        })
        .onConflictDoUpdate({
          target: siteStats.date,
          set: {
            guestVisits: isGuest
              ? sql`${siteStats.guestVisits} + 1`
              : sql`${siteStats.guestVisits}`,
            userVisits: !isGuest
              ? sql`${siteStats.userVisits} + 1`
              : sql`${siteStats.userVisits}`,
            totalVisits: sql`${siteStats.totalVisits} + 1`,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("Error tracking user visit:", error);
    }
  }
}
