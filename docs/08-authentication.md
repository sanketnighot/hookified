# Authentication Setup Guide

## Overview
This guide will help you set up Supabase authentication for the Hookified project with Google OAuth and passwordless email authentication.

## Prerequisites
- Node.js 18+ installed
- Docker and Docker Compose installed
- Supabase account

## Step 1: Supabase Project Setup

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization
   - Enter project details (name: "hookified")
   - Set a strong database password
   - Choose a region close to your users

2. **Configure Authentication**
   - Go to Authentication > Settings
   - Enable "Email" provider
   - Enable "Google" provider
   - Configure Google OAuth:
     - Go to [Google Cloud Console](https://console.cloud.google.com)
     - Create OAuth 2.0 credentials
     - Add authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
     - Copy Client ID and Client Secret to Supabase

3. **Get Supabase Credentials**
   - Go to Settings > API
   - Copy:
     - Project URL
     - Anon (public) key
     - Service role key (secret)

## Step 2: Environment Setup

1. **Copy environment template**
   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local` with your values**
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Database (Local Development)
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hookified"

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Step 3: Database Setup

1. **Start PostgreSQL with Docker**
   ```bash
   npm run db:up
   ```

2. **Run Prisma migrations**
   ```bash
   npm run db:migrate
   ```

3. **Generate Prisma client**
   ```bash
   npm run db:generate
   ```

4. **Optional: Open Prisma Studio**
   ```bash
   npm run db:studio
   ```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Step 6: Test Authentication Flows

### Email Authentication (Passwordless)
1. Click "Sign In" in the floating sidebar
2. Enter your email address
3. Check your email for the magic link
4. Click the link or enter the OTP code
5. You should be redirected to the dashboard

### Google Authentication
1. Click "Sign In" in the floating sidebar
2. Click "Google" button
3. Complete Google OAuth flow
4. You should be redirected to the dashboard

## Step 7: Production Deployment

### Database Migration
For production, you'll need to:
1. Update `DATABASE_URL` to your Supabase PostgreSQL connection string
2. Run migrations: `npm run db:migrate`

### Environment Variables
Set these in your deployment platform (Vercel, Netlify, etc.):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (Supabase PostgreSQL connection string)
- `NEXT_PUBLIC_APP_URL` (your production domain)

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check that all required env vars are set in `.env.local`
   - Restart the development server after adding env vars

2. **Database connection errors**
   - Ensure Docker is running: `docker ps`
   - Check if PostgreSQL is running: `npm run db:up`
   - Verify DATABASE_URL format

3. **Authentication not working**
   - Check Supabase project settings
   - Verify redirect URLs are correct
   - Check browser console for errors

4. **OTP not received**
   - Check spam folder
   - Verify email provider settings in Supabase
   - Check Supabase logs for delivery errors

### Useful Commands

```bash
# Database management
npm run db:up          # Start PostgreSQL
npm run db:down        # Stop PostgreSQL
npm run db:reset       # Reset database (removes all data)
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio

# Development
npm run dev            # Start development server
npm run build         # Build for production
npm run start         # Start production server
```

## Security Notes

- Never commit `.env.local` or `.env` files
- Use strong database passwords
- Regularly rotate Supabase service role keys
- Enable Row Level Security (RLS) in Supabase for additional security
- Use HTTPS in production

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check Supabase logs in the dashboard
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed
