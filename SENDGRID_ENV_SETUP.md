# SendGrid Environment Setup

## Required Environment Variable

Add the following line to your `.env.local` file:

```bash
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

## Complete .env.local Template

Here's a complete template for your `.env.local` file:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Firebase Configuration (add your actual values)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for server-side operations)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com

# Redis Configuration (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

## Next Steps

1. Create or update your `.env.local` file with the SendGrid API key
2. Restart your development server (`npm run dev`)
3. Test the email functionality by setting up notifications in the app

## Testing Email Functionality

To test that SendGrid is working:

1. Go to Settings → Notifications in the Application Console
2. Enable email notifications
3. Set a daily target
4. Configure reminder and summary times
5. The app will now send emails from `noreply@appconsole.tech`

## Security Note

Make sure your `.env.local` file is in your `.gitignore` to prevent committing sensitive API keys to version control.
