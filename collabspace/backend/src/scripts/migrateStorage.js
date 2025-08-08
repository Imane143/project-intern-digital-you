const fs = require('fs');
const path = require('path');
const { db } = require('../config/database');
const { getDocumentPath, initializeStorage } = require('../config/storage');

// Initialize the new storage structure
initializeStorage();

console.log('Starting storage migration...');

// Get all documents from database
db.all('SELECT * FROM documents', [], (err, documents) => {
  if (err) {
    console.error('Failed to fetch documents:', err);
    process.exit(1);
  }

  console.log(`Found ${documents.length} documents to migrate`);

  let migrated = 0;
  let failed = 0;

  documents.forEach(doc => {
    const oldPath = doc.file_path;
    
    // Check if old file exists
    if (!fs.existsSync(oldPath)) {
      console.warn(`File not found: ${oldPath}`);
      failed++;
      return;
    }

    // Generate new path
    const newPath = getDocumentPath(doc.workspace_id, doc.name);
    
    try {
      // Copy file to new location
      fs.copyFileSync(oldPath, newPath);
      
      // Update database with new path
      db.run(
        'UPDATE documents SET file_path = ? WHERE id = ?',
        [newPath, doc.id],
        (err) => {
          if (err) {
            console.error(`Failed to update database for document ${doc.id}:`, err);
            failed++;
          } else {
            // Delete old file after successful migration
            try {
              fs.unlinkSync(oldPath);
            } catch (e) {
              console.warn(`Could not delete old file: ${oldPath}`);
            }
            migrated++;
            console.log(`Migrated: ${doc.original_name}`);
          }
        }
      );
    } catch (error) {
      console.error(`Failed to migrate ${doc.original_name}:`, error);
      failed++;
    }
  });

  setTimeout(() => {
    console.log('\nMigration Summary:');
    console.log(`Total documents: ${documents.length}`);
    console.log(`Successfully migrated: ${migrated}`);
    console.log(`Failed: ${failed}`);
    
    // Clean up old uploads directory if empty
    const oldUploadsDir = path.join(__dirname, '../../uploads');
    if (fs.existsSync(oldUploadsDir)) {
      try {
        fs.rmdirSync(oldUploadsDir, { recursive: true });
        console.log('\nCleaned up old uploads directory');
      } catch (e) {
        console.log('\nOld uploads directory still contains files');
      }
    }
    
    process.exit(failed > 0 ? 1 : 0);
  }, 2000);
});