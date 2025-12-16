# Professional Executive Forum (PEF) Platform

## Overview
The Professional Executive Forum (PEF) is a global digital platform for collecting structured information from professionals, job seekers, employers, business owners, and investors. Its primary purpose is data collection and community building through member registration, profile management, and opportunity posting. The long-term vision includes intelligent matching to connect talent, capital, and business opportunities. Launching in Saudi Arabia with international access, PEF emphasizes verified, high-quality data through an admin approval process to foster a trusted professional ecosystem.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses React with TypeScript and Vite, leveraging `shadcn/ui` (built on Radix UI and Tailwind CSS) for components, `Wouter` for routing, and `TanStack Query` for server state management. It features a navy blue, light blue, and orange/gold color palette, Inter/Open Sans and Montserrat typography, and a responsive, mobile-first design. Multi-language support (English, Arabic, Urdu) is planned.

### Backend
The backend is built with Express.js on Node.js with TypeScript, providing a RESTful API. It uses an abstracted storage interface currently implemented with Firestore for data persistence. Session management infrastructure with `connect-pg-simple` for PostgreSQL is in place.

### Data
Neon Serverless PostgreSQL is used with Drizzle ORM for type-safe queries and migrations. The schema includes a `users` table and is designed for shared client-server use. Drizzle-Zod provides runtime validation. The system supports multi-role profiles and role-specific data, with future expansion for opportunity listings, member directories, and admin approval workflows.

### Centralized Location Management
A comprehensive country-city management system allows admins to enable/disable countries and cities, edit display names, add new cities, and seed initial country data. Public API endpoints (`/api/locations/countries`, `/api/locations/countries/:countryId/cities`) provide data for dropdowns. The admin UI is at `/admin/locations`.

### Authentication & Authorization
Firebase Authentication handles user registration, login, and password resets. Firestore serves as the primary data store, with server-side access via the Firebase Admin SDK. Users can register and import LinkedIn data via OAuth 2.0. An admin panel manages user approval statuses. Image uploads are authenticated and validated. **Critical Security Note**: Firebase Admin SDK token verification is currently disabled in deployment without service account configuration, posing a severe vulnerability that must be addressed before production.

## External Dependencies

### UI Component Libraries
- **Radix UI**: Accessible, unstyled UI primitives.
- **shadcn/ui**: Styled components built on Radix UI with Tailwind CSS.
- **Lucide React, React Icons**: Icon libraries.
- **Embla Carousel**: Carousel functionality.

### Database & ORM
- **Neon Serverless PostgreSQL**: Cloud-native database.
- **Drizzle ORM**: Type-safe ORM.
- **Drizzle Kit**: Schema migration tool.
- **Drizzle Zod**: Integration for Zod validation.

### State Management & Data Fetching
- **TanStack Query**: Server state management with caching.

### Form Management
- **React Hook Form**: Performant form library.
- **Hookform Resolvers**: Validation resolvers for Zod.
- **Zod**: TypeScript-first schema validation.

### Styling & Design
- **Tailwind CSS**: Utility-first CSS framework.
- **PostCSS & Autoprefixer**: CSS processing.
- **class-variance-authority**: Type-safe variant API.
- **clsx & tailwind-merge**: Utilities for class composition.

### Third-Party Integrations
- **Resend Email Service**: Transactional email service with an abstraction layer (`server/services/email.service.ts`).
  - Current provider: Resend (sender: onboarding@resend.dev, admin notifications to: abdulmoiz.cloud25@gmail.com).
- **Replit Plugins**: Development-specific tools.
- **YouTube**: Official PEF channel integrated.

### Browser APIs & Utilities
- **date-fns**: Date utility library.
- **nanoid**: URL-safe unique ID generator.
- **wouter**: Minimal routing library.

### Session & Security
- **connect-pg-simple**: PostgreSQL session store.
- **Environment Variables**: `DATABASE_URL`, `NODE_ENV`, `RESEND_API_KEY`.