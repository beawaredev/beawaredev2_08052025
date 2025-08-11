import sql from 'mssql';
import { pool } from './db.js';
// Azure SQL Database Storage Implementation
export class AzureStorage {
    async ensureConnection() {
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
        }
        catch (error) {
            console.error('Failed to connect to Azure SQL Database:', error);
            // Reset pool on failure
            try {
                if (pool && !pool.connected) {
                    await pool.close();
                }
            }
            catch (closeError) {
                console.error('Error closing failed connection:', closeError);
            }
            throw new Error('Database connection failed. Please check your Azure SQL Database configuration.');
        }
    }
    // User methods
    async getUser(id) {
        try {
            if (!id || isNaN(id)) {
                console.log('Invalid user ID provided:', id);
                return undefined;
            }
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`SELECT * FROM users WHERE id = ${id}`);
            const dbUser = result.recordset[0];
            if (!dbUser)
                return undefined;
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
        }
        catch (error) {
            console.error('Error getting user:', error);
            return undefined;
        }
    }
    async getUserByEmail(email) {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`SELECT * FROM users WHERE email = '${email.replace(/'/g, "''")}'`);
            const dbUser = result.recordset[0];
            if (!dbUser)
                return undefined;
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
        }
        catch (error) {
            console.error('Error getting user by email:', error);
            return undefined;
        }
    }
    async getUserByGoogleId(googleId) {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`SELECT * FROM users WHERE google_id = '${googleId.replace(/'/g, "''")}'`);
            const dbUser = result.recordset[0];
            if (!dbUser)
                return undefined;
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
        }
        catch (error) {
            console.error('Error getting user by Google ID:', error);
            return undefined;
        }
    }
    async getUserByBeawareUsername(username) {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`SELECT * FROM users WHERE beaware_username = '${username.replace(/'/g, "''")}'`);
            const dbUser = result.recordset[0];
            if (!dbUser)
                return undefined;
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
        }
        catch (error) {
            console.error('Error getting user by username:', error);
            return undefined;
        }
    }
    async createUser(userData) {
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
          '${(userData.beawareUsername || '').replace(/'/g, "''")}',
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
        }
        catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
    async getAllUsers() {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query('SELECT * FROM users ORDER BY created_at DESC');
            return result.recordset;
        }
        catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }
    // Scam report methods
    async createScamReport(reportData) {
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
        }
        catch (error) {
            console.error('Error creating scam report:', error);
            console.error('Report data received:', JSON.stringify(reportData, null, 2));
            throw error;
        }
    }
    async getScamReport(id) {
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
        }
        catch (error) {
            console.error('Error getting scam report:', error);
            return undefined;
        }
    }
    async getAllScamReports(page = 1, limit = 50) {
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
        }
        catch (error) {
            console.error('Error getting all scam reports:', error);
            return [];
        }
    }
    async getRecentScamReports(limit, includeUnpublished = false) {
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
        }
        catch (error) {
            console.error('Error getting recent scam reports:', error);
            return [];
        }
    }
    async getUnverifiedScamReports(page = 1, limit = 50) {
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
        }
        catch (error) {
            console.error('Error getting unverified scam reports:', error);
            return [];
        }
    }
    async getVerifiedScamReports(page = 1, limit = 50) {
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
        }
        catch (error) {
            console.error('Error getting verified scam reports:', error);
            return [];
        }
    }
    async getPublishedScamReports(page = 1, limit = 50) {
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
        }
        catch (error) {
            console.error('Error getting published scam reports:', error);
            return [];
        }
    }
    async getTotalScamReportsCount() {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`SELECT COUNT(*) as total FROM scam_reports`);
            return result.recordset[0].total;
        }
        catch (error) {
            console.error('Error getting total scam reports count:', error);
            return 0;
        }
    }
    async getPublishedScamReportsCount() {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`SELECT COUNT(*) as total FROM scam_reports WHERE is_published = CAST(1 AS BIT)`);
            return result.recordset[0].total;
        }
        catch (error) {
            console.error('Error getting published scam reports count:', error);
            return 0;
        }
    }
    async getVerifiedScamReportsCount() {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`SELECT COUNT(*) as total FROM scam_reports WHERE is_verified = CAST(1 AS BIT)`);
            return result.recordset[0].total;
        }
        catch (error) {
            console.error('Error getting verified scam reports count:', error);
            return 0;
        }
    }
    async getUnverifiedScamReportsCount() {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`SELECT COUNT(*) as total FROM scam_reports WHERE is_verified = CAST(0 AS BIT)`);
            return result.recordset[0].total;
        }
        catch (error) {
            console.error('Error getting unverified scam reports count:', error);
            return 0;
        }
    }
    async getUnpublishedScamReports(page = 1, limit = 50) {
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
        }
        catch (error) {
            console.error('Error getting unpublished scam reports:', error);
            return [];
        }
    }
    async getConsolidationForScamReport(scamReportId) {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`
        SELECT * FROM scam_report_consolidations 
        WHERE scam_report_id = ${scamReportId}
      `);
            return result.recordset[0] || null;
        }
        catch (error) {
            console.error('Error getting consolidation for scam report:', error);
            return null;
        }
    }
    async getScamReportsByUser(userId) {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`SELECT * FROM scam_reports WHERE user_id = ${userId} ORDER BY reported_at DESC`);
            return result.recordset;
        }
        catch (error) {
            console.error('Error getting scam reports by user:', error);
            return [];
        }
    }
    async getScamReportsByType(type) {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`SELECT * FROM scam_reports WHERE scam_type = '${type.replace(/'/g, "''")}' ORDER BY reported_at DESC`);
            return result.recordset;
        }
        catch (error) {
            console.error('Error getting scam reports by type:', error);
            return [];
        }
    }
    async verifyScamReport(id, verifiedBy) {
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
            if (!dbReport)
                return undefined;
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
        }
        catch (error) {
            console.error('Error verifying scam report:', error);
            return undefined;
        }
    }
    async publishScamReport(id, publishedBy) {
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
            if (!dbReport)
                return undefined;
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
        }
        catch (error) {
            console.error('Error publishing scam report:', error);
            return undefined;
        }
    }
    async unpublishScamReport(id, unpublishedBy) {
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
        }
        catch (error) {
            console.error('Error unpublishing scam report:', error);
            return undefined;
        }
    }
    // Comment methods
    async createScamComment(commentData) {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`
        INSERT INTO scam_comments (scam_report_id, user_id, comment)
        OUTPUT INSERTED.*
        VALUES (${commentData.scamReportId}, ${commentData.userId}, '${commentData.comment.replace(/'/g, "''")}')
      `);
            return result.recordset[0];
        }
        catch (error) {
            console.error('Error creating scam comment:', error);
            throw error;
        }
    }
    async getCommentsForScamReport(reportId) {
        try {
            await this.ensureConnection();
            const request = pool.request();
            const result = await request.query(`SELECT * FROM scam_comments WHERE scam_report_id = ${reportId} ORDER BY created_at ASC`);
            return result.recordset;
        }
        catch (error) {
            console.error('Error getting comments for scam report:', error);
            return [];
        }
    }
    // Stats and other methods
    async getScamStats() {
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
        }
        catch (error) {
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
    async updateScamReportVerification(id, isVerified, verifiedBy) {
        return isVerified ? this.verifyScamReport(id, verifiedBy) : undefined;
    }
    async toggleScamReportPublished(id, isPublished, publishedBy) {
        return isPublished ? this.publishScamReport(id, publishedBy) : undefined;
    }
    async addScamComment(comment) {
        return this.createScamComment(comment);
    }
    async getScamComments(scamReportId) {
        return this.getCommentsForScamReport(scamReportId);
    }
    // Security Checklist Methods - Essential for Digital Security Checklist page
    async getAllSecurityChecklistItems() {
        // Return hardcoded security checklist items for now
        // In a real implementation, this would query the Azure SQL database
        return [
            {
                id: 1,
                title: "Freeze Your Credit Reports",
                description: "Place security freezes on your credit reports at all three major credit bureaus",
                category: "financial_security",
                priority: "high",
                recommendationText: "Contact Equifax, Experian, and TransUnion to place free security freezes on your credit reports. This prevents new accounts from being opened in your name.",
                helpUrl: "https://www.consumer.ftc.gov/articles/0497-credit-freeze-faqs",
                estimatedTimeMinutes: 45,
                sortOrder: 1
            },
            {
                id: 2,
                title: "Enable Two-Factor Authentication",
                description: "Secure your most important accounts with 2FA",
                category: "account_security",
                priority: "high",
                recommendationText: "Set up 2FA on your email, banking, and social media accounts using an authenticator app like Google Authenticator or Authy.",
                helpUrl: "https://authy.com/what-is-2fa/",
                estimatedTimeMinutes: 15,
                sortOrder: 2
            },
            {
                id: 3,
                title: "Use a Password Manager",
                description: "Generate and store strong, unique passwords",
                category: "password_security",
                priority: "high",
                recommendationText: "Install a reputable password manager like Bitwarden, 1Password, or LastPass to create unique passwords for every account.",
                helpUrl: "https://bitwarden.com/help/getting-started-webvault/",
                estimatedTimeMinutes: 30,
                sortOrder: 3
            },
            {
                id: 4,
                title: "Review Bank and Credit Card Statements",
                description: "Monitor your financial accounts for unauthorized transactions",
                category: "financial_security",
                priority: "high",
                recommendationText: "Check your bank and credit card statements weekly for suspicious activity. Set up account alerts for transactions over a certain amount.",
                helpUrl: "https://www.consumer.ftc.gov/articles/0213-lost-or-stolen-credit-atm-and-debit-cards",
                estimatedTimeMinutes: 20,
                sortOrder: 4
            },
            {
                id: 5,
                title: "Update Software and Operating Systems",
                description: "Keep your devices secure with the latest updates",
                category: "device_security",
                priority: "medium",
                recommendationText: "Enable automatic updates for your operating system, web browsers, and important software to protect against security vulnerabilities.",
                helpUrl: "https://www.cisa.gov/tips/st04-006",
                estimatedTimeMinutes: 10,
                sortOrder: 5
            },
            {
                id: 6,
                title: "Secure Your Wi-Fi Network",
                description: "Protect your home internet connection",
                category: "network_security",
                priority: "medium",
                recommendationText: "Use WPA3 encryption, change default router passwords, and regularly update router firmware.",
                helpUrl: "https://www.fcc.gov/consumers/guides/how-protect-yourself-online",
                estimatedTimeMinutes: 25,
                sortOrder: 6
            },
            {
                id: 7,
                title: "Be Cautious with Public Wi-Fi",
                description: "Protect your data on public networks",
                category: "network_security",
                priority: "medium",
                recommendationText: "Avoid accessing sensitive information on public Wi-Fi. Use a VPN when necessary and ensure websites use HTTPS.",
                helpUrl: "https://www.cisa.gov/tips/st05-017",
                estimatedTimeMinutes: 5,
                sortOrder: 7
            },
            {
                id: 8,
                title: "Review Privacy Settings on Social Media",
                description: "Control what information you share online",
                category: "privacy_settings",
                priority: "medium",
                recommendationText: "Regularly review and update privacy settings on social media platforms to limit who can see your personal information.",
                helpUrl: "https://www.ftc.gov/tips-advice/business-center/privacy-and-security/social-media",
                estimatedTimeMinutes: 30,
                sortOrder: 8
            },
            {
                id: 9,
                title: "Use Secure Email Practices",
                description: "Protect yourself from email-based threats",
                category: "communication_security",
                priority: "medium",
                recommendationText: "Be suspicious of unexpected emails, verify sender identity, and never click links or download attachments from unknown sources.",
                helpUrl: "https://www.cisa.gov/tips/st04-014",
                estimatedTimeMinutes: 10,
                sortOrder: 9
            },
            {
                id: 10,
                title: "Backup Important Data",
                description: "Protect your data from loss or ransomware",
                category: "data_protection",
                priority: "high",
                recommendationText: "Regularly backup important files to multiple locations including cloud storage and external drives using the 3-2-1 backup rule.",
                helpUrl: "https://www.cisa.gov/tips/st05-012",
                estimatedTimeMinutes: 60,
                sortOrder: 10
            },
            {
                id: 11,
                title: "Install Antivirus Software",
                description: "Protect your devices from malware",
                category: "device_security",
                priority: "medium",
                recommendationText: "Install reputable antivirus software and keep it updated. Enable real-time protection and regular system scans.",
                helpUrl: "https://www.cisa.gov/tips/st04-005",
                estimatedTimeMinutes: 20,
                sortOrder: 11
            },
            {
                id: 12,
                title: "Monitor Your Credit Reports",
                description: "Watch for signs of identity theft",
                category: "financial_security",
                priority: "high",
                recommendationText: "Check your credit reports from all three bureaus annually at annualcreditreport.com and dispute any errors immediately.",
                helpUrl: "https://www.annualcreditreport.com/",
                estimatedTimeMinutes: 30,
                sortOrder: 12
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
                sortOrder: 13
            }
        ];
    }
    async getSecurityChecklistItem(id) {
        const items = await this.getAllSecurityChecklistItems();
        return items.find(item => item.id === id);
    }
    async createSecurityChecklistItem(item) {
        // This would normally insert into database and return the created item
        // For now, return a mock item with an ID
        return {
            id: Date.now(),
            ...item
        };
    }
    async getUserSecurityProgress(userId) {
        // In localStorage implementation, this would return empty for new users
        // Database implementation would query user_security_progress table
        return [];
    }
    async updateUserSecurityProgress(userId, checklistItemId, isCompleted, notes) {
        // This would update the database and return the updated progress
        // For now, return a mock progress item
        return {
            id: Date.now(),
            userId,
            checklistItemId,
            isCompleted,
            notes: notes || null,
            completedAt: isCompleted ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString()
        };
    }
    async getUserSecurityProgressForItem(userId, checklistItemId) {
        const progress = await this.getUserSecurityProgress(userId);
        return progress.find(p => p.checklistItemId === checklistItemId);
    }
    // Additional stub methods to satisfy IStorage interface
    async getConsolidatedScam(id) {
        return undefined;
    }
    async getConsolidatedScamByIdentifier(identifier) {
        return undefined;
    }
    async getAllConsolidatedScams() {
        return [];
    }
    async searchConsolidatedScams(query) {
        return [];
    }
    async createLawyerProfile(profile) {
        throw new Error("Not implemented");
    }
    async getLawyerProfile(id) {
        return undefined;
    }
    async getLawyerProfileByUserId(userId) {
        return undefined;
    }
    async getAllLawyerProfiles() {
        return [];
    }
    async createLawyerRequest(request) {
        throw new Error("Not implemented");
    }
    async getLawyerRequest(id) {
        return undefined;
    }
    async getLawyerRequestsByUser(userId) {
        return [];
    }
    async updateLawyerRequestStatus(id, status, lawyerProfileId) {
        return undefined;
    }
    async addScamVideo(video) {
        throw new Error("Not implemented");
    }
    async getScamVideo(id) {
        return undefined;
    }
    async getAllScamVideos() {
        return [];
    }
    async getFeaturedScamVideos() {
        return [];
    }
    // Password reset methods
    async createPasswordReset(userId, resetToken) {
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
        }
        catch (error) {
            console.error('Error creating password reset:', error);
            throw error;
        }
    }
    async getPasswordReset(resetToken) {
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
        }
        catch (error) {
            console.error('Error getting password reset:', error);
            throw error;
        }
    }
    async usePasswordReset(resetToken) {
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
        }
        catch (error) {
            console.error('Error using password reset:', error);
            throw error;
        }
    }
    async updateUserPassword(userId, newPassword) {
        await this.ensureConnection();
        try {
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .input('password', sql.NVarChar, newPassword)
                .query('UPDATE users SET password = @password WHERE id = @userId');
            return result.rowsAffected[0] > 0;
        }
        catch (error) {
            console.error('Error updating user password:', error);
            throw error;
        }
    }
}
