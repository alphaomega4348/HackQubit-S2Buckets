import {
  Button,
  Stack,
  TextField,
} from "@mui/material";
import React, { useState } from "react";
import HorizontalStack from "./util/HorizontalStack";

const SendMessage = ({ onSendMessage, allowOffensive, showToast }) => {
  const [content, setContent] = useState("");
  const [checking, setChecking] = useState(false);

  const moderateMessage = async (text) => {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_KEY ||
        "AIzaSyAsBfW2kOzvvufH_YJzd_J7ZZfgq5CYjp0"
        }`;

      const moderationPrompt = `
You are a multilingual moderation model.
Classify this text strictly in JSON.

Text: """${text}"""

Return JSON only:
{
  "overall_classification": "safe" | "risky" | "offensive",
  "justification": string
}`;

      const payload = {
        contents: [{ role: "user", parts: [{ text: moderationPrompt }] }],
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      let output = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // 🧠 Clean Gemini markdown wrappers
      output = output
        .replace(/```json/i, "")
        .replace(/```/g, "")
        .trim();

      let parsed = { overall_classification: "safe" };
      try {
        parsed = JSON.parse(output);
      } catch (err) {
        console.warn("JSON parse failed. Raw text:", output);
      }

      return parsed;
    } catch (err) {
      console.error("Gemini moderation error:", err);
      return { overall_classification: "safe" };
    }
  };

  const handleSendMessage = async () => {
    const text = content.trim();
    if (!text) return;

    if (!allowOffensive) {
      setChecking(true);
      const result = await moderateMessage(text);
      setChecking(false);

      console.log("Gemini moderation result:", result);

      if (result?.overall_classification === "offensive") {
        showToast("🚫 Message blocked: Offensive content detected.", "error");
        return;
      } else if (result?.overall_classification === "risky") {
        showToast(
          "⚠️ Message flagged as risky — please review before sending.",
          "warning"
        );
        return;
      }
    }

    onSendMessage(text);
    setContent("");
  };

  return (
    <Stack sx={{ m: 2, height: "40px" }} justifyContent="center">
      <HorizontalStack>
        <TextField
          onChange={(e) => setContent(e.target.value)}
          label={
            allowOffensive
              ? "Raw mode — Send a message..."
              : "Send a message..."
          }
          fullWidth
          value={content}
          autoComplete="off"
          size="small"
          disabled={checking}
          onKeyPress={(e) => {
            if (e.key === "Enter" && content.trim().length > 0) {
              handleSendMessage();
            }
          }}
        />
        <Button
          onClick={handleSendMessage}
          disabled={content.trim().length === 0 || checking}
        >
          {checking ? "Checking..." : "Send"}
        </Button>
      </HorizontalStack>
    </Stack>
  );
};

export default SendMessage;