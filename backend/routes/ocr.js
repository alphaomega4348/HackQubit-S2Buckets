// Backend API endpoint for OCR scanning
// File: routes/ocr.js or similar

const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');

// Configure multer for file uploads (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// OCR endpoint
router.post('/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Perform OCR using Tesseract
    const result = await Tesseract.recognize(
      req.file.buffer,
      'eng', // Language
      {
        logger: (m) => console.log(m), // Optional: log progress
      }
    );

    const extractedText = result.data.text;
    
    // Check for hate speech (case-insensitive)
    const lowerText = extractedText.toLowerCase();
    const containsHate = lowerText.includes('hate');

    // You can expand this to check for more words or use a more sophisticated
    // hate speech detection algorithm/API
    const prohibitedWords = ['hate','kill','ruin'];
    const foundWords = prohibitedWords.filter(word => 
      lowerText.includes(word)
    );

    return res.json({
      success: true,
      text: extractedText,
      containsHate: containsHate,
      foundWords: foundWords, // Optional: return which words were found
      confidence: result.data.confidence, // OCR confidence score
    });

  } catch (error) {
    console.error('OCR Error:', error);
    return res.status(500).json({ 
      error: 'Failed to process image',
      details: error.message 
    });
  }
});

module.exports = router;

