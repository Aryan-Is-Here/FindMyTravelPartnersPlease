"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { InboxItem } from "@/lib/types";
import Inbox from "./Inbox";
import FeedbackModal from "./FeedbackModal";
import Wordmark from "./Wordmark";

export default function Header() {
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await createClient().rpc("my_inbox");
    setItems((data as InboxItem[]) ?? []);
  }, []);

  useEffect(() => {
    load();
    // Any change to join_requests I'm allowed to see → refresh the bell.
    const supabase = createClient();
    const channel = supabase
      .channel("inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "join_requests" }, () => load())
      .subscribe();
    const t = setInterval(load, 60_000);
    return () => {
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [load]);

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 bg-cream/80 backdrop-blur-md border-b border-stone-300/60">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link href="/panel" className="mr-auto" aria-label="Home">
          <Wordmark className="text-[30px] sm:text-[34px] leading-none" />
        </Link>
        <div className="relative">
          <button aria-label="Notifications" className="relative p-2 rounded-full text-ink hover:bg-sage-pale/70 transition" onClick={() => setOpen((o) => !o)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            {items.length > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-burgundy text-paper text-[10px] font-semibold grid place-items-center">
                {items.length}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] max-h-[70vh] overflow-auto bg-paper border border-stone-200 rounded-xl shadow-[0_24px_48px_-24px_rgba(43,34,36,0.45)] p-3">
              <Inbox items={items} onChange={load} />
            </div>
          )}
        </div>
        <Link href="/profile" className="font-label text-xs text-ink hover:text-burgundy transition">
          Profile
        </Link>
        <button className="font-label text-xs text-stone-500 hover:text-burgundy transition" onClick={logout}>
          Logout
        </button>
      </div>
      <FeedbackModal />
    </header>
  );
}
