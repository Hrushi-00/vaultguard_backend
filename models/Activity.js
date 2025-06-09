const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['upload', 'download', 'share', 'login', 'delete', 'rename']
  },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: function() {
      return ['upload', 'download', 'share', 'delete', 'rename'].includes(this.type);
    }
  },
  userAgent: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema); 