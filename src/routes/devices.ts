import { Router } from "express";
import { upsertDevice } from "../services/supabase";

const router = Router();

router.post("/register-device", async (req, res) => {
  try {
    const { deviceId, fcmToken, platform } = req.body;
    if (!deviceId || !fcmToken) return res.status(400).json({ error: "deviceId & fcmToken required" });

    await upsertDevice({ device_id: deviceId, fcm_token: fcmToken, platform });
    res.json({ success: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
