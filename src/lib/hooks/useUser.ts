import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setUser, setLoading } from "@/store/features/userSlice";
import supabase from "@/lib/supabaseClient";
import { createOrUpdateUser } from "@/services/auth";
import { getUserIpAddress } from "@/utils/ipUtils";
import { useRouter } from "next/router";

export function useUser() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        dispatch(setLoading(true));
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          // Check if the session is expired
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at < now) {
            await supabase.auth.signOut();
            dispatch(setUser(null));
            if (isProtectedRoute(router.pathname)) {
              router.push("/");
            }
            return;
          }

          const ipAddress = await getUserIpAddress();
          await createOrUpdateUser(session.user, ipAddress);
          dispatch(setUser(session.user));
        } else if (!session && mounted) {
          dispatch(setUser(null));
          if (isProtectedRoute(router.pathname)) {
            router.push("/");
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
        dispatch(setUser(null));
      } finally {
        if (mounted) {
          dispatch(setLoading(false));
        }
      }
    }

    // Helper function to check if a route is protected
    function isProtectedRoute(pathname: string) {
      const protectedRoutes = ["/profile", "/subscriptions"];
      return protectedRoutes.includes(pathname);
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        // Check if the session is expired
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < now) {
          await supabase.auth.signOut();
          dispatch(setUser(null));
          if (isProtectedRoute(router.pathname)) {
            router.push("/");
          }
          return;
        }

        const ipAddress = await getUserIpAddress();
        await createOrUpdateUser(session.user, ipAddress);
        dispatch(setUser(session.user));
      } else {
        dispatch(setUser(null));
        if (isProtectedRoute(router.pathname)) {
          router.push("/");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch, router]);
}
