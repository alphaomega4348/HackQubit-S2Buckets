import {
  Button,
  Card,
  Link,
  Stack,
  TextField,
  Typography,
  IconButton,
  LinearProgress,
  Alert,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api/posts";
import ErrorAlert from "./ErrorAlert";
import { isLoggedIn } from "../helpers/authHelper";
import HorizontalStack from "./util/HorizontalStack";
import UserAvatar from "./UserAvatar";

const PostEditor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [scanningImage, setScanningImage] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [containsHate, setContainsHate] = useState(false);

  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState({});
  const user = isLoggedIn();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    const errors = validate();
    setErrors(errors);
  };

  const performOCR = async (imageFile) => {
    try {
      setScanningImage(true);
      setOcrText("");
      setContainsHate(false);

      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch("/api/ocr/scan", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (err) {
        console.error("OCR endpoint returned non-JSON response:", text);
        setServerError("OCR scan failed: " + text.slice(0, 200));
        return false;
      }

      if (result.error) {
        setServerError(result.error);
        return false;
      }

      setOcrText(result.text || "");
      
      // Check if the word "hate" exists in the extracted text
      const hasHate = result.containsHate || false;
      setContainsHate(hasHate);

      return hasHate;
    } catch (err) {
      console.error("OCR Error:", err);
      setServerError("Failed to scan image content");
      return false;
    } finally {
      setScanningImage(false);
    }
  };

  const handleFileChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    
    setFile(f);
    setPreview(URL.createObjectURL(f));

    // Check if it's an image file
    if (f.type.startsWith("image/")) {
      // Perform OCR to check for hate content
      await performOCR(f);
    }

    // Auto upload to backend which uploads to Cloudinary
    await uploadFileToServer(f);
  };

  const uploadFileToServer = async (f) => {
    try {
      setUploadingImage(true);
      const data = new FormData();
      data.append("file", f);
      data.append("folder", "socialify/posts");

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: data,
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.error("Upload endpoint returned non-JSON response:", text);
        setServerError(
          "Upload failed: " +
            (text && text.length > 200 ? text.slice(0, 200) + "..." : text)
        );
        return;
      }

      if (json && json.secure_url) {
        setFormData((prev) => ({ ...prev, image: json.secure_url }));
      } else if (json && json.error) {
        setServerError(json.error);
      } else {
        setServerError("Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      setServerError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Block submission if hate content detected
    if (containsHate) {
      setServerError(
        "Cannot submit post: Image contains prohibited content (hate speech detected)"
      );
      return;
    }

    setLoading(true);

    // If file selected but image not yet uploaded, try uploading now
    if (file && !formData.image) {
      await uploadFileToServer(file);
    }

    const data = await createPost(formData, isLoggedIn());
    setLoading(false);
    if (data && data.error) {
      setServerError(data.error);
    } else {
      navigate("/posts/" + data._id);
    }
  };

  const validate = () => {
    const errors = {};
    return errors;
  };

  return (
    <Card>
      <Stack spacing={1}>
        {user && (
          <HorizontalStack spacing={2}>
            <UserAvatar width={50} height={50} username={user.username} />
            <Typography variant="h5">
              What would you like to post today {user.username}?
            </Typography>
          </HorizontalStack>
        )}

        <Typography>
          <a href="https://commonmark.org/help/" target="_blank">
            Markdown Help
          </a>
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <input
            id="post-file"
            type="file"
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <label htmlFor="post-file">
            <Button component="span" sx={{ mt: 1 }}>
              Attach file
            </Button>
          </label>

          {uploadingImage && (
            <>
              <LinearProgress sx={{ mt: 1, mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Uploading image...
              </Typography>
            </>
          )}

          {scanningImage && (
            <>
              <LinearProgress sx={{ mt: 1, mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Scanning image for content moderation...
              </Typography>
            </>
          )}

          {containsHate && (
            <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
              ⚠️ This image contains prohibited content and cannot be posted.
            </Alert>
          )}

          {preview && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography variant="subtitle2">Preview</Typography>
              <Box
                component="img"
                src={preview}
                alt="preview"
                sx={{ maxWidth: "100%", maxHeight: 280 }}
              />
            </Box>
          )}

          {ocrText && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography variant="subtitle2">Detected Text:</Typography>
              <Typography
                variant="body2"
                sx={{
                  p: 1,
                  bgcolor: "black",
                  borderRadius: 1,
                  fontSize: "0.85rem",
                }}
              >
                {ocrText || "No text detected"}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            label="Title"
            required
            name="title"
            margin="normal"
            onChange={handleChange}
            error={errors.title !== undefined}
            helperText={errors.title}
          />
          <TextField
            fullWidth
            label="Content"
            multiline
            rows={10}
            name="content"
            margin="normal"
            onChange={handleChange}
            error={errors.content !== undefined}
            helperText={errors.content}
            required
          />
          <ErrorAlert error={serverError} />
          <Button
            variant="outlined"
            type="submit"
            fullWidth
            disabled={loading || containsHate || scanningImage || uploadingImage}
            sx={{
              mt: 2,
            }}
          >
            {loading ? <>Submitting</> : <>Submit</>}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
};

export default PostEditor;