import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl font-semibold text-rune text-glow">404</h1>
        <h2 className="mt-4 text-xl font-semibold">This path leads nowhere</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Even seasoned adventurers wander off the map.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md gradient-rune px-6 py-3 text-sm font-medium text-primary-foreground shadow-rune transition-transform hover:scale-105"
          >
            Return to camp
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Side Quest — Real-life challenges that level you up" },
      { name: "description", content: "A gamified productivity platform that assigns daily real-world challenges. No screens. Just XP for living." },
      { name: "author", content: "Side Quest" },
      { property: "og:title", content: "Side Quest — Level up your real life" },
      { property: "og:description", content: "Daily screen-free challenges. Earn XP. Build streaks. Touch grass." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster theme="dark" position="top-center" richColors />
    </>
  );
}
