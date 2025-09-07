import express from "express";
import * as path from "path";
import { registerRoutes } from "./routes.js";
import { getVersionInfo } from "../shared/version.js";
// Import vite utilities conditionally to avoid production errors
// Simple logging function
const log = (message) => console.log(message);
// Import global deployment configuration
import * as fs from "fs";
// Read and parse deploy-config.js as a module
const configPath = path.join(process.cwd(), "deploy-config.js");
let config = {
    server: { port: process.env.PORT || 5000, host: "0.0.0.0" },
    database: {
        server: process.env.AZURE_SQL_SERVER || "beawaredevdbserver.database.windows.net",
        port: parseInt(process.env.AZURE_SQL_PORT || "1433"),
        database: process.env.AZURE_SQL_DATABASE || "Beawaredevdb",
        user: process.env.AZURE_SQL_USER || "beawaredevadmin",
        password: process.env.AZURE_SQL_PASSWORD || "Getmeup81$",
    },
    firebase: {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
    },
    uploads: {
        enabled: true,
        maxFileSize: 10 * 1024 * 1024,
        allowedTypes: ["application/pdf", "image/jpeg", "image/png"],
        directory: process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"),
    },
    email: {
        enabled: !!process.env.EMAIL_PASSWORD,
        from: "beaware.fyi@gmail.com",
        password: process.env.EMAIL_PASSWORD,
    },
    environment: {
        isReplit: !!process.env.REPL_ID || !!process.env.REPL_SLUG,
        isProduction: process.env.NODE_ENV === "production",
        isDocker: fs.existsSync("/.dockerenv") || process.env.RUNNING_IN_DOCKER === "true",
        isAzure: !!process.env.WEBSITE_SITE_NAME || !!process.env.WEBSITE_INSTANCE_ID,
    },
};
// 🔹 Feature flags
const disableReportSubmission = process.env.DISABLE_REPORT_SUBMISSION === "true";
// Create a simple validation function
const validateConfig = () => {
    const issues = [];
    if (!config.database.server)
        issues.push("AZURE_SQL_SERVER is not defined");
    if (!config.database.database)
        issues.push("AZURE_SQL_DATABASE is not defined");
    if (!config.database.user)
        issues.push("AZURE_SQL_USER is not defined");
    if (!config.database.password)
        issues.push("AZURE_SQL_PASSWORD is not defined");
    if (!config.firebase.apiKey)
        issues.push("VITE_FIREBASE_API_KEY is not defined");
    if (!config.firebase.projectId)
        issues.push("VITE_FIREBASE_PROJECT_ID is not defined");
    if (!config.firebase.appId)
        issues.push("VITE_FIREBASE_APP_ID is not defined");
    if (issues.length > 0) {
        console.warn("⚠️ Configuration issues detected:");
        issues.forEach((issue) => console.warn(`  - ${issue}`));
    }
    else {
        console.log("✅ Configuration validation passed");
    }
    return issues.length === 0;
};
const logDeploymentInfo = () => {
    console.log("🚀 Deployment environment detected:");
    if (config.environment.isReplit)
        console.log("  - Running on Replit");
    if (config.environment.isProduction)
        console.log("  - Running in production mode");
    if (config.environment.isDocker)
        console.log("  - Running in Docker container");
    if (config.environment.isAzure)
        console.log("  - Running on Azure");
    if (!config.environment.isReplit &&
        !config.environment.isDocker &&
        !config.environment.isAzure)
        console.log("  - Running locally");
    if (!fs.existsSync(config.uploads.directory)) {
        try {
            fs.mkdirSync(config.uploads.directory, { recursive: true });
            console.log(`Created uploads directory at ${config.uploads.directory}`);
        }
        catch (err) {
            console.error(`Failed to create uploads directory: ${err.message}`);
        }
    }
};
// Initialize the Express application
const app = express();
logDeploymentInfo();
try {
    const versionInfo = getVersionInfo();
    console.log("📋 Version Information:");
    console.log(`  - Version: ${versionInfo.version}`);
    console.log(`  - Build Hash: ${versionInfo.hash}`);
    console.log(`  - Environment: ${versionInfo.environment}`);
    console.log(`  - Branch: ${versionInfo.branch}`);
    console.log(`  - Build Time: ${new Date(versionInfo.timestamp).toLocaleString()}`);
    if (versionInfo.buildNumber) {
        console.log(`  - Build Number: ${versionInfo.buildNumber}`);
    }
}
catch (error) {
    console.log("📋 Version Information: Development build");
}
// Ensure HTML is never sent when the client expects JSON
app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
        res.setHeader("Content-Type", "application/json");
        const originalSend = res.send;
        res.send = function (body) {
            if (typeof body === "string" && body.startsWith("<!DOCTYPE html>")) {
                console.error("Prevented HTML response in API route:", req.path);
                return res.status(500).json({
                    error: "Server Error",
                    message: "The server attempted to return HTML instead of JSON",
                });
            }
            return originalSend.call(this, body);
        };
    }
    next();
});
// Basic CORS
app.use((_, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-user-id, x-user-email, x-user-role");
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 🔹 Block report submissions when disabled
app.use((req, res, next) => {
    if (disableReportSubmission &&
        req.path.startsWith("/api/scam-reports") &&
        req.method !== "GET") {
        return res.status(403).json({
            code: "REPORT_SUBMISSION_DISABLED",
            message: "Submitting new reports is temporarily disabled.",
        });
    }
    next();
});
// Apply MIME type headers
app.use((req, res, next) => {
    if (req.path.endsWith(".js"))
        res.setHeader("Content-Type", "application/javascript");
    else if (req.path.endsWith(".css"))
        res.setHeader("Content-Type", "text/css");
    next();
});
// Diagnostics route
app.get("/api/diagnostics", (req, res) => {
    import("os")
        .then((os) => {
        res.json({
            firebase: {
                apiKeyExists: !!process.env.VITE_FIREBASE_API_KEY,
                projectIdExists: !!process.env.VITE_FIREBASE_PROJECT_ID,
                appIdExists: !!process.env.VITE_FIREBASE_APP_ID,
                apiKey: process.env.VITE_FIREBASE_API_KEY ? "[REDACTED]" : null,
                projectId: process.env.VITE_FIREBASE_PROJECT_ID || null,
            },
            database: {
                databaseUrlExists: !!process.env.DATABASE_URL,
                pgHostExists: !!process.env.PGHOST,
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                port: process.env.PORT,
                isDocker: config.environment.isDocker,
                isReplit: config.environment.isReplit,
                isAzure: config.environment.isAzure,
            },
            server: {
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                hostname: os.hostname(),
            },
        });
    })
        .catch((err) => {
        res.json({ error: err.message || "Unknown error" });
    });
});
// Serve uploads
const uploadsDir = config.uploads.directory || path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsDir));
console.log(`Serving static files from: ${uploadsDir}`);
// API logging
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse;
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse)
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            if (logLine.length > 80)
                logLine = logLine.slice(0, 79) + "…";
            log(logLine);
        }
    });
    next();
});
(async () => {
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
    });
    if (app.get("env") === "development") {
        const { setupVite } = await import("./vite.js");
        await setupVite(app, server);
    }
    else {
        app.use(express.static(path.join(process.cwd(), "dist/public")));
        app.get("*", (req, res) => {
            res.sendFile(path.join(process.cwd(), "dist/public/index.html"));
        });
    }
    const port = process.env.PORT || config.server.port || 5000;
    const host = config.server.host || "0.0.0.0";
    server.listen({ port, host, reusePort: true }, () => {
        log(`🚀 Server running at http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
        validateConfig();
    });
})();
