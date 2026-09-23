import Link from "next/link"

export default function BlogNotFound() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Blog Post Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8">
          The blog post you&apos;re looking for doesn&apos;t exist or hasn&apos;t been published yet.
        </p>
        <Link 
          href="/blog" 
          className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
        >
          Back to Blog
        </Link>
      </div>
    </div>
  )
} 