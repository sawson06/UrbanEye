# RoadSense AI - fixed local dashboard

## Run

1. Open a terminal in this folder.
2. Run:
   npm install
3. Start:
   npm start
4. Open:
   http://localhost:3000

API:
http://localhost:3000/api/detections

Health:
http://localhost:3000/api/health

The dashboard polls `/api/detections` automatically every 3 seconds.

The previous initialization bug was caused by JavaScript trying to write to
`#eye`, an element that does not exist. That exception stopped execution before
the detection polling started. The fixed HTML removes that reference.

The POST endpoint accepts:
{
  "detections": [
    {
      "id": "P001",
      "lat": 19.1136,
      "lon": 72.8697,
      "confidence": 0.94
    }
  ]
}

The next stage is to have the Ultralytics YOLO Python process POST its output
to `/api/detections`.
