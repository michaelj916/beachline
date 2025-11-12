import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { createServerSupabaseClient } from "@/lib/supabaseServerClient";

export const metadata = {
  title: "Sign in — Surfwatch",
};

export default async function LoginPage() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      redirect("/dashboard");
    }
  } catch (error) {
    console.warn("Supabase not configured yet for auth.", error);
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
      <section className="flex flex-col justify-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-lg shadow-sky-900/20">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">
          Secure by Supabase
        </span>
        <h1 className="text-4xl font-semibold leading-tight text-white">
          Your lineup, your data.
        </h1>
        <p className="text-lg text-white/70">
          Surfwatch ships with Supabase Auth, RLS-powered tables, and edge
          functions for buoy sync. Sign in to curate favorite spots, invite
          friends, and stream live conditions without paying a cent.
        </p>
        <ul className="space-y-2 text-sm text-white/60">
          <li>• Email + magic link out of the box</li>
          <li>• Ready for social providers when you are</li>
          <li>• Realtime broadcasts via Supabase channels</li>
        </ul>
        <Link
          href="https://github.com/michaelj916/beachline/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-sky-300/60 hover:text-sky-100"
        >
          View implementation guide
        </Link>
      </section>
      <div className="flex items-center justify-center">
        <AuthForm
          redirectTo="/dashboard"
          footer={
            <p>
              By signing in you agree to keep Surfwatch open-source and awesome.{" "}
              <Link
                href="https://supabase.com/docs/guides/auth"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted underline-offset-4"
              >
                Read the full Auth docs
              </Link>
              .
            </p>
          }
        />
      </div>
    </div>
  );
}

