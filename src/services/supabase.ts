import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const PROJECT_URL = process.env.PROJECT_URL;
const PUBLIC_ANON_KEY = process.env.PUBLIC_ANON_KEY;

if (!PROJECT_URL || !PUBLIC_ANON_KEY) {
  throw new Error(
    "Supabase environment variables PROJECT_URL or PUBLIC_ANON_KEY are missing. Please check your .env file."
  );
}

// Create Supabase client
const supabase = createClient(PROJECT_URL, PUBLIC_ANON_KEY);

// ================= Supabase functions =================

export async function upsertDevice(device: { device_id: string; fcm_token: string; platform?: string }) {
  const { error } = await supabase.from("devices").upsert(
    {
      ...device,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "device_id" }
  );
  if (error) throw error;
  return true;
}

export async function fetchDeviceById(deviceId: string) {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("device_id", deviceId)
    .single();
  if (error) return null;
  return data;
}

export async function insertNotification(payload: any) {
  const { data, error } = await supabase
    .from("notifications")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchAllDevices() {
  const { data, error } = await supabase.from("devices").select("id, fcm_token");
  if (error) throw error;
  return data || [];
}

export async function insertDeviceNotification(deviceId: string, notificationId: string) {
  await supabase.from("device_notifications").insert({
    device_id: deviceId,
    notification_id: notificationId,
    read: false,
  });
}

export async function fetchDeviceNotifications(deviceId: string) {
  const { data, error } = await supabase
    .from("device_notifications")
    .select(`
      id,
      read,
      created_at,
      notifications (
        id,
        type,
        title,
        body,
        data,
        created_at
      )
    `)
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Export client for direct queries
export default supabase;
