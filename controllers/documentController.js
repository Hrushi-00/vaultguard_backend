const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
  
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify user exists and get their ID
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const file = req.files.file;

    // Upload to Cloudinary with user-specific folder
    const uploadResponse = await cloudinary.uploader.upload(file.tempFilePath, {
      resource_type: 'auto',
      folder: `vaultguard_docs/${user._id}`, // Create user-specific folder
      public_id: `${user._id}_${Date.now()}`, // Add user ID to filename
    });

    // Create document record with strict user ownership
    const newDocument = new Document({
      user: user._id, // Store as ObjectId
      name: file.name,
      url: uploadResponse.secure_url,
      cloudinaryId: uploadResponse.public_id,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.mimetype,
      uploadDate: new Date(),
      owner: user._id, // Additional owner field for extra security
    });

    // Save document with user ownership
    await newDocument.save();

    // Clean up temp file (non-blocking)
    await fs.promises.unlink(file.tempFilePath);

    // Return document with user information
    const populatedDoc = await Document.findById(newDocument._id)
      .populate('user', 'email fullName')
      .select('-__v');

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: populatedDoc
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Upload failed',
      error: error.message,
    });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const docs = await Document.find({ user: user._id.toString() })
      .select('-__v')
      .sort({ uploadDate: -1 });
    
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const doc = await Document.findOne({ 
      _id: req.params.id,
      user: user._id.toString()
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found or access denied' });
    }

    res.redirect(doc.url);
  } catch (error) {
    res.status(500).json({ message: 'Download failed', error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const doc = await Document.findOne({ 
      _id: req.params.id,
      user: user._id.toString()
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found or access denied' });
    }

    // Delete from Cloudinary
    if (doc.cloudinaryId) {
      await cloudinary.uploader.destroy(doc.cloudinaryId);
    }

    // Delete from database
    await Document.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};

exports.renameDocument = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!req.body.name) {
      return res.status(400).json({ message: 'New name is required' });
    }

    const doc = await Document.findOne({ 
      _id: req.params.id,
      user: user._id.toString()
    });

    if (!doc) {
      return res.status(404).json({ message: 'Document not found or access denied' });
    }
    
    doc.name = req.body.name;
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Rename failed', error: error.message });
  }
};

exports.searchDocuments = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const docs = await Document.find({
      user: user._id.toString(),
      name: { $regex: query, $options: 'i' }
    })
    .select('-__v')
    .sort({ uploadDate: -1 });

    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Error searching documents', error: error.message });
  }
};
