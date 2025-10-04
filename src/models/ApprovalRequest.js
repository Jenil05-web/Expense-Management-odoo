// src/models/ApprovalRequest.js
/**
 * ApprovalRequest model for Expense Management System
 *
 * Tracks each step in the approval workflow for an expense.
 * Supports:
 * - Multi-level approvals (Manager → Finance → Director)
 * - Conditional approvals (percentage or specific role)
 * - Comments and timestamps for each decision
 */

const mongoose = require('mongoose');

const APPROVAL_STATUS = ['Pending', 'Approved', 'Rejected', 'Skipped'];

const ApprovalRequestSchema = new mongoose.Schema(
  {
    // Which company this approval belongs to
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    // Which expense is being approved
    expense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
      required: true
    },

    // Who needs to approve this (User)
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // The approver’s role (Manager, Finance, Director, etc.)
    approverRole: {
      type: String,
      trim: true,
      required: true
    },

    // Approval sequence number (1, 2, 3...) for multi-level flows
    sequence: {
      type: Number,
      required: true,
      default: 1
    },

    // Current approval status
    status: {
      type: String,
      enum: APPROVAL_STATUS,
      default: 'Pending'
    },

    // Optional comments left by the approver
    comments: {
      type: String,
      trim: true,
      default: ''
    },

    // When this approver acted
    actionAt: {
      type: Date
    },

    // Conditional rules tracking
    ruleApplied: {
      type: String, // e.g. "60%_APPROVAL", "CFO_AUTO_APPROVE"
      default: null
    },

    // Whether this step is currently active (ready for action)
    isActive: {
      type: Boolean,
      default: false
    },

    // For audit/logging purposes
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

/**
 * Helper: mark as approved
 */
ApprovalRequestSchema.methods.markApproved = function (comments = '') {
  this.status = 'Approved';
  this.comments = comments;
  this.actionAt = new Date();
  this.isActive = false;
  return this.save();
};

/**
 * Helper: mark as rejected
 */
ApprovalRequestSchema.methods.markRejected = function (comments = '') {
  this.status = 'Rejected';
  this.comments = comments;
  this.actionAt = new Date();
  this.isActive = false;
  return this.save();
};

/**
 * Helper: activate next step in the sequence
 */
ApprovalRequestSchema.statics.activateNextApprover = async function (expenseId, currentSequence) {
  const next = await this.findOne({
    expense: expenseId,
    sequence: currentSequence + 1
  });
  if (next) {
    next.isActive = true;
    await next.save();
  }
  return next;
};

/**
 * Helper: check percentage approvals
 * e.g., if 60% or more are approved => auto-approve
 */
ApprovalRequestSchema.statics.checkPercentageRule = async function (expenseId, thresholdPercent) {
  const approvals = await this.find({ expense: expenseId });
  const total = approvals.length;
  const approved = approvals.filter(a => a.status === 'Approved').length;

  const approvedPercent = (approved / total) * 100;
  return approvedPercent >= thresholdPercent;
};

/**
 * Helper: check if a specific approver (e.g., CFO) approved
 */
ApprovalRequestSchema.statics.checkSpecificApprover = async function (expenseId, roleName) {
  const approver = await this.findOne({
    expense: expenseId,
    approverRole: roleName,
    status: 'Approved'
  });
  return !!approver;
};

/**
 * toJSON cleanup
 */
ApprovalRequestSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('ApprovalRequest', ApprovalRequestSchema);
