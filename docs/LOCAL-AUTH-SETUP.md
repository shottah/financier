# Local Authentication Setup

This guide explains how to set up Clerk authentication for local development.

## Overview

For local development, the application automatically syncs user data without requiring webhooks, since Clerk webhooks cannot reach your local environment.

The application uses custom authentication pages that match the app's design, keeping users on your domain throughout the authentication process.

## Setup Steps

1. **Create a Clerk Application**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Create a new application
   - Enable Google OAuth in Social Connections

2. **Configure Environment Variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env.local
   
   # Add your Clerk keys from the dashboard
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

3. **Run the Application**
   ```bash
   yarn dev
   ```

## How It Works

### Local Development
- When a user signs in, the application automatically syncs their Clerk profile to the local database
- No webhook configuration is needed
- User data is synced on every authenticated request if not found in the database

### Production Deployment
- Set up Clerk webhooks pointing to `https://yourdomain.com/api/webhooks/clerk`
- Add the webhook signing secret: `CLERK_WEBHOOK_SECRET=whsec_...`
- Webhooks will keep user data in sync automatically

## Testing Authentication

1. Start the development server
2. Navigate to http://localhost:3000
3. You'll be redirected to the sign-in page
4. Sign in with Google
5. Your user will be automatically created in the local database

## Troubleshooting

### User not syncing
- Check that your Clerk keys are correctly set in `.env.local`
- Ensure the database migrations have been run: `yarn db:migrate`
- Check the console for any error messages

### Authentication errors
- Clear your browser cookies and try signing in again
- Verify your Clerk application is properly configured
- Check that Google OAuth is enabled in your Clerk dashboard