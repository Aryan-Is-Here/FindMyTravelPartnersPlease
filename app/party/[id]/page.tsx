import { Suspense } from "react";
import PartyRoom from "./PartyRoom";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PartyRoom />
    </Suspense>
  );
}
