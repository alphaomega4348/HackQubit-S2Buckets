const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ✅ Correct API key usage with new SDK
const genAI = new GoogleGenerativeAI({
  apiKey: "AIzaSyAQgluL7YsqO0sEHtfdLx0EFWU3mFa5bLk",
});

router.post("/content", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    // Quick pre-check
    if (/\bhate\b/i.test(text)) {
      return res.json({
        allowed: false,
        reason: "Detected prohibited content (hate speech)",
        severity: "medium",
        cleanedText: text.replace(/\bhate\b/gi, "****"),
      });
    }

    // ✅ Updated model name (v1 API compatible)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are a content moderator. Analyze this text for hate speech, offensive language, discrimination, or any harmful content.
Respond strictly in JSON:
{
  "allowed": true/false,
  "reason": "brief reason",
  "severity": "low/medium/high",
  "cleanedText": "sanitized version"
}

Text: "${text}"
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    let moderationResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      moderationResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        allowed: true,
        reason: "",
        severity: "low",
        cleanedText: text,
      };
    } catch (err) {
      console.error("JSON parse error:", err);
      moderationResult = {
        allowed: true,
        reason: "",
        severity: "low",
        cleanedText: text,
      };
    }

    res.json(moderationResult);
  } catch (error) {
    console.error("Content moderation error:", error);
    res.json({
      allowed: true,
      reason: "",
      severity: "low",
      cleanedText: req.body.text,
      error: "Moderation service unavailable",
    });
  }
});

module.exports = router;
