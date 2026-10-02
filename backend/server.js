const express = require("express");
const cors = require("cors");
const missions = require("./missions.json");

const app = express();
const PORT = 3000;

app.use(cors());

app.get("/api/status", (request, response) => {
  response.json({ status: "Backend is running" });
});

app.get("/api/missions", (request, response) => {
  response.json(missions);
});

app.get("/api/missions/:id", (request, response) => {
  const mission = missions.find((item) => item.id === request.params.id);

  if (!mission) {
    return response.status(404).json({ error: "Mission not found" });
  }

  response.json(mission);
});

app.listen(PORT, () => {
  console.log(`Space Mission Tracker API is running on port ${PORT}`);
});