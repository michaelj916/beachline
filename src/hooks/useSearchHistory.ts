"use client";

import { useCallback, useEffect, useState } from "react";

const COOKIE_NAME = "surfwatch_search_history";
const MAX_HISTORY = 10;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function parseCookie(): string[] {
  if (typeof document === "undefined") {
    return [];
  }
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));

  if (!cookie) return [];
  try {
    const value = decodeURIComponent(cookie.split("=")[1] ?? "");
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch (error) {
    console.warn("Unable to parse search history cookie", error);
  }
  return [];
}

function writeCookie(values: string[]) {
  if (typeof document === "undefined") {
    return;
  }
  const payload = encodeURIComponent(JSON.stringify(values));
  document.cookie = `${COOKIE_NAME}=${payload}; path=/; max-age=${COOKIE_MAX_AGE}`;
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(parseCookie());
  }, []);

  const addSearch = useCallback((term: string) => {
    setHistory((prev) => {
      const trimmed = term.trim();
      if (!trimmed) return prev;
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(
        0,
        MAX_HISTORY
      );
      writeCookie(next);
      return next;
    });
  }, []);

  const removeSearch = useCallback((term: string) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item !== term);
      writeCookie(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeCookie([]);
  }, []);

  return {
    history,
    addSearch,
    removeSearch,
    clearHistory,
  };
}

