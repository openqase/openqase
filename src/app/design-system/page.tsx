'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  CircuitBoard, 
  Building2, 
  User,
  Sun,
  Moon
} from 'lucide-react';

export default function DesignSystemPage() {
  const [isDark, setIsDark] = useState(false);

  // Toggle theme
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    setIsDark(!isDark);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">OpenQase Design System</h1>
              <p className="text-lg text-muted-foreground">
                Dual accent system: <span className="text-primary font-semibold">{isDark ? 'Yellow' : 'Blue'}</span> for {isDark ? 'Dark' : 'Light'} Mode
              </p>
            </div>
            <Button
              onClick={toggleTheme}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        
        {/* Mode-Specific Accent Colors */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8">Mode-Specific Accent Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="w-5 h-5" />
                  Light Mode - Stark Blue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                    <span className="font-medium">Primary</span>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md" style={{ backgroundColor: '#5E6AD2' }} />
                      <code className="text-sm text-muted-foreground">#5E6AD2</code>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Inspired by Stark&apos;s accessibility platform. Provides excellent contrast (7:1) on light backgrounds.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="w-5 h-5" />
                  Dark Mode - Golden Yellow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                    <span className="font-medium">Primary</span>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md" style={{ backgroundColor: '#FFD000' }} />
                      <code className="text-sm text-muted-foreground">#FFD000</code>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    High visibility yellow for dark backgrounds. Creates energetic, modern feel with strong contrast.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Core Principles */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8">Core Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-xl">Accessibility First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pure black text on warm cream background. Minimum 7:1 contrast ratio. 
                  Visible shadows for real elevation.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-xl">Systematic Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Consistent shadows, borders, and spacing. Every card has both border 
                  AND shadow for clear definition.
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-md hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="text-xl">Strategic Color</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Accent color used sparingly for CTAs only. Blue in light mode, 
                  yellow in dark mode. Icons use neutral colors.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Elevation Hierarchy System */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8">Elevation Hierarchy</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Systematic depth levels create proper visual hierarchy where content advances and chrome recedes.
          </p>
          
          {/* Elevation Levels */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            <div className="text-center">
              <div className="h-24 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center mb-2">
                <span className="text-xs font-bold">-1</span>
              </div>
              <p className="font-semibold text-sm">Sunken</p>
              <p className="text-xs text-muted-foreground">Sidebars, metadata</p>
            </div>
            <div className="text-center">
              <div className="h-24 rounded-lg border border-border bg-background flex items-center justify-center mb-2">
                <span className="text-xs font-bold">0</span>
              </div>
              <p className="font-semibold text-sm">Base</p>
              <p className="text-xs text-muted-foreground">Page background</p>
            </div>
            <div className="text-center">
              <div className="h-24 rounded-lg border border-border bg-card shadow-sm flex items-center justify-center mb-2">
                <span className="text-xs font-bold">1</span>
              </div>
              <p className="font-semibold text-sm">Content</p>
              <p className="text-xs text-muted-foreground">Main reading area</p>
            </div>
            <div className="text-center">
              <div className="h-24 rounded-lg border border-border bg-card shadow-md flex items-center justify-center mb-2">
                <span className="text-xs font-bold">2</span>
              </div>
              <p className="font-semibold text-sm">Raised</p>
              <p className="text-xs text-muted-foreground">Cards, highlights</p>
            </div>
            <div className="text-center">
              <div className="h-24 rounded-lg border border-border bg-card shadow-xl flex items-center justify-center mb-2">
                <span className="text-xs font-bold">3</span>
              </div>
              <p className="font-semibold text-sm">Overlay</p>
              <p className="text-xs text-muted-foreground">Modals, dropdowns</p>
            </div>
          </div>

          {/* Hierarchy Example */}
          <Card className="shadow-md mb-12">
            <CardHeader>
              <CardTitle>Hierarchy in Practice</CardTitle>
              <CardDescription>
                How elevation creates focus on content while UI chrome recedes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-background p-4 rounded-lg">
                {/* Mini layout demo */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <div className="bg-card p-3 rounded border border-border shadow-sm h-32">
                      <p className="text-xs font-medium mb-2">Sidebar Cards</p>
                      <p className="text-xs text-muted-foreground">Level 1: Elevated white cards</p>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="bg-card p-4 rounded shadow-sm border border-border h-32">
                      <p className="text-sm font-medium mb-2">Main Content</p>
                      <p className="text-xs text-muted-foreground mb-3">Level 1: Elevated</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-card p-2 rounded shadow-md border border-border">
                          <p className="text-xs">Card (Level 2)</p>
                        </div>
                        <div className="bg-card p-2 rounded shadow-md border border-border">
                          <p className="text-xs">Card (Level 2)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Color Palette */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8">Color Palette</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Background Colors */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Backgrounds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="font-medium">Background</span>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-background border border-border" />
                    <code className="text-sm text-muted-foreground">Warm cream</code>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="font-medium">Card</span>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-card border border-border shadow-sm" />
                    <code className="text-sm text-muted-foreground">Pure white</code>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="font-medium">Muted</span>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-muted border border-border" />
                    <code className="text-sm text-muted-foreground">Subtle gray</code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Text Colors */}
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Typography</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="font-medium text-foreground">Primary Text</span>
                  <code className="text-sm text-muted-foreground">Pure black</code>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="font-medium text-muted-foreground">Secondary Text</span>
                  <code className="text-sm text-muted-foreground">Dark gray</code>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="font-medium text-primary">
                    Accent ({isDark ? 'Yellow' : 'Blue'})
                  </span>
                  <code className="text-sm text-muted-foreground">
                    {isDark ? '#FFD000' : '#5E6AD2'}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Shadow System */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8">Elevation System</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <p className="font-medium mb-2">Shadow SM</p>
                <p className="text-sm text-muted-foreground">Subtle cards</p>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <p className="font-medium mb-2">Shadow MD</p>
                <p className="text-sm text-muted-foreground">Default cards</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <p className="font-medium mb-2">Shadow LG</p>
                <p className="text-sm text-muted-foreground">Hover state</p>
              </CardContent>
            </Card>
            <Card className="shadow-xl">
              <CardContent className="pt-6">
                <p className="font-medium mb-2">Shadow XL</p>
                <p className="text-sm text-muted-foreground">Modals/Overlays</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Component Examples */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8">Component Library</h2>
          
          {/* Cards */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-foreground mb-6">Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Card */}
              <Card className="shadow-sm hover:shadow-md transition-all">
                <CardContent className="pt-6">
                  <BookOpen className="w-6 h-6 text-muted-foreground mb-3" />
                  <p className="text-3xl font-bold text-foreground mb-1">47</p>
                  <p className="text-sm text-muted-foreground">Case Studies</p>
                </CardContent>
              </Card>
              
              {/* Content Card */}
              <Card className="shadow-md hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="outline">1QBit</Badge>
                    <Badge variant="outline">BMW</Badge>
                  </div>
                  <CardTitle className="text-lg">Automotive Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-3">
                    Quantum algorithms for supply chain optimization
                  </p>
                  <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Read case study →
                  </a>
                </CardContent>
              </Card>
              
              {/* Action Card */}
              <Card className="shadow-md hover:shadow-lg transition-all border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">Get Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Explore quantum computing case studies
                  </p>
                  <Button className="w-full">
                    Browse Cases
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Buttons */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-foreground mb-6">Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <Button>Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Link Button</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Primary button uses <span className="font-semibold">{isDark ? 'yellow' : 'blue'}</span> accent color in {isDark ? 'dark' : 'light'} mode
            </p>
          </div>

          {/* Badges */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-foreground mb-6">Badges</h3>
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Default badge uses <span className="font-semibold">{isDark ? 'yellow' : 'blue'}</span> background in {isDark ? 'dark' : 'light'} mode
            </p>
          </div>
        </section>

        {/* Icons & Usage */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8">Icon Usage</h2>
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Default</p>
                  <p className="text-xs text-muted-foreground">Gray icons</p>
                </div>
                <div className="text-center">
                  <CircuitBoard className="w-8 h-8 text-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Black on hover</p>
                </div>
                <div className="text-center">
                  <Building2 className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">CTA Only</p>
                  <p className="text-xs text-muted-foreground">{isDark ? 'Yellow' : 'Blue'} sparingly</p>
                </div>
                <div className="text-center">
                  <User className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm font-medium">Disabled</p>
                  <p className="text-xs text-muted-foreground">50% opacity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Typography Scale */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8">Typography Scale</h2>
          <Card className="shadow-md">
            <CardContent className="pt-6 space-y-4">
              <div className="border-b border-border pb-4">
                <p className="text-5xl font-bold">Display (3rem)</p>
              </div>
              <div className="border-b border-border pb-4">
                <p className="text-4xl font-bold">Heading 1 (2.25rem)</p>
              </div>
              <div className="border-b border-border pb-4">
                <p className="text-3xl font-semibold">Heading 2 (1.875rem)</p>
              </div>
              <div className="border-b border-border pb-4">
                <p className="text-2xl font-semibold">Heading 3 (1.5rem)</p>
              </div>
              <div className="border-b border-border pb-4">
                <p className="text-xl font-medium">Heading 4 (1.25rem)</p>
              </div>
              <div className="border-b border-border pb-4">
                <p className="text-lg">Body Large (1.125rem)</p>
              </div>
              <div className="border-b border-border pb-4">
                <p className="text-base">Body Default (1rem)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Small Text (0.875rem)</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Design Rules */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8">Design Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md border-green-500/20">
              <CardHeader>
                <CardTitle className="text-green-600">✓ Do</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Use shadows AND borders on all cards</li>
                  <li>• Apply accent color only to primary CTAs</li>
                  <li>• Use bold text weight for emphasis</li>
                  <li>• Maintain consistent spacing (4, 6, 8 grid)</li>
                  <li>• Test contrast ratios (minimum 7:1)</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="shadow-md border-red-500/20">
              <CardHeader>
                <CardTitle className="text-red-600">✗ Don&apos;t</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Don&apos;t use accent color for icons or numbers</li>
                  <li>• Don&apos;t skip borders on cards</li>
                  <li>• Don&apos;t use color alone for emphasis</li>
                  <li>• Don&apos;t mix shadow levels randomly</li>
                  <li>• Don&apos;t hard-code color values</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}