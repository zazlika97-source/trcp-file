import { useSocket } from '@/hooks/useSocket';
import { Wifi, WifiOff } from 'lucide-react';

export function ConnectionStatus() {
  const { connected, connecting } = useSocket();

  if (connected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-[#e5a044]/10 border-b border-[#e5a044]/30 px-4 py-2 flex items-center justify-center gap-2 lg:ml-56">
      {connecting ? (
        <Wifi className="w-3.5 h-3.5 text-[#e5a044] animate-pulse" />
      ) : (
        <WifiOff className="w-3.5 h-3.5 text-[#ff6b6b]" />
      )}
      <span className="text-xs font-medium text-[#e5a044]">
        {connecting ? 'Connecting...' : 'Disconnected - Reconnecting...'}
      </span>
    </div>
  );
}
