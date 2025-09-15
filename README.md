# Buyer Lead Intake

A Next.js application for capturing, listing, and managing buyer leads with validation, search/filtering, and CSV import/export capabilities.

## Features

- **Authentication**: Email magic links and demo login option
- **Buyer Lead Management**: Create, edit, view, and delete buyer leads
- **Validation**: Form validation using Zod schemas
- **Search & Filtering**: Advanced search and filtering options
- **CSV Import/Export**: Import and export data in CSV format
- **Responsive Design**: Works on desktop and mobile devices
- **History Tracking**: Track changes to buyer leads

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM (easy to switch to PostgreSQL)
- **Authentication**: NextAuth.js
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 18.x or higher

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Database (Using SQLite for local development)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="this-is-a-development-secret-key-change-in-production"

# Email (using SendGrid)
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="apikey"
# Your SendGrid API key
EMAIL_SERVER_PASSWORD="SENDGRID_API_KEY"
EMAIL_FROM="your_email_id"
```

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up the database:

```bash
npx prisma migrate dev
npx prisma db seed
# or
yarn prisma migrate dev
yarn prisma db seed
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

- **/prisma** - Database schema and migrations
- **/public** - Static assets
- **/src**
  - **/app** - Next.js App Router pages and API routes
  - **/components** - React components
  - **/lib** - Utility functions and shared logic

## Data Model

### Buyer Lead

- **fullName**: Full name of the buyer (required)
- **email**: Email address (optional)
- **phone**: Phone number (required)
- **city**: Location (Chandigarh, Mohali, Zirakpur, Panchkula, Other)
- **propertyType**: Type of property (Apartment, Villa, Plot, Office, Retail)
- **bhk**: Number of bedrooms (Studio, One, Two, Three, Four) - required for Apartment and Villa
- **purpose**: Purpose (Buy, Rent)
- **budgetMin**: Minimum budget (optional)
- **budgetMax**: Maximum budget (optional)
- **timeline**: Purchase timeline (ZeroToThreeMonths, ThreeToSixMonths, MoreThanSixMonths, Exploring)
- **source**: Lead source (Website, Referral, WalkIn, Call, Other)
- **status**: Current status (New, Qualified, Contacted, Visited, Negotiation, Converted, Dropped)
- **notes**: Additional notes or requirements (optional)
- **tags**: Custom tags for categorization (stored as comma-separated string)

## API Routes

- **GET /api/buyers** - List buyers with filtering and pagination
- **POST /api/buyers** - Create a new buyer lead
- **GET /api/buyers/[id]** - Get a specific buyer lead
- **PUT /api/buyers/[id]** - Update a buyer lead
- **DELETE /api/buyers/[id]** - Delete a buyer lead
- **GET /api/buyers/csv** - Export buyers as CSV
- **POST /api/buyers/csv** - Import buyers from CSV

## License

This project is licensed under the MIT License.
