const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

// Routes
router.post('/upload', documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.get('/search', documentController.searchDocuments);
router.get('/download/:id', documentController.downloadDocument);
router.delete('/:id', documentController.deleteDocument);
router.put('/rename/:id', documentController.renameDocument);

module.exports = router;
