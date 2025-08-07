import sql from 'mssql';
import { pool } from './db.js';

// Simplified types for Azure SQL Database compatibility
export interface User {
  id: number;
  email: string;
  password?: string;
  displayName?: string;
  beawareUsername?: string;
  role: string;
  authProvider: string;
  googleId?: string;
  createdAt?: string;
}

export interface ScamReport {
  id: number;
  userId: number;
  scamType: string;
  scamPhoneNumber?: string;
  scamEmail?: string;
  scamBusinessName?: string;
  incidentDate: string;
  country: string;
  city?: string;
  state?: string;
  zipCode?: string;
  description: string;
  isVerified: boolean;
  isPublished: boolean;
  reportedAt: string;
  verifiedBy?: number;
  publishedBy?: number;
  hasProofDocument?: boolean;
  proofFilePath?: string;
  proofFileName?: string;
  proofFileType?: string;
  proofFileSize?: number;
  verifiedAt?: string;
  publishedAt?: string;
}

export interface ScamComment {
  id: number;
  scamReportId: number;
  userId: number;
  comment: string;
  createdAt: string;
}

export interface PasswordReset {
  id: number;
  userId: number;
  resetToken: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

// Import the IStorage interface and types
import { IStorage } from './storage.js';
import { 
  InsertUser, User, InsertScamReport, ScamReport, InsertScamComment, ScamComment, 
  ConsolidatedScam, InsertConsolidatedScam, ScamReportConsolidation, InsertScamReportConsolidation,
  LawyerProfile, InsertLawyerProfile, LawyerRequest, InsertLawyerRequest, InsertScamVideo, ScamVideo,
  ScamStat, ScamType, RequestStatus, SecurityChecklistItem, InsertSecurityChecklistItem,
  UserSecurityProgress, InsertUserSecurityProgress 
} from "../shared/schema.js";

// Azure SQL Database Storage Implementation
export class AzureStorage implements IStorage {
  
  private async ensureConnection(): Promise<void> {
    try {
      if (pool.connected) {
        return;
      }
      
      if (pool.connecting) {
        // Wait for existing connection attempt
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (pool.connected || !pool.connecting) {
              clearInterval(checkInterval);
              resolve(true);
            }
          }, 100);
        });
        return;
      }
      
      console.log('Establishing Azure SQL Database connection...');
      await pool.connect();
      console.log('Azure SQL Database connected successfully');
    } catch (error) {
      console.error('Failed to connect to Azure SQL Database:', error);
      
      // Reset pool on failure
      try {
        if (pool && !pool.connected) {
          await pool.close();
        }
      } catch (closeError) {
        console.error('Error closing failed connection:', closeError);
      }
      
      throw new Error('Database connection failed. Please check your Azure SQL Database configuration.');
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      if (!id || isNaN(id)) {
        console.log('Invalid user ID provided:', id);
        return undefined;
      }
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`SELECT * FROM users WHERE id = ${id}`);
      const dbUser = result.recordset[0];
      
      if (!dbUser) return undefined;
      
      return {
        id: dbUser.id,
        email: dbUser.email,
        password: dbUser.password,
        displayName: dbUser.display_name,
        beawareUsername: dbUser.beaware_username,
        role: dbUser.role,
        authProvider: dbUser.auth_provider,
        googleId: dbUser.google_id,
        createdAt: dbUser.created_at
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`SELECT * FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
      const dbUser = result.recordset[0];
      
      if (!dbUser) return undefined;
      
      return {
        id: dbUser.id,
        email: dbUser.email,
        password: dbUser.password,
        displayName: dbUser.display_name,
        beawareUsername: dbUser.beaware_username,
        role: dbUser.role,
        authProvider: dbUser.auth_provider,
        googleId: dbUser.google_id,
        createdAt: dbUser.created_at
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`SELECT * FROM users WHERE google_id = '${googleId.replace(/'/g, "''")}'`);
      const dbUser = result.recordset[0];
      
      if (!dbUser) return undefined;
      
      return {
        id: dbUser.id,
        email: dbUser.email,
        password: dbUser.password,
        displayName: dbUser.display_name,
        beawareUsername: dbUser.beaware_username,
        role: dbUser.role,
        authProvider: dbUser.auth_provider,
        googleId: dbUser.google_id,
        createdAt: dbUser.created_at
      };
    } catch (error) {
      console.error('Error getting user by Google ID:', error);
      return undefined;
    }
  }

  async getUserByBeawareUsername(username: string): Promise<User | undefined> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`SELECT * FROM users WHERE beaware_username = '${username.replace(/'/g, "''")}'`);
      const dbUser = result.recordset[0];
      
      if (!dbUser) return undefined;
      
      return {
        id: dbUser.id,
        email: dbUser.email,
        password: dbUser.password,
        displayName: dbUser.display_name,
        beawareUsername: dbUser.beaware_username,
        role: dbUser.role,
        authProvider: dbUser.auth_provider,
        googleId: dbUser.google_id,
        createdAt: dbUser.created_at
      };
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(userData: any): Promise<User> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`
        INSERT INTO users (email, password, display_name, beaware_username, role, auth_provider, google_id)
        OUTPUT INSERTED.*
        VALUES (
          '${userData.email.replace(/'/g, "''")}',
          ${userData.password ? `'${userData.password.replace(/'/g, "''")}'` : 'NULL'},
          '${(userData.displayName || '').replace(/'/g, "''")}',
          ${userData.beawareUsername ? `'${userData.beawareUsername.replace(/'/g, "''")}'` : 'NULL'},
          '${(userData.role || 'user').replace(/'/g, "''")}',
          '${(userData.authProvider || 'local').replace(/'/g, "''")}',
          ${userData.googleId ? `'${userData.googleId.replace(/'/g, "''")}'` : 'NULL'}
        )
      `);
      
      const dbUser = result.recordset[0];
      
      // Map database columns to TypeScript interface
      return {
        id: dbUser.id,
        email: dbUser.email,
        password: dbUser.password,
        displayName: dbUser.display_name,
        beawareUsername: dbUser.beaware_username,
        role: dbUser.role,
        authProvider: dbUser.auth_provider,
        googleId: dbUser.google_id,
        createdAt: dbUser.created_at
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query('SELECT * FROM users ORDER BY created_at DESC');
      return result.recordset;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Scam report methods
  async createScamReport(reportData: any): Promise<ScamReport> {
    try {
      await this.ensureConnection();
      
      console.log('📅 Raw incident date received:', reportData.incidentDate);
      console.log('📅 Type of incident date:', typeof reportData.incidentDate);
      
      // Use parameterized query to avoid date conversion issues
      const request = pool.request();
      
      // Add parameters to prevent SQL injection and handle dates properly
      request.input('userId', reportData.userId);
      request.input('scamType', reportData.scamType);
      request.input('scamPhoneNumber', reportData.scamPhoneNumber || null);
      request.input('scamEmail', reportData.scamEmail || null);
      request.input('scamBusinessName', reportData.scamBusinessName || null);
      request.input('country', reportData.country);
      request.input('city', reportData.city || null);
      request.input('state', reportData.state || null);
      request.input('zipCode', reportData.zipCode || null);
      request.input('description', reportData.description);
      
      // Handle proof document fields
      request.input('hasProofDocument', reportData.hasProofDocument || false);
      request.input('proofFilePath', reportData.proofFilePath || null);
      request.input('proofFileName', reportData.proofFileName || null);
      request.input('proofFileType', reportData.proofFileType || null);
      request.input('proofFileSize', reportData.proofFileSize || null);
      
      // Handle incident date with proper parsing
      let incidentDate = new Date(); // default to current date
      if (reportData.incidentDate) {
        const parsedDate = new Date(reportData.incidentDate);
        if (!isNaN(parsedDate.getTime())) {
          incidentDate = parsedDate;
        }
      }
      request.input('incidentDate', incidentDate);
      
      console.log('📅 Final incident date for SQL:', incidentDate);

      const result = await request.query(`
        INSERT INTO scam_reports (
          user_id, scam_type, scam_phone_number, scam_email, scam_business_name,
          incident_date, country, city, state, zip_code, description,
          is_verified, is_published, has_proof_document, proof_file_path,
          proof_file_name, proof_file_type, proof_file_size
        )
        OUTPUT INSERTED.*
        VALUES (
          @userId, @scamType, @scamPhoneNumber, @scamEmail, @scamBusinessName,
          @incidentDate, @country, @city, @state, @zipCode, @description,
          0, 0, @hasProofDocument, @proofFilePath, @proofFileName, @proofFileType, @proofFileSize
        )
      `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating scam report:', error);
      console.error('Report data received:', JSON.stringify(reportData, null, 2));
      throw error;
    }
  }

  async getScamReport(id: number): Promise<ScamReport | undefined> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`
        SELECT 
          id,
          user_id as userId,
          scam_type as scamType,
          scam_phone_number as scamPhoneNumber,
          scam_email as scamEmail,
          scam_business_name as scamBusinessName,
          incident_date as incidentDate,
          country,
          city,
          state,
          zip_code as zipCode,
          description,
          is_verified as isVerified,
          is_published as isPublished,
          reported_at as reportedAt,
          verified_by as verifiedBy,
          published_by as publishedBy,
          has_proof_document as hasProofDocument,
          proof_file_path as proofFilePath,
          proof_file_name as proofFileName,
          proof_file_type as proofFileType,
          proof_file_size as proofFileSize,
          verified_at as verifiedAt,
          published_at as publishedAt
        FROM scam_reports 
        WHERE id = ${id}
      `);
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('Error getting scam report:', error);
      return undefined;
    }
  }

  async getAllScamReports(page: number = 1, limit: number = 50): Promise<ScamReport[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const offset = (page - 1) * limit;
      
      const result = await request.query(`
        SELECT 
          id,
          user_id as userId,
          scam_type as scamType,
          scam_phone_number as scamPhoneNumber,
          scam_email as scamEmail,
          scam_business_name as scamBusinessName,
          incident_date as incidentDate,
          country,
          city,
          state,
          zip_code as zipCode,
          description,
          is_verified as isVerified,
          is_published as isPublished,
          reported_at as reportedAt,
          verified_by as verifiedBy,
          published_by as publishedBy,
          has_proof_document as hasProofDocument,
          proof_file_path as proofFilePath,
          proof_file_name as proofFileName,
          proof_file_type as proofFileType,
          proof_file_size as proofFileSize,
          verified_at as verifiedAt,
          published_at as publishedAt
        FROM scam_reports 
        ORDER BY reported_at DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error getting all scam reports:', error);
      return [];
    }
  }

  async getRecentScamReports(limit: number, includeUnpublished: boolean = false): Promise<ScamReport[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const whereClause = includeUnpublished ? '' : 'WHERE is_published = CAST(1 AS BIT)';
      const result = await request.query(`
        SELECT TOP ${limit}
          id,
          user_id as userId,
          scam_type as scamType,
          scam_phone_number as scamPhoneNumber,
          scam_email as scamEmail,
          scam_business_name as scamBusinessName,
          incident_date as incidentDate,
          country,
          city,
          state,
          zip_code as zipCode,
          description,
          is_verified as isVerified,
          is_published as isPublished,
          reported_at as reportedAt,
          verified_by as verifiedBy,
          published_by as publishedBy,
          has_proof_document as hasProofDocument,
          proof_file_path as proofFilePath,
          proof_file_name as proofFileName,
          proof_file_type as proofFileType,
          proof_file_size as proofFileSize,
          verified_at as verifiedAt,
          published_at as publishedAt
        FROM scam_reports 
        ${whereClause}
        ORDER BY reported_at DESC
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error getting recent scam reports:', error);
      return [];
    }
  }

  async getUnverifiedScamReports(page: number = 1, limit: number = 50): Promise<ScamReport[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const offset = (page - 1) * limit;
      const result = await request.query(`
        SELECT 
          id,
          user_id as userId,
          scam_type as scamType,
          scam_phone_number as scamPhoneNumber,
          scam_email as scamEmail,
          scam_business_name as scamBusinessName,
          incident_date as incidentDate,
          country,
          city,
          state,
          zip_code as zipCode,
          description,
          is_verified as isVerified,
          is_published as isPublished,
          reported_at as reportedAt,
          verified_by as verifiedBy,
          published_by as publishedBy
        FROM scam_reports 
        WHERE is_verified = CAST(0 AS BIT)
        ORDER BY reported_at DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error getting unverified scam reports:', error);
      return [];
    }
  }

  async getVerifiedScamReports(page: number = 1, limit: number = 50): Promise<ScamReport[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const offset = (page - 1) * limit;
      const result = await request.query(`
        SELECT 
          id,
          user_id as userId,
          scam_type as scamType,
          scam_phone_number as scamPhoneNumber,
          scam_email as scamEmail,
          scam_business_name as scamBusinessName,
          incident_date as incidentDate,
          country,
          city,
          state,
          zip_code as zipCode,
          description,
          is_verified as isVerified,
          is_published as isPublished,
          reported_at as reportedAt,
          verified_by as verifiedBy,
          published_by as publishedBy
        FROM scam_reports 
        WHERE is_verified = CAST(1 AS BIT)
        ORDER BY reported_at DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error getting verified scam reports:', error);
      return [];
    }
  }

  async getPublishedScamReports(page: number = 1, limit: number = 50): Promise<ScamReport[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const offset = (page - 1) * limit;
      const result = await request.query(`
        SELECT 
          id,
          user_id as userId,
          scam_type as scamType,
          scam_phone_number as scamPhoneNumber,
          scam_email as scamEmail,
          scam_business_name as scamBusinessName,
          incident_date as incidentDate,
          country,
          city,
          state,
          zip_code as zipCode,
          description,
          is_verified as isVerified,
          is_published as isPublished,
          reported_at as reportedAt,
          verified_by as verifiedBy,
          published_by as publishedBy,
          has_proof_document as hasProofDocument,
          proof_file_path as proofFilePath,
          proof_file_name as proofFileName,
          proof_file_type as proofFileType,
          proof_file_size as proofFileSize,
          verified_at as verifiedAt,
          published_at as publishedAt
        FROM scam_reports 
        WHERE is_published = CAST(1 AS BIT)
        ORDER BY reported_at DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error getting published scam reports:', error);
      return [];
    }
  }

  async getTotalScamReportsCount(): Promise<number> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`SELECT COUNT(*) as total FROM scam_reports`);
      return result.recordset[0].total;
    } catch (error) {
      console.error('Error getting total scam reports count:', error);
      return 0;
    }
  }

  async getPublishedScamReportsCount(): Promise<number> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`SELECT COUNT(*) as total FROM scam_reports WHERE is_published = CAST(1 AS BIT)`);
      return result.recordset[0].total;
    } catch (error) {
      console.error('Error getting published scam reports count:', error);
      return 0;
    }
  }

  async getVerifiedScamReportsCount(): Promise<number> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`SELECT COUNT(*) as total FROM scam_reports WHERE is_verified = CAST(1 AS BIT)`);
      return result.recordset[0].total;
    } catch (error) {
      console.error('Error getting verified scam reports count:', error);
      return 0;
    }
  }

  async getUnverifiedScamReportsCount(): Promise<number> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`SELECT COUNT(*) as total FROM scam_reports WHERE is_verified = CAST(0 AS BIT)`);
      return result.recordset[0].total;
    } catch (error) {
      console.error('Error getting unverified scam reports count:', error);
      return 0;
    }
  }

  async getUnpublishedScamReports(page: number = 1, limit: number = 50): Promise<ScamReport[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const offset = (page - 1) * limit;
      const result = await request.query(`
        SELECT 
          id,
          user_id as userId,
          scam_type as scamType,
          scam_phone_number as scamPhoneNumber,
          scam_email as scamEmail,
          scam_business_name as scamBusinessName,
          incident_date as incidentDate,
          country,
          city,
          state,
          zip_code as zipCode,
          description,
          is_verified as isVerified,
          is_published as isPublished,
          reported_at as reportedAt,
          verified_by as verifiedBy,
          published_by as publishedBy
        FROM scam_reports 
        WHERE is_published = CAST(0 AS BIT)
        ORDER BY reported_at DESC
        OFFSET ${offset} ROWS
        FETCH NEXT ${limit} ROWS ONLY
      `);
      return result.recordset;
    } catch (error) {
      console.error('Error getting unpublished scam reports:', error);
      return [];
    }
  }

  async getConsolidationForScamReport(scamReportId: number): Promise<any> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`
        SELECT * FROM scam_report_consolidations 
        WHERE scam_report_id = ${scamReportId}
      `);
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error getting consolidation for scam report:', error);
      return null;
    }
  }

  async getScamReportsByUser(userId: number): Promise<ScamReport[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`SELECT * FROM scam_reports WHERE user_id = ${userId} ORDER BY reported_at DESC`);
      return result.recordset;
    } catch (error) {
      console.error('Error getting scam reports by user:', error);
      return [];
    }
  }

  async getScamReportsByType(type: string): Promise<ScamReport[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`SELECT * FROM scam_reports WHERE scam_type = '${type.replace(/'/g, "''")}' ORDER BY reported_at DESC`);
      return result.recordset;
    } catch (error) {
      console.error('Error getting scam reports by type:', error);
      return [];
    }
  }

  async verifyScamReport(id: number, verifiedBy: number): Promise<ScamReport | undefined> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`
        UPDATE scam_reports 
        SET is_verified = CAST(1 AS BIT), verified_by = ${verifiedBy}, verified_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = ${id}
      `);
      
      const dbReport = result.recordset[0];
      if (!dbReport) return undefined;
      
      // Map database columns to TypeScript interface
      return {
        id: dbReport.id,
        userId: dbReport.user_id,
        scamType: dbReport.scam_type,
        scamPhoneNumber: dbReport.scam_phone_number,
        scamEmail: dbReport.scam_email,
        scamBusinessName: dbReport.scam_business_name,
        incidentDate: dbReport.incident_date,
        country: dbReport.country,
        city: dbReport.city,
        state: dbReport.state,
        zipCode: dbReport.zip_code,
        description: dbReport.description,
        isVerified: dbReport.is_verified,
        isPublished: dbReport.is_published,
        reportedAt: dbReport.reported_at,
        verifiedBy: dbReport.verified_by,
        publishedBy: dbReport.published_by
      };
    } catch (error) {
      console.error('Error verifying scam report:', error);
      return undefined;
    }
  }

  async publishScamReport(id: number, publishedBy: number): Promise<ScamReport | undefined> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`
        UPDATE scam_reports 
        SET is_published = CAST(1 AS BIT), published_by = ${publishedBy}, published_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = ${id}
      `);
      
      const dbReport = result.recordset[0];
      if (!dbReport) return undefined;
      
      // Map database columns to TypeScript interface
      return {
        id: dbReport.id,
        userId: dbReport.user_id,
        scamType: dbReport.scam_type,
        scamPhoneNumber: dbReport.scam_phone_number,
        scamEmail: dbReport.scam_email,
        scamBusinessName: dbReport.scam_business_name,
        incidentDate: dbReport.incident_date,
        country: dbReport.country,
        city: dbReport.city,
        state: dbReport.state,
        zipCode: dbReport.zip_code,
        description: dbReport.description,
        isVerified: dbReport.is_verified,
        isPublished: dbReport.is_published,
        reportedAt: dbReport.reported_at,
        verifiedBy: dbReport.verified_by,
        publishedBy: dbReport.published_by
      };
    } catch (error) {
      console.error('Error publishing scam report:', error);
      return undefined;
    }
  }

  async unpublishScamReport(id: number, unpublishedBy: number): Promise<ScamReport | undefined> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`
        UPDATE scam_reports 
        SET is_published = CAST(0 AS BIT), published_by = ${unpublishedBy}, published_at = NULL
        OUTPUT INSERTED.*
        WHERE id = ${id}
      `);
      return result.recordset[0] || undefined;
    } catch (error) {
      console.error('Error unpublishing scam report:', error);
      return undefined;
    }
  }

  // Comment methods
  async createScamComment(commentData: any): Promise<ScamComment> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`
        INSERT INTO scam_comments (scam_report_id, user_id, comment)
        OUTPUT INSERTED.*
        VALUES (${commentData.scamReportId}, ${commentData.userId}, '${commentData.comment.replace(/'/g, "''")}')
      `);
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating scam comment:', error);
      throw error;
    }
  }

  async getCommentsForScamReport(reportId: number): Promise<ScamComment[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`SELECT * FROM scam_comments WHERE scam_report_id = ${reportId} ORDER BY created_at ASC`);
      return result.recordset;
    } catch (error) {
      console.error('Error getting comments for scam report:', error);
      return [];
    }
  }

  // Stats and other methods
  async getScamStats(): Promise<any> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`
        SELECT 
          COUNT(*) as totalReports,
          SUM(CASE WHEN is_verified = CAST(1 AS BIT) THEN 1 ELSE 0 END) as verifiedReports,
          SUM(CASE WHEN scam_type = 'phone' THEN 1 ELSE 0 END) as phoneScams,
          SUM(CASE WHEN scam_type = 'email' THEN 1 ELSE 0 END) as emailScams,
          SUM(CASE WHEN scam_type = 'business' THEN 1 ELSE 0 END) as businessScams
        FROM scam_reports
      `);
      return {
        id: 1,
        updatedAt: new Date().toISOString(),
        ...result.recordset[0]
      };
    } catch (error) {
      console.error('Error getting scam stats:', error);
      return {
        id: 1,
        updatedAt: new Date().toISOString(),
        totalReports: 0,
        verifiedReports: 0,
        phoneScams: 0,
        emailScams: 0,
        businessScams: 0
      };
    }
  }

  // Placeholder methods for interface compatibility
  async updateScamReportVerification(id: number, isVerified: boolean, verifiedBy: number): Promise<ScamReport | undefined> {
    return isVerified ? this.verifyScamReport(id, verifiedBy) : undefined;
  }

  async toggleScamReportPublished(id: number, isPublished: boolean, publishedBy: number): Promise<ScamReport | undefined> {
    return isPublished ? this.publishScamReport(id, publishedBy) : undefined;
  }

  async addScamComment(comment: any): Promise<ScamComment> {
    return this.createScamComment(comment);
  }

  async getScamComments(scamReportId: number): Promise<ScamComment[]> {
    return this.getCommentsForScamReport(scamReportId);
  }

  // Security Checklist Methods - Essential for Digital Security Checklist page
  async getAllSecurityChecklistItems(): Promise<SecurityChecklistItem[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      
      // First check which columns exist to handle schema differences
      const columnsCheck = await request.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'security_checklist_items'
      `);
      
      const existingColumns = columnsCheck.recordset.map(row => row.COLUMN_NAME.toLowerCase());
      const hasToolLaunchUrl = existingColumns.includes('tool_launch_url');
      const hasYoutubeVideoUrl = existingColumns.includes('youtube_video_url');
      
      // Build query based on available columns
      let selectColumns = `
        id, title, description, category, priority, 
        recommendation_text as recommendationText,
        help_url as helpUrl
      `;
      
      if (hasToolLaunchUrl) {
        selectColumns += ', tool_launch_url as toolLaunchUrl';
      } else {
        selectColumns += ', NULL as toolLaunchUrl';
      }
      
      if (hasYoutubeVideoUrl) {
        selectColumns += ', youtube_video_url as youtubeVideoUrl';
      } else {
        selectColumns += ', NULL as youtubeVideoUrl';
      }
      
      selectColumns += `, estimated_time_minutes as estimatedTimeMinutes,
          sort_order as sortOrder,
          is_active as isActive,
          created_at as createdAt,
          updated_at as updatedAt`;
      
      const result = await request.query(`
        SELECT ${selectColumns}
        FROM security_checklist_items 
        WHERE is_active = 1 
        ORDER BY sort_order ASC
      `);
      
      return result.recordset.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority,
        recommendationText: item.recommendationText,
        helpUrl: item.helpUrl,
        toolLaunchUrl: item.toolLaunchUrl,
        youtubeVideoUrl: item.youtubeVideoUrl,
        estimatedTimeMinutes: item.estimatedTimeMinutes,
        sortOrder: item.sortOrder,
        isActive: Boolean(item.isActive),
        createdAt: item.createdAt?.toISOString(),
        updatedAt: item.updatedAt?.toISOString()
      }));
    } catch (error) {
      console.error('Error getting security checklist items from database:', error);
      // Return hardcoded fallback data
      return [
      {
        id: 1,
        title: "Freeze Your Credit Reports",
        description: "Place security freezes on your credit reports at all three major credit bureaus",
        category: "financial_security",
        priority: "high",
        recommendationText: "Contact Equifax, Experian, and TransUnion to place free security freezes on your credit reports. This prevents new accounts from being opened in your name.",
        helpUrl: "https://www.consumer.ftc.gov/articles/0497-credit-freeze-faqs",
        toolLaunchUrl: "https://www.freeze.equifax.com/Freeze/jsp/SFF_PersonalIDInfo.jsp",
        youtubeVideoUrl: null,
        estimatedTimeMinutes: 45,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: "Enable Two-Factor Authentication",
        description: "Secure your most important accounts with 2FA",
        category: "account_security",
        priority: "high",
        recommendationText: "Set up 2FA on your email, banking, and social media accounts using an authenticator app like Google Authenticator or Authy.",
        helpUrl: "https://authy.com/what-is-2fa/",
        toolLaunchUrl: "https://authy.com/download/",
        youtubeVideoUrl: null,
        estimatedTimeMinutes: 15,
        sortOrder: 2,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        title: "Use a Password Manager",
        description: "Generate and store strong, unique passwords",
        category: "password_security",
        priority: "high",
        recommendationText: "Install a reputable password manager like Bitwarden, 1Password, or LastPass to create unique passwords for every account.",
        helpUrl: "https://bitwarden.com/help/getting-started-webvault/",
        toolLaunchUrl: "https://bitwarden.com/pricing/",
        youtubeVideoUrl: null,
        estimatedTimeMinutes: 30,
        sortOrder: 3,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 4,
        title: "Review Bank and Credit Card Statements",
        description: "Monitor your financial accounts for unauthorized transactions",
        category: "financial_security",
        priority: "high",
        recommendationText: "Check your bank and credit card statements weekly for suspicious activity. Set up account alerts for transactions over a certain amount.",
        helpUrl: "https://www.consumer.ftc.gov/articles/0213-lost-or-stolen-credit-atm-and-debit-cards",
        toolLaunchUrl: null,
        youtubeVideoUrl: null,
        estimatedTimeMinutes: 20,
        sortOrder: 4,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 5,
        title: "Update Software and Operating Systems",
        description: "Keep your devices secure with the latest updates",
        category: "device_security",
        priority: "medium",
        recommendationText: "Enable automatic updates for your operating system, web browsers, and important software to protect against security vulnerabilities.",
        helpUrl: "https://www.cisa.gov/tips/st04-006",
        toolLaunchUrl: null,
        youtubeVideoUrl: null,
        estimatedTimeMinutes: 10,
        sortOrder: 5,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 6,
        title: "Secure Your Wi-Fi Network",
        description: "Protect your home internet connection",
        category: "network_security",
        priority: "medium",
        recommendationText: "Use WPA3 encryption, change default router passwords, and regularly update router firmware.",
        helpUrl: "https://www.fcc.gov/consumers/guides/how-protect-yourself-online",
        toolLaunchUrl: null,
        youtubeVideoUrl: null,
        estimatedTimeMinutes: 25,
        sortOrder: 6,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 7,
        title: "Be Cautious with Public Wi-Fi",
        description: "Protect your data on public networks",
        category: "network_security",
        priority: "medium",
        recommendationText: "Avoid accessing sensitive information on public Wi-Fi. Use a VPN when necessary and ensure websites use HTTPS.",
        helpUrl: "https://www.cisa.gov/tips/st05-017",
        toolLaunchUrl: null,
        youtubeVideoUrl: null,
        estimatedTimeMinutes: 5,
        sortOrder: 7,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 8,
        title: "Review Privacy Settings on Social Media",
        description: "Control what information you share online",
        category: "privacy_settings",
        priority: "medium",
        recommendationText: "Regularly review and update privacy settings on social media platforms to limit who can see your personal information.",
        helpUrl: "https://www.ftc.gov/tips-advice/business-center/privacy-and-security/social-media",
        toolLaunchUrl: null,
        youtubeVideoUrl: null,
        estimatedTimeMinutes: 30,
        sortOrder: 8,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 9,
        title: "Use Secure Email Practices",
        description: "Protect yourself from email-based threats",
        category: "communication_security",
        priority: "medium",
        recommendationText: "Be suspicious of unexpected emails, verify sender identity, and never click links or download attachments from unknown sources.",
        helpUrl: "https://www.cisa.gov/tips/st04-014",
        toolLaunchUrl: null,
        youtubeVideoUrl: null,
        estimatedTimeMinutes: 10,
        sortOrder: 9,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 10,
        title: "Backup Important Data",
        description: "Protect your data from loss or ransomware",
        category: "data_protection",
        priority: "high",
        recommendationText: "Regularly backup important files to multiple locations including cloud storage and external drives using the 3-2-1 backup rule.",
        helpUrl: "https://www.cisa.gov/tips/st05-012",
        toolLaunchUrl: null,
        youtubeVideoUrl: null,
        estimatedTimeMinutes: 60,
        sortOrder: 10,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 11,
        title: "Install Antivirus Software",
        description: "Protect your devices from malware",
        category: "device_security",
        priority: "medium",
        recommendationText: "Install reputable antivirus software and keep it updated. Enable real-time protection and regular system scans.",
        helpUrl: "https://www.cisa.gov/tips/st04-005",
        toolLaunchUrl: null,
        youtubeVideoUrl: null,
        estimatedTimeMinutes: 20,
        sortOrder: 11,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 12,
        title: "Monitor Your Credit Reports",
        description: "Watch for signs of identity theft",
        category: "financial_security",
        priority: "high",
        recommendationText: "Check your credit reports from all three bureaus annually at annualcreditreport.com and dispute any errors immediately.",
        helpUrl: "https://www.annualcreditreport.com/",
        toolLaunchUrl: "https://www.annualcreditreport.com/",
        youtubeVideoUrl: null,
        estimatedTimeMinutes: 30,
        sortOrder: 12,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 13,
        title: "Use Encrypted Communication Apps",
        description: "Protect your private conversations",
        category: "communication_security",
        priority: "low",
        recommendationText: "Use encrypted messaging apps like Signal or WhatsApp for sensitive communications instead of regular SMS.",
        helpUrl: "https://signal.org/",
        estimatedTimeMinutes: 15,
        sortOrder: 13,
        isActive: true,
        toolLaunchUrl: null,
        youtubeVideoUrl: null,
        createdAt: new Date().toISOString()
      }
    ];
    }
  }

  async getSecurityChecklistItem(id: number): Promise<SecurityChecklistItem | undefined> {
    const items = await this.getAllSecurityChecklistItems();
    return items.find(item => item.id === id);
  }

  async createSecurityChecklistItem(item: InsertSecurityChecklistItem): Promise<SecurityChecklistItem> {
    try {
      await this.ensureConnection();
      
      // Check which columns exist to handle schema differences
      const columnsCheck = await pool.request().query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'security_checklist_items'
      `);
      
      const existingColumns = columnsCheck.recordset.map(row => row.COLUMN_NAME.toLowerCase());
      const hasToolLaunchUrl = existingColumns.includes('tool_launch_url');
      const hasYoutubeVideoUrl = existingColumns.includes('youtube_video_url');
      
      const request = pool.request();
      request.input('title', item.title);
      request.input('description', item.description);
      request.input('category', item.category);
      request.input('priority', item.priority || 'medium');
      request.input('recommendationText', item.recommendationText);
      request.input('helpUrl', item.helpUrl || null);
      request.input('estimatedTimeMinutes', item.estimatedTimeMinutes || 15);
      request.input('sortOrder', item.sortOrder || 999);
      request.input('isActive', item.isActive !== false);

      // Build query based on available columns
      let insertColumns = 'title, description, category, priority, recommendation_text, help_url, estimated_time_minutes, sort_order, is_active, created_at, updated_at';
      let insertValues = '@title, @description, @category, @priority, @recommendationText, @helpUrl, @estimatedTimeMinutes, @sortOrder, @isActive, GETDATE(), GETDATE()';
      
      if (hasToolLaunchUrl) {
        insertColumns += ', tool_launch_url';
        insertValues += ', @toolLaunchUrl';
        request.input('toolLaunchUrl', item.toolLaunchUrl || null);
      }
      
      if (hasYoutubeVideoUrl) {
        insertColumns += ', youtube_video_url';
        insertValues += ', @youtubeVideoUrl';
        request.input('youtubeVideoUrl', item.youtubeVideoUrl || null);
      }

      const query = `
        INSERT INTO security_checklist_items (${insertColumns})
        OUTPUT INSERTED.*
        VALUES (${insertValues})
      `;

      console.log('Creating security checklist item:', item);
      const result = await request.query(query);
      
      if (result.recordset.length === 0) {
        throw new Error('Failed to create security checklist item');
      }

      const created = result.recordset[0];
      return {
        id: created.id,
        title: created.title,
        description: created.description,
        category: created.category,
        priority: created.priority,
        recommendationText: created.recommendation_text,
        helpUrl: created.help_url,
        toolLaunchUrl: created.tool_launch_url || null,
        youtubeVideoUrl: created.youtube_video_url || null,
        estimatedTimeMinutes: created.estimated_time_minutes,
        sortOrder: created.sort_order,
        isActive: Boolean(created.is_active),
        createdAt: created.created_at?.toISOString(),
        updatedAt: created.updated_at?.toISOString()
      };
    } catch (error) {
      console.error('Error creating security checklist item:', error);
      throw error;
    }
  }

  async deleteSecurityChecklistItem(itemId: number): Promise<boolean> {
    try {
      await this.ensureConnection();
      
      const request = pool.request();
      request.input('itemId', itemId);

      // Soft delete by setting is_active to false instead of actual deletion
      const query = `
        UPDATE security_checklist_items 
        SET is_active = 0, updated_at = GETDATE()
        WHERE id = @itemId AND is_active = 1
      `;

      console.log('Deleting security checklist item:', itemId);
      const result = await request.query(query);
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error deleting security checklist item:', error);
      return false;
    }
  }

  async updateSecurityChecklistItem(itemId: number, updates: Partial<SecurityChecklistItem>): Promise<SecurityChecklistItem | null> {
    try {
      await this.ensureConnection();
      
      // Build the UPDATE query dynamically based on provided updates
      const updateFields = [];
      const params: any = {};
      
      if (updates.title !== undefined) {
        updateFields.push('title = @title');
        params.title = updates.title;
      }
      if (updates.description !== undefined) {
        updateFields.push('description = @description');
        params.description = updates.description;
      }
      if (updates.recommendationText !== undefined) {
        updateFields.push('recommendation_text = @recommendationText');
        params.recommendationText = updates.recommendationText;
      }
      if (updates.helpUrl !== undefined) {
        updateFields.push('help_url = @helpUrl');
        params.helpUrl = updates.helpUrl;
      }
      if (updates.toolLaunchUrl !== undefined) {
        updateFields.push('tool_launch_url = @toolLaunchUrl');
        params.toolLaunchUrl = updates.toolLaunchUrl;
      }
      if (updates.youtubeVideoUrl !== undefined) {
        updateFields.push('youtube_video_url = @youtubeVideoUrl');
        params.youtubeVideoUrl = updates.youtubeVideoUrl;
      }
      if (updates.estimatedTimeMinutes !== undefined) {
        updateFields.push('estimated_time_minutes = @estimatedTimeMinutes');
        params.estimatedTimeMinutes = updates.estimatedTimeMinutes;
      }

      if (updateFields.length === 0) {
        // No updates to apply, return current item
        return await this.getSecurityChecklistItem(itemId);
      }

      // Always update the updated_at field
      updateFields.push('updated_at = GETDATE()');

      const request = pool.request();
      
      // Add parameters to request
      Object.keys(params).forEach(key => {
        request.input(key, params[key]);
      });
      request.input('itemId', itemId);

      const query = `
        UPDATE security_checklist_items 
        SET ${updateFields.join(', ')}
        OUTPUT INSERTED.*
        WHERE id = @itemId
      `;

      console.log('Executing update query:', query);
      console.log('With parameters:', params);

      const result = await request.query(query);
      
      if (result.recordset.length === 0) {
        return null; // Item not found
      }

      const updated = result.recordset[0];
      return {
        id: updated.id,
        title: updated.title,
        description: updated.description,
        category: updated.category,
        priority: updated.priority,
        recommendationText: updated.recommendation_text,
        helpUrl: updated.help_url,
        toolLaunchUrl: updated.tool_launch_url,
        youtubeVideoUrl: updated.youtube_video_url,
        estimatedTimeMinutes: updated.estimated_time_minutes,
        sortOrder: updated.sort_order,
        isActive: Boolean(updated.is_active),
        createdAt: updated.created_at?.toISOString(),
        updatedAt: updated.updated_at?.toISOString()
      };
    } catch (error) {
      console.error('Error updating security checklist item:', error);
      return null;
    }
  }

  async getUserSecurityProgress(userId: number): Promise<UserSecurityProgress[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      const result = await request.query(`
        SELECT 
          id, user_id as userId, checklist_item_id as checklistItemId,
          is_completed as isCompleted, completed_at as completedAt,
          notes, created_at as createdAt, updated_at as updatedAt
        FROM user_security_progress 
        WHERE user_id = ${userId}
        ORDER BY checklist_item_id ASC
      `);
      
      return result.recordset.map(item => ({
        id: item.id,
        userId: item.userId,
        checklistItemId: item.checklistItemId,
        isCompleted: Boolean(item.isCompleted),
        completedAt: item.completedAt?.toISOString() || null,
        notes: item.notes || null,
        createdAt: item.createdAt?.toISOString(),
        updatedAt: item.updatedAt?.toISOString()
      }));
    } catch (error) {
      console.error('Error getting user security progress from database:', error);
      return [];
    }
  }

  async updateUserSecurityProgress(userId: number, checklistItemId: number, isCompleted: boolean, notes?: string): Promise<UserSecurityProgress> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      
      // Check if record exists
      const existingResult = await request.query(`
        SELECT id FROM user_security_progress 
        WHERE user_id = ${userId} AND checklist_item_id = ${checklistItemId}
      `);
      
      let result;
      const completedAt = isCompleted ? new Date() : null;
      const updatedAt = new Date();
      
      if (existingResult.recordset.length > 0) {
        // Update existing record
        result = await pool.request().query(`
          UPDATE user_security_progress 
          SET 
            is_completed = ${isCompleted ? 1 : 0},
            completed_at = ${completedAt ? `'${completedAt.toISOString()}'` : 'NULL'},
            notes = ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
            updated_at = '${updatedAt.toISOString()}'
          OUTPUT INSERTED.*
          WHERE user_id = ${userId} AND checklist_item_id = ${checklistItemId}
        `);
      } else {
        // Insert new record
        result = await pool.request().query(`
          INSERT INTO user_security_progress (user_id, checklist_item_id, is_completed, completed_at, notes, updated_at)
          OUTPUT INSERTED.*
          VALUES (
            ${userId}, 
            ${checklistItemId}, 
            ${isCompleted ? 1 : 0},
            ${completedAt ? `'${completedAt.toISOString()}'` : 'NULL'},
            ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
            '${updatedAt.toISOString()}'
          )
        `);
      }
      
      const progressRecord = result.recordset[0];
      return {
        id: progressRecord.id,
        userId: progressRecord.user_id,
        checklistItemId: progressRecord.checklist_item_id,
        isCompleted: Boolean(progressRecord.is_completed),
        completedAt: progressRecord.completed_at?.toISOString() || null,
        notes: progressRecord.notes || null,
        createdAt: progressRecord.created_at?.toISOString(),
        updatedAt: progressRecord.updated_at?.toISOString()
      };
    } catch (error) {
      console.error('Error updating user security progress in database:', error);
      throw error;
    }
  }

  async getUserSecurityProgressForItem(userId: number, checklistItemId: number): Promise<UserSecurityProgress | undefined> {
    const progress = await this.getUserSecurityProgress(userId);
    return progress.find(p => p.checklistItemId === checklistItemId);
  }

  // Additional stub methods to satisfy IStorage interface
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

  async updateLawyerRequestStatus(id: number, status: RequestStatus, lawyerProfileId?: number): Promise<LawyerRequest | undefined> {
    return undefined;
  }

  async addScamVideo(video: InsertScamVideo): Promise<ScamVideo> {
    throw new Error("Not implemented");
  }

  async getScamVideo(id: number): Promise<ScamVideo | undefined> {
    return undefined;
  }

  async getAllScamVideos(): Promise<ScamVideo[]> {
    return [];
  }

  async getFeaturedScamVideos(): Promise<ScamVideo[]> {
    return [];
  }

  // Password reset methods
  async createPasswordReset(userId: number, resetToken: string): Promise<PasswordReset> {
    console.log("=== AzureStorage.createPasswordReset called ===");
    console.log("UserId:", userId, "ResetToken:", resetToken);
    
    await this.ensureConnection();
    console.log("Database connection ensured");
    
    try {
      // Calculate expiration time (15 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      console.log("Expiration time calculated:", expiresAt);
      
      // First, invalidate any existing reset tokens for this user
      console.log("Invalidating existing reset tokens for user:", userId);
      await pool.request()
        .input('userId', sql.Int, userId)
        .query('UPDATE password_resets SET used = 1 WHERE user_id = @userId AND used = 0');
      console.log("Existing tokens invalidated");
      
      // Create new reset token
      console.log("Creating new password reset record...");
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('resetToken', sql.NVarChar, resetToken)
        .input('expiresAt', sql.DateTime2, expiresAt)
        .query(`
          INSERT INTO password_resets (user_id, reset_token, expires_at)
          OUTPUT INSERTED.*
          VALUES (@userId, @resetToken, @expiresAt)
        `);
      
      console.log("Insert query executed, result:", result);
      console.log("Recordset length:", result.recordset.length);
      
      const resetRecord = result.recordset[0];
      console.log("Reset record from database:", resetRecord);
      
      const passwordResetObject = {
        id: resetRecord.id,
        userId: resetRecord.user_id,
        resetToken: resetRecord.reset_token,
        expiresAt: resetRecord.expires_at.toISOString(),
        used: resetRecord.used,
        createdAt: resetRecord.created_at.toISOString()
      };
      
      console.log("Returning password reset object:", passwordResetObject);
      return passwordResetObject;
    } catch (error) {
      console.error('Error creating password reset:', error);
      throw error;
    }
  }

  async getPasswordReset(resetToken: string): Promise<PasswordReset | undefined> {
    await this.ensureConnection();
    
    try {
      const result = await pool.request()
        .input('resetToken', sql.NVarChar, resetToken)
        .query(`
          SELECT * FROM password_resets 
          WHERE reset_token = @resetToken AND used = 0 AND expires_at > GETDATE()
        `);
      
      if (result.recordset.length === 0) {
        return undefined;
      }
      
      const resetRecord = result.recordset[0];
      return {
        id: resetRecord.id,
        userId: resetRecord.user_id,
        resetToken: resetRecord.reset_token,
        expiresAt: resetRecord.expires_at.toISOString(),
        used: resetRecord.used,
        createdAt: resetRecord.created_at.toISOString()
      };
    } catch (error) {
      console.error('Error getting password reset:', error);
      throw error;
    }
  }

  async usePasswordReset(resetToken: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      const result = await pool.request()
        .input('resetToken', sql.NVarChar, resetToken)
        .query(`
          UPDATE password_resets 
          SET used = 1 
          WHERE reset_token = @resetToken AND used = 0 AND expires_at > GETDATE()
        `);
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error using password reset:', error);
      throw error;
    }
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('password', sql.NVarChar, newPassword)
        .query('UPDATE users SET password = @password WHERE id = @userId');
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  async updateUser(userId: number, updateData: any): Promise<User | undefined> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      
      // Build dynamic update query based on provided fields
      const updateFields = [];
      if (updateData.displayName !== undefined) {
        updateFields.push(`display_name = '${(updateData.displayName || '').replace(/'/g, "''")}'`);
      }
      if (updateData.beawareUsername !== undefined) {
        updateFields.push(`beaware_username = '${(updateData.beawareUsername || '').replace(/'/g, "''")}'`);
      }
      if (updateData.role !== undefined) {
        updateFields.push(`role = '${(updateData.role || 'user').replace(/'/g, "''")}'`);
      }
      
      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }
      
      const result = await request.query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        OUTPUT INSERTED.*
        WHERE id = ${userId}
      `);
      
      if (result.recordset.length === 0) {
        return undefined;
      }
      
      const dbUser = result.recordset[0];
      return {
        id: dbUser.id,
        email: dbUser.email,
        password: dbUser.password,
        displayName: dbUser.display_name,
        beawareUsername: dbUser.beaware_username,
        role: dbUser.role,
        authProvider: dbUser.auth_provider,
        googleId: dbUser.google_id,
        createdAt: dbUser.created_at
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async fixEmptyUsernames(): Promise<number> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      
      // Update users with null or empty beaware_username  
      const result = await request.query(`
        UPDATE users 
        SET beaware_username = CONCAT('user_', id) 
        WHERE beaware_username IS NULL OR beaware_username = '' OR LEN(LTRIM(RTRIM(beaware_username))) = 0
      `);
      
      console.log(`Fixed ${result.rowsAffected[0]} users with empty usernames`);
      return result.rowsAffected[0];
    } catch (error) {
      console.error('Error fixing empty usernames:', error);
      throw error;
    }
  }

  async removeUsernameUniqueConstraint(): Promise<void> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      
      // Try multiple approaches to find and drop the constraint
      try {
        // Method 1: Look for unique key constraints
        const constraintResult = await request.query(`
          SELECT kc.name 
          FROM sys.key_constraints kc
          INNER JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
          INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
          WHERE kc.type = 'UQ' 
          AND kc.parent_object_id = OBJECT_ID('users')
          AND c.name = 'beaware_username'
        `);
        
        if (constraintResult.recordset.length > 0) {
          const constraintName = constraintResult.recordset[0].name;
          console.log(`Found and dropping constraint: ${constraintName}`);
          await request.query(`ALTER TABLE users DROP CONSTRAINT ${constraintName}`);
          console.log('Successfully removed unique constraint on beaware_username');
          return;
        }
      } catch (error1) {
        console.log('Method 1 failed, trying method 2:', error1);
      }

      // Method 2: Look for unique indexes
      try {
        const indexResult = await request.query(`
          SELECT i.name 
          FROM sys.indexes i
          INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
          WHERE i.is_unique = 1 
          AND i.object_id = OBJECT_ID('users')
          AND c.name = 'beaware_username'
          AND i.name IS NOT NULL
        `);
        
        if (indexResult.recordset.length > 0) {
          const indexName = indexResult.recordset[0].name;
          console.log(`Found and dropping unique index: ${indexName}`);
          await request.query(`DROP INDEX ${indexName} ON users`);
          console.log('Successfully removed unique index on beaware_username');
          return;
        }
      } catch (error2) {
        console.log('Method 2 failed, trying method 3:', error2);
      }

      // Method 3: Try the known constraint name pattern
      try {
        await request.query(`ALTER TABLE users DROP CONSTRAINT UQ__users__71364CAB401C1DD1`);
        console.log('Successfully removed constraint using known name');
      } catch (error3) {
        console.log('Method 3 failed:', error3);
        console.log('No unique constraint found on beaware_username or already removed');
      }
    } catch (error) {
      console.error('Error removing username constraint:', error);
      throw error;
    }
  }

  generateUniqueUsername(): string {
    // Generate random username with adjective + animal + number (no async needed)
    const adjectives = ['brave', 'clever', 'swift', 'wise', 'bold', 'keen', 'bright', 'calm', 'kind', 'strong'];
    const animals = ['fox', 'eagle', 'wolf', 'bear', 'lion', 'owl', 'hawk', 'tiger', 'deer', 'dolphin'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const number = Math.floor(Math.random() * 1000);
    const timestamp = Date.now().toString().slice(-3); // Add timestamp suffix for uniqueness
    
    return `${adjective}_${animal}_${number}_${timestamp}`;
  }

  // API Configuration Methods - Using fallback until database table is created
  async getApiConfigs(): Promise<ApiConfig[]> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      
      // First, try to check if api_configs table exists
      const tableCheckResult = await request.query(`
        SELECT COUNT(*) as table_exists 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'api_configs'
      `);
      
      if (tableCheckResult.recordset[0].table_exists === 0) {
        console.log('api_configs table does not exist, returning empty array');
        return [];
      }
      
      const result = await request.query(`
        SELECT id, name, type, url, api_key as apiKey, enabled, description, 
               rate_limit as rateLimit, timeout,
               parameter_mapping as parameterMapping, headers,
               created_at as createdAt, updated_at as updatedAt
        FROM api_configs 
        ORDER BY name ASC
      `);
      
      return result.recordset.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        url: row.url,
        apiKey: row.apiKey,
        enabled: Boolean(row.enabled),
        description: row.description,
        rateLimit: row.rateLimit,
        timeout: row.timeout,
        parameterMapping: row.parameterMapping,
        headers: row.headers,
        createdAt: row.createdAt?.toISOString(),
        updatedAt: row.updatedAt?.toISOString()
      }));
    } catch (error) {
      console.error('Error fetching API configs:', error);
      return [];
    }
  }

  async getApiConfigByType(type: string): Promise<ApiConfig | undefined> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      
      // Check if table exists first
      const tableCheckResult = await request.query(`
        SELECT COUNT(*) as table_exists 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'api_configs'
      `);
      
      if (tableCheckResult.recordset[0].table_exists === 0) {
        console.log('api_configs table does not exist');
        return undefined;
      }
      
      const queryRequest = pool.request();
      queryRequest.input('type', sql.VarChar, type);
      
      const result = await queryRequest.query(`
        SELECT TOP 1 id, name, type, url, api_key as apiKey, enabled, description,
               rate_limit as rateLimit, timeout,
               parameter_mapping as parameterMapping, headers,
               created_at as createdAt, updated_at as updatedAt
        FROM api_configs 
        WHERE type = @type AND enabled = 1
        ORDER BY id DESC
      `);
      
      if (result.recordset.length === 0) {
        return undefined;
      }
      
      const row = result.recordset[0];
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        url: row.url,
        apiKey: row.apiKey,
        enabled: Boolean(row.enabled),
        description: row.description,
        rateLimit: row.rateLimit,
        timeout: row.timeout,
        parameterMapping: row.parameterMapping,
        headers: row.headers,
        createdAt: row.createdAt?.toISOString(),
        updatedAt: row.updatedAt?.toISOString()
      };
    } catch (error) {
      console.error('Error fetching API config by type:', error);
      return undefined;
    }
  }

  async createApiConfig(config: InsertApiConfig): Promise<ApiConfig> {
    try {
      await this.ensureConnection();
      
      // Insert the config directly into the existing table
      const insertRequest = pool.request();
      insertRequest.input('name', sql.VarChar, config.name);
      insertRequest.input('type', sql.VarChar, config.type);
      insertRequest.input('url', sql.VarChar, config.url);
      insertRequest.input('apiKey', sql.VarChar, config.apiKey);
      insertRequest.input('enabled', sql.Bit, config.enabled ?? true);
      insertRequest.input('description', sql.VarChar, config.description || null);
      insertRequest.input('rateLimit', sql.Int, config.rateLimit ?? 60);
      insertRequest.input('timeout', sql.Int, config.timeout ?? 30);
      insertRequest.input('parameterMapping', sql.VarChar, config.parameterMapping || null);
      insertRequest.input('headers', sql.VarChar, config.headers || null);
      
      const result = await insertRequest.query(`
        INSERT INTO api_configs (name, type, url, api_key, enabled, description, rate_limit, timeout, parameter_mapping, headers, created_at, updated_at)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.type, INSERTED.url, 
               INSERTED.api_key as apiKey, INSERTED.enabled, INSERTED.description,
               INSERTED.rate_limit as rateLimit, INSERTED.timeout,
               INSERTED.parameter_mapping as parameterMapping, INSERTED.headers,
               INSERTED.created_at as createdAt, INSERTED.updated_at as updatedAt
        VALUES (@name, @type, @url, @apiKey, @enabled, @description, @rateLimit, @timeout, @parameterMapping, @headers, GETDATE(), GETDATE())
      `);
      
      const row = result.recordset[0];
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        url: row.url,
        apiKey: row.apiKey,
        enabled: Boolean(row.enabled),
        description: row.description,
        rateLimit: row.rateLimit,
        timeout: row.timeout,
        parameterMapping: row.parameterMapping,
        headers: row.headers,
        createdAt: row.createdAt?.toISOString(),
        updatedAt: row.updatedAt?.toISOString()
      };
    } catch (error) {
      console.error('Error creating API config:', error);
      throw error;
    }
  }

  async updateApiConfig(id: number, updates: Partial<ApiConfig>): Promise<ApiConfig | undefined> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      
      const setClauses: string[] = [];
      if (updates.name !== undefined) {
        request.input('name', sql.VarChar, updates.name);
        setClauses.push('name = @name');
      }
      if (updates.type !== undefined) {
        request.input('type', sql.VarChar, updates.type);
        setClauses.push('type = @type');
      }
      if (updates.url !== undefined) {
        request.input('url', sql.VarChar, updates.url);
        setClauses.push('url = @url');
      }
      if (updates.apiKey !== undefined) {
        request.input('apiKey', sql.VarChar, updates.apiKey);
        setClauses.push('api_key = @apiKey');
      }
      if (updates.enabled !== undefined) {
        request.input('enabled', sql.Bit, updates.enabled);
        setClauses.push('enabled = @enabled');
      }
      if (updates.description !== undefined) {
        request.input('description', sql.VarChar, updates.description);
        setClauses.push('description = @description');
      }
      if (updates.rateLimit !== undefined) {
        request.input('rateLimit', sql.Int, updates.rateLimit);
        setClauses.push('rate_limit = @rateLimit');
      }
      if (updates.timeout !== undefined) {
        request.input('timeout', sql.Int, updates.timeout);
        setClauses.push('timeout = @timeout');
      }
      if (updates.parameterMapping !== undefined) {
        request.input('parameterMapping', sql.VarChar, updates.parameterMapping);
        setClauses.push('parameter_mapping = @parameterMapping');
      }
      if (updates.headers !== undefined) {
        request.input('headers', sql.VarChar, updates.headers);
        setClauses.push('headers = @headers');
      }
      
      if (setClauses.length === 0) {
        throw new Error('No updates provided');
      }
      
      setClauses.push('updated_at = GETDATE()');
      request.input('id', sql.Int, id);
      
      const result = await request.query(`
        UPDATE api_configs 
        SET ${setClauses.join(', ')}
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.type, INSERTED.url,
               INSERTED.api_key as apiKey, INSERTED.enabled, INSERTED.description,
               INSERTED.rate_limit as rateLimit, INSERTED.timeout,
               INSERTED.parameter_mapping as parameterMapping, INSERTED.headers,
               INSERTED.created_at as createdAt, INSERTED.updated_at as updatedAt
        WHERE id = @id
      `);
      
      if (result.recordset.length === 0) {
        return undefined;
      }
      
      const row = result.recordset[0];
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        url: row.url,
        apiKey: row.apiKey,
        enabled: Boolean(row.enabled),
        description: row.description,
        rateLimit: row.rateLimit,
        timeout: row.timeout,
        parameterMapping: row.parameterMapping,
        headers: row.headers,
        createdAt: row.createdAt?.toISOString(),
        updatedAt: row.updatedAt?.toISOString()
      };
    } catch (error) {
      console.error('Error updating API config:', error);
      return undefined;
    }
  }

  async deleteApiConfig(id: number): Promise<boolean> {
    try {
      await this.ensureConnection();
      const request = pool.request();
      request.input('id', sql.Int, id);
      
      const result = await request.query(`
        DELETE FROM api_configs WHERE id = @id
      `);
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error deleting API config:', error);
      return false;
    }
  }

}