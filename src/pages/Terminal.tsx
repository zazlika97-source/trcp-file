import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSocket } from '@/hooks/useSocket';
import { useSessions } from '@/hooks/useSessions';
import { XTerminal } from '@/components/terminal/XTerminal';
import {
  Terminal as TerminalIcon,
  Plus,
  X,
  Maximize2,
  Minimize2,
  Smartphone,
} from 'lucide-react';

interface TerminalTab {
  id: string;
  terminalId: string;
  sessionId: string;
  sessionName: string;
}

export function TerminalPage() {
  const [searchParams] = useSearchParams();
  const { sessions } = useSessions();
  const { emit } = useSocket();
  const [tabs, setTabs] = useState<TerminalTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showSessionPicker, setShowSessionPicker] = useState(false);

  // Create terminal from URL param
  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (sessionId && sessions.find(s => s.id === sessionId)) {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        createTerminal(session.id, session.name);
      }
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, sessions.length]);

  const createTerminal = useCallback(
    async (sessionId: string, sessionName: string) => {
      const existingTab = tabs.find(t => t.sessionId === sessionId);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return;
      }

      const response: any = await emit('terminal:create', {
        sessionId,
        size: { cols: 80, rows: 24 },
        cwd: sessions.find(s => s.id === sessionId)?.cwd,
      });

      if (response?.success && response.terminalId) {
        const newTab: TerminalTab = {
          id: `tab_${Date.now()}`,
          terminalId: response.terminalId,
          sessionId,
          sessionName,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.id);
        setShowSessionPicker(false);
      }
    },
    [emit, tabs, sessions]
  );

  const closeTab = useCallback(
    async (tabId: string) => {
      const tab = tabs.find(t => t.id === tabId);
      if (tab) {
        await emit('terminal:kill', { terminalId: tab.terminalId });
      }
      const newTabs = tabs.filter(t => t.id !== tabId);
      setTabs(newTabs);
      if (activeTabId === tabId) {
        setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
      }
    },
    [tabs, activeTabId, emit]
  );

  const activeTab = tabs.find(t => t.id === activeTabId);

  // Mobile fullscreen mode
  if (fullscreen && activeTab) {
    return (
      <div className="fixed inset-0 z-[70] bg-[#0f1115] flex flex-col">
        {/* Mobile Terminal Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#151922] border-b border-[#262c36] flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <TerminalIcon className="w-4 h-4 text-[#4fa3ff] flex-shrink-0" />
            <span className="text-sm text-[#d6dbe4] truncate">{activeTab.sessionName}</span>
          </div>
          <button
            onClick={() => setFullscreen(false)}
            className="p-1.5 hover:bg-[#262c36] rounded transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-[#8b93a7]" />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <XTerminal
            key={activeTab.terminalId}
            terminalId={activeTab.terminalId}
            sessionId={activeTab.sessionId}
            onExit={() => closeTab(activeTab.id)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${fullscreen ? 'fixed inset-0 z-[70] bg-[#0f1115]' : ''} animate-fade-in`}>
      {/* Header */}
      {!fullscreen && (
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-[#d6dbe4]">Terminal</h1>
            <p className="text-xs text-[#8b93a7] font-mono mt-0.5">
              {tabs.length} active terminal{tabs.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tabs.length > 0 && (
              <button
                onClick={() => setFullscreen(true)}
                className="lg:hidden btn-secondary p-2"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowSessionPicker(!showSessionPicker)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Terminal
            </button>
          </div>
        </div>
      )}

      {/* Session Picker */}
      {showSessionPicker && !fullscreen && (
        <div className="panel p-3 mb-3 animate-slide-up">
          <p className="text-xs text-[#8b93a7] font-mono mb-2">SELECT SESSION</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => createTerminal(session.id, session.name)}
                className="flex items-center gap-2 px-3 py-2 bg-[#0f1115] rounded hover:bg-[#1a1f2a] transition-colors text-left"
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    session.status === 'running'
                      ? 'bg-[#57c27e]'
                      : session.status === 'error'
                      ? 'bg-[#ff6b6b]'
                      : 'bg-[#8b93a7]'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-xs text-[#d6dbe4] truncate">{session.name}</p>
                  <p className="text-[10px] text-[#8b93a7] font-mono truncate">{session.command}</p>
                </div>
              </button>
            ))}
            {sessions.length === 0 && (
              <p className="text-xs text-[#8b93a7] col-span-full text-center py-4">
                No sessions available. <Link to="/sessions" className="text-[#4fa3ff] hover:underline">Create one</Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      {tabs.length > 0 && (
        <>
          <div className="flex items-center gap-1 overflow-x-auto mb-2 pb-1 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors flex-shrink-0 ${
                  tab.id === activeTabId
                    ? 'bg-[#4fa3ff]/10 text-[#4fa3ff] border border-[#4fa3ff]/30'
                    : 'bg-[#1e2230] text-[#8b93a7] border border-[#262c36] hover:text-[#d6dbe4]'
                }`}
              >
                <TerminalIcon className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{tab.sessionName}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  className="ml-1 p-0.5 hover:bg-[#ff6b6b]/20 rounded"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            ))}
            {tabs.length > 0 && (
              <button
                onClick={() => setFullscreen(!fullscreen)}
                className="hidden lg:flex items-center gap-1 px-2 py-1.5 text-[#8b93a7] hover:text-[#d6dbe4] transition-colors ml-auto"
              >
                {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Terminal Container */}
          <div className={`border border-[#262c36] rounded bg-[#0f1115] ${fullscreen ? 'flex-1' : 'h-[60vh] lg:h-[70vh]'}`}>
            {activeTab ? (
              <XTerminal
                key={activeTab.terminalId}
                terminalId={activeTab.terminalId}
                sessionId={activeTab.sessionId}
                onExit={() => closeTab(activeTab.id)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#8b93a7]">
                <p className="text-sm">Select a terminal tab</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {tabs.length === 0 && !showSessionPicker && (
        <div className="panel flex flex-col items-center justify-center py-16">
          <TerminalIcon className="w-12 h-12 text-[#262c36] mb-3" />
          <p className="text-sm text-[#8b93a7]">No active terminals</p>
          <p className="text-xs text-[#8b93a7] mt-1 mb-4">Create a new terminal to start</p>
          <button
            onClick={() => setShowSessionPicker(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Terminal
          </button>
        </div>
      )}
    </div>
  );
}
