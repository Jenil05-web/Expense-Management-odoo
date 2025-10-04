// src/models/Expense.js
/**
 * Expense model for Expense Management System
 *
 * Key features:
 * - Supports multi-currency expenses
 * - Tracks approval status and approver chain
 * - Stores receipt file paths (for OCR/verification)
 * - References employee (creator) and company
 * - Includes automatic timestamps
 */

const mongoose = require('mongoose');

// Define allowed expense statuses
const EXPENSE_STATUS = [
  'Draft',
  'Submitted',
  'PendingApproval',
  'Approved',
  'Rejected'
];

// Optional categories (can later be dynamic)
const EXPENSE_CATEGORIES = [
  'Travel',
  'Food',
  'Accommodation',
  'Office Supplies',
  'Transportation',
  'Entertainment',
  'Other'
];

const ExpenseSchema = new mongoose.Schema(
  {
    // Which company this expense belongs to
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    // Who created/submitted the expense
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Optional manager currently responsible for approving
    currentApprover: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // Expense amount and currency (can differ from company’s currency)
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Amount must be positive']
    },

    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      trim: true,
      default: 'USD'
    },

    // Converted amount (to company base currency) – optional
    convertedAmount: {
      type: Number,
      default: 0
    },

    // Category (e.g., Travel, Food)
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      default: 'Other'
    },

    description: {
      type: String,
      trim: true,
      default: ''
    },

    expenseDate: {
      type: Date,
      required: [true, 'Expense date is required']
    },

    // Array of receipt file paths (for uploaded files)
    receipts: [
      {
        filename: String,
        url: String, // e.g. '/uploads/receipts/xxx.png'
        uploadedAt: { type: Date, default: Date.now }
      }
    ],

    // Current approval status
    status: {
      type: String,
      enum: EXPENSE_STATUS,
      default: 'Draft'
    },

    // Tracks each approval step (manager, finance, director, etc.)
    approvals: [
      {
        approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, trim: true }, // e.g., 'Manager', 'Finance'
        action: { type: String, enum: ['Approved', 'Rejected', 'Pending'], default: 'Pending' },
        comments: { type: String, trim: true },
        actedAt: { type: Date }
      }
    ],

    // Final remarks (admin override, rejection reason, etc.)
    finalComments: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true // createdAt and updatedAt
  }
);

/**
 * Virtual: human-friendly label combining category and amount
 * e.g., "Travel - 300 USD"
 */
ExpenseSchema.virtual('label').get(function () {
  return `${this.category} - ${this.amount} ${this.currency}`;
});

/**
 * Helper: mark as submitted
 */
ExpenseSchema.methods.submit = function () {
  this.status = 'Submitted';
  return this.save();
};

/**
 * Helper: record an approval decision
 */
ExpenseSchema.methods.addApproval = function (approverId, role, action, comments) {
  this.approvals.push({
    approver: approverId,
    role,
    action,
    comments,
    actedAt: new Date()
  });

  // Automatically update overall status
  if (action === 'Rejected') {
    this.status = 'Rejected';
  } else if (action === 'Approved') {
    const allApproved = this.approvals.every(a => a.action === 'Approved');
    if (allApproved) this.status = 'Approved';
    else this.status = 'PendingApproval';
  }
  return this.save();
};

/**
 * toJSON cleanup: remove Mongoose internals
 */
ExpenseSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Expense', ExpenseSchema);
