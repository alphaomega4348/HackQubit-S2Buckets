import {
  Button,
  Card,
  Snackbar,
  Alert,
  Stack,
  TextField,
  Typography,
  LinearProgress,
} from "@mui/material";
import { Box } from "@mui/system";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api/posts";
import { isLoggedIn } from "../helpers/authHelper";
import HorizontalStack from "./util/HorizontalStack";
import UserAvatar from "./UserAvatar";

const PostEditor = () => {
  const navigate = useNavigate();
  const user = isLoggedIn();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [scanningImage, setScanningImage] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [moderationData, setModerationData] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    image: "",
  });

  const showToast = (message, severity = "info") => {
    setToast({ open: true, message, severity });
  };

  const closeToast = () => setToast({ ...toast, open: false });

  const performOCR = async (imageFile) => {
    try {
      setScanningImage(true);
      const fd = new FormData();
      fd.append("image", imageFile);
      const res = await fetch("/api/ocr/scan", { method: "POST", body: fd });
      const json = await res.json();
      setOcrText(json.text || "");
      return json.text || "";
    } catch (err) {
      showToast("OCR scan failed", "error");
      return "";
    } finally {
      setScanningImage(false);
    }
  };

  const uploadFileToServer = async (f) => {
    try {
      setUploadingImage(true);
      const data = new FormData();
      data.append("file", f);
      data.append("folder", "socialify/posts");
      const res = await fetch("/api/uploads", { method: "POST", body: data });
      const json = await res.json();
      if (json.secure_url) {
        setFormData((prev) => ({ ...prev, image: json.secure_url }));
      } else {
        showToast("Image upload failed", "error");
      }
    } catch (err) {
      showToast("Upload error", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    if (f.type.startsWith("image/")) await performOCR(f);
    await uploadFileToServer(f);
  };

  const handleModerationCheck = async (text, context = null) => {
    try {
      const body = { text };
     context="normal post by anonymous guy"
      const res = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setModerationData(data);
      if (data.overall_classification === "offensive") {
        showToast(`⚠️ Offensive (${data.overall_score}%) - ${data.justification}`, "error");
      } else if (data.overall_classification === "risky") {
        showToast(`⚠️ Risky (${data.overall_score}%) - ${data.justification}`, "warning");
      } else {
        showToast("✅ Safe to post", "success");
      }
    } catch (err) {
      showToast("Moderation check failed", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const combinedText = `${formData.title}\n${formData.content}\n${ocrText}`;
    await handleModerationCheck(combinedText);
    if (moderationData?.overall_classification === "offensive") return;
    setLoading(true);
    const data = await createPost(formData, user);
    setLoading(false);
    if (data.error) showToast(data.error, "error");
    else navigate(`/posts/${data._id}`);
  };

  const getClassificationColor = (classification) => {
    switch (classification) {
      case "safe":
        return "#4caf50"; // green
      case "risky":
        return "#ff9800"; // orange
      case "offensive":
        return "#f44336"; // red
      default:
        return "#9e9e9e"; // grey
    }
  };

  return (
    <Card sx={{ p: 2 }}>
      <Stack spacing={2}>
        {user && (
          <HorizontalStack spacing={2}>
            <UserAvatar width={50} height={50} username={user.username} />
            <Typography variant="h5">
              What would you like to post today {user.username}?
            </Typography>
          </HorizontalStack>
        )}

        <input
          id="file-input"
          type="file"
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <label htmlFor="file-input">
          <Button variant="contained" component="span">
            Attach File
          </Button>
        </label>

        {(uploadingImage || scanningImage) && (
          <>
            <LinearProgress />
            <Typography variant="caption">
              {uploadingImage ? "Uploading image..." : "Scanning for hate content..."}
            </Typography>
          </>
        )}

        {preview && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle2">Preview</Typography>
            <Box
              component="img"
              src={preview}
              alt="preview"
              sx={{ width: "100%", borderRadius: 1, maxHeight: 300 }}
            />
          </Box>
        )}

        {ocrText && (
          <Box sx={{ p: 1, bgcolor: "#111", borderRadius: 1 }}>
            <Typography variant="subtitle2" color="white">
              OCR Text:
            </Typography>
            <Typography variant="body2" color="gray">
              {ocrText}
            </Typography>
          </Box>
        )}

        <TextField
          fullWidth
          label="Title"
          name="title"
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        <TextField
          fullWidth
          multiline
          rows={6}
          label="Content"
          name="content"
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        />

        {moderationData && (
          <Box sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: "#f6f7f9" }}>
            <Box
              sx={{
                height: 12,
                borderRadius: 1,
                backgroundColor: getClassificationColor(moderationData.overall_classification),
                mb: 1,
              }}
              aria-label={`Moderation classification: ${moderationData.overall_classification}`}
            />
            <Typography variant="subtitle1" gutterBottom>
              Moderation Result:{" "}
              <strong>{moderationData.overall_classification.toUpperCase()}</strong> (
              {moderationData.overall_score}%)
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, mb: 1 }}>
              {moderationData.justification}
            </Typography>
            {moderationData.dimensions &&
              Object.entries(moderationData.dimensions).map(([k, v]) => (
                <Typography key={k} variant="caption" display="block" sx={{ mb: 0.5 }}>
                  {k}: {v.score}% - {v.explanation}
                </Typography>
              ))}
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={
            loading ||
            uploadingImage ||
            scanningImage ||
            moderationData?.overall_classification === "offensive"
          }
          onClick={handleSubmit}
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </Stack>

      <Snackbar
        open={toast.open}
        onClose={closeToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={4000}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default PostEditor;