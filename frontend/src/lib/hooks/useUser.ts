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
          const ipAddress = await getUserIpAddress();
          await createOrUpdateUser(session.user, ipAddress);
          dispatch(setUser(session.user));
        } else if (!session && mounted) {
          // Only redirect to home if we're on a protected route
          const protectedRoutes = ["/profile", "/subscriptions"];
          if (protectedRoutes.includes(router.pathname)) {
            router.push("/");
          }
          dispatch(setUser(null));
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        if (mounted) {
          dispatch(setLoading(false));
        }
      }
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (session?.user) {
          const ipAddress = await getUserIpAddress();
          await createOrUpdateUser(session.user, ipAddress);
          dispatch(setUser(session.user));
        } else {
          // Only redirect to home if we're on a protected route
          const protectedRoutes = ["/profile", "/subscriptions"];
          if (protectedRoutes.includes(router.pathname)) {
            router.push("/");
          }
          dispatch(setUser(null));
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch, router]);
}
