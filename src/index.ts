import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import deviceRoutes from "./routes/devices";
import notificationRoutes from "./routes/notifications";
import jwplayerRoutes from "./routes/jwplayer";

dotenv.config();
const app = express();
app.use(express.json());

app.use("/devices", deviceRoutes);
app.use("/notifications", notificationRoutes);
app.use("/jwplayer-webhook", jwplayerRoutes);

const PORT = process.env.PORT || 8080;

// Middleware to parse JSON
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
