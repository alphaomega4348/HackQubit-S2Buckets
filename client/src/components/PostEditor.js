import {
  Button,
  Card,
  Stack,
  TextField,
  Typography,
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
  const [processingOCR, setProcessingOCR] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [moderationWarning, setModerationWarning] = useState("");

  const [serverError, setServerError] = useState("");
  const [errors, setErrors] = useState({});
  const user = isLoggedIn();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    const errors = validate();
    setErrors(errors);
  };

  // Perform OCR on the image
  const performOCR = async (file) => {
    try {
      setProcessingOCR(true);
      setModerationWarning("");
      
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/ocr/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        console.error("OCR Error:", data.error);
        return null;
      }

      return data.text || "";
    } catch (err) {
      console.error("OCR extraction failed:", err);
      return null;
    } finally {
      setProcessingOCR(false);
    }
  };

  // Moderate content using Gemini
  const moderateContent = async (text) => {
    try {
      const res = await fetch("/api/moderate/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (data.error) {
        console.error("Moderation Error:", data.error);
        return { allowed: true }; // Fail open in case of error
      }

      return {
        allowed: data.allowed,
        reason: data.reason,
        cleanedText: data.cleanedText,
      };
    } catch (err) {
      console.error("Content moderation failed:", err);
      return { allowed: true }; // Fail open in case of error
    }
  };

  const handleFileChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setModerationWarning("");

    // Perform OCR on the image
    const extractedText = await performOCR(f);
    
    if (extractedText) {
      setOcrText(extractedText);
      
      // Moderate the extracted text
      const moderation = await moderateContent(extractedText);
      
      if (!moderation.allowed) {
        setModerationWarning(
          moderation.reason || "Image contains inappropriate content and cannot be uploaded."
        );
        // Clear the file selection
        setFile(null);
        setPreview(null);
        setOcrText("");
        return;
      }
    }

    // If moderation passed, upload to server
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

    // Check if there's a moderation warning
    if (moderationWarning) {
      setServerError("Cannot submit post with flagged content");
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

          {processingOCR && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography variant="caption">Processing image content...</Typography>
              <LinearProgress />
            </Box>
          )}

          {uploadingImage && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography variant="caption">Uploading image...</Typography>
              <LinearProgress />
            </Box>
          )}

          {moderationWarning && (
            <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
              {moderationWarning}
            </Alert>
          )}

          {preview && !moderationWarning && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography variant="subtitle2">Preview</Typography>
              <Box
                component="img"
                src={preview}
                alt="preview"
                sx={{ maxWidth: "100%", maxHeight: 280 }}
              />
              {ocrText && (
                <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                  Detected text: {ocrText.substring(0, 100)}
                  {ocrText.length > 100 ? "..." : ""}
                </Typography>
              )}
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
            disabled={loading || processingOCR || !!moderationWarning}
            sx={{ mt: 2 }}
          >
            {loading ? <>Submitting</> : <>Submit</>}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
};

export default PostEditor;