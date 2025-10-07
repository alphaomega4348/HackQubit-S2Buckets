const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadController = require("../controllers/uploadController");

// Use multer memory storage since we'll stream to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/uploads - expects 'file' field and optional 'folder' field
router.post("/", upload.single("file"), uploadController.upload);

module.exports = router;
