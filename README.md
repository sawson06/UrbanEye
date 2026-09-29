# UrbanEye

UrbanEye is an AI-powered urban road-condition monitoring prototype. The dashboard consumes detection data produced by an AI/YOLO pipeline and displays the reported locations, severity, confidence, status, and detection metadata on an interactive map.

## Architecture

```text
Video feed
    ↓
AI / YOLO processing
    ↓
Detection JSON
    ↓
POST /api/detections
    ↓
UrbanEye Node.js server
    ↓
Dashboard polls /api/detections
    ↓
Map + detection details + analytics
```

## Project structure

```text
urbanEye/
├── server.js
├── detections.json
├── package.json
├── package-lock.json
├── README.md
└── public/
    ├── index.html
    ├── css/
    │   └── app.css
    └── js/
        └── app.js
```

`node_modules/` is intentionally excluded from the project archive. Run `npm install` after extracting the project.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## API

### Get current detections

`GET /api/detections`

### Submit AI detections

`POST /api/detections`

Example payload:

```json
{
  "detections": [
    {
      "id": "P001",
      "lat": 19.1136,
      "lon": 72.8697,
      "confidence": 0.94,
      "severity": "High",
      "status": "Unresolved",
      "frame": 120,
      "timestamp_sec": 4.0,
      "frames_tracked": 8,
      "bbox_xyxy": [120, 200, 300, 350]
    }
  ]
}
```

The dashboard automatically refreshes the detection feed every three seconds.

## Next development stage

Connect the Ultralytics YOLO video-processing script to `POST /api/detections` so that detections generated from real video replace the current demo `detections.json` data.
