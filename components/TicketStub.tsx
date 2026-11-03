// Burgundy boarding-pass stub: destination set tall, date underneath.
export default function TicketStub({ city, date, foot }: { city: string; date: string; foot?: React.ReactNode }) {
  const d = new Date(date + "T00:00:00");
  const name = city.replace(/ \(.*\)/, "");
  // Fit the name on one line: Six Caps glyphs average about 0.3em wide; the stub has about 80px inside.
  const size = Math.max(15, Math.min(46, Math.floor(80 / (name.length * 0.31))));
  return (
    <div className="ticket-stub text-center">
      <span className="font-label text-[9px] opacity-70">To</span>
      <span className="font-display whitespace-nowrap" style={{ fontSize: size }} title={city}>
        {name}
      </span>
      <span className="leading-none">
        <span className="font-display block text-[34px]">{d.getDate()}</span>
        <span className="font-label text-[10px] opacity-80">
          {d.toLocaleDateString("en-IN", { month: "short" })} · {d.toLocaleDateString("en-IN", { weekday: "short" })}
        </span>
      </span>
      {foot && <span className="font-label text-[10px] opacity-80">{foot}</span>}
    </div>
  );
}
