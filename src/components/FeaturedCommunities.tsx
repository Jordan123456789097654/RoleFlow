import Link from "next/link";
import { prisma } from "@/lib/prisma";

/** Official and partner communities, shown above the directory on the homepage. */
export default async function FeaturedCommunities() {
  const guilds = await prisma.guild.findMany({
    where: {
      OR: [{ verifiedBadges: { contains: "OFFICIAL" } }, { verifiedBadges: { contains: "PARTNER" } }],
    },
    select: { id: true, name: true, vanitySlug: true, description: true },
    take: 3,
  });
  if (guilds.length === 0) return null;

  return (
    <section className="border-t border-line">
      <div className="page-wrap section">
        <div className="mb-10">
          <p className="eyebrow mb-3">Featured</p>
          <h2 className="display-md">Official and partner communities</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {guilds.map((g) => (
            <Link key={g.id} href={`/c/${g.vanitySlug || g.id}`} className="card p-5 hover:border-ink">
              <p className="font-semibold text-ink">{g.name}</p>
              {g.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{g.description}</p>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
