import jwt from "jsonwebtoken";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) throw new Error("FIREBASE_SERVICE_ACCOUNT is missing in .env");

let serviceAccount: any;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (err) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
}

// ✅ Fix private key formatting - ensure it's a valid PEM format
if (!serviceAccount.private_key) {
  throw new Error("private_key is missing from FIREBASE_SERVICE_ACCOUNT");
}

serviceAccount.private_key = serviceAccount.private_key
  .replace(/\\n/g, "\n")   // convert escaped newlines to real newlines
  .trim();                  // trim whitespace

// Validate the private key format
if (!serviceAccount.private_key.includes("BEGIN") || !serviceAccount.private_key.includes("END")) {
  throw new Error("Invalid private key format - must be in PEM format (-----BEGIN PRIVATE KEY-----)");
}

export async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // ✅ RS256 signing
  const token = jwt.sign(payload, serviceAccount.private_key, { algorithm: "RS256" });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: token,
    }),
  });

  const data = await res.json();

  if (!data.access_token) {
    console.error("Failed to get Firebase access token:", data);
    throw new Error("Failed to get Firebase access token");
  }

  return data.access_token;
}
