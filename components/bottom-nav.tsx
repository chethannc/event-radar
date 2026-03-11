"use client";

const items = [
  { label: "Home", href: "#discover" },
  { label: "Trending", href: "#trending" },
  { label: "Map", href: "#map" },
  { label: "AI", href: "#ai-picks" },
];

export function BottomNav() {
  return (
    <nav className="surface fixed inset-x-4 bottom-4 z-50 rounded-[24px] px-3 py-2 md:hidden">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="rounded-2xl px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)] transition hover:bg-[var(--accent-soft)] hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
