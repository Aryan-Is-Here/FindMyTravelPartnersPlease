export default function Avatar({ src, name, size = 48 }: { src: string | null; name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} loading="lazy" decoding="async" width={size} height={size} className="rounded-full object-cover shrink-0 ring-1 ring-stone-300/70" style={{ width: size, height: size }} />
  ) : (
    <div
      className="rounded-full bg-sage-pale text-burgundy font-display grid place-items-center shrink-0 ring-1 ring-stone-300/70"
      style={{ width: size, height: size, fontSize: size / 1.7 }}
    >
      {initials}
    </div>
  );
}
