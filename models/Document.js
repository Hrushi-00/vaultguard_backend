const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: 
  {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  url:
   {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
   },
  cloudinaryId: 
  {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  size: 
  {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  type: 
  {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  uploadDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
