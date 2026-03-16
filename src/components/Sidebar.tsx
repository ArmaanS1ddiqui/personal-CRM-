import React, { useState } from 'react';
import { Plus, LayoutDashboard } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const boards = useStore((state) => state.boards);
  const activeBoardId = useStore((state) => state.activeBoardId);
  const setActiveBoard = useStore((state) => state.setActiveBoard);
  const addBoard = useStore((state) => state.addBoard);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoardName.trim()) {
      addBoard(newBoardName.trim());
      setNewBoardName('');
      setIsCreating(false);
    }
  };

  return (
    <aside className={`glass-panel sidebar-container ${isOpen ? 'open' : ''}`} style={{
      width: '280px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border-color)',
      padding: '24px 16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary-color)' }}>
          <LayoutDashboard size={28} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Leads Flow</h1>
        </div>
        {/* Close Button only visible on mobile via CSS toggle logic if preferred, or rely on overlay */}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.05em', fontWeight: 600 }}>
          Your Boards
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {boards.map(board => (
            <button
              key={board.id}
              onClick={() => {
                setActiveBoard(board.id);
                setIsOpen(false); // auto-close on selection for mobile
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: 'var(--border-radius-sm)',
                background: activeBoardId === board.id ? 'var(--primary-glow)' : 'transparent',
                color: activeBoardId === board.id ? '#fff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-family)',
                fontSize: '0.95rem',
                transition: 'all 0.2s',
                fontWeight: activeBoardId === board.id ? 600 : 400
              }}
            >
              {board.name}
            </button>
          ))}
        </div>

        {isCreating ? (
          <form onSubmit={handleCreate} style={{ marginTop: '16px' }}>
            <input
              autoFocus
              className="premium-input"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Board name..."
              onBlur={() => !newBoardName && setIsCreating(false)}
            />
          </form>
        ) : (
          <button
            className="premium-btn"
            style={{ width: '100%', marginTop: '16px', justifyContent: 'flex-start', background: 'transparent', border: '1px dashed var(--border-color)' }}
            onClick={() => setIsCreating(true)}
          >
            <Plus size={18} /> New Board
          </button>
        )}
      </div>
    </aside>
  );
};
