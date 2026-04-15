import express from "express";
import cors from "cors";
import metacritic from "metacritic";

const app = express();
app.use(cors());

app.get("/api/metacritic", async (req, res) => {
  const title = String(req.query.title || "").trim();

  if (!title) {
    return res.status(400).json({ error: "Missing title query parameter" });
  }

  try {
    const result = await metacritic.getGameReviews(title);
    const score = String(result?.score || "").trim();
    const reviews = result?.reviews || [];

    res.json({
      title,
      score: score || null,
      reviews,
      source: "metacritic"
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch Metacritic data",
      details: String(error?.message || error)
    });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Metacritic proxy running on http://localhost:${port}`);
});
