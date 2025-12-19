import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * GET /projects
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, description, total_tokens
      FROM projects
      ORDER BY id ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("🔥 GET /projects error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /projects
 */
router.post("/", async (req, res) => {
  const { name, description = "" } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Project name is required" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO projects (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description, total_tokens
      `,
      [name, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("🔥 CREATE PROJECT ERROR:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});
/**
 * PATCH /projects/:id
 * Update project description
 */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE projects
      SET description = $1
      WHERE id = $2
      RETURNING id, name, description, total_tokens
      `,
      [description, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("🔥 UPDATE PROJECT ERROR:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;

