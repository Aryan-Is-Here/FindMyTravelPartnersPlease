export type Gender = "male" | "female" | "other";
export type GenderPref = "male" | "female" | "any";
export type TimeSlot = "early_morning" | "morning" | "afternoon" | "evening" | "night";

export type User = {
  college_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  year: number | null;
  show_year: boolean;
  phone: string;
  gender: Gender;
  budget: number | null;
  status: "active" | "suspended";
};

export type TripPrefs = {
  user_id: string;
  bio: string;
  gender_pref: GenderPref;
  travel_mediums: string[];
  destination_city: string;
  travel_date: string;
  preferred_time: TimeSlot;
};

export type PublicUser = {
  college_id: string;
  name: string;
  avatar_url: string | null;
  year: number | null;
  budget: number | null;
  bio: string;
  destination_city: string;
  travel_date: string;
  preferred_time: TimeSlot;
  travel_mediums: string[];
};

export type PartySummary = {
  id: string;
  name: string;
  destination_city: string;
  travel_date: string;
  preferred_time: TimeSlot;
  travel_medium: string;
  max_size: number;
  member_count: number;
  head_name: string;
  head_avatar: string | null;
  my_status: "member" | "requested" | "invited" | "rejected" | null;
};

export type MyParty = {
  id: string;
  name: string;
  destination_city: string;
  travel_date: string;
  preferred_time: TimeSlot;
  travel_medium: string;
  member_count: number;
  max_size: number;
  is_head: boolean;
};

export type InboxItem = {
  request_id: string;
  kind: "request" | "invite";
  party_id: string;
  party_name: string;
  other_name: string;
  other_avatar: string | null;
  other_year: number | null;
  other_bio: string | null;
  created_at: string;
};

export type Member = {
  college_id: string;
  name: string;
  avatar_url: string | null;
  year: number | null;
  whatsapp_consent: boolean;
  is_head: boolean;
};

export type Message = { id: number; party_id: string; user_id: string; body: string; created_at: string };
export type Song = { id: number; party_id: string; user_id: string; title: string; link: string | null };
