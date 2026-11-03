"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/constants";
import type { InboxItem, MyParty, TripPrefs, User } from "@/lib/types";
import Header from "@/components/Header";
import Inbox from "@/components/Inbox";
import TripForm from "@/components/TripForm";
import UserDetailsForm from "@/components/UserDetailsForm";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [trip, setTrip] = useState<TripPrefs | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [parties, setParties] = useState<MyParty[]>([]);
  const [saved, setSaved] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const [u, t, i, p] = await Promise.all([
      supabase.from("users").select("*").single(),
      supabase.from("trip_prefs").select("*").single(),
      supabase.rpc("my_inbox"),
      supabase.rpc("my_parties"),
    ]);
    setUser(u.data);
    setTrip(t.data);
    setInbox(i.data ?? []);
    setParties(p.data ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(""), 2500);
  };

  return (
    <>
      <Header />
      <main className="max-w-md w-full mx-auto px-5 pt-8 pb-16 space-y-12">
        <section>
          <h2 className="font-display text-[52px] mb-4">Want to travel <span className="text-burgundy">with you</span></h2>
          <Inbox items={inbox} onChange={load} />
        </section>

        <section>
          <h2 className="font-display text-[52px] mb-4">Your parties</h2>
          {parties.length ? (
            <ul className="space-y-2">
              {parties.map((p) => (
                <li key={p.id}>
                  <Link href={`/party/${p.id}`} className="card flex justify-between hover:border-stone-400">
                    <span>
                      {p.name} {p.is_head && <span className="tag">👑 head</span>}
                    </span>
                    <span className="text-sm text-stone-500">
                      {p.destination_city} · {formatDate(p.travel_date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-500">Not in any party yet.</p>
          )}
        </section>

        {saved && <p className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-burgundy text-paper font-label text-xs px-5 py-2.5 rounded-full shadow-lg">{saved}</p>}

        {trip && (
          <section>
            <h2 className="font-display text-[52px] mb-4">Your trip</h2>
            <TripForm initial={trip} submitLabel="Save trip" onSaved={() => flash("Trip saved")} />
          </section>
        )}

        {user && (
          <section>
            <h2 className="font-display text-[52px] mb-4">Your details</h2>
            <UserDetailsForm initial={user} email={user.email} submitLabel="Save details" onSaved={() => flash("Details saved")} />
          </section>
        )}
      </main>
    </>
  );
}
