const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // removed required to bypass validation
  },
  country: {
    type: String,
    // removed required to bypass validation
  },
  currency: {
    type: String,
    // removed required to bypass validation
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', CompanySchema);
