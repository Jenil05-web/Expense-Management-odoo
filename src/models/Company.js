// src/models/Company.js
/**
 * Company model for Expense Management System
 *
 * Features:
 * - Auto-detects currency for the company's country
 * - Links to users (Admin, Managers, Employees)
 * - Stores approval flow settings and business details
 * - Tracks when company data was created/updated
 */

const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },

    // Optional unique company registration ID or code
    registrationNumber: {
      type: String,
      trim: true,
      unique: false
    },

    // Country info (used for currency)
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true
    },

    // Default currency (e.g., "USD", "INR", etc.)
    currency: {
      type: String,
      required: [true, 'Currency code is required'],
      uppercase: true,
      trim: true
    },

    // Company address and contact details (optional)
    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true }
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, 'Please provide a valid email address']
    },

    phoneNumber: {
      type: String,
      trim: true
    },

    // Link to admin user
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Approval flow configuration reference (optional)
    approvalFlow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApprovalFlow',
      default: null
    },

    // Whether the company is active in the system
    isActive: {
      type: Boolean,
      default: true
    },

    // API or integration settings
    integrationSettings: {
      currencyApiBase: {
        type: String,
        default: 'https://api.exchangerate-api.com/v4/latest/'
      },
      countryApiBase: {
        type: String,
        default: 'https://restcountries.com/v3.1/all?fields=name,currencies'
      }
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

/**
 * Virtual: display label combining name and currency
 * e.g. "TechNova Pvt Ltd (USD)"
 */
CompanySchema.virtual('label').get(function () {
  return `${this.name} (${this.currency})`;
});

/**
 * Static helper to create a company automatically on first signup
 * @param {Object} adminUser - User document for the admin
 * @param {String} country - Country name
 * @param {String} currency - Currency code (default derived from API)
 */
CompanySchema.statics.createDefaultCompany = async function (adminUser, country, currency) {
  const company = await this.create({
    name: `${adminUser.name}'s Company`,
    country,
    currency,
    admin: adminUser._id,
    contactEmail: adminUser.email
  });
  return company;
};

/**
 * toJSON cleanup
 */
CompanySchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Company', CompanySchema);
