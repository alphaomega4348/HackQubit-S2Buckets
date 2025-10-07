const express = require("express");
const router = express.Router();
const multer = require("multer");
const tesseract = require("node-tesseract-ocr");
const fs = require("fs").promises;
const path = require("path");

// Configure multer for temporary file storage
const upload = multer({
  dest: "temp/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// OCR configuration
const tesseractConfig = {
  lang: "eng", // English language
  oem: 1, // OCR Engine Mode: LSTM only
  psm: 3, // Page segmentation mode: Fully automatic page segmentation
};

router.post("/extract", upload.single("image"), async (req, res) => {
  let tempFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    tempFilePath = req.file.path;

    // Perform OCR on the image
    const text = await tesseract.recognize(tempFilePath, tesseractConfig);

    // Clean up the extracted text
    const cleanedText = text.trim();

    // Delete temporary file
    await fs.unlink(tempFilePath);

    res.json({
      success: true,
      text: cleanedText,
    });
  } catch (error) {
    console.error("OCR extraction error:", error);

    // Clean up temp file if it exists
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (unlinkError) {
        console.error("Failed to delete temp file:", unlinkError);
      }
    }

    res.status(500).json({
      error: "Failed to extract text from image",
      details: error.message,
    });
  }
});

module.exports = router;