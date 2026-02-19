import { getAccessToken } from "../utils/firebase";

export async function sendFCM(tokens: string[], payload: any) {
  if (!tokens.length) return;

  const accessToken = await getAccessToken();
  const url = `https://fcm.googleapis.com/v1/projects/${JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!).project_id}/messages:send`;

  await Promise.all(
    tokens.map(async (token) => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: payload.notification,
            data: payload.data,
          },
        }),
      });

      const result = await res.json();
      console.log("FCM Result:", result);
    })
  );
}
