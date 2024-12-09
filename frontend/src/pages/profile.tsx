import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import Image from "next/image";

interface UserProfile {
  full_name: string;
  email: string;
  avatar_url: string;
}

export default function Profile() {
  const user = useAppSelector((state) => state.user.user);
  const loading = useAppSelector((state) => state.user.loading);
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for the user state to be loaded
    if (loading) return;

    // If no user is found after loading, redirect to pricing
    if (!user && !loading) {
      router.push("/pricing");
      return;
    }

    let mounted = true;

    async function fetchProfile() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data && mounted) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading || isLoading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user is found and loading is complete, the useEffect will handle the redirect
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      <div className="bg-muted p-6 rounded-lg">
        <div className="flex items-center space-x-4 mb-6">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name}
              width={80}
              height={80}
              className="rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-700" />
          )}
          <div>
            <h2 className="text-2xl font-semibold">{profile?.full_name}</h2>
            <p className="text-gray-500">{profile?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
