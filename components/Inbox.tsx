"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { InboxItem } from "@/lib/types";
import Avatar from "./Avatar";

// Pending join requests to my parties + invites to me, with accept/decline.
export default function Inbox({ items, onChange }: { items: InboxItem[]; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function respond(id: string, accept: boolean) {
    setBusy(id);
    const { error } = await createClient().rpc("respond_request", { req: id, accept });
    setBusy(null);
    if (error) alert(error.message);
    onChange();
  }

  if (!items.length) return <p className="text-sm text-stone-500 p-2">No requests or invites right now.</p>;

  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.request_id} className="flex gap-3 items-start rounded-lg border border-stone-200 bg-paper p-3">
          <Avatar src={it.other_avatar} name={it.other_name} size={40} />
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              {it.kind === "request" ? (
                <>
                  <b>{it.other_name}</b> {it.other_year ? `(Year ${it.other_year}) ` : ""}wants to join <b>{it.party_name}</b>
                </>
              ) : (
                <>
                  <b>{it.other_name}</b> invited you to <b>{it.party_name}</b>
                </>
              )}
            </p>
            {it.other_bio && <p className="text-xs text-stone-500 mt-1 line-clamp-2">{it.other_bio}</p>}
            <div className="flex gap-2 mt-2">
              <button className="btn btn-sm" disabled={busy === it.request_id} onClick={() => respond(it.request_id, true)}>
                Accept
              </button>
              <button className="btn-ghost btn-sm" disabled={busy === it.request_id} onClick={() => respond(it.request_id, false)}>
                Decline
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
