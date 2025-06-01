# Vercel Blob Storage Setup

This application uses Vercel Blob Storage for storing PDF statements instead of the local file system.

## Setup Instructions

1. **Create a Blob Store**
   - Go to your Vercel Dashboard
   - Navigate to the "Storage" tab
   - Create a new Blob Store
   - Copy the `BLOB_READ_WRITE_TOKEN`

2. **Add Environment Variable**
   ```bash
   # Add to your .env.local
   BLOB_READ_WRITE_TOKEN=vercel_blob_...
   ```

3. **Deploy to Vercel**
   - The token will be automatically available in your Vercel deployment
   - No additional configuration needed

## How It Works

### Upload Flow
1. User uploads a PDF file through the UI
2. The file is sent to `/api/statements/upload`
3. The API uploads the file to Vercel Blob Storage
4. The blob URL is stored in the database

### Storage Structure
Files are organized in the blob storage as:
```
statements/
  └── {userId}/
      └── {cardId}/
          └── {timestamp}.pdf
```

### Processing Flow
1. When processing a statement, the API fetches the PDF from the blob URL
2. The PDF is processed in memory (not saved locally)
3. Results are stored in the database

## Benefits

- **No local storage needed** - Works perfectly with serverless deployments
- **Global CDN** - PDFs are served from Vercel's edge network
- **Automatic scaling** - No need to worry about storage limits
- **Secure** - Files are only accessible to authenticated users
- **Cost effective** - Pay only for what you use

## Local Development

The same blob storage is used in local development. Make sure you have the `BLOB_READ_WRITE_TOKEN` in your `.env.local` file.

## Migration from Local Storage

If you have existing files in `/public/uploads`, they will continue to work as the system supports both blob URLs and local paths. New uploads will automatically use Vercel Blob Storage.