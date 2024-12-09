import supabase from "@/lib/supabaseClient";

export interface LogEntry {
  endpoint: string;
  parameters: object;
  ip_address: string;
  timestamp: string;
  success: boolean;
  error_message?: string;
  error_code?: string;
  steps?: object;
  url: string;
}

export async function logApiRequest(entry: LogEntry) {
  if (entry.ip_address !== "::1") {
    try {
      const { data, error } = await supabase.from("api_logs").insert(entry);

      if (error) {
        console.error("Error logging API request:", error);
      }
    } catch (error) {
      console.error("Error logging API request:", error);
    }
  }
}
