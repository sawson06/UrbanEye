const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, "public");
const detectionsFile = path.join(__dirname, "detections.json");

app.use(express.json({ limit: "2mb" }));
app.use(express.static(publicDir));

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        service: "RoadSense AI",
        time: new Date().toISOString()
    });
});

// Dashboard reads the latest AI detections from here.
app.get("/api/detections", (req, res) => {
    fs.readFile(detectionsFile, "utf8", (err, data) => {
        if (err) {
            console.error("Could not read detections.json:", err);
            return res.status(500).json({
                error: "Could not read detections.json"
            });
        }

        try {
            const payload = JSON.parse(data);
            return res.json(payload);
        } catch (err) {
            console.error("Invalid detections.json:", err);
            return res.status(500).json({
                error: "detections.json contains invalid JSON"
            });
        }
    });
});

// AI processor can POST a complete detection payload here.
app.post("/api/detections", (req, res) => {
    const payload = req.body;

    if (!payload || typeof payload !== "object") {
        return res.status(400).json({
            success: false,
            error: "Request body must be a JSON object"
        });
    }

    const detections = Array.isArray(payload)
        ? payload
        : payload.detections;

    if (!Array.isArray(detections)) {
        return res.status(400).json({
            success: false,
            error: "Expected { detections: [...] }"
        });
    }

    const clean = {
        detections
    };

    fs.writeFile(
        detectionsFile,
        JSON.stringify(clean, null, 2),
        "utf8",
        (err) => {
            if (err) {
                console.error("Could not save detections:", err);
                return res.status(500).json({
                    success: false,
                    error: "Could not save detections"
                });
            }

            console.log(
                `[${new Date().toISOString()}] Saved ${detections.length} AI detections`
            );

            res.json({
                success: true,
                count: detections.length
            });
        }
    );
});

// Always return the dashboard for the root route.
app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
    console.log("----------------------------------");
    console.log("RoadSense AI server running");
    console.log("----------------------------------");
    console.log(`Dashboard: http://localhost:${PORT}`);
    console.log(`API:       http://localhost:${PORT}/api/detections`);
    console.log(`Health:    http://localhost:${PORT}/api/health`);
});
