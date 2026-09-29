import Link from "next/link";
import { requirePageSession } from "@/lib/api/session";
import { SignOutButton } from "./SignOutButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePageSession();

  const isSuperAdmin = session.user.role === "super_admin";

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/app" className="font-semibold text-zinc-800 dark:text-zinc-100">
          KshetraMap
        </Link>
        <span className="text-zinc-400">|</span>
        <span className="text-zinc-600 dark:text-zinc-300">
          {session.user.name} · {session.user.role}
        </span>
        <nav className="flex items-center gap-3 ml-2">
          <Link
            href="/app/candidates/demo-mokama-anant-kumar-singh"
            className="text-emerald-700 hover:underline dark:text-emerald-400 font-medium"
          >
            Candidate CV
          </Link>
        </nav>
        {isSuperAdmin && (
          <nav className="ml-auto flex items-center gap-3">
            <Link href="/app/admin/users" className="text-zinc-600 hover:underline dark:text-zinc-300">
              Users
            </Link>
            <Link href="/app/admin/audit" className="text-zinc-600 hover:underline dark:text-zinc-300">
              Audit log
            </Link>
          </nav>
        )}
        <div className={isSuperAdmin ? "" : "ml-auto"}>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
