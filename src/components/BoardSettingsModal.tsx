import React, { useState, useEffect } from 'react';
import { useStore, type Stage } from '../store/useStore';
import { X, Plus, Trash2, ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const BoardSettingsModal: React.FC<{ boardId: string; onClose: () => void }> = ({ boardId, onClose }) => {
  const board = useStore(state => state.boards.find(b => b.id === boardId));
  const rawStages = useStore(state => state.stages);
  const updateBoard = useStore(state => state.updateBoard);
  const deleteBoard = useStore(state => state.deleteBoard);
  const updateBoardForm = useStore(state => state.updateBoardForm);
  const updateStages = useStore(state => state.updateStages);

  const [activeTab, setActiveTab] = useState<'general' | 'form' | 'stages'>('general');

  // General state
  const [boardName, setBoardName] = useState(board?.name || '');

  // Form state
  const [formFields, setFormFields] = useState<string[]>(board?.formFields || []);

  // Stages state
  const [localStages, setLocalStages] = useState<Stage[]>([]);

  // Feedback State
  const [isSaved, setIsSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const boardStages = rawStages.filter(s => s.boardId === boardId).sort((a, b) => a.order - b.order);
    setLocalStages(boardStages);
  }, [rawStages, boardId]);

  if (!board) return null;

  // --- Handlers ---
  const triggerSuccessSequence = () => {
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  const handleSaveGeneral = () => {
    if (boardName.trim()) {
      updateBoard(boardId, boardName.trim());
      triggerSuccessSequence();
    }
  };

  const handleDeleteBoard = () => {
    deleteBoard(boardId);
    onClose();
  };

  const handleSaveForm = () => {
    const validFields = formFields.map(f => f.trim()).filter(f => f !== '');
    updateBoardForm(boardId, validFields);
    triggerSuccessSequence();
  };

  const handleSaveStages = () => {
    // Ensure accurate order values
    const properlyOrdered = localStages.map((s, idx) => ({ ...s, order: idx }));
    updateStages(boardId, properlyOrdered);
    triggerSuccessSequence();
  };

  // --- Stage Manipulations ---
  const addLocalStage = () => {
    setLocalStages([...localStages, { id: uuidv4(), boardId, name: 'New Stage', order: localStages.length }]);
  };

  const updateLocalStageName = (id: string, name: string) => {
    setLocalStages(localStages.map(s => s.id === id ? { ...s, name } : s));
  };

  const removeLocalStage = (id: string) => {
    setLocalStages(localStages.filter(s => s.id !== id));
  };

  const moveStageUp = (index: number) => {
    if (index === 0) return;
    const newStages = [...localStages];
    const temp = newStages[index - 1];
    newStages[index - 1] = newStages[index];
    newStages[index] = temp;
    setLocalStages(newStages);
  };

  const moveStageDown = (index: number) => {
    if (index === localStages.length - 1) return;
    const newStages = [...localStages];
    const temp = newStages[index + 1];
    newStages[index + 1] = newStages[index];
    newStages[index] = temp;
    setLocalStages(newStages);
  };

  // --- Renderers ---
  const renderGeneralTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Board Name</label>
        <input 
          className="premium-input" 
          value={boardName} 
          onChange={e => setBoardName(e.target.value)} 
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
        <button className="premium-btn primary" onClick={handleSaveGeneral}>Save Name</button>
        {showDeleteConfirm ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Are you sure?</span>
            <button className="premium-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            <button className="premium-btn" style={{ background: 'var(--danger-color)', color: 'white', border: 'none' }} onClick={handleDeleteBoard}>Yes, Delete</button>
          </div>
        ) : (
          <button 
            className="premium-btn" 
            style={{ background: 'transparent', color: 'var(--danger-color)', borderColor: 'rgba(248, 81, 73, 0.3)' }} 
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Entire Board
          </button>
        )}
      </div>
    </div>
  );

  const renderFormTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Define the template of fields for new cards in this board. When you add a new card, these fields will be automatically populated.
      </p>
      
      {formFields.map((field, idx) => (
        <div key={idx} style={{ display: 'flex', gap: '8px' }}>
          <input 
            className="premium-input"
            style={{ flex: 1 }}
            value={field}
            placeholder="Field Name"
            onChange={e => {
              const newFields = [...formFields];
              newFields[idx] = e.target.value;
              setFormFields(newFields);
            }}
          />
          <button 
            onClick={() => setFormFields(formFields.filter((_, i) => i !== idx))}
            style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0 8px' }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      
      <button 
        className="premium-btn" 
        style={{ border: '1px dashed var(--border-color)', background: 'transparent', alignSelf: 'flex-start' }}
        onClick={() => setFormFields([...formFields, ''])}
      >
        <Plus size={16} /> Add Field
      </button>

      <div style={{ marginTop: '16px' }}>
        <button className="premium-btn primary" onClick={handleSaveForm}>Save Form Template</button>
      </div>
    </div>
  );

  const renderStagesTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
        Add, remove, or reorder the columns for this board.
      </p>

      {localStages.map((stage, idx) => (
        <div key={stage.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button onClick={() => moveStageUp(idx)} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', padding: '2px' }}><ArrowUp size={14} /></button>
            <button onClick={() => moveStageDown(idx)} disabled={idx === localStages.length - 1} style={{ border: 'none', background: 'transparent', cursor: idx === localStages.length - 1 ? 'default' : 'pointer', color: idx === localStages.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', padding: '2px' }}><ArrowDown size={14} /></button>
          </div>
          <input 
            className="premium-input"
            style={{ flex: 1 }}
            value={stage.name}
            onChange={e => updateLocalStageName(stage.id, e.target.value)}
          />
          <button 
            onClick={() => removeLocalStage(stage.id)}
            style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0 8px' }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      <button 
        className="premium-btn" 
        style={{ border: '1px dashed var(--border-color)', background: 'transparent', alignSelf: 'flex-start', marginTop: '8px' }}
        onClick={addLocalStage}
      >
        <Plus size={16} /> Add Stage
      </button>

      <div style={{ marginTop: '16px' }}>
        <button className="premium-btn primary" onClick={handleSaveStages}>Save Stages</button>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '600px', maxHeight: '90vh',
        borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--primary-glow)'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Board Settings</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 24px' }}>
          <button 
            style={{ 
              padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
              color: activeTab === 'general' ? 'var(--text-main)' : 'var(--text-muted)',
              borderBottom: activeTab === 'general' ? '2px solid var(--primary-color)' : '2px solid transparent'
            }}
            onClick={() => setActiveTab('general')}
          >General</button>
          <button 
            style={{ 
              padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
              color: activeTab === 'form' ? 'var(--text-main)' : 'var(--text-muted)',
              borderBottom: activeTab === 'form' ? '2px solid var(--primary-color)' : '2px solid transparent'
            }}
            onClick={() => setActiveTab('form')}
          >Edit Form</button>
          <button 
            style={{ 
              padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
              color: activeTab === 'stages' ? 'var(--text-main)' : 'var(--text-muted)',
              borderBottom: activeTab === 'stages' ? '2px solid var(--primary-color)' : '2px solid transparent'
            }}
            onClick={() => setActiveTab('stages')}
          >Edit Stages</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {isSaved ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', animation: 'fadeIn 0.3s ease' }}>
              <CheckCircle2 size={48} color="var(--primary-color)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Saved Successfully!</h3>
            </div>
          ) : (
            <>
              {activeTab === 'general' && renderGeneralTab()}
              {activeTab === 'form' && renderFormTab()}
              {activeTab === 'stages' && renderStagesTab()}
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};
