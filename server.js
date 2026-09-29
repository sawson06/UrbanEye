const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");
const detectionsFile = path.join(__dirname, "detections.json");

app.use(express.json({ limit: "2mb" }));
app.use(express.static(publicDir));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "UrbanEye",
    time: new Date().toISOString(),
  });
});

app.get("/api/detections", async (req, res) => {
  try {
    const data = await fs.readFile(detectionsFile, "utf8");
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Failed to read detections.json:", error.message);
    res.status(500).json({ error: "Could not read valid detection data" });
  }
});

app.post("/api/detections", async (req, res) => {
  const payload = req.body;
  const detections = Array.isArray(payload) ? payload : payload?.detections;

  if (!Array.isArray(detections)) {
    return res.status(400).json({
      success: false,
      error: "Expected a JSON array or { detections: [...] }",
    });
  }

  try {
    await fs.writeFile(
      detectionsFile,
      JSON.stringify({ detections }, null, 2),
      "utf8"
    );

    console.log(`[${new Date().toISOString()}] Saved ${detections.length} detections`);
    res.json({ success: true, count: detections.length });
  } catch (error) {
    console.error("Failed to save detections:", error.message);
    res.status(500).json({ success: false, error: "Could not save detections" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`UrbanEye running at http://localhost:${PORT}`);
  console.log(`Detections: http://localhost:${PORT}/api/detections`);
  console.log(`Health:     http://localhost:${PORT}/api/health`);
});
