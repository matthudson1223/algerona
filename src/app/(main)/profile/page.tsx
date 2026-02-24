import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profiles = await db.algorithmProfile.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  const watchCount = await db.watchEvent.count({ where: { userId: session.user.id } });

  return (
    <div className="min-h-full bg-zinc-950 text-white overflow-y-auto">
      <div className="px-4 py-8 max-w-lg mx-auto space-y-8">
        {/* User info */}
        <div className="flex items-center gap-4">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="w-14 h-14 rounded-full" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-indigo-700 flex items-center justify-center text-xl font-bold">
              {session.user.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{session.user.name ?? session.user.email}</p>
            <p className="text-zinc-400 text-sm">{session.user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{watchCount}</p>
            <p className="text-zinc-400 text-sm mt-1">Videos watched</p>
          </div>
          <div className="bg-zinc-900 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{profiles.length}</p>
            <p className="text-zinc-400 text-sm mt-1">Algorithm profiles</p>
          </div>
        </div>

        {/* Profiles */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Algorithm Profiles
          </h2>
          <div className="space-y-2">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-zinc-900 rounded-2xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{p.name}</p>
                  <p className="text-zinc-500 text-xs">Updated {p.updatedAt.toLocaleDateString()}</p>
                </div>
                {p.isActive && (
                  <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded-full">Active</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Sign out */}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-4 rounded-2xl font-medium transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
