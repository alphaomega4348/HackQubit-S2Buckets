import fetch from "node-fetch";

// Middleware to verify content moderation before saving post
export const moderationCheck = async (req, res, next) => {
  try {
    const { title = "", content = "", image = "" } = req.body;
    const combinedText = `${title}\n${content}`.trim();

    if (!combinedText) return next(); // skip moderation for empty posts (if needed)

    const response = await fetch(`${process.env.BASE_URL || "http://localhost:4000"}/api/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: combinedText, context: "backend moderation validation" }),
    });

    const data = await response.json();

    // If moderation service fails or returns invalid data
    if (!data || !data.overall_classification) {
      console.error("⚠️ Invalid moderation response:", data);
      return res.status(500).json({ error: "Moderation service unavailable. Please try again later." });
    }

    // 🚫 Block offensive content
    if (data.overall_classification === "offensive") {
      console.log("🛑 Offensive content blocked:", data.justification);
      return res.status(400).json({
        error: "❌ Post rejected: Offensive or hateful content detected.",
        moderation: data,
      });
    }

    // attach moderation result to request (optional)
    req.moderationData = data;
    next();
  } catch (err) {
    console.error("Moderation check failed:", err);
    return res.status(500).json({ error: "Moderation service unavailable." });
  }
};