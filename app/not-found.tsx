import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <span className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
        404
      </span>
      <h1 className="mt-5 text-5xl font-semibold tracking-[-0.07em] text-foreground">
        Event not found
      </h1>
      <p className="mt-4 text-lg leading-8 text-[color:var(--muted)]">
        This route does not match the current sample event set.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-[var(--panel-dark)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
      >
        Back to home
      </Link>
    </main>
  );
}
