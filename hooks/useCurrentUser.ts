"use client";

import { useEffect, useState } from "react";
import { getSupabaseAuthClient } from "@/lib/supabase";

export interface CurrentUser {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
}

export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let mounted = true;
    try {
      const client = getSupabaseAuthClient() as any;

      const resolve = (authUser: any) => {
        if (!authUser) {
          if (mounted) setUser(null);
          return;
        }
        const meta = authUser.user_metadata || {};
        const name =
          meta.full_name ||
          meta.username ||
          authUser.email?.split("@")[0] ||
          "Admin";

        if (mounted) {
          setUser({
            id: authUser.id,
            name,
            email: authUser.email ?? null,
            role: null,
          });
        }

        client
          .from("profiles")
          .select("full_name, role")
          .eq("id", authUser.id)
          .maybeSingle()
          .then(
            ({
              data,
            }: {
              data: { full_name?: string; role?: string } | null;
            }) => {
              if (!mounted) return;
              setUser((prev) =>
                prev
                  ? {
                      ...prev,
                      name: data?.full_name || prev.name,
                      role: data?.role ?? null,
                    }
                  : prev,
              );
            },
          );
      };

      client.auth.getUser().then(({ data }: { data: { user: any } }) => {
        if (mounted) resolve(data.user);
      });

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange(
        (_event: string, session: { user: any } | null) => {
          if (mounted) resolve(session?.user);
        },
      );

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } catch {
      if (mounted) setUser(null);
      return () => {
        mounted = false;
      };
    }
  }, []);

  return user;
}
