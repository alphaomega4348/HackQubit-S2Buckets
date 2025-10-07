const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.upload = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  console.log("Received upload request. file size:", req.file.size, "bytes; folder:", req.body.folder);

  const stream = cloudinary.uploader.upload_stream(
    { folder: req.body.folder || "socialify/posts" },
    function (error, result) {
      if (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({ error: error.message || "Cloudinary upload failed" });
      }
      console.log("Cloudinary upload result:", result && result.public_id);
      return res.json({ secure_url: result.secure_url, public_id: result.public_id });
    }
  );

  try {
    stream.end(req.file.buffer);
  } catch (err) {
    console.error("Error streaming to Cloudinary:", err);
    return res.status(500).json({ error: "Failed to stream file to Cloudinary" });
  }
};
