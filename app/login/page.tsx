"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  async function signIn() {
    await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback`, queryParams: { prompt: "select_account" } },
    });
  }

  return (
    <main className="flex-1 flex flex-col">
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 pt-10 pb-8 grid gap-10 md:grid-cols-[1.15fr_1fr] md:items-center">
        <section>
          <p className="eyebrow">For hostellers going home for the holidays</p>
          <h1 className="font-display mt-3 text-[25vw] sm:text-[150px] md:text-[168px] leading-[0.86] text-ink">
            Find my
            <br />
            <span className="text-burgundy">travel</span>
            <br />
            partners
            <br />
            <span className="text-sage">please</span>
          </h1>
        </section>

        <section className="md:pl-8 md:border-l md:border-stone-300/70">
          <p className="text-lg text-stone-700 max-w-sm">
            See who from your hostel is going to your city around the same date. Make a party, plan the trip in a private
            room, and split the cab.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-stone-600">
            <li className="flex gap-3">
              <span className="font-label text-burgundy w-16 shrink-0">Match</span>
              Same city and closest date show up first
            </li>
            <li className="flex gap-3">
              <span className="font-label text-burgundy w-16 shrink-0">Party</span>
              Chat, plan and share a trip playlist
            </li>
            <li className="flex gap-3">
              <span className="font-label text-burgundy w-16 shrink-0">Private</span>
              Your number is shared only if you agree
            </li>
          </ul>

          <button className="btn w-full max-w-sm mt-8 py-3.5 text-sm" onClick={signIn}>
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
              <path fill="#f8f3eb" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
            </svg>
            Continue with Google
          </button>
          <p className="text-xs text-stone-500 mt-3 max-w-sm">
            Any Google account works. We only get your name, email and photo.{" "}
            <Link href="/privacy" className="underline decoration-stone-300 underline-offset-2 hover:text-burgundy">
              Privacy policy
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
