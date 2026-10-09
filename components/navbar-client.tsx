'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Droplets,
  Menu,
  X,
  LayoutDashboard,
  MapPin,
  AlertCircle,
  LogOut,
  LogIn,
  UserCircle,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'
import { cn } from '@/lib/utils'

interface NavbarClientProps {
  user: User | null
  role: UserRole | null
}

const baseNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/map', label: 'Water Map', icon: MapPin },
  { href: '/report', label: 'Report Issue', icon: AlertCircle },
  { href: '/profile', label: 'Profile', icon: UserCircle },
]

export function NavbarClient({ user, role }: NavbarClientProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = !user
    ? []
    : role === 'admin'
      ? [...baseNavLinks, { href: '/admin', label: 'Admin', icon: ShieldCheck }]
      : baseNavLinks

  async function handleSignOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Failed to sign out.')
      return
    }
    // Full page load so no page prefetched while signed in is reused
    window.location.assign('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="p-1.5 rounded-lg bg-primary">
            <Droplets className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground text-base hidden sm:block">AquaWatch Ghana</span>
          <span className="font-bold text-foreground text-base sm:hidden">AquaWatch</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/sign-up">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Get started
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <div className="border-t border-border mt-2 pt-2">
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  Sign in
                </Link>
                <Button size="sm" asChild>
                  <Link href="/auth/sign-up" onClick={() => setMenuOpen(false)}>
                    Get started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
