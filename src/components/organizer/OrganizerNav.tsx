'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Calendar, QrCode, Menu, LogOut, User, Laptop } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useUser } from '@/hooks/use-auth';
import { getRoleDisplayName } from '@/lib/utils/role-utils';
import { LogoutDialog } from '@/components/auth/LogoutDialog';

const navItems = [
  { href: '/organizer/sessions', label: 'My Sessions', icon: Calendar },
  { href: '/organizer/scan', label: 'QR Scanner', icon: QrCode },
];

function NavLink({ 
  href, 
  label, 
  icon: Icon, 
  onClick 
}: { 
  href: string; 
  label: string; 
  icon: React.ElementType;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
        'hover:bg-muted hover:text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        isActive 
          ? 'bg-primary-50 text-primary-800 border-r-2 border-primary-500 dark:bg-primary-900/20 dark:text-primary-300' 
          : 'text-muted-foreground'
      )}
    >
      <Icon className={cn(
        'h-5 w-5 transition-colors',
        isActive ? 'text-primary-700 dark:text-primary-300' : 'text-muted-foreground'
      )} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function OrganizerNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const user = useUser();

  const handleNavClick = () => {
    setIsOpen(false);
  };

  const handleLogoutClick = () => {
    setIsLogoutDialogOpen(true);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:block fixed top-0 left-0 w-[280px] h-screen z-50">
        <div className="flex h-full flex-col">
          {/* Desktop Header */}
          <div className="flex h-16 items-center border-b px-6 bg-muted/50">
            <Link
              href="/organizer/sessions"
              className="flex items-center gap-3 font-semibold text-foreground hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              <Image src="/logo/dnsc.webp" alt="DNSC Logo" width={32} height={32} className="rounded-full" />
              <span className="text-lg">DNSC Attendance</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-3">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>
          </div>

          {/* Desktop Footer */}
          <div className="border-t bg-muted/50">
            {/* User Info */}
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.email || 'Organizer'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getRoleDisplayName(user?.role || null)}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleLogoutClick}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                DNSC Attendance
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Header */}
      <header className="flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-4 supports-[backdrop-filter]:bg-background/60 lg:hidden">
        {/* Mobile Logo */}
        <Link
          href="/organizer/sessions"
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <Image src="/logo/dnsc.webp" alt="DNSC Logo" width={32} height={32} className="rounded-full" />
          <span className="text-lg">DNSC Attendance</span>
        </Link>

        {/* Mobile Menu Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-80 p-0 bg-background z-50"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            
            {/* Mobile Sheet Header */}
            <div className="flex h-16 items-center justify-between border-b px-6 bg-muted/50">
              <Link
                href="/organizer/sessions"
                onClick={handleNavClick}
                className="flex items-center gap-3 font-semibold text-foreground"
              >
                <Image src="/logo/dnsc.webp" alt="DNSC Logo" width={32} height={32} className="rounded-full" />
                <span className="text-lg">DNSC Attendance</span>
              </Link>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => (
                <NavLink 
                  key={item.href} 
                  {...item} 
                  onClick={handleNavClick}
                />
              ))}
            </nav>

            {/* Mobile Sheet Footer */}
            <div className="border-t bg-muted/50">
              {/* Mobile User Info */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.email || 'Organizer'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getRoleDisplayName(user?.role || null)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    handleLogoutClick();
                    handleNavClick();
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:border-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  DNSC Attendance
                </div>
                <ThemeToggle />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Logout Confirmation Dialog */}
      <LogoutDialog 
        open={isLogoutDialogOpen} 
        onOpenChange={setIsLogoutDialogOpen} 
      />
    </>
  );
}

export default OrganizerNav;
