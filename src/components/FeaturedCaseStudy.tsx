import Link from 'next/link';

interface FeaturedCaseStudyProps {
  title: string;
  description: string;
  slug: string;
  pills?: string[];
}

export function FeaturedCaseStudy({ title, description, slug, pills = [] }: FeaturedCaseStudyProps) {
  return (
    <div className="border-l-4 border-primary rounded-r-lg bg-primary/[0.03] p-6 md:p-8">
      <div className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
        Featured
      </div>
      <h3 className="font-heading text-xl md:text-2xl font-semibold leading-tight mb-3">
        <Link href={`/case-study/${slug}`} className="hover:text-primary transition-colors">
          {title}
        </Link>
      </h3>
      <p className="text-muted-foreground text-sm md:text-base line-clamp-2 mb-4">
        {description}
      </p>
      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {pills.slice(0, 4).map((pill, index) => (
            <span
              key={`${index}-${pill}`}
              className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25"
            >
              {pill}
            </span>
          ))}
        </div>
      )}
      <Link
        href={`/case-study/${slug}`}
        className="text-sm font-semibold text-primary hover:underline"
      >
        Read case study →
      </Link>
    </div>
  );
}
