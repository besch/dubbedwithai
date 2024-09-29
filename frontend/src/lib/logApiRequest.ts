import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_API_KEY!
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
  try {
    const { data, error } = await supabase.from("api_logs").insert(entry);

    if (error) {
      console.error("Error logging API request:", error);
    }
  } catch (error) {
    console.error("Error logging API request:", error);
  }
}
