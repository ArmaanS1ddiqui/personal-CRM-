import React, { useState } from 'react';
import type { Card } from '../store/useStore';
import { CardModal } from './CardModal';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const CardItem: React.FC<{ card: Card; isOverlay?: boolean }> = ({ card, isOverlay = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  // Extract Title for display if exists, else show first field or 'Untitled'
  const titleField = card.fields.find(f => f.name.toLowerCase() === 'title' || f.name.toLowerCase() === 'company');
  const displayTitle = titleField ? titleField.value : (card.fields[0]?.value || 'Untitled');

  return (
    <>
      <div 
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        {/* We separate the click handler into an inner div to prevent drag click conflicts, 
            but @dnd-kit handles clicks cleanly. Still, wrapping it safely: */}
        <div
          onClick={() => {
            // Prevent opening modal if it's a drag
            if (isDragging) return;
            setIsModalOpen(true);
          }}
          className="glass-panel"
          style={{
            padding: '12px',
            borderRadius: 'var(--border-radius-sm)',
            cursor: 'grab',
            background: 'var(--surface-2)',
            boxShadow: isOverlay ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
            transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
            border: isOverlay ? '1px solid var(--primary-color)' : '1px solid transparent'
          }}
          onMouseEnter={e => {
            if (isOverlay) return;
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.borderColor = 'var(--primary-glow)';
          }}
          onMouseLeave={e => {
             if (isOverlay) return;
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 500, pointerEvents: 'none' }}>{displayTitle}</h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', pointerEvents: 'none' }}>
            {card.fields.slice(0, 3).map(field => {
              if (field.id === titleField?.id) return null; // Skip title field in brief
              return (
                <div key={field.id} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.7 }}>{field.name}:</span>
                  <span style={{ color: 'var(--text-main)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{field.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CardModal card={card} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};
