import { Router, Request, Response } from "express";
import { fetchDeviceById, fetchDeviceNotifications } from "../services/supabase";
import { sendFCM } from "../services/fcm";
import { fetchAllDevices, insertNotification, insertDeviceNotification } from "../services/supabase";

const router = Router();

router.post("/send", async (req: Request, res: Response) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "title and body are required" });
    }

    // 1️⃣ Save notification to Supabase
    const notification = await insertNotification({ title, body, data: data || {}, type: data?.type || "general" });

    // 2️⃣ Get all device tokens
    const devices = await fetchAllDevices();
    const tokens = devices.map(d => d.fcm_token).filter(Boolean);

    // 3️⃣ Link notification to devices
    await Promise.all(devices.map(d => insertDeviceNotification(d.id, notification.id)));

    // 4️⃣ Send push
    await sendFCM(tokens, { notification: { title, body }, data });

    return res.json({ success: true, sent: tokens.length });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:deviceId", async (req, res) => {
  try {
    const device = await fetchDeviceById(req.params.deviceId);
    if (!device) return res.status(404).json({ error: "Device not found" });

    const notifications = await fetchDeviceNotifications(device.id);
    res.json(notifications);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
