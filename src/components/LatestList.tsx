import Link from 'next/link';

interface LatestListItem {
  title: string;
  description: string;
  href: string;
  pills?: string[];
  meta?: string;
}

interface LatestListProps {
  title: string;
  viewAllHref: string;
  viewAllCount?: number;
  items: LatestListItem[];
}

export function LatestList({ title, viewAllHref, viewAllCount, items }: LatestListProps) {
  return (
    <div>
      <div className="flex justify-between items-baseline pb-3 mb-4 border-b-2 border-foreground">
        <h2 className="font-heading text-xl md:text-2xl font-bold tracking-tight">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
        >
          View all{viewAllCount ? ` ${viewAllCount}` : ''} →
        </Link>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">Coming soon.</p>
      )}
      <div className="divide-y divide-border">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="block group py-5 first:pt-0">
            <h3 className="font-heading text-base md:text-lg font-semibold leading-snug mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
              {item.description}
            </p>
            {item.pills && item.pills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.pills.slice(0, 3).map((pill, index) => (
                  <span
                    key={`${index}-${pill}`}
                    className="inline-block text-[0.65rem] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            )}
            {item.meta && (
              <span className="text-xs text-muted-foreground">{item.meta}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
