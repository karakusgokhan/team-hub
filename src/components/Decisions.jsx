import React, { useState } from 'react';
import { todayStr, linkifyText } from '../utils/helpers';
import { airtableCreate, airtableUpdate, airtableDelete } from '../utils/airtable';
import { Avatar, CategoryBadge, PillBadge, WhatsAppButton } from './Shared';

const CATEGORY_COLORS = {
  product:    '#6366F1',
  marketing:  '#EC4899',
  operations: '#F59E0B',
  finance:    '#10B981',
  hr:         '#8B5CF6',
};

const STATUS_STYLES = {
  active:   { bg: 'rgba(16,185,129,0.15)',  color: '#6EE7B7',  label: 'Active' },
  revised:  { bg: 'rgba(245,158,11,0.15)',   color: '#FCD34D',  label: 'Revised' },
  reversed: { bg: 'rgba(239,68,68,0.15)',    color: '#FCA5A5',  label: 'Reversed' },
};

const STATUS_NEXT = { active: 'revised', revised: 'reversed', reversed: 'active' };
const STATUS_BTN_LABEL = { active: 'Mark Revised', revised: 'Mark Reversed', reversed: 'Restore' };

const CATEGORIES = ['all', 'product', 'marketing', 'operations', 'finance', 'hr'];

export default function Decisions({ decisions, setDecisions, currentUser, config, onWriteError }) {
  const [showForm,        setShowForm]        = useState(false);
  const [editingDecision, setEditingDecision] = useState(null);
  const [confirmDelete,   setConfirmDelete]   = useState(null);
  const [expandedIds,     setExpandedIds]     = useState(new Set());
  const [filterCategory,  setFilterCategory]  = useState('all');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [formTitle,       setFormTitle]       = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory,    setFormCategory]    = useState('product');
  const [formStatus,      setFormStatus]      = useState('active');

  const clearForm = () => {
    setFormTitle(''); setFormDescription(''); setFormCategory('product'); setFormStatus('active');
  };

  const closeForm = () => {
    setShowForm(false); setEditingDecision(null); setConfirmDelete(null); clearForm();
  };

  const openNewForm = () => {
    setEditingDecision(null); setConfirmDelete(null); clearForm(); setShowForm(v => !v);
  };

  const openEditDecision = (d) => {
    setEditingDecision(d);
    setFormTitle(d.title);
    setFormDescription(d.description || '');
    setFormCategory(d.category);
    setFormStatus(d.status);
    setConfirmDelete(null);
    setShowForm(true);
  };

  const handleStatusChange = async (decision, e) => {
    e.stopPropagation();
    const next = STATUS_NEXT[decision.status];
    setDecisions(prev =>
      prev.map(d => d.id === decision.id ? { ...d, status: next } : d)
    );
    if (config?.apiKey && config?.baseId) {
      await airtableUpdate(config, 'Decisions', decision.id, { Status: next }, onWriteError);
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) return;

    if (editingDecision) {
      // UPDATE
      const updated = {
        ...editingDecision,
        title:       formTitle.trim(),
        description: formDescription.trim(),
        category:    formCategory,
        status:      formStatus,
      };
      setDecisions(prev => prev.map(d => d.id === editingDecision.id ? updated : d));
      closeForm();
      if (config?.apiKey && config?.baseId) {
        await airtableUpdate(config, 'Decisions', editingDecision.id, {
          Title:       updated.title,
          Category:    updated.category,
          Status:      updated.status,
          Description: updated.description,
        }, onWriteError);
      }
    } else {
      // CREATE
      const tempId = `d${Date.now()}`;
      const newDecision = {
        id: tempId,
        title:       formTitle.trim(),
        description: formDescription.trim(),
        decidedBy:   currentUser,
        date:        todayStr(),
        category:    formCategory,
        status:      'active',
      };
      setDecisions(prev => [newDecision, ...prev]);
      closeForm();
      if (config?.apiKey && config?.baseId) {
        const result = await airtableCreate(config, 'Decisions', {
          Title:     newDecision.title,
          DecidedBy: newDecision.decidedBy,
          Date:      newDecision.date,
          Category:  newDecision.category,
          Status:    'active',
          ...(newDecision.description ? { Description: newDecision.description } : {}),
        }, onWriteError);
        if (result?.id) {
          setDecisions(prev => prev.map(d => d.id === tempId ? { ...d, id: result.id } : d));
        }
      }
    }
  };

  const handleDelete = async (id) => {
    setDecisions(prev => prev.filter(d => d.id !== id));
    closeForm();
    if (config?.apiKey && config?.baseId) {
      await airtableDelete(config, 'Decisions', id);
    }
  };

  // Filter + search pipeline
  const visible = decisions
    .filter(d => filterCategory === 'all' || d.category === filterCategory)
    .filter(d => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return d.title.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const buildWhatsAppText = () => {
    const lines = visible.map(d => {
      const icon = d.status === 'active' ? '✅' : d.status === 'revised' ? '🔄' : '❌';
      return `${icon} [${d.category}] *${d.title}*\n   By ${d.decidedBy} | ${new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }).join('\n\n');
    return `📋 *Decision Log*\n\n${lines}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
            Decision Log
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>
            {visible.length} decision{visible.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <WhatsAppButton compact label="Share" text={buildWhatsAppText()} />
          <button onClick={openNewForm} style={{
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#A5B4FC', padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}>+ New Decision</button>
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div style={{
          background: 'rgba(99,102,241,0.06)', borderRadius: 16, padding: 24,
          marginBottom: 20, border: '1px solid rgba(99,102,241,0.15)', animation: 'slideIn 0.3s ease',
        }}>
          <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 15, color: '#E2E8F0' }}>
            {editingDecision ? 'Edit Decision' : 'Record a new decision'}
          </p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Title *</label>
            <input
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              placeholder="What was decided?"
              autoFocus
              style={{
                width: '100%', padding: '10px 14px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, color: '#E2E8F0', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
            <textarea
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="Context, rationale, or notes..."
              rows={5}
              style={{
                width: '100%', padding: '10px 14px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, color: '#E2E8F0', fontSize: 14, outline: 'none', resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: editingDecision ? 16 : 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Category</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['product', 'marketing', 'operations', 'finance', 'hr'].map(cat => {
                const color = CATEGORY_COLORS[cat];
                const isSelected = formCategory === cat;
                return (
                  <button key={cat} onClick={() => setFormCategory(cat)} style={{
                    padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: isSelected ? `${color}22` : 'rgba(255,255,255,0.04)',
                    border: isSelected ? `2px solid ${color}88` : '2px solid rgba(255,255,255,0.08)',
                    color: isSelected ? color : '#64748B',
                    textTransform: 'capitalize', transition: 'all 0.2s',
                  }}>{cat}</button>
                );
              })}
            </div>
          </div>

          {/* Status — only shown when editing */}
          {editingDecision && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['active', 'revised', 'reversed'].map(s => {
                  const ss = STATUS_STYLES[s];
                  const isSelected = formStatus === s;
                  return (
                    <button key={s} onClick={() => setFormStatus(s)} style={{
                      padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: isSelected ? ss.bg : 'rgba(255,255,255,0.04)',
                      border: isSelected ? `2px solid ${ss.color}88` : '2px solid rgba(255,255,255,0.08)',
                      color: isSelected ? ss.color : '#64748B',
                      textTransform: 'capitalize', transition: 'all 0.2s',
                    }}>{ss.label}</button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={handleSave} disabled={!formTitle.trim()} style={{
              padding: '10px 24px',
              background: formTitle.trim() ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'rgba(255,255,255,0.06)',
              border: 'none', color: formTitle.trim() ? '#fff' : '#475569',
              borderRadius: 8, fontWeight: 600, cursor: formTitle.trim() ? 'pointer' : 'not-allowed', fontSize: 14,
            }}>{editingDecision ? 'Save Changes' : 'Save Decision'}</button>
            <button onClick={closeForm} style={{
              padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94A3B8', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            }}>Cancel</button>

            {/* Delete — only in edit mode */}
            {editingDecision && (
              confirmDelete === editingDecision.id ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                  <button onClick={() => handleDelete(editingDecision.id)} style={{
                    padding: '10px 16px', background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5',
                    borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  }}>Confirm Delete</button>
                  <button onClick={() => setConfirmDelete(null)} style={{
                    padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94A3B8', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                  }}>Keep</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(editingDecision.id)} style={{
                  padding: '10px 16px', background: 'transparent',
                  border: '1px solid rgba(239,68,68,0.2)', color: '#F87171',
                  borderRadius: 8, cursor: 'pointer', fontSize: 14, marginLeft: 'auto',
                }}>Delete</button>
              )
            )}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {CATEGORIES.map(cat => {
            const isActive = filterCategory === cat;
            const color = cat === 'all' ? '#6366F1' : CATEGORY_COLORS[cat];
            return (
              <button key={cat} onClick={() => setFilterCategory(cat)} style={{
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: isActive ? `${color}22` : 'rgba(255,255,255,0.04)',
                border: isActive ? `1px solid ${color}55` : '1px solid rgba(255,255,255,0.08)',
                color: isActive ? color : '#64748B',
                textTransform: 'capitalize', transition: 'all 0.2s',
              }}>{cat === 'all' ? 'All Categories' : cat}</button>
            );
          })}
        </div>

        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="🔍  Search decisions..."
          style={{
            width: '100%', padding: '9px 14px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, color: '#E2E8F0', fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {/* Decision list */}
      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#475569', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 600, color: '#475569', marginBottom: 6 }}>
            {searchQuery ? 'No decisions match your search.' : 'No decisions yet'}
          </div>
          <div style={{ fontSize: 13 }}>
            {searchQuery ? 'Try a different keyword or clear the search.' : 'Add your first one using the button above.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map(d => {
            const ss = STATUS_STYLES[d.status] || STATUS_STYLES.active;
            const isOwner = d.decidedBy === currentUser;
            return (
              <div
                key={d.id}
                onClick={() => isOwner && openEditDecision(d)}
                style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.06)',
                  padding: '16px 18px', transition: 'all 0.2s',
                  cursor: isOwner ? 'pointer' : 'default',
                  ...(isOwner ? { ':hover': { background: 'rgba(255,255,255,0.05)' } } : {}),
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <CategoryBadge category={d.category} colorMap={CATEGORY_COLORS} />
                  <PillBadge label={ss.label} bg={ss.bg} color={ss.color} />
                  <div style={{ flex: 1 }} />
                  {isOwner && (
                    <span style={{ fontSize: 11, color: '#475569', fontFamily: "'Space Mono', monospace" }}>✏ edit</span>
                  )}
                  <button
                    onClick={(e) => handleStatusChange(d, e)}
                    style={{
                      padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#94A3B8', transition: 'all 0.2s',
                    }}
                  >{STATUS_BTN_LABEL[d.status]}</button>
                </div>

                {/* Title */}
                <div dangerouslySetInnerHTML={{ __html: linkifyText(d.title) }} style={{ fontWeight: 700, fontSize: 15, color: '#E2E8F0', marginBottom: 6 }} />

                {/* Description */}
                {d.description && (() => {
                  const isLong = d.description.length > 180 || d.description.split('\n').length > 3;
                  const isExpanded = expandedIds.has(d.id);
                  return (
                    <div style={{ marginBottom: 12 }}>
                      <p
                        dangerouslySetInnerHTML={{ __html: linkifyText(d.description) }}
                        style={{
                          margin: 0, fontSize: 13, color: '#94A3B8', lineHeight: 1.6,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          ...(isLong && !isExpanded ? {
                            display: '-webkit-box', WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          } : {}),
                        }}
                      />
                      {isLong && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setExpandedIds(prev => {
                              const next = new Set(prev);
                              isExpanded ? next.delete(d.id) : next.add(d.id);
                              return next;
                            });
                          }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#6366F1', fontSize: 12, fontWeight: 600,
                            padding: '4px 0 0', marginTop: 2,
                          }}
                        >
                          {isExpanded ? 'Show less ▲' : 'Show more ▼'}
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={d.decidedBy} size={20} />
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    {d.decidedBy} · {formatDate(d.date)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
