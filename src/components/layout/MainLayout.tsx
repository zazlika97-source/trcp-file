import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { ConnectionStatus } from './ConnectionStatus';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[#0f1115]">
      <Sidebar />
      <ConnectionStatus />
      <main className="lg:ml-56 pb-16 lg:pb-0 min-h-screen">
        <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
