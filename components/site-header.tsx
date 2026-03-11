"use client";

import { motion } from "framer-motion";

type SiteHeaderProps = {
  isDarkMode: boolean;
  onToggleTheme: () => void;
};

export function SiteHeader({
  isDarkMode,
  onToggleTheme,
}: SiteHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="surface sticky top-4 z-40 mb-6 flex items-center justify-between gap-4 rounded-[24px] px-4 py-3 sm:px-5"
    >
      <div className="flex items-center gap-4">
        <div className="accent-ring flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--panel-dark)] text-sm font-semibold tracking-[0.22em] text-white">
          BER
        </div>
        <div>
          <p className="text-[15px] font-semibold tracking-[-0.03em] text-foreground">
            Bangalore Event Radar
          </p>
          <p className="text-sm text-[color:var(--muted)]">
            Discover what Bangalore is doing next
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        {["Discover", "Trending", "Map", "AI Picks"].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase().replace(" ", "-")}`}
            className="rounded-full px-4 py-2 text-sm font-medium text-[color:var(--muted)] transition hover:bg-[var(--accent-soft)] hover:text-foreground"
          >
            {item}
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggleTheme}
        className="flex items-center gap-3 rounded-full border border-[color:var(--border)] bg-[var(--panel-strong)] px-3 py-2 text-sm font-medium text-foreground transition hover:scale-[1.02]"
        aria-label="Toggle dark mode"
      >
        <span>{isDarkMode ? "Dark" : "Light"}</span>
        <span className="relative flex h-6 w-11 items-center rounded-full bg-[var(--accent-soft)] p-1">
          <motion.span
            animate={{ x: isDarkMode ? 20 : 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="h-4 w-4 rounded-full bg-[var(--accent)]"
          />
        </span>
      </button>
    </motion.header>
  );
}
