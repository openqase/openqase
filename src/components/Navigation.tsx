// src/components/Navigation.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/case-study', label: 'Case Studies' },
  { href: '/paths', label: 'Related Content' },
  { href: '/blog', label: 'Blog' },
];

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const supabase = createBrowserSupabaseClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      'sticky top-0 z-40 w-full border-b border-border transition-all duration-200',
      isScrolled ? 'bg-background/80 backdrop-blur-sm' : 'bg-background'
    )}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center text-foreground hover:text-foreground">
              {mounted ? (
                <Image
                  src={theme === 'dark' ? '/openqase-light.svg' : '/openqase-dark.svg'}
                  alt="OpenQase - Quantum Computing Business Applications Platform"
                  className="h-8 w-auto"
                  width={80}
                  height={80}
                  unoptimized
                  priority
                  suppressHydrationWarning
                />
              ) : (
                <Image
                  src='/openqase-light.svg'
                  alt="OpenQase - Quantum Computing Business Applications Platform"
                  className="h-8 w-auto"
                  width={80}
                  height={80}
                  unoptimized
                  priority
                  suppressHydrationWarning
                />
              )}
              <Badge variant="outline" className="ml-2 self-center">BETA</Badge>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'nav-link relative py-2 text-base font-medium',
                    pathname === item.href ? 'nav-active text-primary' : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  {item.label}
                  {pathname === item.href && (
                    <span className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-primary" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Actions - pushed to the right */}
          <div className="hidden md:flex md:items-center md:space-x-4 ml-auto">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                <Button variant="ghost" asChild>
                  <Link href="/auth?view=sign_in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth?view=sign_up">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-4 md:hidden ml-auto">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="touch-target -mr-2 p-2"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-6 w-6" suppressHydrationWarning />
              ) : (
                <Menu className="h-6 w-6" suppressHydrationWarning />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="border-t md:hidden">
            <div className="space-y-1 py-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'block px-3 py-2 text-base font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="px-3 py-2">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <User className="h-5 w-5" />
                        <span className="sr-only">User menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut}>
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" asChild>
                      <Link href="/auth?view=sign_in">Sign In</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/auth?view=sign_up">Get Started</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}