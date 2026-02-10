'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

interface DashboardShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  headerAction?: React.ReactNode;
  title: string;
  subTitle?: string;
}

export function DashboardShell({ children, sidebar, headerAction, title, subTitle }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Area */}
      <aside className="hidden w-64 border-r border-gray-200 bg-white md:block print:hidden">
        {sidebar}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subTitle && <p className="text-sm text-gray-500">{subTitle}</p>}
          </div>
          <div className="flex gap-2">{headerAction}</div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
