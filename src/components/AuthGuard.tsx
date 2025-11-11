"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
};

export default function AuthGuard({
  children,
  fallback = null,
  redirectTo = "/login",
}: Props) {
  const { session, loading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace(redirectTo);
    }
  }, [loading, session, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center py-12">
        <span className="text-muted-foreground text-sm">Checking session…</span>
      </div>
    );
  }

  if (!session) {
    return fallback;
  }

  return <>{children}</>;
}


