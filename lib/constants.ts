import { useEffect, useState } from "react";

// Edit this list to match where your hostellers actually go.
export const CITIES = [
  "Agra", "Ahmedabad", "Ajmer", "Aligarh", "Allahabad (Prayagraj)", "Amritsar", "Aurangabad",
  "Bareilly", "Bengaluru", "Bhopal", "Bhubaneswar", "Bikaner", "Chandigarh", "Chennai",
  "Coimbatore", "Cuttack", "Dehradun", "Delhi", "Dhanbad", "Durgapur", "Faridabad",
  "Gaya", "Ghaziabad", "Gorakhpur", "Guwahati", "Gurugram", "Gwalior", "Haridwar",
  "Hyderabad", "Indore", "Jabalpur", "Jaipur", "Jalandhar", "Jammu", "Jamshedpur",
  "Jhansi", "Jodhpur", "Kanpur", "Kochi", "Kolkata", "Kota", "Kozhikode", "Lucknow",
  "Ludhiana", "Madurai", "Mangaluru", "Meerut", "Moradabad", "Mumbai", "Muzaffarpur",
  "Mysuru", "Nagpur", "Nashik", "Noida", "Patna", "Puducherry", "Pune", "Raipur",
  "Rajkot", "Ranchi", "Rohtak", "Shimla", "Siliguri", "Srinagar", "Surat",
  "Thiruvananthapuram", "Udaipur", "Ujjain", "Vadodara", "Varanasi", "Vijayawada",
  "Visakhapatnam", "Other",
];

export const MEDIUMS = [
  { value: "bus", label: "Bus" },
  { value: "train", label: "Train" },
  { value: "car", label: "Car" },
  { value: "cab", label: "Cab" },
  { value: "flight", label: "Flight" },
  { value: "other", label: "Other" },
] as const;

export const TIME_SLOTS = [
  { value: "early_morning", label: "Early morning (before 7)" },
  { value: "morning", label: "Morning (7–12)" },
  { value: "afternoon", label: "Afternoon (12–5)" },
  { value: "evening", label: "Evening (5–9)" },
  { value: "night", label: "Night (after 9)" },
] as const;

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export const GENDER_PREFS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "any", label: "Ab to koi bhi chalega" },
] as const;

export const YEARS = [1, 2, 3, 4, 5, 6];

export function label<T extends { value: string; label: string }>(list: readonly T[], value: string | null | undefined) {
  return list.find((x) => x.value === value)?.label ?? value ?? "";
}

export function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" });
}

// Today's date (YYYY-MM-DD) for date-input `min`. Read after mount so prerender stays static.
export function useToday() {
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  return today;
}
