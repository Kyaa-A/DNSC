import React from 'react';
import { Metadata } from 'next';
import { OrganizerOnly } from '@/components/auth/RoleGuard';
import { OrganizerNav } from '@/components/organizer/OrganizerNav';

export const metadata: Metadata = {
  title: 'Organizer Portal - DNSC Attendance System',
  description: 'Organizer portal for managing attendance sessions',
};

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrganizerOnly redirectTo="/admin/dashboard">
      <div className="min-h-screen">
        <OrganizerNav />
        <div className="lg:ml-[280px]"> {/* Add left margin to account for fixed sidebar */}
          <main className="min-h-screen pt-16 lg:pt-0 bg-gradient-to-br from-primary-50/40 via-white to-secondary-50/40 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
            {children}
          </main>
        </div>
      </div>
    </OrganizerOnly>
  );
}
