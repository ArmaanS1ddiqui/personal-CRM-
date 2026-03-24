import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { Dashboard } from './components/Dashboard';
import { OCRScanner } from './components/OCRScanner';
import { useStore } from './store/useStore';

function App() {
  const activeBoardId = useStore((state) => state.activeBoardId);
  const activeView = useStore((state) => state.activeView);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  return (
    <div className="app-layout" style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Overlay for mobile when sidebar is open */}
      <div 
        className={`mobile-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      <main className="main-content" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeBoardId ? (
          activeView === 'dashboard' ? (
            <Dashboard boardId={activeBoardId} />
          ) : (
            <KanbanBoard boardId={activeBoardId} />
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <h2>Select or create a board to get started</h2>
          </div>
        )}
      </main>
      <OCRScanner />
    </div>
  );
}

export default App;
