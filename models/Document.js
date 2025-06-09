const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  url: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  cloudinaryId: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  size: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  uploadDate: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

documentSchema.index({ user: 1, uploadDate: -1 });

documentSchema.methods.isOwner = function(userId) {
  return this.user.toString() === userId.toString();
};

module.exports = mongoose.model('Document', documentSchema);
