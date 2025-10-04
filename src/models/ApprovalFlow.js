const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the approval flow schema
const ApprovalFlowSchema = new Schema({
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  levels: [
    {
      levelNumber: { type: Number, required: true }, // e.g., 1 = Manager, 2 = Finance
      approvers: [
        {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      rule: {
        type: String,
        enum: ['ALL', 'ANY', 'PERCENTAGE', 'SPECIFIC'], // Rule type
        default: 'ALL',
      },
      percentageRequired: {
        type: Number, // Only used if rule = 'PERCENTAGE'
      },
      specificApprover: {
        type: Schema.Types.ObjectId, // Only used if rule = 'SPECIFIC'
        ref: 'User',
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

/**
 * Method to get the next level based on current level number
 */
ApprovalFlowSchema.methods.getNextLevel = function(currentLevelNumber) {
  return this.levels.find(level => level.levelNumber === currentLevelNumber + 1);
};

/**
 * Method to check if a level is approved based on rule
 * @param {Object} level - level object from flow
 * @param {Array} approvals - array of userIds who approved
 */
ApprovalFlowSchema.methods.isLevelApproved = function(level, approvals) {
  if (!level || !approvals) return false;

  switch(level.rule) {
    case 'ALL':
      return level.approvers.every(approverId =>
        approvals.includes(approverId.toString())
      );
    case 'ANY':
      return level.approvers.some(approverId =>
        approvals.includes(approverId.toString())
      );
    case 'PERCENTAGE':
      const approvedCount = level.approvers.filter(approverId =>
        approvals.includes(approverId.toString())
      ).length;
      const required = Math.ceil((level.percentageRequired / 100) * level.approvers.length);
      return approvedCount >= required;
    case 'SPECIFIC':
      return approvals.includes(level.specificApprover.toString());
    default:
      return false;
  }
};

module.exports = mongoose.model('ApprovalFlow', ApprovalFlowSchema);
