// FindMy·Travel·Partners·Please set in the tall display face; "Travel" in burgundy.
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display ${className}`}>
      FindMy<span className="text-burgundy">Travel</span>Partners<span className="text-sage">Please</span>
    </span>
  );
}
