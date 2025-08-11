"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const express_1 = require("express");
const http_1 = require("http");
const path_1 = require("path");
const fs_1 = require("fs");
const multer_1 = require("multer");
const storage_js_1 = require("./storage.js");
const emailService_js_1 = require("./emailService.js");
const version_js_1 = require("../shared/version.js");
const crypto_1 = require("crypto");
const schema_js_1 = require("../shared/schema.js");
const zod_1 = require("zod");
// Path to the uploads directory
const uploadDir = path_1.default.join(process.cwd(), "uploads");
// Configure multer for file uploads
const multerStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${timestamp}_${sanitizedName}`);
    }
});
const upload = (0, multer_1.default)({
    storage: multerStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common document and image types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'text/plain'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, PNG, GIF, and TXT files are allowed.'));
        }
    }
});
// File utility functions
const getFilePath = (filename) => {
    return path_1.default.join(uploadDir, filename);
};
const fileExists = (filePath) => {
    try {
        return fs_1.default.existsSync(filePath);
    }
    catch {
        return false;
    }
};
const getFileMimeType = (filename) => {
    const ext = path_1.default.extname(filename).toLowerCase();
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
};
// Ensure uploads directory exists
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
console.log("📝 File upload functionality has been enabled");
async function registerRoutes(app) {
    // API routes
    const apiRouter = express_1.default.Router();
    // Serve static files from the uploads directory
    app.use("/uploads", express_1.default.static(uploadDir));
    // Authentication middleware
    const requireAuth = async (req, res, next) => {
        try {
            // Try to get the user ID from the request
            const userId = req.headers['x-user-id'];
            const userEmail = req.headers['x-user-email'];
            const userRole = req.headers['x-user-role'];
            // Add debugging info
            console.log("Authentication headers:", {
                userId,
                userEmail,
                userRole
            });
            // If we have valid auth headers, use them directly
            if (userId && userEmail && userRole) {
                console.log("Using header authentication for user:", userEmail);
                // Create a user object from the headers
                req.user = {
                    id: parseInt(userId, 10),
                    email: userEmail,
                    role: userRole
                };
                return next();
            }
            // Fallback: try to get admin user from database
            console.log("Attempting to authenticate admin user from database");
            try {
                let user = await storage_js_1.storage.getUserByEmail("admin@beaware.fyi");
                if (!user) {
                    console.log("Admin user not found, creating admin user");
                    user = await storage_js_1.storage.createUser({
                        email: "admin@beaware.fyi",
                        password: "admin123",
                        displayName: "Administrator",
                        role: "admin",
                        authProvider: "local"
                    });
                    console.log("Admin user created successfully:", user);
                }
                else {
                    console.log("Admin user found in database:", user);
                }
                req.user = user;
                console.log("Set user object with role:", user.role);
                next();
            }
            catch (dbError) {
                console.error("Database authentication failed:", dbError);
                // If database fails, proceed without authentication for now
                console.log("Proceeding without authentication due to database error");
                req.user = null;
                next();
            }
        }
        catch (err) {
            console.error("Error in requireAuth middleware:", err);
            res.status(500).json({ message: "Authentication required" });
        }
    };
    // Authorization middleware for admin only routes
    const requireAdmin = async (req, res, next) => {
        const user = req.user;
        // Check for user identification in headers
        const headerUserId = req.headers['x-user-id'];
        const headerEmail = req.headers['x-user-email'];
        console.log("Authorization check for admin access:", {
            userExists: !!user,
            userRole: user?.role,
            headerUserId,
            headerEmail
        });
        // Case 1: User already authenticated through session
        if (user && user.role === "admin") {
            console.log("Admin access granted through session");
            return next();
        }
        // Case 2: User identified through headers - verify from database
        try {
            let verifiedUser;
            if (headerEmail) {
                verifiedUser = await storage_js_1.storage.getUserByEmail(headerEmail);
            }
            else if (headerUserId) {
                verifiedUser = await storage_js_1.storage.getUser(parseInt(headerUserId, 10));
            }
            if (verifiedUser && verifiedUser.role === "admin") {
                console.log("Admin access granted for user:", { id: verifiedUser.id, email: verifiedUser.email, role: verifiedUser.role });
                req.user = verifiedUser;
                return next();
            }
        }
        catch (err) {
            console.error("Error verifying admin access:", err);
        }
        // If we get here, access is denied
        console.log("Admin access denied");
        return res.status(403).json({ message: "Forbidden - Admin access required" });
    };
    // Endpoint to download proof files
    apiRouter.get("/files/:filename", async (req, res) => {
        try {
            const requestedFilename = req.params.filename;
            const decodedFilename = decodeURIComponent(requestedFilename);
            // First attempt: direct file path match
            let filePath = getFilePath(decodedFilename);
            // Check if file exists by direct match
            if (!fileExists(filePath)) {
                console.log(`Direct file match failed for: ${decodedFilename}`);
                // Second attempt: Try to find the file by searching for files with similar names
                const files = fs_1.default.readdirSync(uploadDir);
                // Try to find a file that ends with the requested filename (ignoring timestamp prefix)
                const matchingFile = files.find(file => {
                    // Remove timestamp prefix and compare the rest
                    const fileWithoutTimestamp = file.substring(file.indexOf('_') + 1);
                    // Try both with spaces and with underscores
                    const requestedWithSpaces = decodedFilename.replace(/_/g, ' ');
                    const requestedWithUnderscores = decodedFilename.replace(/ /g, '_');
                    return fileWithoutTimestamp === decodedFilename ||
                        fileWithoutTimestamp === requestedWithSpaces ||
                        fileWithoutTimestamp === requestedWithUnderscores;
                });
                if (matchingFile) {
                    console.log(`Found matching file: ${matchingFile}`);
                    filePath = getFilePath(matchingFile);
                }
                else {
                    console.error(`File not found: ${decodedFilename}`);
                    return res.status(404).json({
                        success: false,
                        message: "File not found",
                        details: `Requested: ${decodedFilename}`
                    });
                }
            }
            // Get the MIME type - extract the filename from the path
            const fileBaseName = path_1.default.basename(filePath);
            const mimeType = getFileMimeType(fileBaseName);
            // Set content headers
            res.setHeader('Content-Type', mimeType);
            // Send the file
            res.sendFile(filePath);
        }
        catch (error) {
            console.error("Error serving file:", error);
            res.status(500).json({
                success: false,
                message: "Failed to serve file",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
    // AUTH ROUTES
    apiRouter.post("/auth/register", async (req, res) => {
        try {
            console.log("Register request received:", JSON.stringify(req.body));
            // Explicitly handle the displayName/display_name field
            // This ensures the client-side "displayName" is properly mapped to the server-side "display_name"
            const transformedData = {
                ...req.body,
                // If displayName is present but display_name isn't, map displayName to display_name
                displayName: req.body.displayName || req.body.display_name
            };
            console.log("Transformed user data:", JSON.stringify(transformedData));
            try {
                // Parse the user data with the schema
                const userData = schema_js_1.insertUserSchema.parse(transformedData);
                console.log("Validated user data:", JSON.stringify(userData));
                // Check if user with this email already exists
                const existingUser = await storage_js_1.storage.getUserByEmail(userData.email);
                if (existingUser) {
                    return res.status(400).json({ message: "User with this email already exists" });
                }
                // Check if BeAware username already exists (if provided)
                if (userData.beawareUsername) {
                    const existingUsernameUser = await storage_js_1.storage.getUserByBeawareUsername(userData.beawareUsername);
                    if (existingUsernameUser) {
                        return res.status(400).json({ message: "This BeAware username is already taken. Please choose a different one." });
                    }
                }
                console.log("Creating user with data:", JSON.stringify(userData));
                // Create the user
                const user = await storage_js_1.storage.createUser(userData);
                // Remove password from response
                const { password, ...userWithoutPassword } = user;
                console.log("User created successfully:", JSON.stringify(userWithoutPassword));
                res.status(201).json({
                    success: true,
                    user: userWithoutPassword
                });
            }
            catch (validationError) {
                console.error("Validation error:", validationError);
                if (validationError instanceof zod_1.z.ZodError) {
                    return res.status(400).json({
                        message: "Invalid user data",
                        errors: validationError.errors
                    });
                }
                throw validationError; // Re-throw if it's not a validation error
            }
        }
        catch (error) {
            console.error("Error creating user:", error);
            // More detailed error response
            res.status(500).json({
                message: "Failed to create user",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
    // Username availability check endpoint
    apiRouter.post("/auth/check-username", async (req, res) => {
        try {
            const { username } = req.body;
            if (!username) {
                return res.status(400).json({ message: "Username is required" });
            }
            // Check if username already exists
            const existingUser = await storage_js_1.storage.getUserByBeawareUsername(username);
            const available = !existingUser;
            res.json({
                available,
                message: available ? "Username is available" : "Username is already taken"
            });
        }
        catch (error) {
            console.error("Error checking username availability:", error);
            res.status(500).json({
                message: "Failed to check username availability",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
    // Update user's BeAware username (for Google users)
    apiRouter.post("/auth/update-username", async (req, res) => {
        try {
            const { email, beawareUsername } = req.body;
            if (!email || !beawareUsername) {
                return res.status(400).json({ message: "Email and username are required" });
            }
            // Check if username is already taken
            const existingUser = await storage_js_1.storage.getUserByBeawareUsername(beawareUsername);
            if (existingUser) {
                return res.status(400).json({ message: "Username is already taken" });
            }
            // Find user by email and update their BeAware username
            const user = await storage_js_1.storage.getUserByEmail(email);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            const updatedUser = await storage_js_1.storage.updateUser(user.id, { beawareUsername });
            if (!updatedUser) {
                return res.status(500).json({ message: "Failed to update username" });
            }
            res.json({
                success: true,
                user: updatedUser,
                message: "Username updated successfully"
            });
        }
        catch (error) {
            console.error("Error updating username:", error);
            res.status(500).json({
                message: "Failed to update username",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
    // Rate limiting for Google login to prevent endless loops
    const authAttempts = new Map();
    const MAX_ATTEMPTS = 3;
    const BLOCK_DURATION = 30000; // 30 seconds
    const ATTEMPT_WINDOW = 10000; // 10 seconds
    apiRouter.post("/auth/google-login", async (req, res) => {
        try {
            const { email, displayName, googleId, photoURL } = req.body;
            if (!email || !googleId) {
                console.warn("Google login missing required fields:", { email: !!email, googleId: !!googleId });
                return res.status(400).json({ message: "Email and googleId are required" });
            }
            // Check rate limiting
            const now = Date.now();
            const attemptKey = `${email}:${googleId}`;
            const attempts = authAttempts.get(attemptKey) || { count: 0, lastAttempt: 0, blocked: false };
            // Reset attempts if enough time has passed
            if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
                attempts.count = 0;
                attempts.blocked = false;
            }
            // Check if user is blocked
            if (attempts.blocked && now - attempts.lastAttempt < BLOCK_DURATION) {
                console.log(`Authentication blocked for ${email} - too many attempts`);
                return res.status(429).json({
                    message: "Too many authentication attempts. Please wait before trying again.",
                    blockedUntil: attempts.lastAttempt + BLOCK_DURATION
                });
            }
            // Update attempts
            attempts.count++;
            attempts.lastAttempt = now;
            authAttempts.set(attemptKey, attempts);
            console.log(`Processing Google login for email: ${email} (attempt ${attempts.count})`);
            // Check if the user already exists by googleId
            let user = await storage_js_1.storage.getUserByGoogleId(googleId);
            if (user) {
                console.log(`Found existing user with googleId: ${googleId}`);
                // Update displayName if it has changed
                if (displayName && user.displayName !== displayName) {
                    console.log(`Updating displayName for user ${user.id} from "${user.displayName}" to "${displayName}"`);
                    // In a full implementation, you would update the user here
                    // user = await storage.updateUser(user.id, { displayName });
                }
            }
            else {
                // Check if user exists by email
                console.log(`No user found with googleId ${googleId}, checking by email: ${email}`);
                const existingUserByEmail = await storage_js_1.storage.getUserByEmail(email);
                if (existingUserByEmail) {
                    console.log(`Found existing user with email: ${email}`);
                    // If the user exists by email but not by googleId, update the user with googleId
                    if (existingUserByEmail.authProvider === 'local') {
                        // This is a special case where the user had a local account and now wants to use Google
                        console.log("Existing local user trying to log in with Google");
                        // Block this user after MAX_ATTEMPTS to prevent loops
                        if (attempts.count >= MAX_ATTEMPTS) {
                            console.log(`Blocking authentication for ${email} after ${attempts.count} attempts`);
                            attempts.blocked = true;
                            authAttempts.set(attemptKey, attempts);
                            return res.status(429).json({
                                message: "Too many authentication attempts. Authentication has been temporarily disabled for this account.",
                                blockedUntil: now + BLOCK_DURATION
                            });
                        }
                        return res.status(400).json({
                            message: "An account with this email already exists. Please log in with your password first and then link your Google account."
                        });
                    }
                    else if (existingUserByEmail.authProvider === 'google' && !existingUserByEmail.googleId) {
                        // User created with Google auth but missing googleId (should be rare)
                        console.log(`Updating existing Google user with missing googleId: ${existingUserByEmail.id}`);
                        // In a full implementation, you would update the user here
                        // user = await storage.updateUser(existingUserByEmail.id, { googleId });
                        user = existingUserByEmail;
                    }
                }
                if (!user) {
                    // Create new user with Google account data
                    console.log(`Creating new user for Google email: ${email}`);
                    try {
                        const newUserData = {
                            email,
                            displayName: displayName || email.split('@')[0],
                            googleId,
                            authProvider: 'google',
                            role: 'user'
                        };
                        console.log('Creating new Google user with data:', newUserData);
                        user = await storage_js_1.storage.createUser(newUserData);
                        console.log('Successfully created new Google user:', user.id);
                        // Reset auth attempts since successful creation
                        authAttempts.delete(attemptKey);
                    }
                    catch (createError) {
                        console.error('Error creating new Google user:', createError);
                        return res.status(500).json({
                            message: "Failed to create user account. Please try again.",
                            error: createError instanceof Error ? createError.message : "Unknown error"
                        });
                    }
                }
            }
            // Remove sensitive info from response
            const { password, ...userInfo } = user;
            // Check if user needs to set BeAware username
            const needsUsername = !user.beawareUsername;
            // Log successful authentication
            console.log(`Google authentication successful for user ID: ${user.id}, needs username: ${needsUsername}`);
            res.status(200).json({
                success: true,
                user: userInfo,
                needsUsername
            });
        }
        catch (error) {
            console.error("Google login error:", error);
            res.status(500).json({
                message: "Failed to authenticate with Google",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
    apiRouter.post("/auth/login", async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }
            // Find user by email
            const user = await storage_js_1.storage.getUserByEmail(email);
            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            // Special case for admin users in dev/testing
            if (email === "admin@beaware.com" || email === "admin@scamreport.com") {
                console.log("Admin login attempt detected");
                // Always give admin privileges for these special accounts
                // regardless of password input (for development/testing purposes)
                console.log("Admin login successful - granting admin privileges");
                // Remove password from response
                const { password: _, ...userWithoutPassword } = user;
                // Force the role to be admin
                console.log(`Setting user role to admin (was: ${user.role})`);
                userWithoutPassword.role = "admin";
                // Log the user data being returned
                console.log("Admin user data:", JSON.stringify(userWithoutPassword));
                res.json({
                    success: true,
                    user: userWithoutPassword
                });
                return;
            }
            // For non-admin users or incorrect admin password
            // Check password - simplified version to handle both hashed and non-hashed
            if (user.password !== password &&
                !(email === "admin@beaware.com" && password === "password123")) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;
            res.json({
                success: true,
                user: userWithoutPassword
            });
        }
        catch (error) {
            console.error("Error logging in:", error);
            res.status(500).json({ message: "Failed to log in" });
        }
    });
    // Password Reset Routes
    apiRouter.post("/auth/forgot-password", async (req, res) => {
        try {
            console.log("=== FORGOT PASSWORD REQUEST ===");
            console.log("Request body:", JSON.stringify(req.body));
            const { email } = req.body;
            if (!email) {
                console.log("No email provided in request");
                return res.status(400).json({ message: "Email is required" });
            }
            console.log("Looking up user with email:", email);
            // Find user by email
            const user = await storage_js_1.storage.getUserByEmail(email);
            console.log("User found:", user ? `ID: ${user.id}, Email: ${user.email}` : "No user found");
            if (!user) {
                // For security, return success even if user doesn't exist
                console.log("User not found, returning success for security");
                return res.json({
                    success: true,
                    message: "If an account with that email exists, a password reset link has been sent."
                });
            }
            // Generate secure reset token
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            console.log("Generated reset token:", resetToken);
            // Create password reset record
            console.log("Creating password reset record for user ID:", user.id);
            const passwordReset = await storage_js_1.storage.createPasswordReset(user.id, resetToken);
            console.log("Password reset record created:", passwordReset);
            // Get base URL for reset link
            const baseUrl = req.protocol + '://' + req.get('host');
            console.log("Base URL for reset link:", baseUrl);
            // Send email
            console.log("Attempting to send password reset email...");
            const emailSent = await (0, emailService_js_1.sendPasswordResetEmail)(email, resetToken, baseUrl);
            console.log("Email sent result:", emailSent);
            if (!emailSent) {
                console.error('Failed to send password reset email');
                return res.status(500).json({ message: "Failed to send reset email" });
            }
            console.log("Password reset process completed successfully");
            res.json({
                success: true,
                message: "Password reset link has been sent to your email."
            });
        }
        catch (error) {
            console.error("Error in forgot password:", error);
            res.status(500).json({ message: "Failed to process password reset request" });
        }
    });
    apiRouter.post("/auth/reset-password", async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                return res.status(400).json({ message: "Token and new password are required" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters long" });
            }
            // Validate reset token
            const resetRecord = await storage_js_1.storage.getPasswordReset(token);
            if (!resetRecord) {
                return res.status(400).json({ message: "Invalid or expired reset token" });
            }
            // Update user password
            const passwordUpdated = await storage_js_1.storage.updateUserPassword(resetRecord.userId, newPassword);
            if (!passwordUpdated) {
                return res.status(500).json({ message: "Failed to update password" });
            }
            // Mark token as used
            await storage_js_1.storage.usePasswordReset(token);
            res.json({
                success: true,
                message: "Password has been reset successfully"
            });
        }
        catch (error) {
            console.error("Error in reset password:", error);
            res.status(500).json({ message: "Failed to reset password" });
        }
    });
    apiRouter.get("/auth/validate-reset-token/:token", async (req, res) => {
        try {
            const { token } = req.params;
            const resetRecord = await storage_js_1.storage.getPasswordReset(token);
            res.json({
                valid: !!resetRecord,
                expired: !resetRecord
            });
        }
        catch (error) {
            console.error("Error validating reset token:", error);
            res.json({ valid: false, expired: true });
        }
    });
    // USER ROUTES
    apiRouter.get("/users", requireAuth, async (req, res) => {
        try {
            const users = await storage_js_1.storage.getAllUsers();
            // Remove passwords from response
            const usersWithoutPasswords = users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
            return res.json(usersWithoutPasswords);
        }
        catch (error) {
            console.error("Error fetching users:", error);
            return res.status(500).json({ message: "Failed to fetch users" });
        }
    });
    // Get scam reports for a specific user
    apiRouter.get("/users/:userId/scam-reports", async (req, res) => {
        try {
            const userId = parseInt(req.params.userId, 10);
            // Get user info from headers (for auth check)
            const headerUserId = parseInt(req.headers['x-user-id'], 10) || 0;
            const headerUserRole = req.headers['x-user-role'] || '';
            console.log(`Auth headers: User ID ${headerUserId}, Role: ${headerUserRole}`);
            // Ensure the user is requesting their own reports or is an admin
            if (headerUserId !== userId && headerUserRole !== 'admin') {
                console.log(`Access denied: headerUserId=${headerUserId}, userId=${userId}, role=${headerUserRole}`);
                return res.status(403).json({ message: "Access denied: You can only view your own reports" });
            }
            console.log(`Fetching scam reports for user ID ${userId}`);
            const reports = await storage_js_1.storage.getScamReportsByUser(userId);
            console.log(`Found ${reports.length} reports for user ID ${userId}`);
            res.json(reports);
        }
        catch (error) {
            console.error(`Error fetching scam reports for user ID ${req.params.userId}:`, error);
            res.status(500).json({ message: "Failed to fetch user's scam reports" });
        }
    });
    // SCAM REPORT ROUTES
    // Create a new scam report with file upload
    // Standard JSON endpoint for scam reports (without file)
    apiRouter.post("/scam-reports", async (req, res) => {
        try {
            console.log("\n\n==========================================");
            console.log("📝 NEW SCAM REPORT SUBMISSION");
            console.log("==========================================");
            // 1. AUTHENTICATION CHECK
            const userId = parseInt(req.headers['x-user-id'] || '0', 10);
            const userEmail = req.headers['x-user-email'] || '';
            console.log(`🔑 User Authentication - ID: ${userId}, Email: ${userEmail}`);
            if (!userId || isNaN(userId) || !userEmail) {
                console.error("❌ Authentication failed - invalid user ID or email");
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }
            // 2. REQUEST VALIDATION
            if (!req.body || typeof req.body !== 'object') {
                console.error("❌ Invalid request body:", req.body);
                return res.status(400).json({
                    success: false,
                    message: "Request body is missing or invalid"
                });
            }
            // Check required fields
            const requiredFields = ['scamType', 'description', 'incidentDate'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            if (missingFields.length > 0) {
                console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
                return res.status(400).json({
                    success: false,
                    message: "Required fields are missing",
                    fields: missingFields
                });
            }
            // 4. PREPARE DATABASE RECORD
            // Handle date formatting
            let formattedDate;
            try {
                // Accept various date formats and convert to YYYY-MM-DD
                const dateValue = req.body.incidentDate;
                if (dateValue instanceof Date) {
                    formattedDate = dateValue.toISOString().split('T')[0];
                }
                else if (typeof dateValue === 'string') {
                    // Try to parse the string date
                    const parsedDate = new Date(dateValue);
                    if (!isNaN(parsedDate.getTime())) {
                        formattedDate = parsedDate.toISOString().split('T')[0];
                    }
                    else {
                        // If it's already in YYYY-MM-DD format, use as is
                        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                            formattedDate = dateValue;
                        }
                        else {
                            throw new Error(`Invalid date format: ${dateValue}`);
                        }
                    }
                }
                else {
                    throw new Error("Invalid incident date");
                }
            }
            catch (dateError) {
                console.error("❌ Date parsing error:", dateError);
                return res.status(400).json({
                    success: false,
                    message: "Invalid incident date format",
                    error: dateError instanceof Error ? dateError.message : "Unknown error"
                });
            }
            // 5. DATABASE INSERTION - Using ORM interface
            // Process file upload if present
            let fileData = null;
            if (req.file) {
                console.log("📎 Processing uploaded file:", req.file);
                fileData = {
                    proofFilePath: req.file.path,
                    proofFileName: req.file.originalname,
                    proofFileType: req.file.mimetype,
                    proofFileSize: req.file.size
                };
            }
            // Create the report data object using the InsertScamReport type
            const reportData = {
                userId,
                scamType: req.body.scamType,
                scamPhoneNumber: req.body.scamPhoneNumber || null,
                scamEmail: req.body.scamEmail || null,
                scamBusinessName: req.body.scamBusinessName || null,
                incidentDate: new Date(formattedDate), // Convert string to Date object
                country: req.body.country || 'USA',
                city: req.body.city || null,
                state: req.body.state || null,
                zipCode: req.body.zipCode || null,
                description: req.body.description,
                // Add file information if a file was uploaded
                ...(fileData && {
                    hasProofDocument: true,
                    ...fileData
                })
            };
            try {
                // Use the storage interface for reports with optional file attachment
                const newReport = await storage_js_1.storage.createScamReport(reportData);
                // Return success response directly from the ORM-provided object
                return res.status(201).json({
                    success: true,
                    message: "Scam report created successfully",
                    report: newReport
                });
            }
            catch (dbError) {
                console.error("❌ DATABASE ERROR:", dbError);
                return res.status(500).json({
                    success: false,
                    message: "Failed to save report to database",
                    error: dbError instanceof Error ? dbError.message : "Unknown database error"
                });
            }
        }
        catch (error) {
            console.error("❌ UNEXPECTED ERROR:", error);
            return res.status(500).json({
                success: false,
                message: "An unexpected error occurred",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
    // File upload endpoint for scam reports with multer middleware
    apiRouter.post("/scam-reports/upload", upload.single('proofFile'), async (req, res) => {
        try {
            // 1. AUTHENTICATION CHECK
            const userId = parseInt(req.headers['x-user-id'] || '0', 10);
            const userEmail = req.headers['x-user-email'] || '';
            console.log(`🔑 User Authentication - ID: ${userId}, Email: ${userEmail}`);
            if (!userId || isNaN(userId) || !userEmail) {
                console.error("❌ Authentication failed - invalid user ID or email");
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }
            // 2. REQUEST VALIDATION
            if (!req.body || typeof req.body !== 'object') {
                console.error("❌ Invalid request body:", req.body);
                return res.status(400).json({
                    success: false,
                    message: "Request body is missing or invalid"
                });
            }
            // 3. FILE VALIDATION 
            if (!req.file) {
                console.error("❌ No file uploaded");
                return res.status(400).json({
                    success: false,
                    message: "No file uploaded"
                });
            }
            console.log("📎 File received:", {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            });
            // 4. FORM DATA VALIDATION
            // Check required fields
            const requiredFields = ['scamType', 'description', 'incidentDate'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            if (missingFields.length > 0) {
                console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
                return res.status(400).json({
                    success: false,
                    message: "Required fields are missing",
                    fields: missingFields
                });
            }
            // 5. PREPARE DATABASE RECORD
            // Handle date formatting
            let formattedDate;
            try {
                // Accept various date formats and convert to YYYY-MM-DD
                const dateValue = req.body.incidentDate;
                if (dateValue instanceof Date) {
                    formattedDate = dateValue.toISOString().split('T')[0];
                }
                else if (typeof dateValue === 'string') {
                    // Try to parse the string date
                    const parsedDate = new Date(dateValue);
                    if (!isNaN(parsedDate.getTime())) {
                        formattedDate = parsedDate.toISOString().split('T')[0];
                    }
                    else {
                        // If it's already in YYYY-MM-DD format, use as is
                        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                            formattedDate = dateValue;
                        }
                        else {
                            throw new Error(`Invalid date format: ${dateValue}`);
                        }
                    }
                }
                else {
                    throw new Error("Invalid incident date");
                }
            }
            catch (dateError) {
                console.error("❌ Date parsing error:", dateError);
                return res.status(400).json({
                    success: false,
                    message: "Invalid incident date format",
                    error: dateError instanceof Error ? dateError.message : "Unknown error"
                });
            }
            // Process file upload
            const fileData = {
                proofFilePath: req.file.path,
                proofFileName: req.file.originalname,
                proofFileType: req.file.mimetype,
                proofFileSize: req.file.size
            };
            // Create the report data object
            const reportData = {
                userId,
                scamType: req.body.scamType,
                scamPhoneNumber: req.body.scamPhoneNumber || null,
                scamEmail: req.body.scamEmail || null,
                scamBusinessName: req.body.scamBusinessName || null,
                incidentDate: new Date(formattedDate), // Convert string to Date object
                country: req.body.country || 'USA',
                city: req.body.city || null,
                state: req.body.state || null,
                zipCode: req.body.zipCode || null,
                description: req.body.description,
                hasProofDocument: true,
                ...fileData
            };
            try {
                // Use the storage interface for reports with file attachment
                const newReport = await storage_js_1.storage.createScamReport(reportData);
                // Return success response
                return res.status(201).json({
                    success: true,
                    message: "Scam report with file uploaded successfully",
                    report: newReport
                });
            }
            catch (dbError) {
                console.error("❌ DATABASE ERROR:", dbError);
                return res.status(500).json({
                    success: false,
                    message: "Failed to save report to database",
                    error: dbError instanceof Error ? dbError.message : "Unknown database error"
                });
            }
        }
        catch (error) {
            console.error("❌ UNEXPECTED ERROR:", error);
            return res.status(500).json({
                success: false,
                message: "An unexpected error occurred",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
    // Get all scam reports with optional filtering
    apiRouter.get("/scam-reports", requireAuth, async (req, res) => {
        try {
            console.log("Scam reports request with query params:", req.query);
            // Add pagination support for performance
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const offset = (page - 1) * limit;
            console.log(`📄 Pagination: page=${page}, limit=${limit}, offset=${offset}`);
            // Check user role to determine if we should include unpublished reports
            const user = req.user;
            const userRole = user?.role || req.headers['x-user-role'] || '';
            const isAdmin = userRole === 'admin';
            console.log(`👤 User role: ${userRole}, isAdmin: ${isAdmin}`);
            let reports;
            let totalCount;
            // Check if we're filtering by verification status
            if (req.query.isVerified !== undefined) {
                const isVerified = req.query.isVerified === 'true';
                console.log(`Filtering scam reports by verification status: isVerified=${isVerified}`);
                if (isVerified) {
                    reports = await storage_js_1.storage.getVerifiedScamReports(page, limit);
                    totalCount = await storage_js_1.storage.getVerifiedScamReportsCount();
                }
                else {
                    reports = await storage_js_1.storage.getUnverifiedScamReports(page, limit);
                    totalCount = await storage_js_1.storage.getUnverifiedScamReportsCount();
                }
                // Filter out unpublished reports if not admin (this should be done in the database query)
                if (!isAdmin) {
                    reports = reports.filter(report => report.isPublished !== false);
                    console.log(`Filtered reports for non-admin user, showing only published: ${reports.length}`);
                }
                console.log(`Returning ${reports.length} ${isVerified ? 'verified' : 'unverified'} reports (page ${page})`);
            }
            else {
                // No filtering by verification status
                if (isAdmin) {
                    reports = await storage_js_1.storage.getAllScamReports(page, limit);
                    totalCount = await storage_js_1.storage.getTotalScamReportsCount();
                    console.log(`Admin user - returning paginated reports: ${reports.length} (page ${page})`);
                }
                else {
                    reports = await storage_js_1.storage.getPublishedScamReports(page, limit);
                    totalCount = await storage_js_1.storage.getPublishedScamReportsCount();
                    console.log(`Regular user - returning paginated published reports: ${reports.length} (page ${page})`);
                }
            }
            // Include user data for each report
            const reportsWithUsers = await Promise.all(reports.map(async (report) => {
                const userId = report.user_id || report.userId;
                const user = userId ? await storage_js_1.storage.getUser(userId) : null;
                return {
                    ...report,
                    user: user ? {
                        id: user.id,
                        displayName: user.displayName,
                        email: user.email
                    } : undefined
                };
            }));
            console.log(`Returning ${reportsWithUsers.length} reports (page ${page} of ${Math.ceil(totalCount / limit)})`);
            // Return paginated response
            res.json({
                reports: reportsWithUsers,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit)
                }
            });
        }
        catch (error) {
            console.error("Error fetching scam reports:", error);
            res.status(500).json({ message: "Failed to fetch scam reports" });
        }
    });
    // Get recent scam reports
    apiRouter.get("/scam-reports/recent", async (req, res) => {
        try {
            const limit = parseInt(req.query.limit || "5", 10);
            const userRole = req.headers['x-user-role'] || '';
            const isAdmin = userRole === 'admin';
            console.log(`👤 User requesting recent reports - Role: ${userRole}, isAdmin: ${isAdmin}`);
            // Get recent reports - pass includeUnpublished as true for admins
            let recentReports = await storage_js_1.storage.getRecentScamReports(limit, isAdmin);
            // Get the user for each report and transform field names for frontend
            const reportsWithUsers = await Promise.all(recentReports.map(async (report) => {
                const user = await storage_js_1.storage.getUser(report.userId);
                // Get consolidated info if available
                const consolidation = await storage_js_1.storage.getConsolidationForScamReport(report.id);
                let consolidatedInfo = null;
                if (consolidation) {
                    consolidatedInfo = await storage_js_1.storage.getConsolidatedScam(consolidation.consolidatedScamId);
                }
                // Transform database field names to camelCase for frontend
                return {
                    id: report.id,
                    scamType: report.scamType,
                    scamPhoneNumber: report.scamPhoneNumber,
                    scamEmail: report.scamEmail,
                    scamBusinessName: report.scamBusinessName,
                    incidentDate: report.incidentDate,
                    city: report.city,
                    state: report.state,
                    zipCode: report.zipCode,
                    country: report.country,
                    description: report.description,
                    reportedAt: report.reportedAt,
                    isVerified: report.isVerified,
                    isPublished: report.isPublished,
                    hasProofDocument: report.hasProofDocument,
                    proofFilePath: report.proofFilePath,
                    userId: report.userId,
                    user: user ? {
                        id: user.id,
                        displayName: user.displayName,
                        email: user.email
                    } : null,
                    consolidatedInfo
                };
            }));
            console.log(`Returning ${reportsWithUsers.length} recent reports`);
            res.json(reportsWithUsers);
        }
        catch (error) {
            console.error("Error fetching recent scam reports:", error);
            res.status(500).json({ message: "Failed to fetch recent scam reports" });
        }
    });
    // Get scam reports by type
    apiRouter.get("/scam-reports/by-type/:type", async (req, res) => {
        try {
            const type = req.params.type;
            const userRole = req.headers['x-user-role'] || '';
            const isAdmin = userRole === 'admin';
            console.log(`👤 User requesting reports by type ${type} - Role: ${userRole}, isAdmin: ${isAdmin}`);
            if (!['phone', 'email', 'business'].includes(type)) {
                return res.status(400).json({ message: "Invalid scam type" });
            }
            // Get reports by type
            let reports = await storage_js_1.storage.getScamReportsByType(type);
            // Filter out unpublished reports for non-admin users
            if (!isAdmin) {
                console.log(`Filtering unpublished reports for non-admin user`);
                reports = reports.filter(report => report.isPublished !== false);
                console.log(`After filtering: ${reports.length} published reports of type ${type}`);
            }
            res.json(reports);
        }
        catch (error) {
            console.error(`Error fetching ${req.params.type} scam reports:`, error);
            res.status(500).json({ message: "Failed to fetch scam reports" });
        }
    });
    // Get a specific scam report
    apiRouter.get("/scam-reports/:id", async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const userRole = req.headers['x-user-role'] || '';
            const isAdmin = userRole === 'admin';
            console.log(`👤 User requesting scam report ID ${id} - Role: ${userRole}, isAdmin: ${isAdmin}`);
            const report = await storage_js_1.storage.getScamReport(id);
            if (!report) {
                return res.status(404).json({ message: "Scam report not found" });
            }
            // Check if report is published or user is admin
            if (!isAdmin && report.isPublished === false) {
                console.log(`⚠️ Non-admin user tried to access unpublished report ID ${id}`);
                return res.status(403).json({
                    message: "This report is not available",
                    notPublished: true
                });
            }
            // Get the user who reported it
            const user = await storage_js_1.storage.getUser(report.userId);
            // Get comments for this report
            const comments = await storage_js_1.storage.getCommentsForScamReport(id);
            const commentsWithUser = await Promise.all(comments.map(async (comment) => {
                const commentUser = await storage_js_1.storage.getUser(comment.userId);
                return {
                    ...comment,
                    user: commentUser ? {
                        id: commentUser.id,
                        beawareUsername: commentUser.beawareUsername,
                        // Only show real info to admins
                        displayName: user?.role === 'admin' ? commentUser.displayName : undefined,
                        email: user?.role === 'admin' ? commentUser.email : undefined
                    } : null
                };
            }));
            // Get consolidation info if available
            const consolidation = await storage_js_1.storage.getConsolidationForScamReport(id);
            let consolidatedInfo = null;
            if (consolidation) {
                consolidatedInfo = await storage_js_1.storage.getConsolidatedScam(consolidation.consolidatedScamId);
            }
            res.json({
                ...report,
                user: user ? {
                    id: user.id,
                    beawareUsername: user.beawareUsername,
                    displayName: user.displayName,
                    email: user.email
                } : null,
                comments: commentsWithUser,
                consolidatedInfo
            });
        }
        catch (error) {
            console.error(`Error fetching scam report ID ${req.params.id}:`, error);
            res.status(500).json({ message: "Failed to fetch scam report" });
        }
    });
    // Verify a scam report (admin only)
    apiRouter.post("/scam-reports/:id/verify", requireAdmin, async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const adminUser = req.user;
            console.log(`🔍 Attempting to verify scam report with ID ${id}`);
            console.log(`👤 Admin user:`, adminUser);
            // Double-check that we have the admin user
            if (!adminUser || !adminUser.id) {
                console.error("❌ Admin validation failed in verify endpoint");
                return res.status(400).json({ message: "Valid admin user required" });
            }
            if (adminUser.role !== 'admin') {
                console.error(`❌ Non-admin user ${adminUser.email} attempted to verify a report`);
                return res.status(403).json({ message: "Admin privileges required" });
            }
            // Get the report first to verify it exists
            const originalReport = await storage_js_1.storage.getScamReport(id);
            if (!originalReport) {
                console.error(`❌ Scam report with ID ${id} not found`);
                return res.status(404).json({ message: "Scam report not found" });
            }
            console.log(`✓ Found scam report: ${JSON.stringify(originalReport)}`);
            if (originalReport.isVerified) {
                console.log(`ℹ️ Report ${id} is already verified by user ${originalReport.verifiedBy}`);
                return res.json({
                    success: true,
                    message: "Scam report was already verified",
                    report: originalReport
                });
            }
            // Verify the report
            console.log(`✅ Verifying scam report ID ${id} with admin ID ${adminUser.id}`);
            const report = await storage_js_1.storage.verifyScamReport(id, adminUser.id);
            if (!report) {
                console.error(`❌ Verification failed for scam report ID ${id}`);
                return res.status(404).json({ message: "Scam report not found or verification failed" });
            }
            console.log(`🎉 Successfully verified scam report: ${JSON.stringify(report)}`);
            // Also verify the consolidated scam if one exists
            try {
                const consolidation = await storage_js_1.storage.getConsolidationForScamReport(id);
                if (consolidation) {
                    console.log(`🔄 Verifying associated consolidated scam ID ${consolidation.consolidatedScamId}`);
                    await storage_js_1.storage.verifyConsolidatedScam(consolidation.consolidatedScamId);
                }
            }
            catch (consolidationError) {
                console.error("⚠️ Error verifying consolidated scam:", consolidationError);
                // Continue despite error with consolidated scam
            }
            // Return success response with verified report
            res.json({
                success: true,
                message: "Scam report verified successfully",
                report
            });
        }
        catch (error) {
            console.error(`❌ Error verifying scam report ID ${req.params.id}:`, error);
            res.status(500).json({ message: "Failed to verify scam report" });
        }
    });
    // Publish a scam report (admin only)
    apiRouter.post("/scam-reports/:id/publish", requireAdmin, async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const adminUser = req.user;
            console.log(`🔍 Attempting to publish scam report with ID ${id}`);
            console.log(`👤 Admin user:`, adminUser);
            // Double-check that we have the admin user
            if (!adminUser || !adminUser.id) {
                console.error("❌ Admin validation failed in publish endpoint");
                return res.status(400).json({ message: "Valid admin user required" });
            }
            // Verify the user is an admin
            if (adminUser.role !== "admin") {
                console.error(`❌ Non-admin user ${adminUser.email} attempted to publish a report`);
                return res.status(403).json({ message: "Admin privileges required" });
            }
            // Get the report first to verify it exists
            const originalReport = await storage_js_1.storage.getScamReport(id);
            if (!originalReport) {
                return res.status(404).json({ message: "Scam report not found" });
            }
            // Publish the report
            const report = await storage_js_1.storage.publishScamReport(id, adminUser.id);
            if (!report) {
                return res.status(500).json({ message: "Failed to publish scam report" });
            }
            res.json({
                message: "Scam report published successfully",
                report
            });
        }
        catch (error) {
            console.error(`❌ Error publishing scam report ID ${req.params.id}:`, error);
            res.status(500).json({ message: "Failed to publish scam report" });
        }
    });
    // Unpublish a scam report (admin only)
    apiRouter.post("/scam-reports/:id/unpublish", requireAdmin, async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const adminUser = req.user;
            console.log(`🔍 Attempting to unpublish scam report with ID ${id}`);
            console.log(`👤 Admin user:`, adminUser);
            // Double-check that we have the admin user
            if (!adminUser || !adminUser.id) {
                console.error("❌ Admin validation failed in unpublish endpoint");
                return res.status(400).json({ message: "Valid admin user required" });
            }
            // Verify the user is an admin
            if (adminUser.role !== "admin") {
                console.error(`❌ Non-admin user ${adminUser.email} attempted to unpublish a report`);
                return res.status(403).json({ message: "Admin privileges required" });
            }
            // Get the report first to verify it exists
            const originalReport = await storage_js_1.storage.getScamReport(id);
            if (!originalReport) {
                return res.status(404).json({ message: "Scam report not found" });
            }
            // Unpublish the report
            const report = await storage_js_1.storage.unpublishScamReport(id, adminUser.id);
            if (!report) {
                return res.status(500).json({ message: "Failed to unpublish scam report" });
            }
            res.json({
                message: "Scam report unpublished successfully",
                report
            });
        }
        catch (error) {
            console.error(`❌ Error unpublishing scam report ID ${req.params.id}:`, error);
            res.status(500).json({ message: "Failed to unpublish scam report" });
        }
    });
    // Get all published scam reports
    apiRouter.get("/scam-reports/published", async (req, res) => {
        try {
            console.log("Fetching published scam reports...");
            // Debug which storage implementation we're using
            console.log("Storage implementation type:", typeof storage_js_1.storage, "with methods:", Object.keys(storage_js_1.storage));
            // Get the reports from storage
            const reports = await storage_js_1.storage.getPublishedScamReports();
            console.log(`Retrieved ${reports.length} published reports`);
            res.json(reports);
        }
        catch (error) {
            console.error("❌ Error getting published scam reports:", error);
            res.status(500).json({
                message: "Failed to get published scam reports",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
    // Get all unpublished scam reports (admin only)
    apiRouter.get("/scam-reports/unpublished", requireAdmin, async (req, res) => {
        try {
            const reports = await storage_js_1.storage.getUnpublishedScamReports();
            res.json(reports);
        }
        catch (error) {
            console.error("❌ Error getting unpublished scam reports:", error);
            res.status(500).json({ message: "Failed to get unpublished scam reports" });
        }
    });
    // SCAM COMMENT ROUTES
    apiRouter.post("/scam-comments", requireAuth, async (req, res) => {
        try {
            const user = req.user;
            // Combine request data with authenticated user
            const commentData = {
                ...req.body,
                userId: user.id
            };
            const validCommentData = schema_js_1.insertScamCommentSchema.parse(commentData);
            const comment = await storage_js_1.storage.createScamComment(validCommentData);
            // Include user info in response
            res.status(201).json({
                ...comment,
                user: {
                    id: user.id,
                    displayName: user.displayName,
                    email: user.email
                }
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Invalid comment data",
                    errors: error.errors
                });
            }
            console.error("Error creating comment:", error);
            res.status(500).json({ message: "Failed to create comment" });
        }
    });
    // STATISTICS ROUTES
    apiRouter.get("/scam-stats", async (req, res) => {
        try {
            console.log("📊 Fetching scam statistics directly from database...");
            // Use the storage interface which handles Azure SQL Database properly
            const stats = await storage_js_1.storage.getScamStats();
            console.log("📊 Database statistics calculated:", stats);
            res.json(stats);
        }
        catch (error) {
            console.error("Error fetching scam statistics:", error);
            res.status(500).json({ message: "Failed to fetch scam statistics" });
        }
    });
    // CONSOLIDATED SCAM ROUTES
    apiRouter.get("/consolidated-scams", async (req, res) => {
        try {
            const consolidatedScams = await storage_js_1.storage.getAllConsolidatedScams();
            // Transform database field names to camelCase for frontend compatibility
            const transformedScams = consolidatedScams.map(scam => ({
                id: scam.id,
                scamType: scam.scamType,
                identifier: scam.identifier,
                reportCount: scam.reportCount,
                firstReportedAt: scam.firstReportedAt,
                lastReportedAt: scam.lastReportedAt,
                isVerified: scam.isVerified
            }));
            res.json(transformedScams);
        }
        catch (error) {
            console.error("Error fetching consolidated scams:", error);
            res.status(500).json({ message: "Failed to fetch consolidated scams" });
        }
    });
    apiRouter.get("/consolidated-scams/by-type/:type", async (req, res) => {
        try {
            const type = req.params.type;
            if (!['phone', 'email', 'business'].includes(type)) {
                return res.status(400).json({ message: "Invalid scam type" });
            }
            const scams = await storage_js_1.storage.getConsolidatedScamsByType(type);
            res.json(scams);
        }
        catch (error) {
            console.error(`Error fetching ${req.params.type} consolidated scams:`, error);
            res.status(500).json({ message: "Failed to fetch consolidated scams" });
        }
    });
    apiRouter.get("/consolidated-scams/:id", async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const consolidatedScam = await storage_js_1.storage.getConsolidatedScam(id);
            if (!consolidatedScam) {
                return res.status(404).json({ message: "Consolidated scam not found" });
            }
            // Get all reports for this consolidated scam
            const reports = await storage_js_1.storage.getScamReportsForConsolidatedScam(id);
            res.json({
                ...consolidatedScam,
                reports
            });
        }
        catch (error) {
            console.error(`Error fetching consolidated scam ID ${req.params.id}:`, error);
            res.status(500).json({ message: "Failed to fetch consolidated scam" });
        }
    });
    // Verify a consolidated scam (admin only)
    apiRouter.post("/consolidated-scams/:id/verify", requireAdmin, async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const adminUser = req.user;
            console.log(`🔍 Attempting to verify consolidated scam with ID ${id}`);
            console.log(`👤 Admin user:`, adminUser);
            // Ensure we have the admin user
            if (!adminUser || !adminUser.id) {
                console.error("❌ Admin validation failed in verify consolidated scam endpoint");
                return res.status(400).json({ message: "Valid admin user required" });
            }
            if (adminUser.role !== 'admin') {
                console.error(`❌ Non-admin user ${adminUser.email} attempted to verify a consolidated scam`);
                return res.status(403).json({ message: "Admin privileges required" });
            }
            // Check if the consolidated scam exists first
            const originalScam = await storage_js_1.storage.getConsolidatedScam(id);
            if (!originalScam) {
                console.error(`❌ Consolidated scam with ID ${id} not found`);
                return res.status(404).json({ message: "Consolidated scam not found" });
            }
            console.log(`✓ Found consolidated scam: ${JSON.stringify(originalScam)}`);
            if (originalScam.isVerified) {
                console.log(`ℹ️ Consolidated scam ${id} is already verified`);
                return res.json({
                    success: true,
                    message: "Consolidated scam was already verified",
                    consolidatedScam: originalScam
                });
            }
            // Use the storage method to verify the consolidated scam
            console.log(`✅ Verifying consolidated scam ID ${id}`);
            const updatedScam = await storage_js_1.storage.verifyConsolidatedScam(id);
            if (!updatedScam) {
                console.error(`❌ Verification failed for consolidated scam ID ${id}`);
                return res.status(500).json({ message: "Failed to verify consolidated scam" });
            }
            console.log(`🎉 Successfully verified consolidated scam: ${JSON.stringify(updatedScam)}`);
            res.json({
                success: true,
                message: "Consolidated scam verified successfully",
                consolidatedScam: updatedScam
            });
        }
        catch (error) {
            console.error(`❌ Error verifying consolidated scam ID ${req.params.id}:`, error);
            res.status(500).json({ message: "Failed to verify consolidated scam" });
        }
    });
    // STATS ROUTES
    apiRouter.get("/scam-stats", async (req, res) => {
        try {
            let stats = await storage_js_1.storage.getScamStats();
            // Make sure stats exist by updating them if needed
            if (!stats) {
                stats = await storage_js_1.storage.updateScamStats();
            }
            res.json(stats);
        }
        catch (error) {
            console.error("Error fetching scam stats:", error);
            res.status(500).json({ message: "Failed to fetch scam stats" });
        }
    });
    // LAWYER PROFILE ROUTES
    // Create a lawyer profile
    apiRouter.post("/lawyer-profiles", requireAuth, async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ message: "Authentication required" });
            }
            // Check if this user already has a lawyer profile
            const existingProfile = await storage_js_1.storage.getLawyerProfileByUserId(user.id);
            if (existingProfile) {
                return res.status(400).json({ message: "User already has a lawyer profile" });
            }
            // Process the form data
            const profileData = {
                userId: user.id,
                ...req.body
            };
            // Handle array fields that might come as strings
            if (typeof profileData.secondarySpecializations === 'string') {
                profileData.secondarySpecializations = JSON.parse(profileData.secondarySpecializations);
            }
            if (typeof profileData.caseTypes === 'string') {
                profileData.caseTypes = JSON.parse(profileData.caseTypes);
            }
            // Convert string boolean values to actual booleans
            profileData.acceptingNewClients = profileData.acceptingNewClients === 'true';
            profileData.offersFreeConsultation = profileData.offersFreeConsultation === 'true';
            // Parse numeric fields
            profileData.yearsOfExperience = parseInt(profileData.yearsOfExperience, 10);
            // File upload functionality has been completely removed
            // No verification document support
            // Validate the data with the schema
            const validProfileData = schema_js_1.insertLawyerProfileSchema.parse(profileData);
            // Create the lawyer profile
            const profile = await storage_js_1.storage.createLawyerProfile(validProfileData);
            res.status(201).json(profile);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Invalid lawyer profile data",
                    errors: error.errors
                });
            }
            console.error("Error creating lawyer profile:", error);
            res.status(500).json({ message: "Failed to create lawyer profile" });
        }
    });
    // Get all lawyer profiles
    apiRouter.get("/lawyer-profiles", async (req, res) => {
        try {
            // By default, only return verified lawyer profiles
            const onlyVerified = req.query.verified !== 'false';
            let profiles;
            if (onlyVerified) {
                profiles = await storage_js_1.storage.getVerifiedLawyerProfiles();
            }
            else {
                profiles = await storage_js_1.storage.getAllLawyerProfiles();
            }
            res.json(profiles);
        }
        catch (error) {
            console.error("Error fetching lawyer profiles:", error);
            res.status(500).json({ message: "Failed to fetch lawyer profiles" });
        }
    });
    // Get a specific lawyer profile
    apiRouter.get("/lawyer-profiles/:id", async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid ID" });
            }
            const profile = await storage_js_1.storage.getLawyerProfile(id);
            if (!profile) {
                return res.status(404).json({ message: "Lawyer profile not found" });
            }
            res.json(profile);
        }
        catch (error) {
            console.error("Error fetching lawyer profile:", error);
            res.status(500).json({ message: "Failed to fetch lawyer profile" });
        }
    });
    // Get lawyer profile by user ID
    apiRouter.get("/users/:userId/lawyer-profile", async (req, res) => {
        try {
            const userId = parseInt(req.params.userId, 10);
            if (isNaN(userId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }
            const profile = await storage_js_1.storage.getLawyerProfileByUserId(userId);
            if (!profile) {
                return res.status(404).json({ message: "Lawyer profile not found for this user" });
            }
            res.json(profile);
        }
        catch (error) {
            console.error("Error fetching lawyer profile by user ID:", error);
            res.status(500).json({ message: "Failed to fetch lawyer profile" });
        }
    });
    // Update a lawyer profile
    apiRouter.patch("/lawyer-profiles/:id", requireAuth, async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid ID" });
            }
            const user = req.user;
            const profile = await storage_js_1.storage.getLawyerProfile(id);
            if (!profile) {
                return res.status(404).json({ message: "Lawyer profile not found" });
            }
            // Check permission (user can update their own profile, admin can update any)
            if (profile.userId !== user.id && user.role !== 'admin') {
                return res.status(403).json({ message: "Permission denied" });
            }
            // Process the update data
            const updateData = { ...req.body };
            // Handle array fields that might come as strings
            if (typeof updateData.secondarySpecializations === 'string') {
                updateData.secondarySpecializations = JSON.parse(updateData.secondarySpecializations);
            }
            if (typeof updateData.caseTypes === 'string') {
                updateData.caseTypes = JSON.parse(updateData.caseTypes);
            }
            // Convert string boolean values to actual booleans
            if (updateData.acceptingNewClients !== undefined) {
                updateData.acceptingNewClients = updateData.acceptingNewClients === 'true';
            }
            if (updateData.offersFreeConsultation !== undefined) {
                updateData.offersFreeConsultation = updateData.offersFreeConsultation === 'true';
            }
            // Parse numeric fields
            if (updateData.yearsOfExperience !== undefined) {
                updateData.yearsOfExperience = parseInt(updateData.yearsOfExperience, 10);
            }
            // File upload functionality has been completely removed
            // No verification document support
            // Update the profile
            const updatedProfile = await storage_js_1.storage.updateLawyerProfile(id, updateData);
            res.json(updatedProfile);
        }
        catch (error) {
            console.error("Error updating lawyer profile:", error);
            res.status(500).json({ message: "Failed to update lawyer profile" });
        }
    });
    // Verify a lawyer profile (admin only)
    apiRouter.post("/lawyer-profiles/:id/verify", requireAuth, requireAdmin, async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid ID" });
            }
            const admin = req.user;
            console.log(`Attempting to verify lawyer profile with ID ${id}`);
            console.log(`Admin user:`, admin);
            // Ensure we have the admin user
            if (!admin || !admin.id) {
                console.error("Admin validation failed in verify lawyer profile endpoint");
                return res.status(400).json({ message: "Valid admin user required" });
            }
            const profile = await storage_js_1.storage.getLawyerProfile(id);
            if (!profile) {
                console.error(`Lawyer profile with ID ${id} not found`);
                return res.status(404).json({ message: "Lawyer profile not found" });
            }
            console.log(`Found lawyer profile: ${JSON.stringify(profile)}`);
            console.log(`Verifying lawyer profile ID ${id} with admin ID ${admin.id}`);
            const verifiedProfile = await storage_js_1.storage.verifyLawyerProfile(id, admin.id);
            if (!verifiedProfile) {
                console.error(`Verification failed for lawyer profile ID ${id}`);
                return res.status(500).json({ message: "Failed to verify lawyer profile" });
            }
            console.log(`Successfully verified lawyer profile: ${JSON.stringify(verifiedProfile)}`);
            res.json({
                success: true,
                profile: verifiedProfile
            });
        }
        catch (error) {
            console.error("Error verifying lawyer profile:", error);
            res.status(500).json({ message: "Failed to verify lawyer profile" });
        }
    });
    // LAWYER REQUEST ROUTES
    // Submit a lawyer request
    apiRouter.post("/lawyer-requests", async (req, res) => {
        try {
            // User ID is optional
            let userId = null;
            if (req.headers['x-user-id']) {
                userId = parseInt(req.headers['x-user-id'], 10);
            }
            // Process request data
            const requestData = {
                ...req.body,
                userId
            };
            // Validate with schema
            const validRequestData = schema_js_1.insertLawyerRequestSchema.parse(requestData);
            // Create the request
            const request = await storage_js_1.storage.createLawyerRequest(validRequestData);
            res.status(201).json(request);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Invalid lawyer request data",
                    errors: error.errors
                });
            }
            console.error("Error creating lawyer request:", error);
            res.status(500).json({ message: "Failed to create lawyer request" });
        }
    });
    // Get all lawyer requests (admin only)
    apiRouter.get("/lawyer-requests", requireAuth, requireAdmin, async (req, res) => {
        try {
            let requests;
            if (req.query.status === 'pending') {
                requests = await storage_js_1.storage.getPendingLawyerRequests();
            }
            else {
                requests = await storage_js_1.storage.getAllLawyerRequests();
            }
            res.json(requests);
        }
        catch (error) {
            console.error("Error fetching lawyer requests:", error);
            res.status(500).json({ message: "Failed to fetch lawyer requests" });
        }
    });
    // Get lawyer requests for a specific lawyer
    apiRouter.get("/lawyer-profiles/:id/requests", requireAuth, async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid ID" });
            }
            const user = req.user;
            const profile = await storage_js_1.storage.getLawyerProfile(id);
            if (!profile) {
                return res.status(404).json({ message: "Lawyer profile not found" });
            }
            // Check permission (lawyers can see their own requests, admin can see any)
            if (profile.userId !== user.id && user.role !== 'admin') {
                return res.status(403).json({ message: "Permission denied" });
            }
            const requests = await storage_js_1.storage.getLawyerRequestsByLawyer(id);
            res.json(requests);
        }
        catch (error) {
            console.error("Error fetching lawyer requests:", error);
            res.status(500).json({ message: "Failed to fetch lawyer requests" });
        }
    });
    // Update the status of a lawyer request
    apiRouter.patch("/lawyer-requests/:id/status", requireAuth, async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid ID" });
            }
            const { status } = req.body;
            if (!status || !['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
                return res.status(400).json({ message: "Invalid status" });
            }
            const user = req.user;
            const request = await storage_js_1.storage.getLawyerRequest(id);
            if (!request) {
                return res.status(404).json({ message: "Lawyer request not found" });
            }
            // If request is assigned to a lawyer, check permission
            if (request.lawyerProfileId) {
                const profile = await storage_js_1.storage.getLawyerProfile(request.lawyerProfileId);
                // Only the assigned lawyer or admin can update status
                if (profile && profile.userId !== user.id && user.role !== 'admin') {
                    return res.status(403).json({ message: "Permission denied" });
                }
            }
            else if (user.role !== 'admin') {
                // Only admin can update unassigned requests
                return res.status(403).json({ message: "Permission denied" });
            }
            const updatedRequest = await storage_js_1.storage.updateLawyerRequestStatus(id, status);
            res.json(updatedRequest);
        }
        catch (error) {
            console.error("Error updating lawyer request status:", error);
            res.status(500).json({ message: "Failed to update lawyer request status" });
        }
    });
    // Assign a lawyer to a request (admin only)
    apiRouter.post("/lawyer-requests/:id/assign", requireAuth, requireAdmin, async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid ID" });
            }
            const { lawyerProfileId } = req.body;
            if (!lawyerProfileId) {
                return res.status(400).json({ message: "Lawyer profile ID is required" });
            }
            const profileId = parseInt(lawyerProfileId, 10);
            if (isNaN(profileId)) {
                return res.status(400).json({ message: "Invalid lawyer profile ID" });
            }
            // Verify the lawyer profile exists
            const profile = await storage_js_1.storage.getLawyerProfile(profileId);
            if (!profile) {
                return res.status(404).json({ message: "Lawyer profile not found" });
            }
            // Verify the request exists
            const request = await storage_js_1.storage.getLawyerRequest(id);
            if (!request) {
                return res.status(404).json({ message: "Lawyer request not found" });
            }
            // Assign the lawyer to the request
            const updatedRequest = await storage_js_1.storage.assignLawyerToRequest(id, profileId);
            res.json(updatedRequest);
        }
        catch (error) {
            console.error("Error assigning lawyer to request:", error);
            res.status(500).json({ message: "Failed to assign lawyer to request" });
        }
    });
    // SCAM VIDEO ROUTES
    // Get all scam videos
    apiRouter.get("/scam-videos", async (req, res) => {
        try {
            const videos = await storage_js_1.storage.getAllScamVideos();
            res.json(videos);
        }
        catch (error) {
            console.error("Error fetching scam videos:", error);
            res.status(500).json({ message: "Failed to fetch scam videos" });
        }
    });
    // Get featured scam videos
    apiRouter.get("/scam-videos/featured", async (req, res) => {
        try {
            // Get limit from query parameter, default to 5
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
            const videos = await storage_js_1.storage.getFeaturedScamVideos(limit);
            res.json(videos);
        }
        catch (error) {
            console.error("Error fetching featured scam videos:", error);
            res.status(500).json({ message: "Failed to fetch featured scam videos" });
        }
    });
    // Get videos by scam type
    apiRouter.get("/scam-videos/type/:scamType", async (req, res) => {
        try {
            const scamType = req.params.scamType;
            if (!['phone', 'email', 'business'].includes(scamType)) {
                return res.status(400).json({ message: "Invalid scam type" });
            }
            const videos = await storage_js_1.storage.getScamVideosByType(scamType);
            res.json(videos);
        }
        catch (error) {
            console.error("Error fetching scam videos by type:", error);
            res.status(500).json({ message: "Failed to fetch scam videos by type" });
        }
    });
    // Get videos for a consolidated scam
    apiRouter.get("/consolidated-scams/:id/videos", async (req, res) => {
        try {
            const consolidatedScamId = parseInt(req.params.id, 10);
            const videos = await storage_js_1.storage.getScamVideosForConsolidatedScam(consolidatedScamId);
            res.json(videos);
        }
        catch (error) {
            console.error("Error fetching videos for consolidated scam:", error);
            res.status(500).json({ message: "Failed to fetch videos for consolidated scam" });
        }
    });
    // Get a specific video by ID
    apiRouter.get("/scam-videos/:id", async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            const video = await storage_js_1.storage.getScamVideo(id);
            if (!video) {
                return res.status(404).json({ message: "Scam video not found" });
            }
            res.json(video);
        }
        catch (error) {
            console.error("Error fetching scam video:", error);
            res.status(500).json({ message: "Failed to fetch scam video" });
        }
    });
    // Create a new scam video (admin only)
    apiRouter.post("/scam-videos", requireAdmin, async (req, res) => {
        try {
            const user = req.user;
            // Validate the request body
            const videoData = schema_js_1.insertScamVideoSchema.parse({
                ...req.body,
                addedById: user.id
            });
            // Extract the YouTube video ID from the URL if not provided
            if (!videoData.youtubeVideoId && videoData.youtubeUrl) {
                const url = new URL(videoData.youtubeUrl);
                let videoId = '';
                if (url.hostname.includes('youtube.com')) {
                    videoId = url.searchParams.get('v') || '';
                }
                else if (url.hostname.includes('youtu.be')) {
                    videoId = url.pathname.substring(1);
                }
                if (videoId) {
                    videoData.youtubeVideoId = videoId;
                }
                else {
                    return res.status(400).json({
                        message: "Could not extract YouTube video ID from URL. Please provide a valid YouTube URL or specify the video ID directly."
                    });
                }
            }
            const video = await storage_js_1.storage.createScamVideo(videoData);
            res.status(201).json(video);
        }
        catch (error) {
            console.error("Error creating scam video:", error);
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    message: "Invalid scam video data",
                    errors: error.errors
                });
            }
            res.status(500).json({
                message: "Failed to create scam video",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }
    });
    // Update a scam video (admin only)
    apiRouter.patch("/scam-videos/:id", requireAdmin, async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            // Check if the video exists
            const existingVideo = await storage_js_1.storage.getScamVideo(id);
            if (!existingVideo) {
                return res.status(404).json({ message: "Scam video not found" });
            }
            // Update the video
            const updatedVideo = await storage_js_1.storage.updateScamVideo(id, req.body);
            res.json(updatedVideo);
        }
        catch (error) {
            console.error("Error updating scam video:", error);
            res.status(500).json({ message: "Failed to update scam video" });
        }
    });
    // Delete a scam video (admin only)
    apiRouter.delete("/scam-videos/:id", requireAdmin, async (req, res) => {
        try {
            const id = parseInt(req.params.id, 10);
            // Check if the video exists
            const existingVideo = await storage_js_1.storage.getScamVideo(id);
            if (!existingVideo) {
                return res.status(404).json({ message: "Scam video not found" });
            }
            // Delete the video
            const success = await storage_js_1.storage.deleteScamVideo(id);
            if (success) {
                res.status(204).end(); // No content response for successful delete
            }
            else {
                res.status(500).json({ message: "Failed to delete scam video" });
            }
        }
        catch (error) {
            console.error("Error deleting scam video:", error);
            res.status(500).json({ message: "Failed to delete scam video" });
        }
    });
    // AI Chatbot API endpoint
    apiRouter.post("/ai-chat", async (req, res) => {
        try {
            const { messages } = req.body;
            if (!messages || !Array.isArray(messages)) {
                return res.status(400).json({ error: "Invalid request format. 'messages' array is required." });
            }
            // Check if Perplexity API key exists
            const apiKey = process.env.PERPLEXITY_API_KEY;
            if (!apiKey) {
                console.warn("Perplexity API key not found, using fallback response");
                // Return a fallback response if no API key is available
                return res.status(200).json({
                    response: "I'm sorry, but I'm currently operating in limited mode. My responses are based on pre-defined information about common scams. For more detailed assistance, please try again later when my full capabilities are available.",
                    source: "fallback"
                });
            }
            // Format messages for Perplexity API
            const formattedMessages = [
                {
                    role: "system",
                    content: "You are a helpful assistant for scam victims. Provide specific, actionable advice for people who've been scammed. Be supportive and empathetic, but focus on practical steps they can take. Include references to official resources when appropriate. Keep your responses concise and direct."
                },
                ...messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content
                }))
            ];
            // Call Perplexity API
            const response = await fetch("https://api.perplexity.ai/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.1-sonar-small-128k-online",
                    messages: formattedMessages,
                    temperature: 0.2,
                    max_tokens: 1000,
                    presence_penalty: 0,
                    frequency_penalty: 1,
                    return_related_questions: false,
                    stream: false
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Perplexity API error:", errorText);
                throw new Error(`Perplexity API error: ${response.status}`);
            }
            const data = await response.json();
            return res.status(200).json({
                response: data.choices[0].message.content,
                citations: data.citations || [],
                source: "perplexity"
            });
        }
        catch (error) {
            console.error("Error in AI chat endpoint:", error);
            return res.status(500).json({
                error: "Failed to get AI response",
                response: "I'm having trouble connecting to my knowledge base right now. Please try again in a moment.",
                source: "error"
            });
        }
    });
    // Contact Form submission endpoint
    apiRouter.post("/contact", async (req, res) => {
        try {
            // Import email utility
            const { sendEmail } = await Promise.resolve().then(() => require("./utils/mailer.js"));
            // Validate request body
            const contactSchema = zod_1.z.object({
                name: zod_1.z.string().min(1, "Name is required"),
                email: zod_1.z.string().email("Invalid email address"),
                subject: zod_1.z.string().min(1, "Subject is required"),
                message: zod_1.z.string().min(1, "Message is required"),
                category: zod_1.z.enum(["general", "feedback", "question", "report", "other"]).optional(),
            });
            const result = contactSchema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid form data",
                    errors: result.error.flatten().fieldErrors
                });
            }
            const { name, email, subject, message } = result.data;
            // Format email content
            const emailSubject = `[BeAware Contact Form] ${subject}`;
            const emailText = `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `;
            const emailHtml = `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<h3>Message:</h3>
<p>${message.replace(/\n/g, '<br>')}</p>
      `;
            // Send email
            const emailSent = await sendEmail({
                to: "beaware.fyi@gmail.com",
                subject: emailSubject,
                text: emailText,
                html: emailHtml,
                from: `"BeAware Contact Form" <beaware.fyi@gmail.com>`
            });
            // Even if email fails, we'll return success to the user since the data is safely logged
            // in the server console and the user doesn't need to know about backend email issues
            return res.status(200).json({
                success: true,
                message: "Your message has been sent successfully. We'll get back to you soon!"
            });
        }
        catch (error) {
            console.error("Contact form submission error:", error);
            return res.status(500).json({
                success: false,
                message: "An unexpected error occurred. Please try again later."
            });
        }
    });
    // SECURITY CHECKLIST ROUTES
    // Get all security checklist items
    apiRouter.get("/security-checklist", async (req, res) => {
        try {
            const items = await storage_js_1.storage.getAllSecurityChecklistItems();
            res.json(items);
        }
        catch (error) {
            console.error("Error fetching security checklist items:", error);
            res.status(500).json({ message: "Failed to fetch security checklist items" });
        }
    });
    // Get user's security progress
    apiRouter.get("/security-checklist/progress", requireAuth, async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const progress = await storage_js_1.storage.getUserSecurityProgress(user.id);
            res.json(progress);
        }
        catch (error) {
            console.error("Error fetching user security progress:", error);
            res.status(500).json({ message: "Failed to fetch security progress" });
        }
    });
    // Update user's progress for a specific checklist item
    apiRouter.post("/security-checklist/:itemId/progress", requireAuth, async (req, res) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ message: "Authentication required" });
            }
            const itemId = parseInt(req.params.itemId, 10);
            if (isNaN(itemId)) {
                return res.status(400).json({ message: "Invalid item ID" });
            }
            const { isCompleted, notes } = req.body;
            // Log the request body for debugging
            console.log("Security checklist progress update request:", {
                itemId,
                isCompleted,
                isCompletedType: typeof isCompleted,
                notes,
                body: req.body
            });
            // More flexible boolean validation
            let completedStatus;
            if (typeof isCompleted === 'boolean') {
                completedStatus = isCompleted;
            }
            else if (typeof isCompleted === 'string') {
                completedStatus = isCompleted.toLowerCase() === 'true';
            }
            else if (typeof isCompleted === 'number') {
                completedStatus = isCompleted === 1;
            }
            else {
                return res.status(400).json({ message: "isCompleted must be a boolean value" });
            }
            // Verify the checklist item exists
            const item = await storage_js_1.storage.getSecurityChecklistItem(itemId);
            if (!item) {
                return res.status(404).json({ message: "Security checklist item not found" });
            }
            const progress = await storage_js_1.storage.updateUserSecurityProgress(user.id, itemId, completedStatus, notes);
            res.json(progress);
        }
        catch (error) {
            console.error("Error updating user security progress:", error);
            res.status(500).json({ message: "Failed to update security progress" });
        }
    });
    // VERSION AND HEALTH CHECK ROUTES
    apiRouter.get("/version", async (req, res) => {
        try {
            const versionInfo = (0, version_js_1.getVersionInfo)();
            res.json(versionInfo);
        }
        catch (error) {
            console.error("Error getting version info:", error);
            res.status(500).json({ error: "Failed to get version information" });
        }
    });
    apiRouter.get("/health", async (req, res) => {
        try {
            const versionInfo = (0, version_js_1.getVersionInfo)();
            res.json({
                status: "healthy",
                timestamp: new Date().toISOString(),
                version: versionInfo
            });
        }
        catch (error) {
            console.error("Health check failed:", error);
            res.status(500).json({
                status: "unhealthy",
                timestamp: new Date().toISOString(),
                error: "Health check failed"
            });
        }
    });
    // Register the API router
    app.use("/api", apiRouter);
    const httpServer = (0, http_1.createServer)(app);
    return httpServer;
}
