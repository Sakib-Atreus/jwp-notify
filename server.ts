// import express from "express";
// import bodyParser from "body-parser";
// import { createClient } from "@supabase/supabase-js";
// import { createPrivateKey } from "crypto";
// import jwt from "jsonwebtoken";
// import fetch from "node-fetch";
// import dotenv from "dotenv";

// dotenv.config();

// const app = express();
// app.use(bodyParser.json());

// // ================== JW Player Allowed Events ==================
// const allowedEvents = [
//   "conversions_complete",
//   "channel_active",
//   "channel_idle",
//   "channel_created",
//   "media_available",
//   "media_created",
//   "media_deleted",
//   "media_reuploaded",
//   "media_updated",
//   "thumbnail_created",
//   "thumbnail_deleted",
//   "track_created",
//   "track_deleted"
// ];

// // ================== SUPABASE ==================
// const supabase = createClient(
//   process.env.PROJECT_URL!,
//   process.env.PUBLIC_ANON_KEY!
// );

// // ================== FIREBASE SERVICE ACCOUNT ==================
// const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
// serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

// // ================== GET FIREBASE ACCESS TOKEN ==================
// async function getAccessToken() {
//   const now = Math.floor(Date.now() / 1000);

//   const payload = {
//     iss: serviceAccount.client_email,
//     scope: "https://www.googleapis.com/auth/firebase.messaging",
//     aud: "https://oauth2.googleapis.com/token",
//     iat: now,
//     exp: now + 3600,
//   };

//   const privateKey = serviceAccount.private_key;

//   const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });

//   const res = await fetch("https://oauth2.googleapis.com/token", {
//     method: "POST",
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     body: new URLSearchParams({
//       grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
//       assertion: token,
//     }),
//   });

//   const data = await res.json();

//   if (!data.access_token) {
//     console.error("Firebase Auth Error:", data);
//     throw new Error("Failed to get Firebase access token");
//   }

//   return data.access_token;
// }

// // ================== SEND FCM ==================
// async function sendFCM(tokens: string[], payload: any) {
//   if (!tokens.length) return;

//   const accessToken = await getAccessToken();
//   const url = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

//   await Promise.all(
//     tokens.map(async (token) => {
//       const res = await fetch(url, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           message: {
//             token,
//             notification: payload.notification,
//             data: payload.data,
//           },
//         }),
//       });

//       const result = await res.json();
//       console.log("FCM Result:", result);
//     })
//   );
// }

// // ================== REGISTER DEVICE ==================
// app.post("/register-device", async (req, res) => {
//   try {
//     const { deviceId, fcmToken, platform } = req.body;
//     if (!deviceId || !fcmToken) return res.status(400).json({ error: "deviceId & fcmToken required" });

//     const { error } = await supabase.from("devices").upsert(
//       {
//         device_id: deviceId,
//         fcm_token: fcmToken,
//         platform: platform || "unknown",
//         updated_at: new Date().toISOString(),
//       },
//       { onConflict: "device_id" }
//     );

//     if (error) throw error;

//     res.json({ success: true });
//   } catch (err: any) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ================== TEST FCM ==================
// app.post("/test-fcm", async (req, res) => {
//   try {
//     const { fcmToken, title, body } = req.body;
//     if (!fcmToken) return res.status(400).json({ error: "fcmToken required" });

//     await sendFCM(
//       [fcmToken],
//       {
//         notification: { title: title || "Test Notification", body: body || "Hello from Supabase!" },
//         data: {},
//       }
//     );

//     res.json({ success: true });
//   } catch (err: any) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ================== FETCH DEVICE NOTIFICATIONS ==================
// app.get("/notifications/:deviceId", async (req, res) => {
//   try {
//     const deviceIdText = req.params.deviceId;
//     const { data: deviceData, error: deviceError } = await supabase
//       .from("devices")
//       .select("id")
//       .eq("device_id", deviceIdText)
//       .single();

//     if (deviceError || !deviceData) return res.status(404).json({ error: "Device not found" });

//     const deviceUUID = deviceData.id;

//     const { data, error } = await supabase
//       .from("device_notifications")
//       .select(`
//         id,
//         read,
//         created_at,
//         notifications (
//           id,
//           type,
//           title,
//           body,
//           data,
//           created_at
//         )
//       `)
//       .eq("device_id", deviceUUID)
//       .order("created_at", { ascending: false });

//     if (error) throw error;

//     res.json(data);
//   } catch (err: any) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ================== JW PLAYER WEBHOOK ==================
// app.post("/jwplayer-webhook", async (req, res) => {
//   try {
//     const event = req.body;
//     console.log("JW Player Event:", event);

//     const eventType = event.event;
//     const media = event.data;

//     if (!allowedEvents.includes(eventType)) return res.json({ ignored: true });

//     const mediaId = media.media_id;
//     const titleText = media.title || "New Media";

//     // Prepare payload
//     let payload: any;
//     if (eventType === "media_created") {
//       payload = {
//         notification: { title: "New Video Uploaded", body: titleText },
//         data: { type: "media", id: mediaId },
//       };
//     } else if (eventType === "media_updated") {
//       payload = {
//         notification: { title: "Video Updated", body: titleText },
//         data: { type: "media", id: mediaId },
//       };
//     } else if (eventType === "channel_active") {
//       const channelName = media.name || "Channel";
//       payload = {
//         notification: { title: "Live Started", body: `The channel "${channelName}" is now live!` },
//         data: { type: "live", id: media.channel_id },
//       };
//     } else {
//       payload = {
//         notification: {
//           title: eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
//           body: titleText,
//         },
//         data: { type: "media", id: mediaId },
//       };
//     }

//     // Save notification in DB
//     const { data: savedNotification, error } = await supabase
//       .from("notifications")
//       .insert({
//         type: payload.data.type,
//         title: payload.notification.title,
//         body: payload.notification.body,
//         data: payload.data,
//       })
//       .select()
//       .single();

//     if (error) throw error;

//     // Fetch all devices
//     const { data: devices, error: devicesError } = await supabase.from("devices").select("id, fcm_token");
//     if (devicesError || !devices?.length) console.error("No devices found", devicesError);

//     const tokens: string[] = [];
//     await Promise.all(
//       devices.map(async (device) => {
//         tokens.push(device.fcm_token);
//         await supabase.from("device_notifications").insert({
//           device_id: device.id,
//           notification_id: savedNotification.id,
//           read: false,
//         });
//       })
//     );

//     // Send FCM
//     await sendFCM(tokens, payload);

//     res.json({ success: true, sent: tokens.length, notification: savedNotification });
//   } catch (err: any) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ================== START SERVER ==================
// const PORT = process.env.PORT || 8080;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
