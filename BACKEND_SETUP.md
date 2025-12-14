# Backend Setup Guide - FYB University Platform

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Cloudinary account (for image storage)
- SMTP email service (Gmail, SendGrid, etc.)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Fill in all required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/fyb_university?schema=public"

# JWT Secret (generate a strong random string)
JWT_SECRET="your-super-secret-jwt-key-here"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="FYB University <noreply@fybuniversity.com>"

# App URL
APP_URL="http://localhost:3000"
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 4. Seed Initial Data (Optional)

You can create a seed script to populate initial templates. Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Add seed data here
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Then add to `package.json`:

```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

### 5. Run Development Server

```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email?token=...` - Verify email
- `POST /api/auth/logout` - Logout user

### Templates

- `GET /api/templates` - Get all templates (with filters)
- `GET /api/templates/:id` - Get template by ID

### Downloads

- `POST /api/downloads/initiate` - Initiate download (checks payment)
- `POST /api/downloads/complete` - Complete download (after payment)

### Payments

- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment

### Admin

- `POST /api/admin/templates` - Create template (Admin only)
- `POST /api/admin/department-access` - Create department access code (Admin only)

## Database Models

### User
- Authentication and user management
- Roles: STUDENT, ADMIN, DEPARTMENT_ADMIN

### Template
- Flyer templates with configuration
- Categories: FYB, SIGNOUT

### Download
- Tracks user downloads
- Manages free edit eligibility

### Payment
- Payment records (currently simulated)
- Status: PENDING, COMPLETED, FAILED

### DepartmentAccess
- Department-specific access codes
- Expiry and usage limits

## Payment Integration

Currently, payments are **simulated**. To integrate Paystack:

1. Uncomment the Paystack code in `lib/payment.ts`
2. Add Paystack keys to `.env`:
   ```env
   PAYSTACK_SECRET_KEY="sk_live_..."
   PAYSTACK_PUBLIC_KEY="pk_live_..."
   ```
3. Update `PaymentService` to use real Paystack functions

## Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password in `SMTP_PASS`

### Other SMTP Providers

Update `SMTP_HOST`, `SMTP_PORT`, and credentials accordingly.

## Cloudinary Setup

1. Sign up at https://cloudinary.com
2. Get your credentials from dashboard
3. Add to `.env`

## Production Deployment

### Environment Variables

Ensure all production secrets are set:
- Strong `JWT_SECRET`
- Production database URL
- Production email credentials
- Cloudinary production credentials

### Database Migrations

```bash
npm run db:migrate
```

### Build

```bash
npm run build
npm start
```

## Security Notes

- All API routes are protected by JWT middleware
- Passwords are hashed with bcrypt
- Email verification required for login
- Department access codes have expiry and usage limits
- Payment verification prevents unauthorized access

## Troubleshooting

### Database Connection Issues

- Check PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Ensure database exists

### Email Not Sending

- Check SMTP credentials
- Verify firewall allows SMTP port
- Check spam folder

### Cloudinary Upload Fails

- Verify API keys are correct
- Check Cloudinary account status
- Verify image format is supported

## Next Steps

1. Set up production database
2. Configure production email service
3. Integrate real Paystack payment
4. Set up monitoring and logging
5. Configure rate limiting
6. Set up backup strategy

