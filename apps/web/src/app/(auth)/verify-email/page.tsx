"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type VerifyState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [state, setState] = useState<VerifyState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double-fire in React strict mode
    if (hasRun.current) return;
    hasRun.current = true;

    if (!token || !email) {
      setErrorMessage("This verification link is missing required parameters.");
      setState("error");
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errorMsg =
            typeof data.error === "object" && data.error !== null
              ? data.error.message || JSON.stringify(data.error)
              : typeof data.error === "string"
              ? data.error
              : "Verification failed. The link may have expired or already been used.";

          setErrorMessage(errorMsg);
          setState("error");
          return;
        }

        setState("success");
      } catch {
        setErrorMessage("Network error. Please check your connection and try again.");
        setState("error");
      }
    }

    verify();
  }, [token, email]);

  // Loading
  if (state === "loading") {
    return (
      <div className="text-center py-8">
        <span className="mx-auto block h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold text-gray-900">Verifying your email…</h2>
        <p className="mt-2 text-sm text-gray-500">This will only take a moment.</p>
      </div>
    );
  }

  // Success
  if (state === "success") {
    return (
      <div className="text-center py-4">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-7 w-7 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Email verified!</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Your email address has been confirmed. You can now sign in to your account.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center justify-center w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors min-h-[44px]"
        >
          Sign in to RenewIt
        </Link>
      </div>
    );
  }

  // Error
  return (
    <div className="text-center py-4">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <svg
          className="h-7 w-7 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900">Verification failed</h2>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">
        {errorMessage ?? "Something went wrong. Please try again."}
      </p>

      <div className="mt-8 space-y-3">
        <Link
          href="/register"
          className="block w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors min-h-[44px] flex items-center justify-center"
        >
          Create a new account
        </Link>
        <Link
          href="/login"
          className="block w-full rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px] flex items-center justify-center"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-8">
          <span className="mx-auto block h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-bold text-gray-900">Verifying your email…</h2>
          <p className="mt-2 text-sm text-gray-500">This will only take a moment.</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
