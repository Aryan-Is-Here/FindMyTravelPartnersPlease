"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GENDERS, YEARS } from "@/lib/constants";
import { resizeImage } from "@/lib/resizeImage";
import type { User } from "@/lib/types";
import Avatar from "./Avatar";

type Props = {
  initial?: User;
  defaultName?: string;
  email: string;
  onSaved: () => void;
  submitLabel: string;
};

export default function UserDetailsForm({ initial, defaultName, email, onSaved, submitLabel }: Props) {
  const editing = !!initial;
  const [form, setForm] = useState({
    college_id: initial?.college_id ?? "",
    name: initial?.name ?? defaultName ?? "",
    year: initial?.year?.toString() ?? "",
    show_year: initial?.show_year ?? true,
    phone: initial?.phone ?? "",
    gender: initial?.gender ?? "",
    budget: initial?.budget?.toString() ?? "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initial?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const blob = await resizeImage(file);
      const path = `${user!.id}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (error) throw error;
      setAvatarUrl(supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const phone = form.phone.replace(/[\s-]/g, "");
    const row = {
      name: form.name.trim(),
      avatar_url: avatarUrl,
      year: form.year ? Number(form.year) : null,
      show_year: form.show_year,
      phone,
      gender: form.gender,
      budget: form.budget ? Number(form.budget) : null,
    };
    const supabase = createClient();
    const { error } = editing
      ? await supabase.from("users").update(row).eq("college_id", initial!.college_id)
      : await supabase.from("users").insert({ ...row, college_id: form.college_id.trim() });
    setSaving(false);
    if (error) {
      setError(
        error.code === "23505"
          ? "This College ID is already registered. If it's yours, contact the admin."
          : error.message.includes("phone")
            ? "Phone must be 10–13 digits (optionally starting with +)."
            : error.message.includes("college_id")
              ? "College ID: 3–30 letters, numbers, dot, dash or underscore."
              : error.message,
      );
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar src={avatarUrl} name={form.name || "?"} size={72} />
        <label className="btn-ghost btn-sm cursor-pointer">
          {uploading ? "Uploading…" : avatarUrl ? "Change photo" : "Add photo"}
          <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={uploading} />
        </label>
      </div>

      <Field label="College User ID" hint={editing ? "Can't be changed" : "Can't be changed later"}>
        <input className="input" required disabled={editing} value={form.college_id} onChange={set("college_id")} />
      </Field>
      <Field label="Name">
        <input className="input" required maxLength={60} value={form.name} onChange={set("name")} />
      </Field>
      <Field label="Email" hint="From your Google account">
        <input className="input" disabled value={email} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Year">
          <select className="input" value={form.year} onChange={set("year")}>
            <option value="">—</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Gender">
          <select className="input" required value={form.gender} onChange={set("gender")}>
            <option value="">Select</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.show_year} onChange={set("show_year")} />
        Show my year to others
      </label>
      <Field label="Phone / WhatsApp" hint="Only shared inside a party, and only if you agree">
        <input className="input" required type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} />
      </Field>
      <Field label="Budget (₹, rough)" hint="Just shown on your card, never used to filter you out">
        <input className="input" type="number" min={0} value={form.budget} onChange={set("budget")} />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn w-full" disabled={saving || uploading}>
        {saving ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </label>
  );
}
