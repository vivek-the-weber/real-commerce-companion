export function Marquee() {
  const text = "Made To Increase Your Aura.";
  const items = Array(10).fill(text);

  return (
    <div className="bg-background py-6 overflow-hidden border-t border-b border-border">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((item, index) => (
          <span
            key={index}
            className="mx-8 text-sm md:text-base text-muted-foreground font-light tracking-widest"
          >
            {item}
          </span>
        ))}
        {items.map((item, index) => (
          <span
            key={`repeat-${index}`}
            className="mx-8 text-sm md:text-base text-muted-foreground font-light tracking-widest"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}