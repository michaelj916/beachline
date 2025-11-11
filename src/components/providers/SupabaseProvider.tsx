"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabaseClient";
import type { Database } from "@/lib/types";

type SupabaseContextValue = {
  client: SupabaseClient<Database>;
  session: Session | null;
  loading: boolean;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(
  undefined
);

type Props = {
  children: ReactNode;
  initialSession: Session | null;
};

export function SupabaseProvider({ children, initialSession }: Props) {
  const [client] = useState(() => getBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(!initialSession);

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      const { data } = await client.auth.getSession();
      if (!ignore) {
        setSession(data.session ?? null);
        setLoading(false);
      }
    }

    if (!initialSession) {
      loadSession();
    } else {
      setLoading(false);
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [client, initialSession]);

  const value = useMemo(
    () => ({
      client,
      session,
      loading,
    }),
    [client, session, loading]
  );

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
}


