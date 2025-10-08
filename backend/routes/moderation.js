const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

/**
 * POST /api/moderate
 * Body: { text: "string", context?: "string" }
 */
router.post("/", async (req, res) => {
  try {
    const { text, context = "" } = req.body;

    if (!text || text.trim().length === 0)
      return res.status(400).json({ error: "No text provided" });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY || "AIzaSyAsBfW2kOzvvufH_YJzd_J7ZZfgq5CYjp0"}`;

    // 👇 Spectrum-based multilingual prompt
    const moderationPrompt = `
You are a multilingual, context-aware moderation model.
Evaluate the following text and respond STRICTLY in JSON.

Text: """${text}"""
Context: """${context}"""

Return the following JSON structure only:
{
  "overall_score": number (0-100),
  "overall_classification": "safe" | "risky" | "offensive",
  "justification": string,
  "language_detected": string,
  "context_adjustments": string,
  "dimensions": {
    "hate_speech": {"score": number, "explanation": string},
    "harassment": {"score": number, "explanation": string},
    "profanity": {"score": number, "explanation": string},
    "toxicity": {"score": number, "explanation": string},
    "self_harm_or_violence": {"score": number, "explanation": string},
    "misinformation": {"score": number, "explanation": string}
  }
}
Rules:
- Be concise.
- Never include text outside JSON.
- Consider multilingual slang, emojis, and context.
- Rate intent, not literal words.
- Output pure JSON only.
`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: moderationPrompt }],
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log(data);


    const outputText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!outputText) {
      console.warn("No text in Gemini response");
      return res.json({
        overall_score: 0,
        overall_classification: "safe",
        justification: "No response",
        dimensions: {},
      });
    }

    let result;
    try {
      result = JSON.parse(outputText);
    } catch (err) {
      console.error("JSON parse failed:", outputText);
      return res.json({
        overall_score: 0,
        overall_classification: "safe",
        justification: "Unparsable response",
        raw: outputText,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Moderation error:", err);
    res.status(500).json({ error: "Moderation failed", details: err.message });
  }
});

module.exports = router;