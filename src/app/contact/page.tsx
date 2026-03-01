import { Github, Twitter } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <div className="container-outer section-spacing">
        {/* Hero Section - Professional Magazine Style */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Have questions about quantum computing or suggestions for our platform? 
              We'd love to hear from you.
            </p>
          </div>
        </div>

        {/* Professional Grid Layout */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Contact Form */}
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-3">Get in Touch</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Fill out our contact form and we'll get back to you as soon as possible.
                </p>
              </div>
              <Link
                href="https://tally.so/r/wap82b"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full py-4 text-base font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Open Contact Form →
              </Link>
            </div>

            {/* Community Links */}
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-3">Join Our Community</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Connect with us on social media and contribute to the quantum computing community.
                </p>
              </div>
              <div className="space-y-4">
                <Link 
                  href="https://github.com/openqase/openqase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-md transition-colors group"
                >
                  <Github className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                  <span className="text-foreground group-hover:text-primary font-medium">Follow us on GitHub</span>
                </Link>
                <Link 
                  href="https://www.threads.com/@openqase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-md transition-colors group"
                >
                  <Twitter className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                  <span className="text-foreground group-hover:text-primary font-medium">Follow us on Threads</span>
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ Section - Professional Typography */}
          <div className="bg-muted/20 border-y border-border py-12 md:py-16">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8 md:mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 md:mb-4">Frequently Asked Questions</h2>
                <p className="text-base md:text-lg text-muted-foreground">Quick answers to common questions about OpenQase</p>
              </div>
              
              <div className="grid gap-6 md:gap-8 lg:gap-10">
                <div className="border-l-4 border-primary/20 pl-4 md:pl-6">
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 md:mb-3">How can I contribute to OpenQase?</h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    We welcome contributions from the quantum computing community! You can contribute by submitting case studies,
                    improving documentation, reporting bugs, or contributing code. Check out our 
                    <Link href="https://github.com/openqase/openqase" className="text-primary hover:underline ml-1">GitHub repository</Link> for detailed contribution guidelines.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary/20 pl-4 md:pl-6">
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 md:mb-3">I found a bug. Where should I report it?</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    Please report any bugs or issues on our GitHub repository's issue tracker. Include as much detail as possible:
                    browser version, steps to reproduce, and screenshots if applicable. This helps us understand and fix problems quickly.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary/20 pl-4 md:pl-6">
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 md:mb-3">Can I suggest new features or case studies?</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    Absolutely! We value community input and new ideas. You can suggest features through our GitHub repository's 
                    discussions section, or reach out to us directly through the contact form above. We're especially interested 
                    in new quantum computing case studies from industry leaders.
                  </p>
                </div>
                
                <div className="border-l-4 border-primary/20 pl-4 md:pl-6">
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 md:mb-3">How do I get my company's case study featured?</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    We offer featured placement opportunities for quantum computing case studies on our homepage. 
                    This provides premium visibility to showcase your company's quantum innovations. Contact us through 
                    the form above to discuss featured placement options and pricing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 