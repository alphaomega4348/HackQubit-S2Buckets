const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI - DON'T hardcode the key!
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/content", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    // If text is empty or too short, allow it
    if (text.trim().length < 3) {
      return res.json({
        allowed: true,
        reason: "",
        severity: "low",
        cleanedText: text,
      });
    }

    // Simple check for "hate" word (case-insensitive)
    const containsHate = /\bhate\b/i.test(text);

    if (containsHate) {
      return res.json({
        allowed: false,
        reason: "Image contains prohibited content (hate speech detected)",
        severity: "high",
      });
    }

    // Use Gemini for more sophisticated content moderation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a content moderator. Analyze the following text extracted from an image and determine if it contains:
- Hate speech
- Offensive language
- Violent content
- Discrimination
- Harassment
- Any other harmful content

Text to analyze: "${text}"

Respond in JSON format with:
{
  "allowed": true/false,
  "reason": "brief explanation if not allowed",
  "severity": "low/medium/high",
  "cleanedText": "cleaned version of the text with offensive words removed or masked"
}

Only set allowed to false if the content is clearly harmful or violates community guidelines.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse Gemini's response
    let moderationResult;
    try {
      // Extract JSON from response (Gemini might wrap it in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        moderationResult = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: assume content is allowed if we can't parse
        moderationResult = {
          allowed: true,
          reason: "",
          severity: "low",
          cleanedText: text,
        };
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      // Fail open - allow content if AI check fails
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
    
    // Fail open - allow content if moderation service fails
    // but log the error for monitoring
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