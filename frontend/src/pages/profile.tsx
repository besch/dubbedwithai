import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/router";

interface UserProfile {
  full_name: string;
  email: string;
  avatar_url: string;
}

export default function Profile() {
  const user = useAppSelector((state) => state.user.user);
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    async function fetchProfile() {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user!.id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user, router]);

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      <div className="bg-muted p-6 rounded-lg">
        <div className="flex items-center space-x-4 mb-6">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="w-20 h-20 rounded-full"
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
