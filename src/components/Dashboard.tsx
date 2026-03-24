import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { KanbanSquare, Settings, Menu } from 'lucide-react';
import { BoardSettingsModal } from './BoardSettingsModal';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export const Dashboard: React.FC<{ boardId: string }> = ({ boardId }) => {
  const [showSettings, setShowSettings] = useState(false);
  
  const board = useStore(state => state.boards.find(b => b.id === boardId));
  const rawCards = useStore(state => state.cards);
  const cards = useMemo(() => rawCards.filter(c => c.boardId === boardId), [rawCards, boardId]);
  const setActiveView = useStore(state => state.setActiveView);

  // Group cards by creation date
  const chartData = useMemo(() => {
    const countsByDate: Record<string, number> = {};
    
    cards.forEach(card => {
      // First history item is roughly the creation timestamp
      const createdStr = card.history[0]?.timestamp || new Date().toISOString();
      const dateOnlyDate = new Date(createdStr);
      // Create a sortable date string YYYY-MM-DD
      const sortableDate = dateOnlyDate.toISOString().split('T')[0];
      
      countsByDate[sortableDate] = (countsByDate[sortableDate] || 0) + 1;
    });

    const sortedDates = Object.keys(countsByDate).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
    });

    return sortedDates.map(dateKey => {
      // format nicely for display
      const displayDate = new Date(dateKey + 'T12:00:00Z').toLocaleDateString('en-US', {
        month: 'short', 
        day: 'numeric'
      });
      return {
        date: displayDate,
        leads: countsByDate[dateKey]
      };
    });
  }, [cards]);

  if (!board) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
      <header className="board-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
          <h2 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0 }}>{board.name} Overview</h2>
          <button 
            onClick={() => setShowSettings(true)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Board Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        <button
           className="premium-btn"
           onClick={() => setActiveView('kanban')}
           style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
           <KanbanSquare size={18} /> Board View
        </button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--border-radius-lg)' }}>
          <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>Leads Created Over Time</h3>
          
          <div style={{ width: '100%', height: '400px' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-muted)" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 15, 20, 0.95)', 
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      color: '#fff',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }} 
                    itemStyle={{ color: 'var(--primary-color)', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="var(--primary-color)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorLeads)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No lead data available for this board yet.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginTop: '24px' }}>
           <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
             <div style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>Total Leads</div>
             <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary-color)', textShadow: '0 0 20px var(--primary-glow)' }}>
               {cards.length}
             </div>
           </div>
           
           <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--border-radius-lg)', textAlign: 'center' }}>
             <div style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.9rem' }}>Active Today</div>
             <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>
               {chartData.length > 0 ? chartData[chartData.length - 1].leads : 0}
             </div>
           </div>
        </div>
      </div>

      {showSettings && (
        <BoardSettingsModal boardId={board.id} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};
