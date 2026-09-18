const path = require('path');
const dns = require('dns');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Configure DNS for MongoDB Atlas SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

async function main() {
  const targetEmail = process.argv[2]?.trim().toLowerCase();

  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI is not defined in server/.env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB Atlas.');

    if (!targetEmail) {
      console.log('\n--- Existing User Accounts ---');
      const users = await User.find({}, 'name email role createdAt').sort({ createdAt: -1 });
      if (users.length === 0) {
        console.log('No users found in database.');
      } else {
        users.forEach((u, i) => {
          console.log(`[${i + 1}] Name: ${u.name} | Email: ${u.email} | Role: ${u.role || 'user'}`);
        });
      }
      console.log('\nUsage: node server/scripts/makeAdmin.js <user-email>\n');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Find the user by email
    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      console.error(`\nError: User with email "${targetEmail}" not found in database.`);
      console.log('\nAvailable users:');
      const users = await User.find({}, 'name email role').sort({ createdAt: -1 });
      users.forEach((u) => console.log(` - ${u.email} (Role: ${u.role || 'user'})`));
      await mongoose.disconnect();
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`\nUser "${user.email}" (${user.name}) already has role="admin".`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Update role to admin
    user.role = 'admin';
    await user.save();

    console.log(`\nSUCCESS: User "${user.email}" (${user.name}) has been promoted to role="admin"!`);
    console.log(`Verified DB Record -> ID: ${user._id}, Email: ${user.email}, Role: ${user.role}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

main();
