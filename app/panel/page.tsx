"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CITIES, MEDIUMS, TIME_SLOTS, YEARS, formatDate, label } from "@/lib/constants";
import type { MyParty, PartySummary, PublicUser } from "@/lib/types";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import ReportButton from "@/components/ReportButton";
import TicketStub from "@/components/TicketStub";

type Filters = { city: string; from: string; to: string; medium: string; year: string; q: string };

export default function PanelPage() {
  const [tab, setTab] = useState<"people" | "parties">("people");
  const [filters, setFilters] = useState<Filters | null>(null);
  const [people, setPeople] = useState<PublicUser[]>([]);
  const [parties, setParties] = useState<PartySummary[]>([]);
  const [mine, setMine] = useState<MyParty[]>([]);
  const [loading, setLoading] = useState(true);

  // Default filter = my own destination city.
  useEffect(() => {
    createClient()
      .from("trip_prefs")
      .select("destination_city")
      .maybeSingle()
      .then(({ data }) => setFilters({ city: data?.destination_city ?? "", from: "", to: "", medium: "", year: "", q: "" }));
  }, []);

  const load = useCallback(async () => {
    if (!filters) return;
    setLoading(true);
    const supabase = createClient();
    const common = {
      p_city: filters.city || null,
      p_date_from: filters.from || null,
      p_date_to: filters.to || null,
      p_medium: filters.medium || null,
    };
    const [u, p, m] = await Promise.all([
      supabase.rpc("browse_users", { ...common, p_year: filters.year ? Number(filters.year) : null, p_q: filters.q.trim() || null }),
      supabase.rpc("browse_parties", common),
      supabase.rpc("my_parties"),
    ]);
    setPeople(u.data ?? []);
    setParties(p.data ?? []);
    setMine(m.data ?? []);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((f) => f && { ...f, [k]: e.target.value });

  const headed = mine.filter((p) => p.is_head);

  return (
    <>
      <Header />
      <main className="max-w-3xl w-full mx-auto px-4 pb-16 pt-6 space-y-6">
        <section className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Hostel holiday board</p>
            <h1 className="font-display text-[68px] sm:text-[88px] text-ink">Departures</h1>
            <p className="text-sm text-stone-600 max-w-sm">Hostellers heading out, closest to your city and date first.</p>
          </div>
          <Link href="/party/new" className="btn shrink-0">
            Create party
          </Link>
        </section>

        {mine.length > 0 && (
          <section>
            <p className="eyebrow mb-2">Your parties</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {mine.map((p) => (
                <Link
                  key={p.id}
                  href={`/party/${p.id}`}
                  className="shrink-0 rounded-lg border border-burgundy/25 bg-burgundy/5 px-3 py-2 transition hover:border-burgundy"
                >
                  <p className="font-medium text-sm">
                    {p.name} {p.is_head && <span className="text-burgundy">· head</span>}
                  </p>
                  <p className="font-label text-[10px] text-stone-500">
                    {p.destination_city} · {formatDate(p.travel_date)} · {p.member_count}/{p.max_size}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="seg">
          {(["people", "parties"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? "seg-on" : ""}>
              {t}
            </button>
          ))}
        </div>

        {filters && (
          <div className="card grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tab === "people" && (
              <input className="input col-span-2 sm:col-span-3" placeholder="Search by name" value={filters.q} onChange={set("q")} />
            )}
            <select className="input" aria-label="City" value={filters.city} onChange={set("city")}>
              <option value="">All cities</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select className="input" aria-label="Travel medium" value={filters.medium} onChange={set("medium")}>
              <option value="">Any medium</option>
              {MEDIUMS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {tab === "people" && (
              <select className="input" aria-label="Year" value={filters.year} onChange={set("year")}>
                <option value="">Any year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            )}
            <label className="eyebrow">
              From
              <input className="input mt-1 normal-case tracking-normal" type="date" value={filters.from} onChange={set("from")} />
            </label>
            <label className="eyebrow">
              To
              <input className="input mt-1 normal-case tracking-normal" type="date" value={filters.to} onChange={set("to")} />
            </label>
          </div>
        )}

        {loading ? (
          <p className="eyebrow text-center py-12">Loading departures…</p>
        ) : tab === "people" ? (
          people.length ? (
            <ul className="space-y-4">
              {people.map((u) => (
                <PersonCard key={u.college_id} user={u} headed={headed} />
              ))}
            </ul>
          ) : (
            <Empty title="No one yet" text="Clear a filter or two, or share the link in your hostel group." />
          )
        ) : parties.length ? (
          <ul className="space-y-4">
            {parties.map((p) => (
              <PartyCard key={p.id} party={p} onChange={load} />
            ))}
          </ul>
        ) : (
          <Empty title="No parties yet" text="Create one and be the party head. Others can request to join." />
        )}
      </main>
    </>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="text-center py-12 px-6">
      <p className="font-display text-5xl text-stone-400">{title}</p>
      <p className="text-sm text-stone-500 mt-2">{text}</p>
    </div>
  );
}

function PersonCard({ user: u, headed }: { user: PublicUser; headed: MyParty[] }) {
  const [inviting, setInviting] = useState(false);
  const [done, setDone] = useState("");

  async function invite(partyId: string) {
    const { error } = await createClient().rpc("invite_user", { p: partyId, target: u.college_id });
    setInviting(false);
    if (error) alert(error.message);
    else setDone("Invited");
  }

  return (
    <li className="ticket">
      <TicketStub city={u.destination_city} date={u.travel_date} foot={label(TIME_SLOTS, u.preferred_time).split(" (")[0]} />
      <div className="ticket-body">
        <div className="flex gap-3 items-center">
          <Avatar src={u.avatar_url} name={u.name} size={44} />
          <div className="min-w-0">
            <p className="font-semibold leading-tight truncate">{u.name}</p>
            <p className="font-label text-[10px] text-stone-500 mt-0.5">
              {u.year ? `Year ${u.year} · ` : ""}
              {u.budget != null ? `Budget ~₹${u.budget}` : "Budget flexible"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {u.travel_mediums.map((m) => (
            <span key={m} className="tag">
              {label(MEDIUMS, m)}
            </span>
          ))}
        </div>
        {u.bio && <p className="text-sm text-stone-700 mt-3 whitespace-pre-line line-clamp-4">{u.bio}</p>}
        <div className="flex gap-2 mt-4 items-center">
          {done ? (
            <span className="font-label text-xs text-sage-deep">{done} ✓</span>
          ) : headed.length === 0 ? (
            <Link href="/party/new" className="text-sm text-stone-500 underline decoration-stone-300 underline-offset-4">
              Create a party to invite
            </Link>
          ) : inviting ? (
            <select className="input py-1.5 text-sm max-w-56" defaultValue="" onChange={(e) => e.target.value && invite(e.target.value)}>
              <option value="">Invite to which party?</option>
              {headed.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <button className="btn btn-sm" onClick={() => (headed.length === 1 ? invite(headed[0].id) : setInviting(true))}>
              Invite to party
            </button>
          )}
          <ReportButton target={u.college_id} name={u.name} />
        </div>
      </div>
    </li>
  );
}

function PartyCard({ party: p, onChange }: { party: PartySummary; onChange: () => void }) {
  const full = p.member_count >= p.max_size;

  async function join() {
    const { error } = await createClient().rpc("request_join", { p: p.id });
    if (error) alert(error.message);
    onChange();
  }

  return (
    <li className="ticket">
      <TicketStub city={p.destination_city} date={p.travel_date} foot={label(TIME_SLOTS, p.preferred_time).split(" (")[0]} />
      <div className="ticket-body flex flex-col">
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">Party · {label(MEDIUMS, p.travel_medium)}</p>
            <p className="font-display text-[40px] text-ink break-words">{p.name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-[44px] text-burgundy">
              {p.member_count}
              <span className="text-stone-400 text-[26px]">/{p.max_size}</span>
            </p>
            <p className="eyebrow">Going</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-4">
          <Avatar src={p.head_avatar} name={p.head_name} size={26} />
          <span className="text-sm text-stone-600 truncate">Head: {p.head_name}</span>
          <span className="ml-auto shrink-0">
            {p.my_status === "member" ? (
              <Link href={`/party/${p.id}`} className="btn btn-sm">
                Open room
              </Link>
            ) : p.my_status === "requested" ? (
              <span className="font-label text-xs text-stone-500">Requested</span>
            ) : p.my_status === "invited" ? (
              <span className="font-label text-xs text-burgundy">Invited · see 🔔</span>
            ) : p.my_status === "rejected" ? (
              <span className="font-label text-xs text-stone-400">Declined</span>
            ) : (
              <button className="btn btn-sm" disabled={full} onClick={join}>
                {full ? "Full" : "Request to join"}
              </button>
            )}
          </span>
        </div>
      </div>
    </li>
  );
}
