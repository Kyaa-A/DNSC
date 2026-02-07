"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { NAV_LINKS, ORG } from "@/lib/content/landing"
import { Menu, X, Shield, Users } from "lucide-react"
import { useState } from "react"

export function HeaderNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200/50 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Enhanced Logo */}
          <Link href="#top" className="flex items-center gap-3 group" aria-label="Go to top">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Image 
                src={ORG.logoSrc} 
                alt="Department logo" 
                width={44} 
                height={44} 
                className="relative rounded-full border-2 border-gray-100 shadow-sm group-hover:border-primary-200 transition-colors" 
              />
            </div>
            <div className="block">
              <div className="font-bold text-gray-900 text-sm sm:text-lg group-hover:text-primary-800 transition-colors leading-tight">{ORG.name}</div>
              <div className="text-xs text-gray-500 -mt-0.5 sm:-mt-1">{ORG.college}</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <Link 
                key={l.href} 
                href={l.href}
                prefetch={false}
                className="relative text-gray-600 hover:text-gray-900 font-medium transition-colors group py-2"
              >
                {l.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* CTA Section: Primary = Join Event; Secondary = Admin Sign In link */}
          <div className="flex items-center gap-4">
            <Link 
              href="/join" 
              aria-label="Join event registration" 
              className="hidden md:inline-flex items-center px-4 py-2 rounded-md shadow text-white font-medium transition-colors bg-primary-600 hover:bg-primary-700"
            >
              <Users className="size-4 mr-2" />
              Join Event
            </Link>
            <Link
              href="/auth/login"
              className="hidden md:inline-flex items-center text-gray-600 hover:text-primary-700 underline-offset-4 hover:underline"
              aria-label="Admin and organizers sign in"
              prefetch={false}
            >
              <Shield className="size-4 mr-1" /> Sign In
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle navigation"
            >
              {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 bg-white/95 backdrop-blur-xl">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {NAV_LINKS.map((l) => (
                <Link 
                  key={l.href} 
                  href={l.href}
                  prefetch={false}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
                <Link 
                  href="/join"
                  className="flex items-center gap-2 font-medium py-3 px-4 rounded-lg transition-colors shadow bg-primary-600 text-white hover:bg-primary-700"
                  aria-label="Join event registration"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users className="size-4" />
                  Join Event
                </Link>
                <Link 
                  href="/auth/login"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors"
                  aria-label="Admin and organizers sign in"
                  prefetch={false}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="size-4" />
                  Sign In
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
