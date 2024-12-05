import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setUser, setLoading } from "@/store/features/userSlice";
import supabase from "@/lib/supabaseClient";
import { createOrUpdateUser } from "@/services/auth";

export function useUser() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          await createOrUpdateUser(session.user);
          dispatch(setUser(session.user));
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
          await createOrUpdateUser(session.user);
          dispatch(setUser(session.user));
        } else {
          dispatch(setUser(null));
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [dispatch]);
}
