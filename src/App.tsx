import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { SessionsPage } from '@/pages/Sessions';
import { TerminalPage } from '@/pages/Terminal';
import { FilesPage } from '@/pages/Files';
import { LogsPage } from '@/pages/Logs';
import { StatsPage } from '@/pages/Stats';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/terminal" element={<TerminalPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
