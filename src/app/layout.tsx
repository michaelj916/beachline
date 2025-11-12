import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Surfwatch — Open Surf Intelligence",
  description:
    "Track your favorite breaks with live buoy data, personalized dashboards, and open tooling powered by Supabase + Next.js.",
};

async function Shell({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const logout = async () => {
    "use server";
    const supabaseForAction = createServerSupabaseClient();
    await supabaseForAction.auth.signOut();
    redirect("/");
  };

  return (
    <SupabaseProvider initialSession={session}>
      <QueryProvider>
        <div className="relative min-h-screen bg-slate-950 text-white">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-sky-900/40 to-slate-900" />
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden">
            <div className="bg-wave-mask h-full w-full opacity-30 mix-blend-screen" />
          </div>
          <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <span className="rounded-md bg-sky-500/20 px-2 py-1 text-xs uppercase tracking-wide text-sky-200">
                  Surfwatch
                </span>
                <span className="hidden text-sm text-white/70 sm:block">
                  Open Surf Intelligence
                </span>
              </Link>
              <nav className="flex items-center gap-4 text-sm text-white/80">
                <Link
                  href="/dashboard"
                  className="rounded-full border border-white/10 px-4 py-1.5 transition hover:border-sky-400/60 hover:text-sky-100"
                >
                  Dashboard
                </Link>
                <Link
                  href="/explore"
                  className="rounded-full border border-white/10 px-4 py-1.5 transition hover:border-sky-400/60 hover:text-sky-100"
                >
                  Explore
                </Link>
                {session ? (
                  <form action={logout}>
                    <button
                      type="submit"
                      className="rounded-full bg-white/10 px-4 py-1.5 font-medium text-white transition hover:bg-white/20"
                    >
                      Sign out
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full bg-sky-500 px-4 py-1.5 font-medium text-slate-950 transition hover:bg-sky-400"
                  >
                    Sign in
                  </Link>
                )}
              </nav>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10">
            <Suspense fallback={<div className="py-24 text-center">Loading…</div>}>
              {children}
            </Suspense>
          </main>

          <footer className="border-t border-white/10 bg-slate-950/70 py-6">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
              <p>Built with Next.js 14, Supabase, and NOAA NDBC data.</p>
              <p>Open source under the MIT License.</p>
            </div>
          </footer>
        </div>
      </QueryProvider>
    </SupabaseProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} bg-slate-950`}
    >
      <body className="min-h-screen antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
