"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CITIES, GENDER_PREFS, MEDIUMS, TIME_SLOTS, useToday } from "@/lib/constants";
import type { TripPrefs } from "@/lib/types";
import { Field } from "./UserDetailsForm";

export default function TripForm({ initial, onSaved, submitLabel }: { initial?: TripPrefs; onSaved: () => void; submitLabel: string }) {
  const today = useToday();
  const [form, setForm] = useState({
    bio: initial?.bio ?? "",
    gender_pref: initial?.gender_pref ?? "any",
    travel_mediums: initial?.travel_mediums ?? [],
    destination_city: initial?.destination_city ?? "",
    travel_date: initial?.travel_date ?? "",
    preferred_time: initial?.preferred_time ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleMedium(m: string) {
    setForm((f) => ({
      ...f,
      travel_mediums: f.travel_mediums.includes(m) ? f.travel_mediums.filter((x) => x !== m) : [...f.travel_mediums, m],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.travel_mediums.length) return setError("Pick at least one travel medium.");
    setSaving(true);
    setError("");
    const { error } = await createClient().from("trip_prefs").upsert({ ...form, bio: form.bio.trim() });
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Where are you going?">
        <select
          className="input"
          required
          value={form.destination_city}
          onChange={(e) => setForm({ ...form, destination_city: e.target.value })}
        >
          <option value="">Select city</option>
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Travel date">
          <input
            className="input"
            type="date"
            required
            min={today}
            value={form.travel_date}
            onChange={(e) => setForm({ ...form, travel_date: e.target.value })}
          />
        </Field>
        <Field label="Preferred time">
          <select
            className="input"
            required
            value={form.preferred_time}
            onChange={(e) => setForm({ ...form, preferred_time: e.target.value as TripPrefs["preferred_time"] })}
          >
            <option value="">Select</option>
            {TIME_SLOTS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div>
        <span className="text-sm font-medium">Travel medium</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {MEDIUMS.map((m) => (
            <button
              type="button"
              key={m.value}
              onClick={() => toggleMedium(m.value)}
              className={`chip ${form.travel_mediums.includes(m.value) ? "chip-on" : ""}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="text-sm font-medium">Travel with</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {GENDER_PREFS.map((g) => (
            <button
              type="button"
              key={g.value}
              onClick={() => setForm({ ...form, gender_pref: g.value })}
              className={`chip ${form.gender_pref === g.value ? "chip-on" : ""}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-stone-500">You only see people whose preference also matches you.</span>
      </div>
      <Field label="About you / your trip" hint={`${form.bio.length}/500`}>
        <textarea
          className="input min-h-28"
          maxLength={500}
          placeholder="Leaving from main gate, can split cab to station, love old Bollywood songs…"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full" disabled={saving}>
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
