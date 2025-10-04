// src/models/User.js
/**
 * User model for Expense Management System
 * - Uses bcryptjs for password hashing
 * - Password is omitted from queries by default (select: false)
 * - Includes helpers: comparePassword, setPassword, toJSON cleanup
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

const ROLES = ['Admin', 'Manager', 'Employee'];

const ProfileSchema = new mongoose.Schema({
  phone: { type: String, trim: true, default: '' },
  designation: { type: String, trim: true, default: '' },
  avatarUrl: { type: String, trim: true, default: '' }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 1
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address']
  },

  // store hashed password; exclude from query results by default
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },

  role: {
    type: String,
    enum: ROLES,
    default: 'Employee'
  },

  // link to manager (another user)
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // reference to Company
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // whether this user (usually a manager) is set to be an approver
  isApprover: {
    type: Boolean,
    default: false
  },

  // whether the account is active
  isActive: {
    type: Boolean,
    default: true
  },

  lastLoginAt: {
    type: Date,
    default: null
  },

  // password reset / verification fields (optional)
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },

  profile: {
    type: ProfileSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Unique index on email
UserSchema.index({ email: 1 }, { unique: true });

/**
 * Pre-save hook: hash password if it was modified
 */
UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

/**
 * Instance method: compare a plain text password with stored hash
 * Usage: const ok = await user.comparePassword('plaintext');
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  // password field is select:false by default; ensure you selected it when calling
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance method: set a new password (hashes it)
 * Usage: await user.setPassword('newpass'); await user.save();
 */
UserSchema.methods.setPassword = async function (newPassword) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(newPassword, salt);
  return this;
};

/**
 * toJSON override: remove sensitive fields when converting to JSON
 */
UserSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

/**
 * Static helper: find by email (case-insensitive)
 */
UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: (email || '').toLowerCase().trim() });
};

module.exports = mongoose.model('User', UserSchema);
