// Script to clean up local uploads directory after migration
// Run with: node scripts/cleanup-uploads.js

const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupUploads() {
  try {
    console.log('🧹 Starting cleanup of local uploads...');
    
    // Check if any statements still reference local files
    const localStatements = await prisma.statement.findMany({
      where: {
        filePath: {
          startsWith: '/uploads/'
        }
      }
    });

    if (localStatements.length > 0) {
      console.error(`❌ Cannot cleanup: ${localStatements.length} statements still reference local files`);
      console.error('Please run the migration script first: node scripts/migrate-to-blob.js');
      process.exit(1);
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    try {
      await fs.access(uploadsDir);
      
      // Remove the uploads directory
      await fs.rm(uploadsDir, { recursive: true, force: true });
      console.log('✅ Removed uploads directory');
      
    } catch (error) {
      console.log('ℹ️  Uploads directory does not exist or already removed');
    }

    console.log('✨ Cleanup complete!');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanupUploads();