"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, type ChangeEvent, type ReactNode } from "react";
import {
  FiArrowRight,
  FiCheckCircle,
  FiInfo,
  FiMail,
  FiUnlock,
} from "react-icons/fi";
import clsx from "clsx";
import { useSupabase } from "@/components/providers/SupabaseProvider";

type Props = {
  redirectTo?: string;
  footer?: ReactNode;
};

type Mode = "signin" | "signup";

export default function AuthForm({ redirectTo = "/dashboard", footer }: Props) {
  const { client } = useSupabase();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInput =
    (setter: (value: string) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
    };

  async function handlePasswordAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!email || !password) {
        setError("Email and password are required.");
        return;
      }

      if (mode === "signup") {
        const { error: signUpError } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setMessage("Check your email to confirm your account.");
      } else {
        const { error: signInError } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        router.push(redirectTo);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!email) {
        setError("Enter an email before requesting a magic link.");
        return;
      }
      const { error: otpError } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      setMessage("Magic link sent! Check your inbox.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <button
          type="button"
          onClick={() => {
            setMode((prev) => (prev === "signin" ? "signup" : "signin"));
            setError(null);
            setMessage(null);
          }}
          className="text-xs font-semibold uppercase tracking-wide text-sky-200 transition hover:text-sky-100"
        >
          {mode === "signin" ? "Need an account?" : "Have an account?"}
        </button>
      </div>
      <p className="mt-2 text-sm text-white/70">
        {mode === "signin"
          ? "Sign in to curate buoys, share spots, and unlock realtime dashboards."
          : "We’ll send a confirmation email to activate your Surfwatch account."}
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handlePasswordAuth}>
        <label className="grid gap-2 text-sm text-white/80">
          <span className="font-medium uppercase tracking-wide">Email</span>
          <div className="relative">
            <FiMail
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              required
              type="email"
              value={email}
              onChange={handleInput(setEmail)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-10 py-3 text-base text-white placeholder:text-white/40 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
        </label>

        <label className="grid gap-2 text-sm text-white/80">
          <span className="font-medium uppercase tracking-wide">
            Password{" "}
            <span className="text-white/50">
              {mode === "signin" ? "" : "(min 6 characters)"}
            </span>
          </span>
          <div className="relative">
            <FiUnlock
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              required
              type="password"
              value={password}
              onChange={handleInput(setPassword)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-10 py-3 text-base text-white placeholder:text-white/40 focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
              placeholder="••••••••"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className={clsx(
            "group inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400",
            loading ? "bg-white/10 text-white/60" : "bg-sky-500 text-slate-950 hover:bg-sky-400"
          )}
        >
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          <FiArrowRight aria-hidden className="transition group-hover:translate-x-0.5" />
        </button>
      </form>

      <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-wide text-white/40">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={handleMagicLink}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-sky-300/60 hover:text-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Send magic link
      </button>

      {(message || error) && (
        <div
          className={clsx(
            "mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
            error
              ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          )}
        >
          {error ? (
            <FiInfo aria-hidden className="mt-0.5 shrink-0" />
          ) : (
            <FiCheckCircle aria-hidden className="mt-0.5 shrink-0" />
          )}
          <p>{error ?? message}</p>
        </div>
      )}

      {footer && <div className="mt-6 text-xs text-white/50">{footer}</div>}
    </div>
  );
}

