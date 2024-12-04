import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setUser, setLoading } from "@/store/features/userSlice";
import supabase from "@/lib/supabaseClient";
import { createOrUpdateUser } from "@/services/auth";

export function useUser() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        createOrUpdateUser(session.user)
          .then(() => dispatch(setUser(session.user)))
          .finally(() => dispatch(setLoading(false)));
      } else {
        dispatch(setLoading(false));
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await createOrUpdateUser(session.user);
        dispatch(setUser(session.user));
      } else {
        dispatch(setUser(null));
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);
}