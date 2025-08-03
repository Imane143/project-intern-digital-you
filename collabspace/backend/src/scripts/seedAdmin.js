const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('../config/database');
require('dotenv').config();

const seedAdmin = async () => {
  const adminEmail = 'admin@collabspace.com';
  const adminPassword = 'admin123456';
  const adminName = 'System Admin';

  try {
    // Initialize database first
    await new Promise((resolve) => {
      initDatabase();
      setTimeout(resolve, 2000); // Wait for tables to be created
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    db.run(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [adminEmail, hashedPassword, adminName, 'admin'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            console.log('Admin user already exists');
          } else {
            console.error('Error creating admin user:', err);
          }
          process.exit(1);
        } else {
          console.log('Admin user created successfully');
          console.log('Email:', adminEmail);
          console.log('Password:', adminPassword);
          console.log('Please change the password after first login');
          process.exit(0);
        }
      }
    );
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

setTimeout(seedAdmin, 1000);