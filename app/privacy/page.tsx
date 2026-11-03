import Link from "next/link";

export const metadata = { title: "Privacy — FindMyTravelPartnersPlease" };

// Public page (no login). Linked from the login page and the Google consent screen.
export default function PrivacyPage() {
  return (
    <main className="max-w-2xl w-full mx-auto p-6 space-y-4 text-stone-700">
      <p className="eyebrow pt-6">FindMyTravelPartnersPlease</p>
      <h1 className="font-display text-[80px] text-ink">Privacy <span className="text-burgundy">policy</span></h1>
      <p>
        FindMyTravelPartnersPlease is a free, non-commercial hobby project that helps hostel students find others travelling
        to the same city for the holidays. This page explains what we collect and why.
      </p>

      <h2 className="font-display text-[34px] text-burgundy pt-4">What we get from Google</h2>
      <p>
        When you sign in with Google we receive only your <b>name, email address and profile picture</b> (the basic
        &quot;openid, email, profile&quot; scopes). We use your email to identify your account and prefill your name. We don&apos;t
        access your Gmail, contacts, Drive or anything else.
      </p>

      <h2 className="font-display text-[34px] text-burgundy pt-4">What you give us</h2>
      <p>
        College User ID, name, photo, year, phone/WhatsApp number, gender, budget, destination city, travel date and time,
        travel medium, gender preference and a short bio. In party rooms: chat messages and song suggestions.
      </p>

      <h2 className="font-display text-[34px] text-burgundy pt-4">Who can see it</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Other signed-in users see only: name, photo, year (if you allow it), budget, bio, city, date, time and travel medium.</li>
        <li>Your email, College User ID and gender are never shown on your public card.</li>
        <li>
          Your <b>phone number</b> is shown only inside a party room, only if you agree, and only to members who also agreed
          to share theirs.
        </li>
        <li>Chat and songs are visible only to members of that party.</li>
      </ul>

      <h2 className="font-display text-[34px] text-burgundy pt-4">How long we keep it</h2>
      <p>
        Party rooms, their chat and song lists are deleted automatically 2 days after the travel date, or earlier if the
        party head deletes the room. Your profile stays until you ask us to delete it.
      </p>

      <h2 className="font-display text-[34px] text-burgundy pt-4">Sharing</h2>
      <p>
        We don&apos;t sell or share your data with anyone. Data is stored with Supabase (database and login) and the site is
        hosted on Vercel.
      </p>

      <h2 className="font-display text-[34px] text-burgundy pt-4">Delete your data</h2>
      <p>
        Open an issue at{" "}
        <a className="underline" href="https://github.com/Aryan-Is-Here/FindMyTravelPartnersPlease/issues">
          github.com/Aryan-Is-Here/FindMyTravelPartnersPlease
        </a>{" "}
        or message the admin, and we&apos;ll delete your account and everything linked to it.
      </p>

      <p className="pt-4">
        <Link href="/login" className="underline">
          ← Back
        </Link>
      </p>
    </main>
  );
}
