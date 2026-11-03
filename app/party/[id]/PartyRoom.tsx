"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MEDIUMS, TIME_SLOTS, formatDate, label } from "@/lib/constants";
import type { InboxItem, Member, Message, Song } from "@/lib/types";
import Header from "@/components/Header";
import Avatar from "@/components/Avatar";
import Inbox from "@/components/Inbox";
import ReportButton from "@/components/ReportButton";
import TicketStub from "@/components/TicketStub";

type Party = {
  id: string;
  name: string;
  head_id: string;
  destination_city: string;
  travel_date: string;
  preferred_time: string;
  travel_medium: string;
  max_size: number;
  expires_at: string;
};

export default function PartyRoom() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [party, setParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState<"chat" | "vibe" | "people">("chat");

  const loadMembers = useCallback(async () => {
    const { data, error } = await createClient().rpc("get_party_members", { p: id });
    if (error) return setMissing(true);
    setMembers(data ?? []);
  }, [id]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("users")
      .select("college_id")
      .maybeSingle()
      .then(({ data }) => setMe(data?.college_id ?? null));
    supabase
      .from("parties")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle()
      .then(({ data }) => (data ? setParty(data) : setMissing(true)));
    loadMembers();
    const t = setInterval(loadMembers, 30_000);
    return () => clearInterval(t);
  }, [id, loadMembers]);

  if (missing)
    return (
      <>
        <Header />
        <main className="p-10 text-center text-stone-500">
          This room doesn&apos;t exist, has ended, or you&apos;re not in it.{" "}
          <Link href="/panel" className="underline">
            Back to panel
          </Link>
        </main>
      </>
    );
  if (!party || !me) return <Header />;

  const isHead = party.head_id === me;
  const myMember = members.find((m) => m.college_id === me);
  const names = Object.fromEntries(members.map((m) => [m.college_id, m.name]));

  async function deleteRoom() {
    if (!confirm("Delete this room for everyone? Chat and songs will be gone for good.")) return;
    const { error } = await createClient().rpc("delete_party", { p: id });
    if (error) return alert(error.message);
    router.push("/panel");
  }

  async function leave() {
    if (!confirm("Leave this party?")) return;
    await createClient().from("party_members").delete().eq("party_id", id).eq("user_id", me!);
    router.push("/panel");
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl w-full mx-auto px-4 pt-6 pb-16 flex flex-col gap-5 flex-1">
        <section className="ticket">
          <TicketStub city={party.destination_city} date={party.travel_date} foot={label(TIME_SLOTS, party.preferred_time).split(" (")[0]} />
          <div className="ticket-body">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <p className="eyebrow">Party room · {label(MEDIUMS, party.travel_medium)}</p>
                <h1 className="font-display text-[56px] sm:text-[64px] break-words">{party.name}</h1>
              </div>
              {isHead ? (
                <button className="font-label text-xs text-burgundy hover:underline shrink-0" onClick={deleteRoom}>
                  Delete room
                </button>
              ) : (
                <button className="font-label text-xs text-stone-500 hover:text-burgundy shrink-0" onClick={leave}>
                  Leave
                </button>
              )}
            </div>
            <p className="text-sm text-stone-600 mt-1">{formatDate(party.travel_date)}</p>
            <p className="eyebrow mt-3">
              Room closes {new Date(party.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </p>
          </div>
        </section>

        {myMember && <Contacts partyId={id} consent={myMember.whatsapp_consent} onChange={loadMembers} members={members} />}

        <div className="seg self-start">
          {(["chat", "vibe", "people"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={tab === t ? "seg-on" : ""}>
              {t === "people" ? `People (${members.length}/${party.max_size})` : t}
            </button>
          ))}
        </div>

        {tab === "chat" && <Chat partyId={id} me={me} names={names} />}
        {tab === "vibe" && <Vibe partyId={id} me={me} isHead={isHead} names={names} />}
        {tab === "people" && (
          <section className="space-y-4">
            {isHead && <HeadRequests partyId={id} onChange={loadMembers} />}
            <ul className="space-y-2">
              {members.map((m) => (
                <li key={m.college_id} className="card flex items-center gap-3 py-3">
                  <Avatar src={m.avatar_url} name={m.name} size={40} />
                  <div className="flex-1">
                    <p className="font-medium">
                      {m.name} {m.is_head && <span className="tag">👑 head</span>}
                    </p>
                    <p className="text-xs text-stone-500">
                      {m.year ? `Year ${m.year} · ` : ""}
                      {m.whatsapp_consent ? "Shared WhatsApp" : "Number private"}
                    </p>
                  </div>
                  {m.college_id !== me && <ReportButton target={m.college_id} name={m.name} />}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}

function Contacts({
  partyId,
  consent,
  members,
  onChange,
}: {
  partyId: string;
  consent: boolean;
  members: Member[];
  onChange: () => void;
}) {
  const [contacts, setContacts] = useState<{ college_id: string; name: string; phone: string }[]>([]);
  const consentKey = members.map((m) => m.college_id + m.whatsapp_consent).join();

  useEffect(() => {
    if (!consent) return;
    createClient()
      .rpc("get_party_contacts", { p: partyId })
      .then(({ data }) => setContacts(data ?? []));
  }, [consent, partyId, consentKey]);

  async function toggle(value: boolean) {
    const supabase = createClient();
    const { data } = await supabase.from("users").select("college_id").single();
    await supabase.from("party_members").update({ whatsapp_consent: value }).eq("party_id", partyId).eq("user_id", data!.college_id);
    onChange();
  }

  if (!consent)
    return (
      <section className="card border-sage/40 bg-sage-pale/60">
        <p className="text-sm">
          <b>Share your WhatsApp number with this party?</b> You&apos;ll see the numbers of others who also agreed. You can turn it
          off anytime.
        </p>
        <button className="btn btn-sm mt-3" onClick={() => toggle(true)}>
          Yes, share my number
        </button>
      </section>
    );

  return (
    <section className="card">
      <div className="flex justify-between items-center">
        <h2 className="font-medium text-sm">WhatsApp</h2>
        <button className="text-xs text-stone-500 underline" onClick={() => toggle(false)}>
          Stop sharing my number
        </button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {contacts.map((c) => (
          <li key={c.college_id}>
            <a
              className="chip inline-block"
              href={`https://wa.me/${c.phone.replace(/^\+/, "").replace(/^(\d{10})$/, "91$1")}`}
              target="_blank"
              rel="noreferrer"
            >
              💬 {c.name}
            </a>
          </li>
        ))}
      </ul>
      {contacts.length <= 1 && <p className="text-xs text-stone-500 mt-2">Waiting for others to share theirs.</p>}
    </section>
  );
}

function Chat({ partyId, me, names }: { partyId: string; me: string; names: Record<string, string> }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("messages")
      .select("*")
      .eq("party_id", partyId)
      .order("created_at")
      .limit(500)
      .then(({ data }) => setMessages(data ?? []));
    const channel = supabase
      .channel(`chat-${partyId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `party_id=eq.${partyId}` }, (payload) =>
        setMessages((m) => (m.some((x) => x.id === payload.new.id) ? m : [...m, payload.new as Message])),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [partyId]);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    const { data, error } = await createClient().from("messages").insert({ party_id: partyId, body }).select().single();
    if (error) return alert(error.message);
    setMessages((m) => (m.some((x) => x.id === data.id) ? m : [...m, data]));
  }

  return (
    <section className="card flex flex-col p-0 overflow-hidden">
      <div className="h-[50vh] overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && <p className="text-center text-sm text-stone-400 pt-10">Say hi and start planning 👋</p>}
        {messages.map((m) => {
          const mine = m.user_id === me;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {!mine && <span className="text-[11px] text-stone-500 ml-1">{names[m.user_id] ?? "Former member"}</span>}
              <p
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                  mine ? "bg-burgundy text-paper rounded-br-sm" : "bg-sage-pale/70 text-ink rounded-bl-sm"
                }`}
              >
                {m.body}
              </p>
              <span className="text-[10px] text-stone-400 mx-1">
                {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-stone-200 p-2">
        <input className="input" placeholder="Message" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn">Send</button>
      </form>
    </section>
  );
}

function Vibe({ partyId, me, isHead, names }: { partyId: string; me: string; isHead: boolean; names: Record<string, string> }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");

  const load = useCallback(async () => {
    const { data } = await createClient().from("songs").select("*").eq("party_id", partyId).order("created_at");
    setSongs(data ?? []);
  }, [partyId]);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const l = link.trim();
    if (l && !/^https?:\/\//.test(l)) return alert("Link must start with http:// or https://");
    const { error } = await createClient()
      .from("songs")
      .insert({ party_id: partyId, title: title.trim(), link: l || null });
    if (error) return alert(error.message);
    setTitle("");
    setLink("");
    load();
  }

  async function remove(id: number) {
    await createClient().from("songs").delete().eq("id", id);
    load();
  }

  return (
    <section className="space-y-3">
      <form onSubmit={add} className="card space-y-2">
        <p className="text-sm font-medium">Add a song for the trip 🎶</p>
        <input className="input" required maxLength={120} placeholder="Song – Artist" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" placeholder="Spotify / YouTube link (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
        <button className="btn btn-sm">Add</button>
      </form>
      <ol className="space-y-2">
        {songs.map((s, i) => (
          <li key={s.id} className="card flex items-center gap-3 py-3">
            <span className="font-display text-[34px] text-burgundy/70 w-8 text-center">{i + 1}</span>
            <div className="flex-1 min-w-0">
              {s.link ? (
                <a href={s.link} target="_blank" rel="noreferrer" className="font-medium underline decoration-stone-300">
                  {s.title}
                </a>
              ) : (
                <p className="font-medium">{s.title}</p>
              )}
              <p className="text-xs text-stone-500">added by {names[s.user_id] ?? "former member"}</p>
            </div>
            {(s.user_id === me || isHead) && (
              <button className="text-xs text-stone-400 hover:text-red-600" onClick={() => remove(s.id)}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ol>
      {songs.length === 0 && <p className="text-center text-sm text-stone-400">No songs yet. Set the vibe!</p>}
    </section>
  );
}

function HeadRequests({ partyId, onChange }: { partyId: string; onChange: () => void }) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const load = useCallback(async () => {
    const { data } = await createClient().rpc("my_inbox");
    setItems(((data as InboxItem[]) ?? []).filter((i) => i.party_id === partyId && i.kind === "request"));
  }, [partyId]);
  useEffect(() => {
    load();
  }, [load]);
  if (!items.length) return null;
  return (
    <div>
      <h2 className="text-sm font-medium text-stone-500 mb-2">Want to join</h2>
      <Inbox
        items={items}
        onChange={() => {
          load();
          onChange();
        }}
      />
    </div>
  );
}
