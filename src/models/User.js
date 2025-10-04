// src/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

// Use lowercase for consistency
const ROLES = ['admin', 'manager', 'employee'];

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

  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },

  role: {
    type: String,
    enum: ROLES,
    default: 'employee'
  },

  // Make company optional during signup
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false
  },

  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  isApprover: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  lastLoginAt: {
    type: Date,
    default: null
  },

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

// Hash password before saving
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

// Compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Set new password
UserSchema.methods.setPassword = async function (newPassword) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(newPassword, salt);
  return this;
};

// Remove sensitive data
UserSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

// Find by email
UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: (email || '').toLowerCase().trim() });
};

module.exports = mongoose.model('User', UserSchema);
