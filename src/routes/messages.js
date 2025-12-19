import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * GET /messages?projectId=1
 * Returns chat history for a project
 */
router.get("/messages", async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({
      error: "projectId query parameter is required",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        role,
        content,
        created_at,
        tokens_used
      FROM messages
      WHERE project_id = $1
      ORDER BY created_at ASC
      `,
      [projectId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("🔥 GET /messages error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
