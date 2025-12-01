# Professional Executive Forum (PEF) Platform

## Overview
The Professional Executive Forum (PEF) is a global digital platform designed to collect structured information from professionals, job seekers, employers, business owners, and investors. The platform's current phase focuses on data collection and community building through member registration, profile management, and opportunity posting. Its future phase will implement intelligent matching to connect talent, capital, and business opportunities. PEF launches in Saudi Arabia with international access, emphasizing verified, high-quality data through an admin approval process to foster a trusted professional ecosystem.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (Dec 1, 2025)
- **Centralized Country-City Management System** - Fully implemented with admin CRUD operations at `/admin/locations`
- **Country-City Data in PostgreSQL** - 198 countries with phone codes seeded and synced with Drizzle ORM
- **Public API Endpoints** - `/api/locations/countries` and `/api/locations/countries/:countryId/cities` for dropdowns
- **All Forms Integrated** - Register, Signup, EditProfile, ProfileEdit all use centralized country/city/phone code dropdowns
- **Fixed Signup Form** - Added missing `useQuery` calls for countries and cities data
- **Phone Field Improvements** - All forms now auto-populate phone code from selected country

## System Architecture

### Frontend
The frontend uses React with TypeScript and Vite. It leverages `shadcn/ui` (built on Radix UI and Tailwind CSS) for its component library, `Wouter` for client-side routing, and `TanStack Query` for server state management. The design system incorporates a navy blue, light blue, and orange/gold color palette, Inter/Open Sans and Montserrat typography, and is responsive with a mobile-first approach. Multi-language support (English, Arabic, Urdu) is planned.

### Backend
The backend is built with Express.js on Node.js with TypeScript, featuring a RESTful API. It uses an abstracted storage interface, currently implemented with Firestore for data persistence. Infrastructure for session management with `connect-pg-simple` (for PostgreSQL) is in place. Development uses Vite middleware for HMR, while production uses esbuild.

### Data
Drizzle ORM is configured for Neon Serverless PostgreSQL, providing type-safe queries and migrations. The current schema includes a `users` table and is designed for sharing between client and server. Drizzle-Zod provides runtime validation. Future expansion will include multi-role profiles, role-specific data, opportunity listings, a member directory, and admin approval workflows.

### Centralized Location Management
The platform includes a centralized country-city management system where admins can:
- Enable/disable countries and cities for display in dropdowns across the site
- Edit display names to correct spellings or localize names
- Add new cities to countries
- Seed the initial country list from `server/data/countries.json`

**Admin Endpoints:**
- `GET /api/admin/countries` - List all countries (admin only)
- `PATCH /api/admin/countries/:id` - Update country (enabled, displayName)
- `GET /api/admin/countries/:countryId/cities` - List cities for a country
- `POST /api/admin/countries/:countryId/cities` - Add a new city
- `PATCH /api/admin/cities/:id` - Update city (enabled, displayName)
- `DELETE /api/admin/cities/:id` - Delete a city
- `POST /api/admin/seed-countries` - Seed countries from JSON file

**Public Endpoints (for dropdowns):**
- `GET /api/locations/countries` - Get enabled countries
- `GET /api/locations/countries/:countryId/cities` - Get enabled cities

**Admin UI:** `/admin/locations` - Two-column interface with countries list and cities list, search filtering, inline editing, and enable/disable toggles.

### Authentication & Authorization
Firebase Authentication handles user registration, login, and password resets. Firestore is the primary data store for all application data, including user profiles, opportunities, and applications, with server-side access via the Firebase Admin SDK. Users can complete registration and import LinkedIn profile data via OAuth 2.0. An admin panel allows filtering and managing user approval statuses. Security measures include user-specific cache keys for TanStack Query, authenticated queries, and mutation cache invalidation. **Critical security concern**: Firebase Admin SDK token verification is currently disabled in deployment when the service account is not configured, which is a severe vulnerability that must be addressed before production. Image uploads are authenticated and validated for MIME type, size, and path security.

## External Dependencies

### UI Component Libraries
- **Radix UI**: Accessible, unstyled UI primitives.
- **shadcn/ui**: Styled components built on Radix UI with Tailwind CSS.
- **Lucide React**: Icon library.
- **React Icons**: Additional icon sets (e.g., social media).
- **Embla Carousel**: Carousel/slider functionality.

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

### Development Tools
- **TypeScript**: For type safety.
- **Vite**: Fast development server and build tool.
- **esbuild**: Fast JavaScript bundler.
- **tsx**: TypeScript execution environment.

### Third-Party Integrations
- **Replit Plugins**: Development-specific tools.
- **Resend Email Service**: Transactional email service with abstraction layer for easy provider switching.
  - Current provider: Resend
  - Sender email: onboarding@resend.dev (requires domain verification for production)
  - Admin notifications sent to: abdulmoiz.cloud25@gmail.com
  - Email service abstraction layer located at: `server/services/email.service.ts`
  - To switch to SendGrid: Follow instructions in email.service.ts comments

### Asset Management
- **Attached Assets**: Generated images stored locally with Vite alias.

### Browser APIs & Utilities
- **date-fns**: Date utility library.
- **nanoid**: URL-safe unique ID generator.
- **wouter**: Minimal routing library.

### Session & Security
- **connect-pg-simple**: PostgreSQL session store.
- **Environment Variables**: `DATABASE_URL`, `NODE_ENV`, `RESEND_API_KEY`.

## Email Service Architecture

The platform uses an abstraction layer for email services, making it easy to switch providers without changing application code.

### Current Setup
- **Provider**: Resend
- **Service File**: `server/services/email.service.ts`
- **Sender Email**: onboarding@resend.dev (temporary, requires domain verification)
- **Admin Email**: abdulmoiz.cloud25@gmail.com

### Email Notifications
1. **Contact Form Submissions**
   - Admin notification: Sent to admin with full contact details and reply-to address
   - User confirmation: Sent to user confirming receipt and expected response time

2. **Opportunity Submissions**
   - Admin notification: Sent to admin with opportunity details and approval link
   - User confirmation: Sent to submitter confirming receipt and review process

### Switching Email Providers

To switch from Resend to SendGrid (or another provider):

1. Install the new provider's package:
   ```bash
   npm install @sendgrid/mail
   ```

2. Update `server/services/email.service.ts`:
   - Follow the detailed comments at the top of the file
   - Replace Resend implementation with SendGrid code (example provided)
   - Update the email sending logic in the `sendEmail()` method

3. Update environment variable:
   - Change `RESEND_API_KEY` to `SENDGRID_API_KEY`
   - Update the secret in Replit Secrets

4. Update sender email:
   - Change `fromEmail` in EmailService class to your verified domain

No other files need to be modified - all email sending is abstracted through the EmailService class.