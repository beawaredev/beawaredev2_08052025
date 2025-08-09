# BeAware.fyi - Scam Reporting Platform

## Overview
BeAware.fyi is a community-driven scam reporting platform enabling users to report scams, search verified reports, and access resources like legal assistance and AI-powered guidance. The project aims to provide a comprehensive tool for combating scams with a strong focus on community involvement and data-driven insights.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: React Context (authentication), React Query (server state)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (with TSX for execution)
- **Database**: Azure SQL Database
- **ORM**: Drizzle ORM (MSSQL dialect)
- **Authentication**: Firebase Auth integration with local user management
- **Email Service**: Gmail SMTP for transactional emails

### Data Storage Solutions
- **Primary Database**: Azure SQL Database
- **File Storage**: Local file system (currently disabled)
- **Security Checklist**: Comprehensive 13-item checklist with Azure SQL backend, supporting user progress tracking and admin management.

### Key Features
- **Authentication System**: Firebase Google OAuth, local email/password, JWT-like session, role-based access, password reset.
- **Scam Reporting System**: User-submitted reports by category, admin verification, comment system, consolidated scam tracking.
- **Admin Panel**: Report verification, user management, system statistics, scam video management (planned), and comprehensive security checklist management (CRUD, statistics, filtering).
- **Scam Lookup Interface**: User-facing tool to check phone numbers, emails, and websites against configured APIs, with real-time results, risk assessment, and detailed formatting.

### Security & Design Decisions
- **Authentication**: Bcrypt hashing for passwords (12 rounds), strong password validation, secure admin user seeding.
- **Data Privacy**: Comprehensive data sanitization for user-facing scam lookup results, hiding sensitive API information.
- **API Security**: All third-party scam lookup API calls use POST methods to hide sensitive information.
- **UI/UX**: Compact, optimized interfaces for footer, scam lookup, and digital security checklist with card-based layouts and responsive design.
- **Error Handling**: Comprehensive error handling and user-friendly error messages.

## External Dependencies

- **Firebase**: Authentication service (Google OAuth).
- **Azure SQL Database**: Primary data storage.
- **Gmail SMTP**: Email service for transactional emails.
- **Third-Party Libraries**:
    - `shadcn/ui`: Component library.
    - `React Query`: Server state management.
    - `React Hook Form` with `Zod`: Form validation.
    - `Recharts`: Data visualization.
    - `Date-fns`: Date formatting.