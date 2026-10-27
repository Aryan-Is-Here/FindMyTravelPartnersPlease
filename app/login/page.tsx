"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  async function signIn() {
    await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback`, queryParams: { prompt: "select_account" } },
    });
  }

  return (
    <main className="flex-1 grid place-items-center p-6">
      <div className="max-w-sm w-full text-center">
        <p className="text-sm uppercase tracking-widest text-stone-500">Holidays are coming</p>
        <h1 className="font-display text-4xl mt-2 leading-tight">
          FindMy<span className="text-[var(--accent)]">Travel</span>Partners<span className="text-stone-400">Please</span>
        </h1>
        <p className="mt-4 text-stone-600">
          Find hostel mates heading to your city around the same date. Form a party, plan in the room, split the cab.
        </p>
        <button className="btn w-full mt-8 py-3" onClick={signIn}>
          Continue with Google
        </button>
        <p className="text-xs text-stone-500 mt-3">College emails get a ✓ verified badge. Personal Gmail works too.</p>
      </div>
    </main>
  );
}
