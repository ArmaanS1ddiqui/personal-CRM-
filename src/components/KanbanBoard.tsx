import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Settings, Menu, BarChart2 } from 'lucide-react';
import { StageColumn } from './StageColumn';
import { BoardSettingsModal } from './BoardSettingsModal';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import type {
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent
} from '@dnd-kit/core';
import { CardItem } from './CardItem';

export const KanbanBoard: React.FC<{ boardId: string }> = ({ boardId }) => {
  const board = useStore(state => state.boards.find(b => b.id === boardId));
  const rawStages = useStore(state => state.stages);
  const rawCards = useStore(state => state.cards);

  // Derived state to avoid infinite loops from Zustand selectors returning new arrays
  const stages = useMemo(() => rawStages.filter(s => s.boardId === boardId).sort((a, b) => a.order - b.order), [rawStages, boardId]);
  const cards = useMemo(() => rawCards.filter(c => c.boardId === boardId), [rawCards, boardId]);
  const addStage = useStore(state => state.addStage);
  const moveCard = useStore(state => state.moveCard);
  const setActiveView = useStore(state => state.setActiveView);

  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStageName.trim()) {
      addStage(boardId, newStageName.trim());
      setNewStageName('');
      setIsAddingStage(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) return;
    
    // We only care about drag end for simple stage swapping, 
    // but if we wanted real-time visual sorting across columns, we'd handle it here.
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeCard = cards.find(c => c.id === activeId);
    if (!activeCard) return;

    // Check if dropping over a stage
    const isOverStage = stages.find(s => s.id === overId);
    if (isOverStage) {
      if (activeCard.stageId !== overId) {
        moveCard(activeId as string, overId as string);
      }
      return;
    }

    // Check if dropping over another card
    const overCard = cards.find(c => c.id === overId);
    if (overCard && overCard.stageId !== activeCard.stageId) {
      moveCard(activeId as string, overCard.stageId);
    }
  };

  if (!board) return null;

  const activeCard = cards.find(c => c.id === activeCardId);

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
        <header className="board-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Mobile Menu Toggle button */}
            <button 
              className="mobile-menu-btn"
              onClick={() => {
                const overlay = document.querySelector('.mobile-overlay');
                if (overlay) {
                  window.dispatchEvent(new CustomEvent('toggleSidebar'));
                }
              }}
            >
              <Menu size={24} />
            </button>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0 }}>{board.name}</h2>
            <button 
              onClick={() => setShowSettings(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Board Settings"
            >
              <Settings size={20} />
            </button>
          </div>
          <button
            className="premium-btn border-ghost"
            onClick={() => setActiveView('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <BarChart2 size={18} /> Dashboard
          </button>
        </header>
        
        <div className="kanban-columns-container" style={{ 
          display: 'flex', 
          gap: '24px', 
          flex: 1, 
          overflowX: 'auto', 
          overflowY: 'hidden',
          paddingBottom: '16px'
        }}>
          {stages.map(stage => (
            <StageColumn key={stage.id} stage={stage} cards={cards.filter(c => c.stageId === stage.id)} />
          ))}
          
          {/* Add Stage Column Placeholder */}
          <div style={{ minWidth: '300px', width: '300px' }}>
            {isAddingStage ? (
              <form onSubmit={handleAddStage} className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--border-radius-md)' }}>
                <input
                  autoFocus
                  className="premium-input"
                  value={newStageName}
                  onChange={e => setNewStageName(e.target.value)}
                  placeholder="Stage name..."
                  onBlur={() => !newStageName && setIsAddingStage(false)}
                />
              </form>
            ) : (
              <button
                className="glass-panel"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 'var(--border-radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  border: '1px dashed var(--border-color)',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'var(--text-muted)'
                }}
                onClick={() => setIsAddingStage(true)}
              >
                <Plus size={20} /> Add Stage
              </button>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCard ? <CardItem card={activeCard} isOverlay /> : null}
      </DragOverlay>

      {showSettings && (
        <BoardSettingsModal boardId={board.id} onClose={() => setShowSettings(false)} />
      )}
    </DndContext>
  );
};
