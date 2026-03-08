const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { pool } = require("./db");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8080);

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/items", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, description, created_at FROM items ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch items", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

app.get("/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, name, description, created_at FROM items WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.json(rows[0]);
  } catch (error) {
    console.error(`Failed to fetch item ${id}`, error);
    return res.status(500).json({ error: "Failed to fetch item" });
  }
});

app.post("/items", async (req, res) => {
  const { name, description } = req.body || {};
  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO items (name, description) VALUES (?, ?)",
      [trimmedName, typeof description === "string" ? description.trim() : null]
    );
    const [rows] = await pool.query(
      "SELECT id, name, description, created_at FROM items WHERE id = ?",
      [result.insertId]
    );
    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Failed to create item", error);
    return res.status(500).json({ error: "Failed to create item" });
  }
});

app.put("/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const { description } = req.body || {};
  if (description !== null && description !== undefined && typeof description !== "string") {
    return res.status(400).json({ error: "Description must be a string" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE items SET description = ? WHERE id = ?",
      [
        typeof description === "string" ? description.trim() : null,
        id
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    const [rows] = await pool.query(
      "SELECT id, name, description, created_at FROM items WHERE id = ?",
      [id]
    );
    return res.json(rows[0]);
  } catch (error) {
    console.error(`Failed to update item ${id}`, error);
    return res.status(500).json({ error: "Failed to update item" });
  }
});

app.delete("/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const [result] = await pool.query("DELETE FROM items WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Not found" });
    }
    return res.status(204).send();
  } catch (error) {
    console.error(`Failed to delete item ${id}`, error);
    return res.status(500).json({ error: "Failed to delete item" });
  }
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
