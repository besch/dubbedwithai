import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export interface LogEntry {
  endpoint: string;
  parameters: object;
  ip_address: string;
  timestamp: string;
  success: boolean;
  error_message?: string;
  error_code?: string;
  steps?: object;
}

export async function logApiRequest(entry: LogEntry) {
  // if (entry.ip_address !== "::1" && entry.ip_address !== "83.27.95.229") {
  try {
    const { data, error } = await supabase.from("api_logs").insert(entry);

    if (error) {
      console.error("Error logging API request:", error);
    }
  } catch (error) {
    console.error("Error logging API request:", error);
  }
  // }
}
