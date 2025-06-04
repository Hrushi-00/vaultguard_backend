const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const cloudinary = require('cloudinary').v2;
  
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.file;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(file.tempFilePath, {
      resource_type: 'auto',
      folder: 'vaultguard_docs',
    });

    // Create document record
    const newDocument = new Document({
      name: file.name,
      url: uploadResponse.secure_url,
      cloudinaryId: uploadResponse.public_id,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.mimetype,
      uploadDate: new Date(),
    });

    await newDocument.save();

    // Clean up temp file (non-blocking)
    await fs.promises.unlink(file.tempFilePath);

    res.status(201).json(newDocument);
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
    const docs = await Document.find().sort({ uploadDate: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.redirect(doc.url);
  } catch (error) {
    res.status(500).json({ message: 'Download failed', error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

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
    if (!req.body.name) {
      return res.status(400).json({ message: 'New name is required' });
    }

    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    
    doc.name = req.body.name;
    await doc.save();
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Rename failed', error: error.message });
  }
};

exports.searchDocuments = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search documents where name contains the query (case-insensitive)
    const docs = await Document.find({
      name: { $regex: query, $options: 'i' }
    }).sort({ uploadDate: -1 });

    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Error searching documents', error: error.message });
  }
};
