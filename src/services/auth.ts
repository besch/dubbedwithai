import supabase from "@/lib/supabaseClient";
import { Provider } from "@supabase/supabase-js";

export async function signInWithOAuth(provider: Provider = "google") {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/pricing`,
    },
  });

  if (error) throw error;
  return data;
}

export async function createOrUpdateUser(userData: any, ipAddress: string) {
  const { data, error } = await supabase
    .from("users")
    .upsert({
      id: userData.id,
      email: userData.email,
      full_name: userData.user_metadata?.full_name,
      avatar_url: userData.user_metadata?.avatar_url,
      ip_address: ipAddress,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating user:", error);
    return null;
  }
  return data;
}
