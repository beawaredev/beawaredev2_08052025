# BeAware.fyi - Scam Reporting Platform

## Overview

BeAware.fyi is a community-driven scam reporting platform built with React, TypeScript, and Express.js. The application allows users to report scams, search through a database of verified scam reports, and get help through various resources including legal assistance and AI-powered guidance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: React Context for authentication, React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with TSX for execution
- **Database**: Azure SQL Database
- **ORM**: Drizzle ORM configured for Azure SQL (MSSQL dialect)
- **Authentication**: Firebase Auth integration with local user management

### Data Storage Solutions
- **Primary Database**: Azure SQL Database hosted on beawaredevdbserver.database.windows.net
- **Database Schema**: Users, scam reports, comments, consolidated scams, lawyer profiles, password reset tokens, and security checklist items
- **Storage Implementation**: AzureStorage class exclusively (MemStorage removed for production consistency)
- **File Storage**: Local file system with upload middleware (currently disabled)

## Key Components

### Authentication System
- Firebase Google OAuth integration
- Local email/password authentication
- JWT-like session management with localStorage
- Role-based access control (admin, user, lawyer)
- Password reset functionality via email

### Scam Reporting System
- User-submitted scam reports with categories (phone, email, business)
- Admin verification and publishing workflow
- File upload capability (currently disabled)
- Comment system for community feedback
- Consolidated scam tracking by identifier

### Email Service
- Gmail SMTP integration for password resets
- Configurable email templates
- Environment-based configuration for different providers

### Admin Panel
- Report verification and publishing controls
- User management capabilities
- System statistics and analytics
- Scam video management (planned feature)

## Data Flow

1. **User Registration/Login**: Users authenticate via Firebase or local accounts
2. **Scam Reporting**: Users submit reports → Admin verification → Publishing to public database
3. **Search and Discovery**: Users search consolidated scam database → View detailed reports
4. **Legal Help**: Users can request legal assistance (feature in development)
5. **Admin Workflow**: Admins verify reports, manage users, and publish content

## External Dependencies

### Firebase Integration
- Authentication service for Google OAuth
- Environment variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID

### Email Service
- Gmail SMTP for transactional emails
- Environment variables: EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD

### Azure SQL Database
- Primary data storage
- Connection via DATABASE_URL or individual Azure SQL configuration variables

### Third-Party Libraries
- shadcn/ui for component library
- React Query for server state management
- React Hook Form with Zod validation
- Recharts for data visualization
- Date-fns for date formatting

## Deployment Strategy

### Azure App Service Deployment
- Entry point: index.js with fallback startup strategies
- Production build via Vite
- Environment variable configuration for Azure SQL
- TypeScript execution via tsx loader

### Development Environment
- Replit-optimized development setup
- Hot module replacement with Vite
- Development server on configurable port (default 5000)

### Database Migration Strategy
- Drizzle ORM configured exclusively for Azure SQL Database
- Migration scripts for Azure SQL table creation and management
- Direct Azure SQL connection without fallback options

### Security Considerations
- CORS configuration for cross-origin requests
- Authentication headers for API requests
- Rate limiting for authentication endpoints
- Secure password reset token generation
- Environment variable management for sensitive data
- Azure Storage implementation with comprehensive security checklist functionality

### Recent Changes (January 2025)
- **Database Architecture**: Removed PostgreSQL dependencies and references, using Azure SQL Database exclusively
- **Storage Architecture**: Switched from MemStorage to Azure Storage exclusively for production consistency
- **Digital Security Checklist**: Implemented comprehensive 13-item security checklist with Azure Storage backend
- **API Integration**: Added security checklist endpoints with fallback data handling
- **Interface Compliance**: Updated AzureStorage class to fully implement IStorage interface
- **Package Cleanup**: Removed pg, postgres, and connect-pg-simple packages from dependencies
- **Security Checklist Database Schema**: Added security_checklist_items and user_security_progress tables to Azure SQL Database (July 26, 2025)
- **AzureStorage Security Methods**: Implemented real database queries for getAllSecurityChecklistItems(), getUserSecurityProgress(), and updateUserSecurityProgress() methods replacing mock data (July 26, 2025)
- **Checkbox Persistence**: Fixed Digital Security Checklist page to properly save user progress to Azure SQL Database instead of local storage only (July 26, 2025)
- **Google Login Flow**: Implemented user-controlled Google signup process with confirmation page instead of automatic account creation (July 26, 2025)
- **Database Schema Updates**: Added missing columns to scam_reports table (verified_at, published_at, has_proof_document, proof_file_*) to fix schema compatibility errors (July 26, 2025)
- **Random Username Generation**: Implemented automatic random username assignment during Google signup with adjective_animal_number format (e.g., "kind_fox_408") to eliminate null constraint issues (July 29, 2025)
- **Username Change API**: Added one-time username change functionality allowing users to modify their generated username after login (July 29, 2025)
- **Fixed Native Login**: Resolved database constraint issues and created test users to fix username/password authentication (July 30, 2025)
- **Launch Tool Buttons**: Added 🔗 Launch Tool buttons to Digital Security Checklist items with admin-editable URLs for external security tools (July 30, 2025)
- **Admin Edit Interface**: Implemented admin-only edit icons (✏️) and comprehensive edit modal for security checklist items including YouTube video embedding (July 30, 2025)
- **Admin Dashboard Integration**: Added Security Checklist management tab to main Dashboard for admin users with full CRUD functionality and video editing options (July 31, 2025)
- **Comprehensive Component Management**: Implemented complete admin interface for security checklist with statistics dashboard, category filtering, create/edit/delete operations, and bulk management capabilities using Azure SQL Database exclusively (July 31, 2025)
- **Admin Security Management**: Added visual indicators for components with launch tools and YouTube videos, priority-based filtering, and comprehensive form validation for creating new security components (July 31, 2025)
- **API Configuration Database Schema**: Fixed "Invalid object name 'api_configs'" error by creating the missing api_configs table in Azure SQL Database with proper schema including parameter_mapping and headers columns for runtime variable support (August 2, 2025)
- **Complete API Configuration Edit Interface**: Implemented comprehensive edit functionality for scam API configurations including update/delete mutations, detailed edit dialog with form validation, and proper authentication header handling for admin operations (August 5, 2025)
- **Enhanced API Testing with Custom Input Variables**: Added custom test input functionality allowing admins to provide variable input for API test calls, plus comprehensive API call details display showing full URL, method, headers, and request body used in external service calls (August 5, 2025)
- **Runtime Variable Substitution**: Implemented comprehensive template variable replacement supporting {{phone}}, {{email}}, {{url}}, {{ip}}, {{domain}}, {{input}}, {{apiKey}}, and {{key}} placeholders in both parameter mapping and URL templates with proper encoding (August 5, 2025)
- **Azure Authentication Fix**: Fixed middleware chain for API configuration endpoints by adding requireAuth before requireAdmin to ensure proper session authentication on Azure deployment, resolved Scam API tab visibility issue (August 5, 2025)
- **User-Facing Scam Lookup Interface**: Created comprehensive scam lookup page allowing general users to input phone numbers, emails, and websites to check against admin-configured APIs with real-time results display, organized by service type with response times and detailed formatting (August 5, 2025)
- **Enhanced Scam Lookup Result Display**: Implemented comprehensive visual formatting for API responses including color-coded risk assessment bars, reputation badges, organized detail grids, security alerts for abuse detection, and collapsible raw data sections for improved user experience (August 5, 2025)
- **Scam Lookup Error Handling**: Fixed 400 error handling in frontend to properly catch validation errors and display meaningful messages to users instead of failing silently, added comprehensive debugging for request/response tracking (August 5, 2025)
- **Authentication Required for Scam Lookup**: Restricted scam lookup functionality to logged-in users only, added authentication middleware to /api/scam-lookup and /api/api-configs/public endpoints, updated navigation to show scam lookup only for authenticated users with elegant login prompt page (August 6, 2025)
- **Enhanced User Privacy and Result Display**: Implemented comprehensive data sanitization for scam lookup results removing API keys, internal URLs, and sensitive system information from user-facing responses, improved error messaging with user-friendly language, and added privacy protection notices (August 6, 2025)
- **Security Score Header Display**: Added real-time security score percentage display in the main header near username, calculated from Digital Security Checklist completion progress, with color-coded indicators (red/orange/yellow/green) and clickable navigation to checklist page for improvement, visible on both desktop and mobile layouts (August 6, 2025)
- **Compact Interface Optimization**: Dramatically reduced footer size by 75%, compressed scam lookup interface with smaller headers/tabs/spacing, merged security details into single section with icon-only indicators, and optimized grid layouts for better space utilization ensuring results display without scrolling (August 6, 2025)
- **Digital Security Checklist Card Layout**: Redesigned security checklist with compact card-based layout, removed redundant page headers, implemented responsive 2-column grid with helpful page description in header, reduced font sizes and spacing, consolidated actions into smaller buttons, and optimized for better space utilization with truncated text and minimal padding (August 6, 2025)
- **Single-Line Footer Optimization**: Consolidated footer from 2 lines to 1 by moving legal links (Terms, Privacy, Disclaimer) and email contact inline with main navigation, maintaining all functionality while further reducing vertical space usage (August 6, 2025)
- **Bcrypt Password Security Implementation**: Implemented comprehensive bcrypt password hashing system with salt rounds of 12 for all user authentication including registration, login, and password reset flows, replacing plaintext password storage with secure hashing (August 7, 2025)
- **Password Strength Validation**: Added comprehensive password validation requiring minimum 8 characters, uppercase/lowercase letters, numbers, and special characters for enhanced security during user registration and password reset operations (August 7, 2025)
- **Secure Admin User Seeding**: Updated admin user creation to use bcrypt hashed passwords instead of plaintext passwords for development and testing environments, ensuring consistent security practices (August 7, 2025)
- **Comprehensive Security Checklist Fallback Data**: Fixed Digital Security Checklist showing non-relevant selections by expanding fallback data from 2 basic items to 13 comprehensive security items covering identity protection, password security, account security, device security, network security, and financial security with practical actionable recommendations (August 7, 2025)
- **Authentication Middleware Fix**: Fixed requireAuth middleware that was incorrectly allowing unauthenticated access by defaulting to admin user, now properly returns 401 for requests without valid authentication headers ensuring new users see clean unchecked security checklist (August 7, 2025)
- **Digital Security Checklist Database Integration Fix**: Resolved data persistence issue where selections weren't saving by fixing authentication headers in queryClient, now properly sends x-user-id, x-user-email, x-user-role headers for all API requests enabling real-time progress tracking and database synchronization (August 7, 2025)
- **API Configuration Table Creation Fix**: Fixed admin API creation attempting to create new table instead of inserting into existing api_configs table by removing redundant CREATE TABLE logic from AzureStorage.createApiConfig method (August 7, 2025)

The application is designed to be flexible across different deployment environments (Replit, Azure, local development) with comprehensive error handling and fallback mechanisms.