"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// After a party room is deleted or expires, ask each member once: helpful or nah?
export default function FeedbackModal() {
  const [queue, setQueue] = useState<{ party_id: string; party_name: string }[]>([]);

  useEffect(() => {
    createClient()
      .rpc("pending_feedback")
      .then(({ data }) => setQueue(data ?? []));
  }, []);

  const current = queue[0];
  if (!current) return null;

  async function answer(helpful: boolean) {
    await createClient().rpc("submit_feedback", { p: current.party_id, is_helpful: helpful });
    setQueue((q) => q.slice(1));
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center p-4">
      <div className="bg-paper rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
        <p className="eyebrow">Your party room has ended</p>
        <h2 className="font-display text-6xl mt-2 text-burgundy">{current.party_name}</h2>
        <p className="mt-4">Did FindMyTravelPartnersPlease help you?</p>
        <div className="flex gap-3 justify-center mt-5">
          <button className="btn" onClick={() => answer(true)}>
            Helpful
          </button>
          <button className="btn-ghost" onClick={() => answer(false)}>
            Nah
          </button>
        </div>
      </div>
    </div>
  );
}
