const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User"); // adjust path if needed

// Replace with your MongoDB connection string
const MONGO_URI = "mongodb://127.0.0.1:27017/your-db-name";

async function fixPasswords() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");

    // Find users with missing or null password
    const users = await User.find({ $or: [{ password: { $exists: false } }, { password: null }] });
    console.log(`Found ${users.length} users without passwords`);

    for (const user of users) {
      const hashed = await bcrypt.hash("Temp1234!", 10); // temporary password
      user.password = hashed;
      await user.save();
      console.log(`Password set for user: ${user.email}`);
    }

    console.log("All missing passwords fixed.");
    process.exit(0);
  } catch (err) {
    console.error("Error fixing passwords:", err);
    process.exit(1);
  }
}

fixPasswords();
