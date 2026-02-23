import { Router, Request, Response } from "express";
import { insertNotification, fetchAllDevices, insertDeviceNotification } from "../services/supabase";
import { sendFCM } from "../services/fcm";

import { requireAuth } from "../middleware/reqauth";
const router = Router();

const allowedEvents = [
  "conversions_complete",
  "channel_active",
  "channel_idle",
  "channel_created",
  "media_available",
  "media_created",
  "media_deleted",
  "media_reuploaded",
  "media_updated",
  "thumbnail_created",
  "thumbnail_deleted",
  "track_created",
  "track_deleted"
];

router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const event = req.body;
    const eventType = event.event;
    const media = event;

    console.log(event)
    console.log(eventType)

    if (!allowedEvents.includes(eventType)) return res.json({ ignored: true });

    // const mediaId = event.media_id;
    // const titleText = event.title || "New Media";

    let payload: any;

    // if (eventType === "media_created") {
    //   payload = { notification: { title: "New Video Uploaded", body: titleText }, data: { type: "media", id: mediaId } };
    // } else if (eventType === "media_updated") {
    //   payload = { notification: { title: "Video Updated", body: titleText }, data: { type: "media", id: mediaId } };
    // } else if (eventType === "channel_active") {
    //   payload = { notification: { title: "Live Started", body: `The channel "${media.name || "Channel"}" is now live!` }, data: { type: "live", id: media.channel_id } };
    // } else {
    //   payload = { notification: { title: eventType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), body: titleText }, data: { type: "media", id: mediaId } };
    // }

    if (eventType === "channel_active") {
      payload = { notification: { title: "Corrigan Sports Network", body: "Is LIVE!" }, data: { type: "live", id: media.channel_id } };
    }

    const savedNotification = await insertNotification({
      type: payload.data.type,
      title: payload.notification.title,
      body: payload.notification.body,
      data: payload.data,
    });

    const devices = await fetchAllDevices();
    const tokens: string[] = [];

    for (const device of devices) {
      tokens.push(device.fcm_token);
      await insertDeviceNotification(device.id, savedNotification.id);
    }

    await sendFCM(tokens, payload);

    res.json({ success: true, sent: tokens.length, notification: savedNotification });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
