// Script to migrate existing local PDF files to Vercel Blob Storage
// Run with: node scripts/migrate-to-blob.js

const fs = require('fs').promises;
const path = require('path');
const { put } = require('@vercel/blob');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    console.log('🚀 Starting migration to Vercel Blob Storage...');
    
    // Get all statements with local file paths
    const statements = await prisma.statement.findMany({
      where: {
        filePath: {
          startsWith: '/uploads/'
        }
      },
      include: {
        card: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`📄 Found ${statements.length} statements to migrate`);

    let migrated = 0;
    let failed = 0;

    for (const statement of statements) {
      try {
        const localPath = path.join(process.cwd(), 'public', statement.filePath);
        
        // Check if file exists
        try {
          await fs.access(localPath);
        } catch (error) {
          console.log(`⚠️  File not found: ${localPath}, skipping...`);
          failed++;
          continue;
        }

        // Read the file
        const fileBuffer = await fs.readFile(localPath);
        const fileName = path.basename(statement.filePath);
        const ext = path.extname(fileName) || '.pdf';
        
        // Create blob path
        const blobFileName = `statements/${statement.card.userId}/${statement.cardId}/${statement.id}${ext}`;
        
        console.log(`📤 Uploading ${fileName} to blob storage...`);
        
        // Upload to Vercel Blob
        const blob = await put(blobFileName, fileBuffer, {
          access: 'public',
          addRandomSuffix: false,
          contentType: 'application/pdf'
        });

        // Update database with new blob URL
        await prisma.statement.update({
          where: { id: statement.id },
          data: { filePath: blob.url }
        });

        console.log(`✅ Migrated: ${fileName} -> ${blob.url}`);
        migrated++;

      } catch (error) {
        console.error(`❌ Failed to migrate statement ${statement.id}:`, error.message);
        failed++;
      }
    }

    console.log(`\n✨ Migration complete!`);
    console.log(`✅ Successfully migrated: ${migrated}`);
    console.log(`❌ Failed: ${failed}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToBlob();