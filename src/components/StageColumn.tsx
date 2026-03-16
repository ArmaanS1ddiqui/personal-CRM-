import React from 'react';
import type { Stage, Card } from '../store/useStore';
import { Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { CardItem } from './CardItem';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export const StageColumn: React.FC<{ stage: Stage; cards: Card[] }> = ({ stage, cards }) => {
  const addCard = useStore(state => state.addCard);
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div 
      className="glass-panel" 
      ref={setNodeRef}
      style={{
        minWidth: '320px',
        width: '320px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--border-radius-md)',
        padding: '16px',
        height: '100%',
        background: isOver ? 'rgba(255,255,255,0.05)' : 'var(--surface-1)',
        transition: 'background 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {stage.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '8px' }}>{cards.length}</span>
        </h3>
        <button 
          onClick={() => addCard(stage.boardId, stage.id)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <Plus size={18} />
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingRight: '4px'
      }}>
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <CardItem key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
