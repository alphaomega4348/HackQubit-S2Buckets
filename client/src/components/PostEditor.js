import {
  Button,
  Card,
  Snackbar,
  Alert,
  Stack,
  TextField,
  Typography,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Box,
  Tooltip,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../api/posts";
import { isLoggedIn } from "../helpers/authHelper";
import HorizontalStack from "./util/HorizontalStack";
import UserAvatar from "./UserAvatar";
import {
  MdWhatshot,
  MdReport,
  MdOutlineContentCut,
  MdSentimentVeryDissatisfied,
  MdOutlineErrorOutline,
} from "react-icons/md";

const ICON_MAP = {
  hate_speech: MdReport,
  harassment: MdWhatshot,
  profanity: MdOutlineContentCut,
  toxicity: MdSentimentVeryDissatisfied,
  self_harm_or_violence: MdOutlineErrorOutline,
  misinformation: MdOutlineErrorOutline,
};

function getColor(score) {
  if (score >= 85) return "#ef4444";
  if (score >= 60) return "#f59e0b";
  if (score >= 35) return "#f97316";
  return "#10b981";
}

const GEMINI_API_KEY =
  import.meta.env?.VITE_GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";

const PostEditor = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const user = isLoggedIn();

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [scanningImage, setScanningImage] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [moderationData, setModerationData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLocked, setModalLocked] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });
  const [formData, setFormData] = useState({ title: "", content: "", image: "" });

  const showToast = (msg, severity = "info") =>
    setToast({ open: true, message: msg, severity });
  const closeToast = () => setToast((t) => ({ ...t, open: false }));

  const checkWithGemini = async (text) => {
    if (!text?.trim()) {
      return { overall_classification: "safe", overall_score: 0, dimensions: {} };
    }

    const lower = text.toLowerCase();
    if (
      lower.includes("hate") ||
      lower.includes("kill") ||
      lower.includes("bitch") ||
      lower.includes("fuck")
    ) {
      return {
        overall_score: 90,
        overall_classification: "offensive",
        justification: "Moderation: detected offensive keywords in text.",
        dimensions: {
          hate_speech: { score: 90, explanation: "Detected hate-related words." },
          harassment: { score: 85, explanation: "Text may harass or insult others." },
          profanity: { score: 80, explanation: "Strong profanity detected." },
          toxicity: { score: 95, explanation: "Highly toxic tone." },
          self_harm_or_violence: { score: 15, explanation: "No direct violence found." },
          misinformation: { score: 0, explanation: "No misinformation present." },
        },
      };
    }

    try {
      const prompt = `
You are a moderation model. Classify strictly in JSON only:
{
  "overall_score": number,
  "overall_classification": "safe" | "risky" | "offensive",
  "justification": string,
  "dimensions": {
    "hate_speech": {"score": number, "explanation": string},
    "harassment": {"score": number, "explanation": string},
    "profanity": {"score": number, "explanation": string},
    "toxicity": {"score": number, "explanation": string},
    "self_harm_or_violence": {"score": number, "explanation": string},
    "misinformation": {"score": number, "explanation": string}
  }
}
Text: """${text}"""`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          }),
        }
      );

      const json = await res.json().catch(() => ({}));
      const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      let cleaned = raw
        .replace(/```json|```/g, "")
        .replace(/JSON parse failed.*?```json/gs, "")
        .replace(/new ObjectId\([^)]+\)/g, "")
        .replace(/\s+/g, " ")
        .trim();

      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1);
      }

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = {
          overall_classification: "safe",
          justification: "Default safe content — Gemini parse fallback.",
          dimensions: {},
        };
      }

      parsed.overall_classification = parsed.overall_classification || "safe";
      parsed.overall_score = parsed.overall_score || 0;
      parsed.dimensions = parsed.dimensions || {};
      parsed.justification = parsed.justification || "No justification.";

      return parsed;
    } catch {
      return {
        overall_classification: "safe",
        overall_score: 0,
        justification: "Network error fallback — safe content.",
        dimensions: {},
      };
    }
  };

  const performOCR = async (imageFile) => {
    try {
      setScanningImage(true);
      const fd = new FormData();
      fd.append("image", imageFile);
      const res = await fetch("/api/ocr/scan", { method: "POST", body: fd });
      const json = await res.json();
      setOcrText(json.text || "");
      return json.text || "";
    } catch {
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
      if (json.secure_url) setFormData((p) => ({ ...p, image: json.secure_url }));
      else showToast("Image upload failed", "error");
    } catch {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const combinedText = `${formData.title}\n${formData.content}\n${ocrText}`;
    setLoading(true);

    const moderation = await checkWithGemini(combinedText);
    setModerationData(moderation);

    if ((moderation.overall_classification || "").toLowerCase().trim() === "offensive") {
      // 🚫 block post
      setModalOpen(true);
      setModalLocked(true);
      setTimeout(() => setModalLocked(false), 1500);
      setLoading(false);
      showToast("🚫 Offensive or unverified content detected. Post blocked.", "error");
      return;
    }

    const data = await createPost(formData, user);
    setLoading(false);
    if (data?.error) showToast(data.error, "error");
    else {
      showToast("✅ Post created successfully!", "success");
      navigate(`/posts/${data._id}`);
    }
  };

  const dims = moderationData?.dimensions || {};

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

        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={loading || uploadingImage || scanningImage}
          onClick={handleSubmit}
        >
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </Stack>

      {/* 🚫 Moderation Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => !modalLocked && setModalOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: theme.palette.mode === "dark" ? "#111" : "#f3f4f6" }}>
            <MdReport />
          </Avatar>
          <Box>
            <Typography variant="h6">Moderation Result</Typography>
            <Typography variant="caption" color="text.secondary">
              A quick visual summary
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {moderationData ? (
            <>
              <Typography sx={{ mb: 1 }}>{moderationData.justification}</Typography>
              {Object.entries(dims).map(([k, v]) => {
                const Icon = ICON_MAP[k] || MdOutlineErrorOutline;
                const color = getColor(v.score);
                return (
                  <Box key={k} sx={{ mb: 2 }}>
                    <HorizontalStack alignItems="center" justifyContent="space-between">
                      <HorizontalStack alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: color, color: "#fff" }}>
                          <Icon />
                        </Avatar>
                        <Tooltip title={v.explanation || ""}>
                          <Typography variant="subtitle2" sx={{ textTransform: "capitalize" }}>
                            {k.replace(/_/g, " ")}
                          </Typography>
                        </Tooltip>
                      </HorizontalStack>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {v.score}%
                      </Typography>
                    </HorizontalStack>
                    <LinearProgress
                      variant="determinate"
                      value={v.score}
                      sx={{
                        height: 10,
                        borderRadius: 4,
                        mt: 1,
                        "& .MuiLinearProgress-bar": {
                          background: `linear-gradient(90deg, ${color}, ${getColor(
                            Math.min(100, v.score + 15)
                          )})`,
                        },
                        background:
                          theme.palette.mode === "dark" ? "#1f2937" : "#e5e7eb",
                      }}
                    />
                  </Box>
                );
              })}
            </>
          ) : (
            <Typography color="text.secondary">No moderation data available.</Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            color="error"
            disabled={modalLocked}
            onClick={() => {
              setModalOpen(false);
              showToast("🚫 Post blocked due to offensive content.", "error");
            }}
          >
            Understood
          </Button>
        </DialogActions>
      </Dialog>

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