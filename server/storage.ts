import { InsertUser, User, InsertScamReport, ScamReport, InsertScamComment, ScamComment, 
  ConsolidatedScam, InsertConsolidatedScam, ScamReportConsolidation, InsertScamReportConsolidation,
  LawyerProfile, InsertLawyerProfile, LawyerRequest, InsertLawyerRequest, InsertScamVideo, ScamVideo,
  ScamStat, ScamType, RequestStatus, SecurityChecklistItem, InsertSecurityChecklistItem,
  UserSecurityProgress, InsertUserSecurityProgress, ApiConfig, InsertApiConfig } from "../shared/schema.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByBeawareUsername(beawareUsername: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  createScamReport(report: InsertScamReport): Promise<ScamReport>;
  getScamReport(id: number): Promise<ScamReport | undefined>;
  getAllScamReports(): Promise<ScamReport[]>;
  getScamReportsByUser(userId: number): Promise<ScamReport[]>;
  updateScamReportVerification(id: number, isVerified: boolean, verifiedBy: number): Promise<ScamReport | undefined>;
  toggleScamReportPublished(id: number, isPublished: boolean, publishedBy: number): Promise<ScamReport | undefined>;
  
  addScamComment(comment: InsertScamComment): Promise<ScamComment>;
  getScamComments(scamReportId: number): Promise<ScamComment[]>;
  
  getConsolidatedScam(id: number): Promise<ConsolidatedScam | undefined>;
  getConsolidatedScamByIdentifier(identifier: string): Promise<ConsolidatedScam | undefined>;
  getAllConsolidatedScams(): Promise<ConsolidatedScam[]>;
  searchConsolidatedScams(query: string): Promise<ConsolidatedScam[]>;
  
  createLawyerProfile(profile: InsertLawyerProfile): Promise<LawyerProfile>;
  getLawyerProfile(id: number): Promise<LawyerProfile | undefined>;
  getLawyerProfileByUserId(userId: number): Promise<LawyerProfile | undefined>;
  getAllLawyerProfiles(): Promise<LawyerProfile[]>;
  
  createLawyerRequest(request: InsertLawyerRequest): Promise<LawyerRequest>;
  getLawyerRequest(id: number): Promise<LawyerRequest | undefined>;
  getLawyerRequestsByUser(userId: number): Promise<LawyerRequest[]>;
  updateLawyerRequestStatus(id: number, status: RequestStatus, lawyerProfileId?: number): Promise<LawyerRequest | undefined>;
  
  addScamVideo(video: InsertScamVideo): Promise<ScamVideo>;
  getScamVideo(id: number): Promise<ScamVideo | undefined>;
  getAllScamVideos(): Promise<ScamVideo[]>;
  getFeaturedScamVideos(): Promise<ScamVideo[]>;
  
  getScamStats(): Promise<ScamStat>;
  
  // Security checklist methods
  getAllSecurityChecklistItems(): Promise<SecurityChecklistItem[]>;
  getSecurityChecklistItem(id: number): Promise<SecurityChecklistItem | undefined>;
  createSecurityChecklistItem(item: InsertSecurityChecklistItem): Promise<SecurityChecklistItem>;
  updateSecurityChecklistItem(itemId: number, updates: Partial<SecurityChecklistItem>): Promise<SecurityChecklistItem | null>;
  deleteSecurityChecklistItem(itemId: number): Promise<boolean>;
  
  getUserSecurityProgress(userId: number): Promise<UserSecurityProgress[]>;
  updateUserSecurityProgress(userId: number, checklistItemId: number, isCompleted: boolean, notes?: string): Promise<UserSecurityProgress>;
  getUserSecurityProgressForItem(userId: number, checklistItemId: number): Promise<UserSecurityProgress | undefined>;
  
  // API configuration methods
  getApiConfigs(): Promise<ApiConfig[]>;
  getApiConfigByType(type: string): Promise<ApiConfig | undefined>;
  createApiConfig(config: InsertApiConfig): Promise<ApiConfig>;
  updateApiConfig(id: number, updates: Partial<ApiConfig>): Promise<ApiConfig | undefined>;
  deleteApiConfig(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private scamReports: Map<number, ScamReport> = new Map();
  private scamComments: Map<number, ScamComment> = new Map();
  private consolidatedScams: Map<number, ConsolidatedScam> = new Map();
  private scamReportConsolidations: Map<number, ScamReportConsolidation> = new Map();
  private lawyerProfiles: Map<number, LawyerProfile> = new Map();
  private lawyerRequests: Map<number, LawyerRequest> = new Map();
  private scamVideos: Map<number, ScamVideo> = new Map();
  private securityChecklistItems: Map<number, SecurityChecklistItem> = new Map();
  private userSecurityProgress: Map<number, UserSecurityProgress> = new Map();
  
  private userId: number = 1;
  private scamReportId: number = 1;
  private commentId: number = 1;
  private consolidatedScamId: number = 1;
  private scamReportConsolidationId: number = 1;
  private lawyerProfileId: number = 1;
  private lawyerRequestId: number = 1;
  private scamVideoId: number = 1;
  private securityChecklistItemId: number = 1;
  private userSecurityProgressId: number = 1;
  
  constructor() {
    // Seed an admin user
    this.createUser({
      email: "admin@beaware.fyi",
      password: "adminpassword",
      displayName: "Admin User",
      role: "admin",
      authProvider: "local"
    });
    
    // Initialize security checklist items
    this.seedSecurityChecklistItems();
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.googleId === googleId);
  }
  
  async getUserByBeawareUsername(beawareUsername: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.beawareUsername === beawareUsername);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    
    // Create user with all required fields explicitly specified
    const user: User = { 
      id,
      email: insertUser.email,
      displayName: insertUser.displayName,
      password: insertUser.password || null,
      googleId: insertUser.googleId || null,
      role: insertUser.role || "user",
      authProvider: insertUser.authProvider || "local",
      createdAt: now
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async createScamReport(insertReport: InsertScamReport): Promise<ScamReport> {
    const id = this.scamReportId++;
    const now = new Date();
    
    // Convert incidentDate to a Date object if it's a string
    const incidentDate = typeof insertReport.incidentDate === 'string' 
      ? new Date(insertReport.incidentDate) 
      : insertReport.incidentDate;
    
    // Create report with all required fields explicitly specified
    const scamReport: ScamReport = {
      id,
      userId: insertReport.userId,
      scamType: insertReport.scamType,
      scamPhoneNumber: insertReport.scamPhoneNumber || null,
      scamEmail: insertReport.scamEmail || null,
      scamBusinessName: insertReport.scamBusinessName || null,
      incidentDate: typeof incidentDate === 'string' ? incidentDate : incidentDate.toISOString(),
      country: insertReport.country || "USA",
      city: insertReport.city || null,
      state: insertReport.state || null,
      zipCode: insertReport.zipCode || null,
      description: insertReport.description,
      hasProofDocument: insertReport.hasProofDocument || false,
      proofFilePath: insertReport.proofFilePath || null,
      proofFileName: insertReport.proofFileName || null,
      proofFileType: insertReport.proofFileType || null,
      proofFileSize: insertReport.proofFileSize || null,
      reportedAt: now,
      isVerified: false,
      verifiedBy: null,
      verifiedAt: null,
      isPublished: true,
      publishedBy: null,
      publishedAt: null
    };
    
    this.scamReports.set(id, scamReport);
    
    // Try to consolidate with existing scams
    this.consolidateScamReport(scamReport);
    
    return scamReport;
  }
  
  private async consolidateScamReport(report: ScamReport): Promise<void> {
    // Determine the identifier based on scam type
    let identifier: string | null = null;
    
    if (report.scamType === "phone" && report.scamPhoneNumber) {
      identifier = report.scamPhoneNumber;
    } else if (report.scamType === "email" && report.scamEmail) {
      identifier = report.scamEmail;
    } else if (report.scamType === "business" && report.scamBusinessName) {
      identifier = report.scamBusinessName;
    }
    
    if (!identifier) return;
    
    // Check if we already have a consolidated scam for this identifier
    const existingScam = await this.getConsolidatedScamByIdentifier(identifier);
    
    if (existingScam) {
      // Update the existing consolidated scam
      const updatedScam = {
        ...existingScam,
        reportCount: existingScam.reportCount + 1,
        lastReportedAt: report.reportedAt
      };
      
      this.consolidatedScams.set(existingScam.id, updatedScam);
      
      // Create a consolidation record
      await this.createScamReportConsolidation({
        scamReportId: report.id,
        consolidatedScamId: existingScam.id
      });
    } else {
      // Create a new consolidated scam
      const newScam = await this.createConsolidatedScam({
        scamType: report.scamType,
        identifier,
        reportCount: 1
      });
      
      // Create a consolidation record
      await this.createScamReportConsolidation({
        scamReportId: report.id,
        consolidatedScamId: newScam.id
      });
    }
  }
  
  private async createConsolidatedScam(insertScam: InsertConsolidatedScam): Promise<ConsolidatedScam> {
    const id = this.consolidatedScamId++;
    const now = new Date();
    
    const consolidatedScam: ConsolidatedScam = {
      id,
      scamType: insertScam.scamType,
      identifier: insertScam.identifier,
      reportCount: insertScam.reportCount || 1,
      firstReportedAt: now,
      lastReportedAt: now,
      isVerified: false
    };
    
    this.consolidatedScams.set(id, consolidatedScam);
    return consolidatedScam;
  }
  
  private async createScamReportConsolidation(
    insertConsolidation: InsertScamReportConsolidation
  ): Promise<ScamReportConsolidation> {
    const id = this.scamReportConsolidationId++;
    
    const consolidation: ScamReportConsolidation = {
      id,
      scamReportId: insertConsolidation.scamReportId,
      consolidatedScamId: insertConsolidation.consolidatedScamId
    };
    
    this.scamReportConsolidations.set(id, consolidation);
    return consolidation;
  }
  
  async getScamReport(id: number): Promise<ScamReport | undefined> {
    return this.scamReports.get(id);
  }
  
  async getAllScamReports(): Promise<ScamReport[]> {
    return Array.from(this.scamReports.values());
  }
  
  async getScamReportsByUser(userId: number): Promise<ScamReport[]> {
    return Array.from(this.scamReports.values())
      .filter(report => report.userId === userId);
  }
  
  async updateScamReportVerification(
    id: number, 
    isVerified: boolean, 
    verifiedBy: number
  ): Promise<ScamReport | undefined> {
    const report = await this.getScamReport(id);
    if (!report) return undefined;
    
    const updatedReport = {
      ...report,
      isVerified,
      verifiedBy,
      verifiedAt: isVerified ? new Date() : null
    };
    
    this.scamReports.set(id, updatedReport);
    
    // If we're verifying the report, also update any consolidated scam
    if (isVerified) {
      const consolidations = Array.from(this.scamReportConsolidations.values())
        .filter(c => c.scamReportId === id);
      
      for (const consolidation of consolidations) {
        const consolidatedScam = await this.getConsolidatedScam(consolidation.consolidatedScamId);
        if (consolidatedScam) {
          const updatedScam = {
            ...consolidatedScam,
            isVerified: true
          };
          this.consolidatedScams.set(consolidatedScam.id, updatedScam);
        }
      }
    }
    
    return updatedReport;
  }
  
  async toggleScamReportPublished(
    id: number, 
    isPublished: boolean, 
    publishedBy: number
  ): Promise<ScamReport | undefined> {
    const report = await this.getScamReport(id);
    if (!report) return undefined;
    
    const updatedReport = {
      ...report,
      isPublished,
      publishedBy,
      publishedAt: isPublished ? new Date() : null
    };
    
    this.scamReports.set(id, updatedReport);
    return updatedReport;
  }
  
  async addScamComment(insertComment: InsertScamComment): Promise<ScamComment> {
    const id = this.commentId++;
    const now = new Date();
    
    const comment: ScamComment = {
      id,
      scamReportId: insertComment.scamReportId,
      userId: insertComment.userId,
      content: insertComment.content,
      createdAt: now
    };
    
    this.scamComments.set(id, comment);
    return comment;
  }
  
  async getScamComments(scamReportId: number): Promise<ScamComment[]> {
    return Array.from(this.scamComments.values())
      .filter(comment => comment.scamReportId === scamReportId);
  }
  
  async getConsolidatedScam(id: number): Promise<ConsolidatedScam | undefined> {
    return this.consolidatedScams.get(id);
  }
  
  async getConsolidatedScamByIdentifier(identifier: string): Promise<ConsolidatedScam | undefined> {
    return Array.from(this.consolidatedScams.values())
      .find(scam => scam.identifier.toLowerCase() === identifier.toLowerCase());
  }
  
  async getAllConsolidatedScams(): Promise<ConsolidatedScam[]> {
    return Array.from(this.consolidatedScams.values());
  }
  
  async searchConsolidatedScams(query: string): Promise<ConsolidatedScam[]> {
    if (!query) return this.getAllConsolidatedScams();
    
    const lowerQuery = query.toLowerCase();
    return Array.from(this.consolidatedScams.values())
      .filter(scam => scam.identifier.toLowerCase().includes(lowerQuery));
  }
  
  async createLawyerProfile(profile: InsertLawyerProfile): Promise<LawyerProfile> {
    const id = this.lawyerProfileId++;
    const now = new Date();
    
    const lawyerProfile: LawyerProfile = {
      id,
      userId: profile.userId,
      barNumber: profile.barNumber,
      yearsOfExperience: profile.yearsOfExperience,
      firmName: profile.firmName || null,
      primarySpecialization: profile.primarySpecialization,
      secondarySpecializations: profile.secondarySpecializations || [],
      officeLocation: profile.officeLocation,
      officePhone: profile.officePhone,
      officeEmail: profile.officeEmail,
      bio: profile.bio,
      profilePhotoUrl: profile.profilePhotoUrl || null,
      websiteUrl: profile.websiteUrl || null,
      verificationStatus: "pending",
      verificationDocumentPath: profile.verificationDocumentPath || null,
      verifiedAt: null,
      verifiedBy: null,
      acceptingNewClients: profile.acceptingNewClients || true,
      caseTypes: profile.caseTypes || [],
      offersFreeConsultation: profile.offersFreeConsultation || false,
      consultationFee: profile.consultationFee || null,
      createdAt: now,
      updatedAt: now
    };
    
    this.lawyerProfiles.set(id, lawyerProfile);
    
    // Update the user's role to "lawyer"
    const user = await this.getUser(profile.userId);
    if (user) {
      const updatedUser: User = { 
        ...user, 
        role: "lawyer" as "admin" | "user" | "lawyer" 
      };
      this.users.set(user.id, updatedUser);
    }
    
    return lawyerProfile;
  }
  
  async getLawyerProfile(id: number): Promise<LawyerProfile | undefined> {
    return this.lawyerProfiles.get(id);
  }
  
  async getLawyerProfileByUserId(userId: number): Promise<LawyerProfile | undefined> {
    return Array.from(this.lawyerProfiles.values())
      .find(profile => profile.userId === userId);
  }
  
  async getAllLawyerProfiles(): Promise<LawyerProfile[]> {
    return Array.from(this.lawyerProfiles.values());
  }
  
  async createLawyerRequest(request: InsertLawyerRequest): Promise<LawyerRequest> {
    const id = this.lawyerRequestId++;
    const now = new Date();
    
    const lawyerRequest: LawyerRequest = {
      id,
      fullName: request.fullName,
      email: request.email,
      phone: request.phone,
      userId: request.userId || null,
      scamType: request.scamType,
      scamReportId: request.scamReportId || null,
      lossAmount: request.lossAmount || null,
      description: request.description,
      urgency: request.urgency || "medium",
      preferredContact: request.preferredContact || "email",
      status: "pending",
      lawyerProfileId: null,
      createdAt: now,
      updatedAt: null,
      completedAt: null
    };
    
    this.lawyerRequests.set(id, lawyerRequest);
    return lawyerRequest;
  }
  
  async getLawyerRequest(id: number): Promise<LawyerRequest | undefined> {
    return this.lawyerRequests.get(id);
  }
  
  async getLawyerRequestsByUser(userId: number): Promise<LawyerRequest[]> {
    return Array.from(this.lawyerRequests.values())
      .filter(request => request.userId === userId);
  }
  
  async updateLawyerRequestStatus(
    id: number, 
    status: RequestStatus, 
    lawyerProfileId?: number
  ): Promise<LawyerRequest | undefined> {
    const request = await this.getLawyerRequest(id);
    if (!request) return undefined;
    
    const now = new Date();
    
    const updatedRequest: LawyerRequest = {
      ...request,
      status,
      lawyerProfileId: lawyerProfileId || request.lawyerProfileId,
      updatedAt: now,
      completedAt: status === "completed" ? now : null
    };
    
    this.lawyerRequests.set(id, updatedRequest);
    return updatedRequest;
  }
  
  async addScamVideo(video: InsertScamVideo): Promise<ScamVideo> {
    const id = this.scamVideoId++;
    const now = new Date();
    
    const scamVideo: ScamVideo = {
      id,
      title: video.title,
      description: video.description,
      youtubeUrl: video.youtubeUrl,
      youtubeVideoId: video.youtubeVideoId,
      scamType: video.scamType || null,
      featured: video.featured || false,
      consolidatedScamId: video.consolidatedScamId || null,
      addedById: video.addedById,
      addedAt: now,
      updatedAt: now
    };
    
    this.scamVideos.set(id, scamVideo);
    return scamVideo;
  }
  
  async getScamVideo(id: number): Promise<ScamVideo | undefined> {
    return this.scamVideos.get(id);
  }
  
  async getAllScamVideos(): Promise<ScamVideo[]> {
    return Array.from(this.scamVideos.values());
  }
  
  async getFeaturedScamVideos(): Promise<ScamVideo[]> {
    return Array.from(this.scamVideos.values())
      .filter(video => video.featured);
  }
  
  async getScamStats(): Promise<ScamStat> {
    const allReports = await this.getAllScamReports();
    
    return {
      id: 1,
      date: new Date(),
      totalReports: allReports.length,
      phoneScams: allReports.filter(r => r.scamType === "phone").length,
      emailScams: allReports.filter(r => r.scamType === "email").length,
      businessScams: allReports.filter(r => r.scamType === "business").length,
      reportsWithProof: allReports.filter(r => r.hasProofDocument).length,
      verifiedReports: allReports.filter(r => r.isVerified).length,
    };
  }
  
  // Security checklist methods
  async getAllSecurityChecklistItems(): Promise<SecurityChecklistItem[]> {
    return Array.from(this.securityChecklistItems.values())
      .filter(item => item.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  async getSecurityChecklistItem(id: number): Promise<SecurityChecklistItem | undefined> {
    return this.securityChecklistItems.get(id);
  }
  
  async createSecurityChecklistItem(insertItem: InsertSecurityChecklistItem): Promise<SecurityChecklistItem> {
    const id = this.securityChecklistItemId++;
    const now = new Date().toISOString();
    
    const item: SecurityChecklistItem = {
      id,
      title: insertItem.title,
      description: insertItem.description,
      category: insertItem.category,
      priority: insertItem.priority || "medium",
      recommendationText: insertItem.recommendationText,
      helpUrl: insertItem.helpUrl || null,
      estimatedTimeMinutes: insertItem.estimatedTimeMinutes || null,
      isActive: insertItem.isActive ?? true,
      sortOrder: insertItem.sortOrder || 0,
      createdAt: now,
    };
    
    this.securityChecklistItems.set(id, item);
    return item;
  }

  async updateSecurityChecklistItem(itemId: number, updates: Partial<SecurityChecklistItem>): Promise<SecurityChecklistItem | null> {
    const item = this.securityChecklistItems.get(itemId);
    if (!item) {
      return null;
    }
    
    const updatedItem = { ...item, ...updates };
    this.securityChecklistItems.set(itemId, updatedItem);
    return updatedItem;
  }

  async deleteSecurityChecklistItem(itemId: number): Promise<boolean> {
    return this.securityChecklistItems.delete(itemId);
  }
  
  async getUserSecurityProgress(userId: number): Promise<UserSecurityProgress[]> {
    return Array.from(this.userSecurityProgress.values())
      .filter(progress => progress.userId === userId);
  }
  
  async getUserSecurityProgressForItem(userId: number, checklistItemId: number): Promise<UserSecurityProgress | undefined> {
    return Array.from(this.userSecurityProgress.values())
      .find(progress => progress.userId === userId && progress.checklistItemId === checklistItemId);
  }
  
  async updateUserSecurityProgress(
    userId: number, 
    checklistItemId: number, 
    isCompleted: boolean, 
    notes?: string
  ): Promise<UserSecurityProgress> {
    const existing = await this.getUserSecurityProgressForItem(userId, checklistItemId);
    const now = new Date().toISOString();
    
    if (existing) {
      const updated: UserSecurityProgress = {
        ...existing,
        isCompleted,
        completedAt: isCompleted ? now : null,
        notes: notes || existing.notes || null,
        updatedAt: now,
      };
      
      this.userSecurityProgress.set(existing.id, updated);
      return updated;
    } else {
      const id = this.userSecurityProgressId++;
      const newProgress: UserSecurityProgress = {
        id,
        userId,
        checklistItemId,
        isCompleted,
        completedAt: isCompleted ? now : null,
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
      };
      
      this.userSecurityProgress.set(id, newProgress);
      return newProgress;
    }
  }
  
  private async seedSecurityChecklistItems(): Promise<void> {
    // Identity Protection
    await this.createSecurityChecklistItem({
      title: "Freeze Your Credit Reports",
      description: "Place security freezes on your credit reports with all three major credit bureaus",
      category: "identity_protection",
      priority: "high",
      recommendationText: "Contact Experian, Equifax, and TransUnion to freeze your credit reports. This prevents new accounts from being opened in your name without your explicit permission.",
      helpUrl: "https://www.consumer.ftc.gov/articles/what-know-about-credit-freezes-and-fraud-alerts",
      estimatedTimeMinutes: 30,
      sortOrder: 1,
    });
    
    await this.createSecurityChecklistItem({
      title: "Monitor Your Credit Report",
      description: "Set up regular monitoring of your credit reports for suspicious activity",
      category: "identity_protection",
      priority: "high",
      recommendationText: "Use a free service like Credit Karma or get your free annual credit reports from annualcreditreport.com to monitor for unauthorized accounts or inquiries.",
      helpUrl: "https://www.annualcreditreport.com",
      estimatedTimeMinutes: 15,
      sortOrder: 2,
    });
    
    // Password Security
    await this.createSecurityChecklistItem({
      title: "Use a Password Manager",
      description: "Install and start using a reputable password manager for all your accounts",
      category: "password_security",
      priority: "high",
      recommendationText: "Choose a password manager like Bitwarden, 1Password, or LastPass. This allows you to use unique, strong passwords for every account without having to remember them all.",
      helpUrl: "https://www.cisa.gov/secure-our-world/use-strong-passwords",
      estimatedTimeMinutes: 45,
      sortOrder: 3,
    });
    
    await this.createSecurityChecklistItem({
      title: "Use Unique Passwords",
      description: "Ensure every online account has a unique, strong password",
      category: "password_security",
      priority: "high",
      recommendationText: "Never reuse passwords across accounts. If one account is compromised, unique passwords prevent attackers from accessing your other accounts.",
      estimatedTimeMinutes: 60,
      sortOrder: 4,
    });
    
    // Account Security
    await this.createSecurityChecklistItem({
      title: "Enable Two-Factor Authentication (2FA)",
      description: "Set up 2FA on all important accounts (email, banking, social media)",
      category: "account_security",
      priority: "high",
      recommendationText: "Enable 2FA using an authenticator app like Google Authenticator or Authy. This adds an extra layer of security even if your password is compromised.",
      helpUrl: "https://www.cisa.gov/secure-our-world/turn-mfa",
      estimatedTimeMinutes: 30,
      sortOrder: 5,
    });
    
    await this.createSecurityChecklistItem({
      title: "Review App Permissions",
      description: "Audit and remove unnecessary permissions for apps and browser extensions",
      category: "account_security",
      priority: "medium",
      recommendationText: "Go through your social media accounts, Google/Apple accounts, and browser extensions. Remove apps you don't use and limit permissions for those you keep.",
      estimatedTimeMinutes: 20,
      sortOrder: 6,
    });
    
    await this.createSecurityChecklistItem({
      title: "Enable Account Alerts",
      description: "Set up login and transaction alerts for banking and email accounts",
      category: "account_security",
      priority: "medium",
      recommendationText: "Enable notifications for logins, password changes, and transactions. This helps you quickly detect unauthorized access to your accounts.",
      estimatedTimeMinutes: 15,
      sortOrder: 7,
    });
    
    // Device Security
    await this.createSecurityChecklistItem({
      title: "Use Biometric Authentication",
      description: "Enable fingerprint, face recognition, or other biometric security on your devices",
      category: "device_security",
      priority: "medium",
      recommendationText: "Set up fingerprint or face unlock on your phone, tablet, and computer when available. This is more secure than PINs and harder for others to bypass.",
      estimatedTimeMinutes: 10,
      sortOrder: 8,
    });
    
    await this.createSecurityChecklistItem({
      title: "Keep Software Updated",
      description: "Enable automatic updates for your operating system and applications",
      category: "device_security",
      priority: "high",
      recommendationText: "Turn on automatic updates for your operating system, browser, and apps. Security patches often fix vulnerabilities that could be exploited by scammers.",
      estimatedTimeMinutes: 5,
      sortOrder: 9,
    });
    
    // Network Security
    await this.createSecurityChecklistItem({
      title: "Secure Your Wi-Fi Network",
      description: "Use WPA3 security and a strong password for your home Wi-Fi",
      category: "network_security",
      priority: "medium",
      recommendationText: "Change the default router password, use WPA3 (or WPA2 if WPA3 isn't available), and set a strong Wi-Fi password. Consider hiding your network name (SSID).",
      helpUrl: "https://www.cisa.gov/secure-our-world/secure-your-home-network",
      estimatedTimeMinutes: 20,
      sortOrder: 10,
    });
    
    await this.createSecurityChecklistItem({
      title: "Use a VPN on Public Wi-Fi",
      description: "Install a reputable VPN service for secure browsing on public networks",
      category: "network_security",
      priority: "medium",
      recommendationText: "When using public Wi-Fi, use a VPN to encrypt your internet traffic. Choose a reputable service like NordVPN, ExpressVPN, or Surfshark.",
      estimatedTimeMinutes: 15,
      sortOrder: 11,
    });
    
    // Financial Security
    await this.createSecurityChecklistItem({
      title: "Review Bank and Credit Card Statements",
      description: "Set up a monthly routine to review all financial statements for unauthorized transactions",
      category: "financial_security",
      priority: "high",
      recommendationText: "Check your bank and credit card statements monthly for any transactions you don't recognize. Report suspicious activity immediately to your financial institution.",
      estimatedTimeMinutes: 20,
      sortOrder: 12,
    });
    
    await this.createSecurityChecklistItem({
      title: "Set Up Account Notifications",
      description: "Enable real-time alerts for all banking and credit card transactions",
      category: "financial_security",
      priority: "high",
      recommendationText: "Most banks and credit card companies offer text or email alerts for transactions. Set these up to be notified immediately of any account activity.",
      estimatedTimeMinutes: 10,
      sortOrder: 13,
    });
  }

}

// Upload utilities
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const upload = multer({ 
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only certain file types
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, GIF, and DOC/DOCX files are allowed.') as any, false);
    }
  }
});

// Import Azure Storage
import { AzureStorage } from './AzureStorage.js';

// Use Azure Storage exclusively
export const storage = new AzureStorage();