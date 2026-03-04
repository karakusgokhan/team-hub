import React, { useState } from 'react';
import { TEAM_MEMBERS } from '../utils/config';
import { todayStr, linkifyText, shareToWhatsApp, APP_URL } from '../utils/helpers';
import { airtableCreate, airtableUpdate, airtableDelete } from '../utils/airtable';
import { Avatar, PillBadge, WhatsAppButton, WhatsAppIcon } from './Shared';

const PRIORITY_STYLES = {
  low:    { bg: 'rgba(100,116,139,0.2)', color: '#94A3B8', label: 'Low' },
  medium: { bg: 'rgba(59,130,246,0.2)',  color: '#93C5FD', label: 'Medium' },
  high:   { bg: 'rgba(245,158,11,0.2)',  color: '#FCD34D', label: 'High' },
  urgent: { bg: 'rgba(239,68,68,0.2)',   color: '#FCA5A5', label: 'Urgent' },
};

const STATUS_STYLES = {
  todo:          { bg: 'rgba(100,116,139,0.2)', color: '#94A3B8', label: 'To Do' },
  'in-progress': { bg: 'rgba(99,102,241,0.2)',  color: '#A5B4FC', label: 'In Progress' },
  done:          { bg: 'rgba(16,185,129,0.2)',   color: '#6EE7B7', label: 'Done' },
  blocked:       { bg: 'rgba(239,68,68,0.2)',    color: '#FCA5A5', label: 'Blocked' },
};

const STATUS_CYCLE = { todo: 'in-progress', 'in-progress': 'done', done: 'blocked', blocked: 'todo' };
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
const KANBAN_COLS = ['todo', 'in-progress', 'done', 'blocked'];

const isOverdue = (task) =>
  task.dueDate && task.dueDate < todayStr() && task.status !== 'done';

export default function Tasks({ tasks, setTasks, currentUser, config, onWriteError }) {
  const [viewMode,        setViewMode]        = useState('list');
  const [showMyTasks,     setShowMyTasks]     = useState(true);
  const [filterStatus,    setFilterStatus]    = useState('all');
  const [filterPriority,  setFilterPriority]  = useState('all');
  const [filterPerson,    setFilterPerson]    = useState('all');
  const [showForm,        setShowForm]        = useState(false);
  const [editingTask,     setEditingTask]     = useState(null);
  const [confirmDelete,   setConfirmDelete]   = useState(null);
  const [formTitle,       setFormTitle]       = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAssignedTo,  setFormAssignedTo]  = useState(currentUser);
  const [formDueDate,     setFormDueDate]     = useState('');
  const [formPriority,    setFormPriority]    = useState('medium');
  const [formStatus,      setFormStatus]      = useState('todo');

  const clearForm = () => {
    setFormTitle(''); setFormDescription(''); setFormAssignedTo(currentUser);
    setFormDueDate(''); setFormPriority('medium'); setFormStatus('todo');
  };

  const closeForm = () => {
    setShowForm(false); setEditingTask(null); setConfirmDelete(null); clearForm();
  };

  const openNewForm = () => {
    setEditingTask(null); setConfirmDelete(null); clearForm(); setShowForm(v => !v);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormAssignedTo(task.assignedTo);
    setFormDueDate(task.dueDate || '');
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setConfirmDelete(null);
    setShowForm(true);
    // Scroll form into view
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handleStatusChange = async (task, e) => {
    e.stopPropagation();
    const next = STATUS_CYCLE[task.status];
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    if (config?.apiKey && config?.baseId) {
      await airtableUpdate(config, 'Tasks', task.id, { Status: next }, onWriteError);
    }
  };

  const handleSaveTask = async () => {
    if (!formTitle.trim()) return;

    if (editingTask) {
      // UPDATE
      const updated = {
        ...editingTask,
        title:       formTitle.trim(),
        description: formDescription.trim(),
        assignedTo:  formAssignedTo,
        dueDate:     formDueDate,
        priority:    formPriority,
        status:      formStatus,
      };
      setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t));
      closeForm();
      if (config?.apiKey && config?.baseId) {
        await airtableUpdate(config, 'Tasks', editingTask.id, {
          Title:      updated.title,
          AssignedTo: updated.assignedTo,
          Priority:   updated.priority,
          Status:     updated.status,
          Description: updated.description,
          ...(updated.dueDate ? { DueDate: updated.dueDate } : { DueDate: null }),
        }, onWriteError);
      }
    } else {
      // CREATE
      const tempId = `t${Date.now()}`;
      const newTask = {
        id: tempId,
        title:       formTitle.trim(),
        description: formDescription.trim(),
        assignedTo:  formAssignedTo,
        createdBy:   currentUser,
        dueDate:     formDueDate,
        priority:    formPriority,
        status:      'todo',
        createdAt:   new Date().toISOString(),
      };
      setTasks(prev => [newTask, ...prev]);
      closeForm();
      if (config?.apiKey && config?.baseId) {
        const result = await airtableCreate(config, 'Tasks', {
          Title:      newTask.title,
          AssignedTo: newTask.assignedTo,
          CreatedBy:  newTask.createdBy,
          Priority:   newTask.priority,
          Status:     'todo',
          ...(newTask.description ? { Description: newTask.description } : {}),
          ...(newTask.dueDate     ? { DueDate:     newTask.dueDate }     : {}),
        }, onWriteError);
        if (result?.id) {
          setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: result.id } : t));
        }
      }
    }
  };

  const handleDeleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    closeForm();
    if (config?.apiKey && config?.baseId) {
      await airtableDelete(config, 'Tasks', id);
    }
  };

  const filteredTasks = tasks
    .filter(t => !showMyTasks || t.assignedTo === currentUser)
    .filter(t => filterStatus   === 'all' || t.status   === filterStatus)
    .filter(t => filterPriority === 'all' || t.priority === filterPriority)
    .filter(t => filterPerson   === 'all' || t.assignedTo === filterPerson)
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3));

  const myCount = tasks.filter(t => t.assignedTo === currentUser && t.status !== 'done').length;

  const formatDue = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const taskStatusIcon = (status) =>
    status === 'done' ? '✅' : status === 'in-progress' ? '🔄' : status === 'blocked' ? '🚫' : '⬜';

  const buildTaskShareText = (t) => {
    const ps = PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.medium;
    const ss = STATUS_STYLES[t.status] || STATUS_STYLES.todo;
    const lines = [
      `${taskStatusIcon(t.status)} *Task: ${t.title || 'Untitled'}*`,
      t.description ? t.description : null,
      `Assigned to: ${t.assignedTo || 'Unassigned'} · Priority: ${ps.label}`,
      `Status: ${ss.label}${t.dueDate ? ` · Due ${formatDue(t.dueDate)}` : ''}`,
      `\n🔗 ${APP_URL}/#tasks`,
    ].filter(Boolean);
    return lines.join('\n');
  };

  const buildWhatsAppText = () => {
    const lines = filteredTasks.map(t => {
      const due = t.dueDate ? ` | Due ${formatDue(t.dueDate)}` : '';
      return `${taskStatusIcon(t.status)} *${t.title || 'Untitled'}*\n   > ${t.assignedTo || 'Unassigned'}${due}`;
    }).join('\n\n');
    return `📋 *Task Tracker*\n\n${lines || 'No tasks found.'}\n\n🔗 ${APP_URL}/#tasks`;
  };

  const segBtn = (active) => ({
    padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
    background: active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
    border: active ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
    color: active ? '#A5B4FC' : '#64748B', transition: 'all 0.2s',
  });

  const TaskCard = ({ task, compact = false }) => {
    const ps = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
    const ss = STATUS_STYLES[task.status] || STATUS_STYLES.todo;
    const overdue = isOverdue(task);
    const isEditing = editingTask?.id === task.id;
    return (
      <div
        onClick={() => openEditTask(task)}
        style={{
          background: isEditing
            ? 'rgba(99,102,241,0.08)'
            : overdue ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.03)',
          border: isEditing
            ? '1px solid rgba(99,102,241,0.3)'
            : overdue ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: compact ? '12px 14px' : '14px 16px',
          transition: 'all 0.2s', cursor: 'pointer',
        }}
      >
        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <PillBadge label={ps.label} bg={ps.bg} color={ps.color} />
          <PillBadge label={ss.label} bg={ss.bg} color={ss.color} />
          {overdue && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#FCA5A5',
              background: 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: 8,
              letterSpacing: '0.06em',
            }}>OVERDUE</span>
          )}
        </div>

        {/* Title */}
        <div dangerouslySetInnerHTML={{ __html: linkifyText(task.title) }} style={{ fontWeight: 700, fontSize: compact ? 13 : 14, color: '#E2E8F0', marginBottom: compact ? 6 : 8 }} />

        {/* Description — list only */}
        {!compact && task.description && (
          <p dangerouslySetInnerHTML={{ __html: linkifyText(task.description) }} style={{
            margin: '0 0 10px', fontSize: 12, color: '#94A3B8', lineHeight: 1.5,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }} />
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Avatar name={task.assignedTo} size={20} />
          <span style={{ fontSize: 12, color: '#64748B', flex: 1 }}>
            {task.assignedTo}
            {task.dueDate && (
              <span style={{ color: overdue ? '#FCA5A5' : '#64748B' }}> · Due {formatDue(task.dueDate)}</span>
            )}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); shareToWhatsApp(buildTaskShareText(task)); }}
            title="Share to WhatsApp"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 4px', opacity: 0.35, transition: 'opacity 0.2s', flexShrink: 0 }}
            onMouseOver={e => e.currentTarget.style.opacity = 1}
            onMouseOut={e => e.currentTarget.style.opacity = 0.35}
          >
            <WhatsAppIcon size={13} color="#25D366" />
          </button>
          <button
            onClick={(e) => handleStatusChange(task, e)}
            style={{
              padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94A3B8', transition: 'all 0.2s', flexShrink: 0,
            }}
          >→ {STATUS_STYLES[STATUS_CYCLE[task.status]]?.label}</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
            Tasks
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>
            {myCount > 0 ? `${myCount} open task${myCount !== 1 ? 's' : ''} assigned to you` : 'All caught up!'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <WhatsAppButton compact label="Share" text={buildWhatsAppText()} />
          <button onClick={openNewForm} style={{
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#A5B4FC', padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}>+ New Task</button>
        </div>
      </div>

      {/* Controls bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
          <button style={segBtn(showMyTasks)} onClick={() => setShowMyTasks(true)}>My Tasks</button>
          <button style={segBtn(!showMyTasks)} onClick={() => setShowMyTasks(false)}>All Tasks</button>
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
          <button style={segBtn(viewMode === 'list')} onClick={() => setViewMode('list')}>≡ List</button>
          <button style={segBtn(viewMode === 'kanban')} onClick={() => setViewMode('kanban')}>⊞ Kanban</button>
        </div>
      </div>

      {/* Filters — only in All Tasks mode */}
      {!showMyTasks && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 56 }}>Status</span>
            {['all', 'todo', 'in-progress', 'done', 'blocked'].map(s => {
              const ss = s === 'all' ? null : STATUS_STYLES[s];
              return (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: '4px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  background: filterStatus === s ? (ss ? ss.bg : 'rgba(99,102,241,0.2)') : 'rgba(255,255,255,0.04)',
                  border: filterStatus === s ? `1px solid ${ss ? ss.color + '66' : 'rgba(99,102,241,0.4)'}` : '1px solid rgba(255,255,255,0.08)',
                  color: filterStatus === s ? (ss ? ss.color : '#A5B4FC') : '#64748B',
                  textTransform: 'capitalize', transition: 'all 0.2s',
                }}>{s === 'all' ? 'All' : ss?.label}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 56 }}>Priority</span>
            {['all', 'urgent', 'high', 'medium', 'low'].map(p => {
              const ps = p === 'all' ? null : PRIORITY_STYLES[p];
              return (
                <button key={p} onClick={() => setFilterPriority(p)} style={{
                  padding: '4px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  background: filterPriority === p ? (ps ? ps.bg : 'rgba(99,102,241,0.2)') : 'rgba(255,255,255,0.04)',
                  border: filterPriority === p ? `1px solid ${ps ? ps.color + '66' : 'rgba(99,102,241,0.4)'}` : '1px solid rgba(255,255,255,0.08)',
                  color: filterPriority === p ? (ps ? ps.color : '#A5B4FC') : '#64748B',
                  textTransform: 'capitalize', transition: 'all 0.2s',
                }}>{p === 'all' ? 'All' : ps?.label}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 56 }}>Person</span>
            {['all', ...TEAM_MEMBERS.map(m => m.name)].map(name => (
              <button key={name} onClick={() => setFilterPerson(name)} style={{
                padding: '4px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: filterPerson === name ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: filterPerson === name ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color: filterPerson === name ? '#A5B4FC' : '#64748B',
                transition: 'all 0.2s',
              }}>{name === 'all' ? 'Everyone' : name}</button>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit task form */}
      {showForm && (
        <div style={{
          background: 'rgba(99,102,241,0.06)', borderRadius: 16, padding: 24,
          marginBottom: 20, border: '1px solid rgba(99,102,241,0.15)', animation: 'slideIn 0.3s ease',
        }}>
          <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 15, color: '#E2E8F0' }}>
            {editingTask ? 'Edit Task' : 'Create a new task'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Title *</label>
              <input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Optional details..."
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Assign To</label>
              <select
                value={formAssignedTo}
                onChange={e => setFormAssignedTo(e.target.value)}
                style={inputStyle}
              >
                {TEAM_MEMBERS.map(m => (
                  <option key={m.name} value={m.name} style={{ background: '#1E2030' }}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                type="date"
                value={formDueDate}
                onChange={e => setFormDueDate(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Priority</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['low', 'medium', 'high', 'urgent'].map(p => {
                const ps = PRIORITY_STYLES[p];
                const isSelected = formPriority === p;
                return (
                  <button key={p} onClick={() => setFormPriority(p)} style={{
                    padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: isSelected ? ps.bg : 'rgba(255,255,255,0.04)',
                    border: isSelected ? `2px solid ${ps.color}88` : '2px solid rgba(255,255,255,0.08)',
                    color: isSelected ? ps.color : '#64748B',
                    textTransform: 'capitalize', transition: 'all 0.2s',
                  }}>{p}</button>
                );
              })}
            </div>
          </div>

          {/* Status — only in edit mode */}
          {editingTask && (
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Status</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['todo', 'in-progress', 'done', 'blocked'].map(s => {
                  const ss = STATUS_STYLES[s];
                  const isSelected = formStatus === s;
                  return (
                    <button key={s} onClick={() => setFormStatus(s)} style={{
                      padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: isSelected ? ss.bg : 'rgba(255,255,255,0.04)',
                      border: isSelected ? `2px solid ${ss.color}88` : '2px solid rgba(255,255,255,0.08)',
                      color: isSelected ? ss.color : '#64748B',
                      transition: 'all 0.2s',
                    }}>{ss.label}</button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={handleSaveTask} disabled={!formTitle.trim()} style={{
              padding: '10px 24px',
              background: formTitle.trim() ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'rgba(255,255,255,0.06)',
              border: 'none', color: formTitle.trim() ? '#fff' : '#475569',
              borderRadius: 8, fontWeight: 600, cursor: formTitle.trim() ? 'pointer' : 'not-allowed', fontSize: 14,
            }}>{editingTask ? 'Save Changes' : 'Create Task'}</button>
            <button onClick={closeForm} style={{
              padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94A3B8', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            }}>Cancel</button>

            {/* Delete — only in edit mode */}
            {editingTask && (
              confirmDelete === editingTask.id ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                  <button onClick={() => handleDeleteTask(editingTask.id)} style={{
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
                <button onClick={() => setConfirmDelete(editingTask.id)} style={{
                  padding: '10px 16px', background: 'transparent',
                  border: '1px solid rgba(239,68,68,0.2)', color: '#F87171',
                  borderRadius: 8, cursor: 'pointer', fontSize: 14, marginLeft: 'auto',
                }}>Delete</button>
              )
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#475569' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <p style={{ margin: 0, fontSize: 14 }}>
            {showMyTasks ? "No tasks assigned to you." : "No tasks found."}
          </p>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && filteredTasks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredTasks.map(task => <TaskCard key={task.id} task={task} />)}
        </div>
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && filteredTasks.length > 0 && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {KANBAN_COLS.map(col => {
            const ss = STATUS_STYLES[col];
            const colTasks = filteredTasks
              .filter(t => t.status === col)
              .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3));
            return (
              <div key={col} style={{ flex: '1 1 220px', minWidth: 220 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                  padding: '10px 14px', borderRadius: 10,
                  background: ss.bg, border: `1px solid ${ss.color}33`,
                }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: ss.color }}>{ss.label}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: ss.color,
                    background: `${ss.color}22`, padding: '1px 8px', borderRadius: 10,
                  }}>{colTasks.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {colTasks.length === 0 ? (
                    <div style={{
                      padding: '20px 14px', borderRadius: 10, textAlign: 'center',
                      border: '1px dashed rgba(255,255,255,0.08)', color: '#334155', fontSize: 12,
                    }}>Empty</div>
                  ) : (
                    colTasks.map(task => <TaskCard key={task.id} task={task} compact />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, color: '#E2E8F0', fontSize: 14, outline: 'none',
};

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: '#94A3B8',
  display: 'block', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.06em',
};
