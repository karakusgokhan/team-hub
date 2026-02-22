import React, { useState } from 'react';
import { TEAM_MEMBERS } from '../utils/config';
import { getMonday, getSunday, offsetWeek } from '../utils/helpers';
import { airtableCreate, airtableUpdate, airtableFetch } from '../utils/airtable';
import { Avatar, PriorityStatus, WhatsAppButton } from './Shared';

const STATUS_CYCLE = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' };

export default function Priorities({ priorities, setPriorities, currentUser, config, onWriteError }) {
  const [showForm, setShowForm] = useState(false);
  const [newPriorityText, setNewPriorityText] = useState('');
  const [expanded, setExpanded] = useState({ [currentUser]: true });
  // weekOffset: 0 = current week, -1 = last week, -2 = two weeks ago, etc.
  const [weekOffset, setWeekOffset] = useState(0);
  const [loadingWeek, setLoadingWeek] = useState(false);

  const thisMonday = getMonday(new Date());   // always the real current week
  const viewedWeek = weekOffset === 0
    ? thisMonday
    : offsetWeek(thisMonday, weekOffset);
  const viewedSunday = getSunday(viewedWeek);
  const isCurrentWeek = weekOffset === 0;

  // Priorities for the week being viewed
  const weekPriorities = priorities.filter(p => p.week === viewedWeek);

  // Group by person, sorted by sortOrder
  const grouped = TEAM_MEMBERS.reduce((acc, m) => {
    acc[m.name] = weekPriorities
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

  // Load a past week's priorities from Airtable if not already in state
  const loadWeekIfNeeded = async (targetMonday) => {
    const alreadyLoaded = priorities.some(p => p.week === targetMonday);
    if (alreadyLoaded || !config?.apiKey) return;

    setLoadingWeek(true);
    const data = await airtableFetch(config, 'WeeklyPriorities', {
      filterByFormula: `{Week} = '${targetMonday}'`,
      sort: JSON.stringify([
        { field: 'Person',    direction: 'asc' },
        { field: 'SortOrder', direction: 'asc' },
      ]),
    });
    if (data?.records?.length > 0) {
      const fetched = data.records.map(r => ({
        id:        r.id,
        person:    r.fields.Person,
        week:      r.fields.Week,
        priority:  r.fields.Priority,
        status:    r.fields.Status || 'todo',
        sortOrder: r.fields.SortOrder || 0,
      }));
      setPriorities(prev => {
        const existing = prev.filter(p => p.week !== targetMonday);
        return [...existing, ...fetched];
      });
    }
    setLoadingWeek(false);
  };

  const goToPrevWeek = async () => {
    const newOffset = weekOffset - 1;
    const targetMonday = offsetWeek(thisMonday, newOffset);
    setWeekOffset(newOffset);
    setExpanded({ [currentUser]: true });
    await loadWeekIfNeeded(targetMonday);
  };

  const goToNextWeek = () => {
    if (weekOffset >= 0) return; // don't go into future
    const newOffset = weekOffset + 1;
    setWeekOffset(newOffset);
    setExpanded({ [currentUser]: true });
  };

  const goToCurrentWeek = () => {
    setWeekOffset(0);
    setExpanded({ [currentUser]: true });
  };

  const handleStatusClick = async (record) => {
    if (!isCurrentWeek) return; // read-only for past weeks
    const next = STATUS_CYCLE[record.status];
    setPriorities(prev =>
      prev.map(p => p.id === record.id ? { ...p, status: next } : p)
    );
    if (config?.apiKey && config?.baseId) {
      const result = await airtableUpdate(config, 'WeeklyPriorities', record.id, { Status: next });
      if (!result) onWriteError?.('Status update failed to save to Airtable. Check the browser console (F12).');
    }
  };

  const handleMove = async (record, direction) => {
    if (!isCurrentWeek) return;
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

    if (config?.apiKey && config?.baseId) {
      const [r1, r2] = await Promise.all([
        airtableUpdate(config, 'WeeklyPriorities', record.id,   { SortOrder: swapOrder }),
        airtableUpdate(config, 'WeeklyPriorities', swapItem.id, { SortOrder: newOrder }),
      ]);
      if (!r1 || !r2) onWriteError?.('Reorder failed to save to Airtable. Check the browser console (F12).');
    }
  };

  const handleAdd = async () => {
    if (!newPriorityText.trim() || !isCurrentWeek) return;
    const myItems = grouped[currentUser] || [];
    const nextOrder = myItems.length > 0 ? Math.max(...myItems.map(p => p.sortOrder)) + 1 : 1;
    const tempId = `p${Date.now()}`;
    const newRecord = {
      id: tempId,
      person: currentUser,
      week: viewedWeek,
      priority: newPriorityText.trim(),
      status: 'todo',
      sortOrder: nextOrder,
    };
    setPriorities(prev => [...prev, newRecord]);
    setNewPriorityText('');
    setShowForm(false);

    if (config?.apiKey && config?.baseId) {
      const result = await airtableCreate(config, 'WeeklyPriorities', {
        Person:    currentUser,
        Week:      viewedWeek,
        Priority:  newRecord.priority,
        Status:    'todo',
        SortOrder: nextOrder,
      });
      if (result?.id) {
        setPriorities(prev => prev.map(p => p.id === tempId ? { ...p, id: result.id } : p));
      } else {
        onWriteError?.('Priority saved locally but failed to write to Airtable. Check the browser console (F12) for the error details — likely a field name mismatch.');
      }
    }
  };

  const buildWhatsAppText = () => {
    const icons = { done: '✅', 'in-progress': '🔄', todo: '⬜' };
    const weekStr = new Date(viewedWeek + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const lines = TEAM_MEMBERS.map(m => {
      const items = grouped[m.name] || [];
      if (items.length === 0) return null;
      const itemLines = items.map(p => `  ${icons[p.status]} ${p.priority}`).join('\n');
      return `*${m.name}*\n${itemLines}`;
    }).filter(Boolean).join('\n\n');
    return `🎯 *Weekly Priorities — Week of ${weekStr}*\n\n${lines || 'No priorities recorded.'}`;
  };

  const getProgress = (name) => {
    const items = grouped[name] || [];
    if (items.length === 0) return { done: 0, total: 0, pct: 0 };
    const done = items.filter(p => p.status === 'done').length;
    return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
  };

  const fmtDate = (str) =>
    new Date(str + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
            Weekly Priorities
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>
            {fmtDate(viewedWeek)} — {fmtDate(viewedSunday)}
            {isCurrentWeek && (
              <span style={{
                marginLeft: 8, fontSize: 10, background: 'rgba(16,185,129,0.15)',
                color: '#6EE7B7', padding: '1px 7px', borderRadius: 8, fontWeight: 600,
              }}>THIS WEEK</span>
            )}
            {!isCurrentWeek && (
              <span style={{
                marginLeft: 8, fontSize: 10, background: 'rgba(245,158,11,0.12)',
                color: '#FCD34D', padding: '1px 7px', borderRadius: 8, fontWeight: 600,
              }}>PAST WEEK</span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <WhatsAppButton compact label="Share" text={buildWhatsAppText()} />
          {isCurrentWeek && (
            <button onClick={() => setShowForm(v => !v)} style={{
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#A5B4FC', padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
            }}>+ Add Priority</button>
          )}
        </div>
      </div>

      {/* Week navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
        padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
      }}>
        <button onClick={goToPrevWeek} disabled={loadingWeek} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#94A3B8', padding: '5px 12px', borderRadius: 7,
          cursor: loadingWeek ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600,
        }}>← Prev</button>

        <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: '#64748B', fontFamily: "'Space Mono', monospace" }}>
          {loadingWeek ? 'Loading…' : `${fmtDate(viewedWeek)} – ${fmtDate(viewedSunday)}`}
        </div>

        <button onClick={goToNextWeek} disabled={isCurrentWeek} style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: isCurrentWeek ? '#2D3748' : '#94A3B8', padding: '5px 12px', borderRadius: 7,
          cursor: isCurrentWeek ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
        }}>Next →</button>

        {!isCurrentWeek && (
          <button onClick={goToCurrentWeek} style={{
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#A5B4FC', padding: '5px 12px', borderRadius: 7,
            cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          }}>↩ This week</button>
        )}
      </div>

      {/* Add form — only for current week */}
      {showForm && isCurrentWeek && (
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

      {/* Past-week read-only notice */}
      {!isCurrentWeek && (
        <div style={{
          marginBottom: 16, padding: '8px 14px', borderRadius: 8,
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
          fontSize: 12, color: '#FCD34D',
        }}>
          📖 Viewing a past week — read only. Click "↩ This week" to return to the current week.
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
              {/* Section header */}
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
                  {items.length === 0 && isMe && isCurrentWeek && (
                    <p style={{ color: '#475569', fontSize: 13, padding: '8px 4px', margin: 0, fontStyle: 'italic' }}>
                      No priorities yet — click "+ Add Priority" to get started.
                    </p>
                  )}
                  {items.length === 0 && !isCurrentWeek && (
                    <p style={{ color: '#334155', fontSize: 13, padding: '8px 4px', margin: 0, fontStyle: 'italic' }}>
                      Nothing recorded this week.
                    </p>
                  )}
                  {items.map((item, idx) => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      opacity: item.status === 'done' ? 0.7 : 1,
                    }}>
                      {/* Clickable status dot — only interactive on current week + own section */}
                      <button
                        onClick={() => isMe && isCurrentWeek && handleStatusClick(item)}
                        title={isMe && isCurrentWeek ? 'Click to update status' : item.status}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          cursor: isMe && isCurrentWeek ? 'pointer' : 'default', flexShrink: 0,
                        }}
                      >
                        <PriorityStatus status={item.status} />
                      </button>

                      {/* Priority text — strike through when done */}
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

                      {/* Up/Down arrows — only for currentUser on current week */}
                      {isMe && isCurrentWeek && (
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
