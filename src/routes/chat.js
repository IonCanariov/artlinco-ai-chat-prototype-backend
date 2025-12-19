import express from "express";
import pool from "../db.js";

const router = express.Router();

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;


/**
 * Very simple token estimator
 * ~4 characters ≈ 1 token (good enough for prototype)
 */
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Extract AI text from ANY possible n8n response
 * (string | JSON | wrapped | empty | weird)
 */
function extractAiText(rawText) {
  if (!rawText) return "";

  // Try JSON
  try {
    const parsed = JSON.parse(rawText);

    // Normal case
    if (typeof parsed.aiResponse === "string" && parsed.aiResponse.trim()) {
      return parsed.aiResponse.trim();
    }

    // Sometimes n8n returns text directly
    if (typeof parsed === "string" && parsed.trim()) {
      return parsed.trim();
    }

    // Fallback: stringify object
    return JSON.stringify(parsed, null, 2);
  } catch {
    // Not JSON → treat as plain text
    return rawText.trim();
  }
}

/**
 * POST /chat
 */
router.post("/chat", async (req, res) => {
  console.log("✅ /chat endpoint HIT");

  const client = await pool.connect();

  try {
    const { projectId, content } = req.body;

    if (!projectId || !content) {
      return res.status(400).json({
        error: "projectId and content are required",
      });
    }

    await client.query("BEGIN");

    // 1️⃣ Save USER message
    const userMessageResult = await client.query(
      `
      INSERT INTO messages (project_id, role, content)
      VALUES ($1, 'user', $2)
      RETURNING *
      `,
      [projectId, content]
    );

    // 2️⃣ Call n8n
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: content,
        projectId,
      }),
    });

    const rawText = await n8nResponse.text();
    console.log("📨 RAW n8n response:", rawText);

    // 3️⃣ HARDENED extraction
    let aiText = extractAiText(rawText);

    // Absolute fallback (never break prototype)
    if (!aiText) {
      aiText = "[AI returned an empty response]";
    }

    // 🧮 Estimate tokens
    const tokensUsed = estimateTokens(aiText);

    // 4️⃣ Save AI message
    const aiMessageResult = await client.query(
      `
      INSERT INTO messages (project_id, role, content, tokens_used)
      VALUES ($1, 'assistant', $2, $3)
      RETURNING *
      `,
      [projectId, aiText, tokensUsed]
    );

    // 5️⃣ Update project tokens
    await client.query(
      `
      UPDATE projects
      SET total_tokens = total_tokens + $1
      WHERE id = $2
      `,
      [tokensUsed, projectId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      userMessage: userMessageResult.rows[0],
      aiMessage: aiMessageResult.rows[0],
      tokensAdded: tokensUsed,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("🔥 CHAT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
