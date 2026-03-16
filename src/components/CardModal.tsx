import React, { useState } from 'react';
import type { Card, CustomField } from '../store/useStore';
import { useStore } from '../store/useStore';
import { X, Plus, Trash2, Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const CardModal: React.FC<{ card: Card; onClose: () => void }> = ({ card, onClose }) => {
  const updateCardFields = useStore(state => state.updateCardFields);
  const deleteCard = useStore(state => state.deleteCard);
  const allStages = useStore(state => state.stages);
  
  const [fields, setFields] = useState<CustomField[]>(card.fields);

  const handleSave = () => {
    updateCardFields(card.id, fields);
    onClose();
  };

  const addField = () => {
    setFields([...fields, { id: uuidv4(), name: '', value: '' }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, key: 'name' | 'value', val: string) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: val } : f));
  };

  const handleDeleteCard = () => {
    deleteCard(card.id);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        borderRadius: 'var(--border-radius-md)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--primary-glow)'
      }}>
        {/* Header */}
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Edit Card</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {fields.map(field => (
            <div key={field.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <input
                className="premium-input"
                style={{ flex: 1 }}
                placeholder="Field Name (e.g. Salary, Status)"
                value={field.name}
                onChange={e => updateField(field.id, 'name', e.target.value)}
              />
              <input
                className="premium-input"
                style={{ flex: 2 }}
                placeholder="Value..."
                value={field.value}
                onChange={e => updateField(field.id, 'value', e.target.value)}
              />
              <button 
                onClick={() => removeField(field.id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', padding: '10px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          <button 
            className="premium-btn" 
            style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px dashed var(--border-color)', color: 'var(--text-muted)' }}
            onClick={addField}
          >
            <Plus size={16} /> Add Custom Field
          </button>

          {/* History Section */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} /> Lead History
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(card.history || []).map((entry, idx) => {
                const stageName = allStages.find(s => s.id === entry.stageId)?.name || 'Unknown Stage';
                const date = new Date(entry.timestamp);
                const isFirst = idx === 0;
                
                return (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: isFirst ? 'var(--secondary-color)' : 'var(--primary-color)',
                      marginTop: '6px',
                      boxShadow: isFirst ? '0 0 8px var(--secondary-color)' : '0 0 8px var(--primary-glow)'
                    }} />
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {isFirst ? 'Created in ' : 'Moved to '} 
                        <strong>{stageName}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {(!card.history || card.history.length === 0) && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No history recorded for this lead yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <button className="premium-btn" style={{ background: 'transparent', color: 'var(--danger-color)', borderColor: 'rgba(248, 81, 73, 0.3)', whiteSpace: 'nowrap' }} onClick={handleDeleteCard}>
            Delete Card
          </button>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="premium-btn" onClick={onClose} style={{ whiteSpace: 'nowrap' }}>Cancel</button>
            <button className="premium-btn primary" onClick={handleSave} style={{ whiteSpace: 'nowrap' }}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};
