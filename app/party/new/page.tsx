"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CITIES, MEDIUMS, TIME_SLOTS, useToday } from "@/lib/constants";
import Header from "@/components/Header";
import { Field } from "@/components/UserDetailsForm";

export default function NewPartyPage() {
  const router = useRouter();
  const today = useToday();
  const [form, setForm] = useState({
    name: "",
    destination_city: "",
    travel_date: "",
    preferred_time: "",
    travel_medium: "",
    max_size: "4",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Prefill from my trip prefs.
  useEffect(() => {
    createClient()
      .from("trip_prefs")
      .select("*")
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm((f) => ({
          ...f,
          name: `${data.destination_city} gang`,
          destination_city: data.destination_city,
          travel_date: data.travel_date,
          preferred_time: data.preferred_time,
          travel_medium: data.travel_mediums[0] ?? "",
        }));
      });
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { data, error } = await createClient()
      .from("parties")
      .insert({ ...form, name: form.name.trim(), max_size: Number(form.max_size) })
      .select("id")
      .single();
    setSaving(false);
    if (error) return setError(error.message);
    router.push(`/party/${data.id}`);
  }

  return (
    <>
      <Header />
      <main className="max-w-md w-full mx-auto px-5 pt-8 pb-16">
        <p className="eyebrow">New party</p>
        <h1 className="font-display text-[72px] mt-2 mb-2">Create a <span className="text-burgundy">party</span></h1>
        <p className="text-sm text-stone-500 mb-6">You&apos;ll be the party head. Invite people from the panel, or let them request to join.</p>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Party name">
            <input className="input" required maxLength={60} value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Destination">
            <select className="input" required value={form.destination_city} onChange={set("destination_city")}>
              <option value="">Select city</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Travel date" hint="Room auto-deletes 2 days after">
              <input
                className="input"
                type="date"
                required
                min={today}
                value={form.travel_date}
                onChange={set("travel_date")}
              />
            </Field>
            <Field label="Time">
              <select className="input" required value={form.preferred_time} onChange={set("preferred_time")}>
                <option value="">Select</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Medium">
              <select className="input" required value={form.travel_medium} onChange={set("travel_medium")}>
                <option value="">Select</option>
                {MEDIUMS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Max people">
              <input className="input" type="number" min={2} max={10} required value={form.max_size} onChange={set("max_size")} />
            </Field>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn w-full py-3" disabled={saving}>
            {saving ? "Creating…" : "Create party"}
          </button>
        </form>
      </main>
    </>
  );
}
