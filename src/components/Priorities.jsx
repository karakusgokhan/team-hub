import React, { useState } from 'react';
import { TEAM_MEMBERS } from '../utils/config';
import { getMonday } from '../utils/helpers';
import { airtableCreate, airtableUpdate } from '../utils/airtable';
import { Avatar, PriorityStatus, WhatsAppButton } from './Shared';

const STATUS_CYCLE = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' };

export default function Priorities({ priorities, setPriorities, currentUser, config }) {
  const [showForm, setShowForm] = useState(false);
  const [newPriorityText, setNewPriorityText] = useState('');
  const [expanded, setExpanded] = useState({ [currentUser]: true });

  const currentWeek = getMonday(new Date());
  const thisWeek = priorities.filter(p => p.week === currentWeek);

  // Group by person, sorted by sortOrder
  const grouped = TEAM_MEMBERS.reduce((acc, m) => {
    acc[m.name] = thisWeek
      .filter(p => p.person === m.name)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return acc;
  }, {});

  // Render order: currentUser first
  const renderOrder = [
    currentUser,
    ...TEAM_MEMBERS.map(m => m.name).filter(n => n !== currentUser),
  ];

  const toggleExpand = (name) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleStatusClick = async (record) => {
    const next = STATUS_CYCLE[record.status];
    setPriorities(prev =>
      prev.map(p => p.id === record.id ? { ...p, status: next } : p)
    );
    if (config?.apiKey) {
      await airtableUpdate(config, 'WeeklyPriorities', record.id, { Status: next });
    }
  };

  const handleMove = async (record, direction) => {
    const items = grouped[record.person];
    const idx = items.findIndex(p => p.id === record.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const swapItem = items[swapIdx];
    const newOrder = record.sortOrder;
    const swapOrder = swapItem.sortOrder;

    setPriorities(prev => prev.map(p => {
      if (p.id === record.id) return { ...p, sortOrder: swapOrder };
      if (p.id === swapItem.id) return { ...p, sortOrder: newOrder };
      return p;
    }));

    if (config?.apiKey) {
      await airtableUpdate(config, 'WeeklyPriorities', record.id, { SortOrder: swapOrder });
      await airtableUpdate(config, 'WeeklyPriorities', swapItem.id, { SortOrder: newOrder });
    }
  };

  const handleAdd = async () => {
    if (!newPriorityText.trim()) return;
    const myItems = grouped[currentUser] || [];
    const nextOrder = myItems.length > 0 ? Math.max(...myItems.map(p => p.sortOrder)) + 1 : 1;
    const tempId = `p${Date.now()}`;
    const newRecord = {
      id: tempId,
      person: currentUser,
      week: currentWeek,
      priority: newPriorityText.trim(),
      status: 'todo',
      sortOrder: nextOrder,
    };
    setPriorities(prev => [...prev, newRecord]);
    setNewPriorityText('');
    setShowForm(false);

    if (config?.apiKey) {
      const result = await airtableCreate(config, 'WeeklyPriorities', {
        Person: currentUser,
        Week: currentWeek,
        Priority: newRecord.priority,
        Status: 'todo',
        SortOrder: nextOrder,
      });
      if (result?.id) {
        setPriorities(prev => prev.map(p => p.id === tempId ? { ...p, id: result.id } : p));
      }
    }
  };

  const buildWhatsAppText = () => {
    const icons = { done: '✅', 'in-progress': '🔄', todo: '⬜' };
    const weekStr = new Date(currentWeek).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const lines = TEAM_MEMBERS.map(m => {
      const items = grouped[m.name] || [];
      if (items.length === 0) return null;
      const itemLines = items.map(p => `  ${icons[p.status]} ${p.priority}`).join('\n');
      return `*${m.name}*\n${itemLines}`;
    }).filter(Boolean).join('\n\n');
    return `🎯 *Weekly Priorities — Week of ${weekStr}*\n\n${lines}`;
  };

  const getProgress = (name) => {
    const items = grouped[name] || [];
    if (items.length === 0) return { done: 0, total: 0, pct: 0 };
    const done = items.filter(p => p.status === 'done').length;
    return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
  };

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
            Weekly Priorities
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>
            Week of {new Date(currentWeek).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <WhatsAppButton compact label="Share" text={buildWhatsAppText()} />
          <button onClick={() => setShowForm(v => !v)} style={{
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#A5B4FC', padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}>+ Add Priority</button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{
          background: 'rgba(99,102,241,0.06)', borderRadius: 16, padding: 20,
          marginBottom: 20, border: '1px solid rgba(99,102,241,0.15)', animation: 'slideIn 0.3s ease',
        }}>
          <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14, color: '#E2E8F0' }}>Add a priority for this week</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={newPriorityText}
              onChange={e => setNewPriorityText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="What do you want to get done this week?"
              autoFocus
              style={{
                flex: 1, minWidth: 200, padding: '10px 14px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, color: '#E2E8F0', fontSize: 14, outline: 'none',
              }}
            />
            <button onClick={handleAdd} style={{
              padding: '10px 20px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              border: 'none', color: '#fff', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}>Add</button>
            <button onClick={() => { setShowForm(false); setNewPriorityText(''); }} style={{
              padding: '10px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94A3B8', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Person sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {renderOrder.map(name => {
          const member = TEAM_MEMBERS.find(m => m.name === name);
          const items = grouped[name] || [];
          const isMe = name === currentUser;
          const isExpanded = expanded[name] ?? isMe;
          const prog = getProgress(name);

          return (
            <div key={name} style={{
              background: isMe ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
              border: isMe ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, overflow: 'hidden',
            }}>
              {/* Section header — click to expand/collapse */}
              <div
                onClick={() => toggleExpand(name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px', cursor: 'pointer',
                  borderBottom: isExpanded && items.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <Avatar name={name} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {name}
                    {isMe && (
                      <span style={{
                        fontSize: 10, background: 'rgba(99,102,241,0.2)', color: '#A5B4FC',
                        padding: '1px 7px', borderRadius: 8, fontWeight: 600,
                      }}>YOU</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{member?.role}</div>
                </div>

                {/* Progress indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {prog.total > 0 ? (
                    <>
                      <span style={{ fontSize: 12, color: '#64748B', fontFamily: "'Space Mono', monospace" }}>
                        {prog.done}/{prog.total}
                      </span>
                      <div style={{ width: 60, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${prog.pct}%`, height: '100%', borderRadius: 3,
                          background: prog.pct === 100 ? '#10B981' : 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>No priorities</span>
                  )}
                  <span style={{ color: '#475569', fontSize: 11 }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Priority items */}
              {isExpanded && (
                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {items.length === 0 && isMe && (
                    <p style={{ color: '#475569', fontSize: 13, padding: '8px 4px', margin: 0, fontStyle: 'italic' }}>
                      No priorities yet — click "+ Add Priority" to get started.
                    </p>
                  )}
                  {items.map((item, idx) => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      {/* Clickable status dot */}
                      <button
                        onClick={() => isMe && handleStatusClick(item)}
                        title={isMe ? 'Click to update status' : item.status}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          cursor: isMe ? 'pointer' : 'default', flexShrink: 0,
                        }}
                      >
                        <PriorityStatus status={item.status} />
                      </button>

                      {/* Priority text */}
                      <span style={{
                        flex: 1, fontSize: 14,
                        color: item.status === 'done' ? '#475569' : '#E2E8F0',
                        textDecoration: item.status === 'done' ? 'line-through' : 'none',
                        transition: 'all 0.2s',
                      }}>
                        {item.priority}
                      </span>

                      {/* Status label */}
                      <span style={{ fontSize: 11, color: '#475569', fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>
                        {item.status.replace('-', ' ')}
                      </span>

                      {/* Up/Down arrows — only for currentUser */}
                      {isMe && (
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          <button
                            onClick={() => handleMove(item, 'up')}
                            disabled={idx === 0}
                            style={{
                              background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                              color: idx === 0 ? '#2D3748' : '#64748B',
                              width: 24, height: 24, borderRadius: 6,
                              cursor: idx === 0 ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                            }}
                          >▲</button>
                          <button
                            onClick={() => handleMove(item, 'down')}
                            disabled={idx === items.length - 1}
                            style={{
                              background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                              color: idx === items.length - 1 ? '#2D3748' : '#64748B',
                              width: 24, height: 24, borderRadius: 6,
                              cursor: idx === items.length - 1 ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                            }}
                          >▼</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
