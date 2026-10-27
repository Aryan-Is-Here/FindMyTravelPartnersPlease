import { redirect } from "next/navigation";

// The proxy routes signed-in users onward; this is just a fallback.
export default function Home() {
  redirect("/panel");
}
