import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      <div className="max-w-[1600px] mx-auto px-4 pb-12">{children}</div>
    </div>
  );
}
