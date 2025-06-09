const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticate } = require('../middleware/auth');

// Routes - all protected with authentication
router.post('/upload', authenticate, documentController.uploadDocument);
router.get('/', authenticate, documentController.getDocuments);
router.get('/search', authenticate, documentController.searchDocuments);
router.get('/download/:id', authenticate, documentController.downloadDocument);
router.delete('/:id', authenticate, documentController.deleteDocument);
router.put('/rename/:id', authenticate, documentController.renameDocument);

module.exports = router;
