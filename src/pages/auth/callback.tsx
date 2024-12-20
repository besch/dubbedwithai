import { useEffect } from "react";
import { useRouter } from "next/router";
import supabase from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          // Redirect to pricing page after successful authentication
          router.replace("/pricing");
        }
      } catch (error) {
        console.error("Error during auth callback:", error);
        router.replace("/");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
        <p className="mt-4">Completing sign in...</p>
      </div>
    </div>
  );
}
