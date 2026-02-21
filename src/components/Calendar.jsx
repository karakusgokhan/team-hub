import React, { useState } from 'react';
import { dayNames, monthNames, todayStr, getMonday, getWeekDays } from '../utils/helpers';
import { airtableCreate, airtableUpdate, airtableDelete } from '../utils/airtable';
import { WhatsAppButton } from './Shared';
import { TEAM_MEMBERS } from '../utils/config';

const EVENT_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#10B981',
  '#F59E0B', '#D4634B', '#3B82F6', '#14B8A6',
];

// Convert a Date object to YYYY-MM-DD string in local time
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Get day-of-week index 1-5 (Mon=1…Fri=5) from a date string, or null if weekend
function dayIndexFromDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return null;
  return dow;
}

// Does an event appear in a given day column (by date string)?
// Multi-day events span start..end inclusive; all-day spans correctly
function eventAppearsOnDay(ev, dayDateStr) {
  const start = ev.date;
  const end   = ev.endDate || ev.date;
  return dayDateStr >= start && dayDateStr <= end;
}

// Is this the first weekday column the event appears in?
function isFirstVisibleDay(ev, dayDateStr, weekDayStrs) {
  // find earliest day in this week that the event covers
  const first = weekDayStrs.find(d => eventAppearsOnDay(ev, d));
  return first === dayDateStr;
}

// Is this the last weekday column the event appears in?
function isLastVisibleDay(ev, dayDateStr, weekDayStrs) {
  const end = ev.endDate || ev.date;
  // last is whichever comes first: event end date or last weekday
  const last = [...weekDayStrs].reverse().find(d => eventAppearsOnDay(ev, d));
  return last === dayDateStr;
}

export default function Calendar({ events, setEvents, currentUser, config }) {
  const now = new Date();
  const weekDays = getWeekDays();
  const weekDayStrs = weekDays.map(d => toDateStr(d)); // ['2026-02-23', …]

  const [showForm,      setShowForm]      = useState(false);
  const [editingEvent,  setEditingEvent]  = useState(null);
  const [formTitle,     setFormTitle]     = useState('');
  const [formDate,      setFormDate]      = useState(toDateStr(now));
  const [formEndDate,   setFormEndDate]   = useState('');       // '' = same as start
  const [formAllDay,    setFormAllDay]    = useState(false);
  const [formTime,      setFormTime]      = useState('10:00');
  const [formDuration,  setFormDuration]  = useState('60');
  const [formAttendees, setFormAttendees] = useState('');
  const [formColor,     setFormColor]     = useState(EVENT_COLORS[0]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const resetForm = () => {
    setFormTitle(''); setFormDate(toDateStr(now)); setFormEndDate('');
    setFormAllDay(false); setFormTime('10:00'); setFormDuration('60');
    setFormAttendees(currentUser); setFormColor(EVENT_COLORS[0]);
  };

  const openAddForm = (dateStr) => {
    setEditingEvent(null);
    resetForm();
    setFormDate(dateStr || toDateStr(now));
    setShowForm(true);
  };

  const openEditForm = (ev) => {
    setEditingEvent(ev);
    setFormTitle(ev.title);
    setFormDate(ev.date);
    setFormEndDate(ev.endDate && ev.endDate !== ev.date ? ev.endDate : '');
    setFormAllDay(ev.allDay || false);
    setFormTime(ev.time || '10:00');
    setFormDuration(String(ev.duration || 60));
    setFormAttendees(ev.attendees || '');
    setFormColor(ev.color || EVENT_COLORS[0]);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingEvent(null); };

  const handleSave = async () => {
    if (!formTitle.trim() || !formDate) return;
    // Need at least one weekday covered
    const dayIdx = dayIndexFromDate(formDate);
    const endDate = formEndDate && formEndDate >= formDate ? formEndDate : formDate;
    // For multi-day, start can be a weekday OR the span must cover at least one weekday
    const coversWeekday = weekDayStrs.some(d => d >= formDate && d <= endDate);
    if (!dayIdx && !coversWeekday) return;

    const eventData = {
      title:     formTitle.trim(),
      date:      formDate,
      endDate:   endDate,
      day:       dayIdx, // may be null for weekend-start multi-day
      allDay:    formAllDay,
      time:      formAllDay ? '' : formTime,
      duration:  formAllDay ? 0 : (parseInt(formDuration, 10) || 60),
      attendees: formAttendees.trim(),
      color:     formColor,
    };

    const airtableFields = {
      Title:     eventData.title,
      Date:      eventData.date,
      EndDate:   eventData.endDate !== eventData.date ? eventData.endDate : '',
      AllDay:    eventData.allDay,
      StartTime: eventData.time,
      Duration:  eventData.duration,
      Attendees: eventData.attendees,
      Color:     eventData.color,
    };

    if (editingEvent) {
      const updated = { ...editingEvent, ...eventData };
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e));
      closeForm();
      if (config?.apiKey) {
        await airtableUpdate(config, 'Events', editingEvent.id, airtableFields);
      }
    } else {
      const tempId = `ev${Date.now()}`;
      const newEvent = { id: tempId, ...eventData };
      setEvents(prev => [...prev, newEvent]);
      closeForm();
      if (config?.apiKey) {
        const result = await airtableCreate(config, 'Events', {
          ...airtableFields,
          CreatedBy: currentUser,
        });
        if (result?.id) {
          setEvents(prev => prev.map(e => e.id === tempId ? { ...e, id: result.id } : e));
        }
      }
    }
  };

  const handleDelete = async (eventId) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    setConfirmDelete(null);
    if (config?.apiKey) {
      await airtableDelete(config, 'Events', eventId);
    }
  };

  const buildWhatsAppText = () => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const lines = dayLabels.map((label, i) => {
      const dayStr = weekDayStrs[i];
      const dayEvents = events.filter(e => eventAppearsOnDay(e, dayStr));
      if (dayEvents.length === 0) return `*${label}:* No events`;
      const evts = dayEvents.map(e =>
        e.allDay
          ? `  📅 (All day) ${e.title}${e.attendees ? ' (' + e.attendees + ')' : ''}`
          : `  📅 ${e.time} — ${e.title}${e.attendees ? ' (' + e.attendees + ')' : ''}`
      ).join('\n');
      return `*${label}:*\n${evts}`;
    }).join('\n\n');
    const weekStr = new Date(getMonday(now)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `📅 *Team Schedule — Week of ${weekStr}*\n\n${lines}`;
  };

  // Events for a given day column, split into all-day and timed
  const getEventsForDay = (dayDateStr) => {
    const all = events.filter(e => eventAppearsOnDay(e, dayDateStr));
    const allDay = all.filter(e => e.allDay);
    const timed  = all.filter(e => !e.allDay).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return { allDay, timed };
  };

  // Render a single event card, aware of whether it spans multiple days
  const renderEventCard = (ev, dayDateStr) => {
    const isFirst = isFirstVisibleDay(ev, dayDateStr, weekDayStrs);
    const isLast  = isLastVisibleDay(ev, dayDateStr, weekDayStrs);
    const isMultiDay = ev.endDate && ev.endDate !== ev.date;

    // Continuation bar style for multi-day events
    const multiDayStyle = isMultiDay ? {
      borderRadius: `${isFirst ? '6px' : '0'} ${isLast ? '6px' : '0'} ${isLast ? '6px' : '0'} ${isFirst ? '6px' : '0'}`,
      marginLeft:  isFirst ? 0 : -8,
      marginRight: isLast  ? 0 : -8,
      paddingLeft: isFirst ? 10 : 6,
      paddingRight: isLast ? 10 : 6,
    } : {};

    return (
      <div
        key={`${ev.id}-${dayDateStr}`}
        style={{
          padding: '7px 10px', fontSize: 12,
          background: `${ev.color}18`,
          borderLeft: isFirst ? `3px solid ${ev.color}` : `1px solid ${ev.color}44`,
          borderRight: isLast ? 'none' : `1px solid ${ev.color}44`,
          borderTop: `1px solid ${ev.color}33`,
          borderBottom: `1px solid ${ev.color}33`,
          cursor: 'pointer', position: 'relative',
          ...multiDayStyle,
        }}
        onClick={() => openEditForm(ev)}
      >
        {/* Only show title/details on the first day of a multi-day event */}
        {(isFirst || !isMultiDay) && (
          <>
            <div style={{ fontWeight: 600, color: '#E2E8F0', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isMultiDay && !isFirst ? '' : ev.title}
            </div>
            {ev.allDay ? (
              <div style={{ color: '#94A3B8', fontSize: 10 }}>All day{isMultiDay ? ' →' : ''}</div>
            ) : (
              <div style={{ color: '#64748B', fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
                {ev.time} · {ev.duration}min
              </div>
            )}
            {ev.attendees && (
              <div style={{ color: '#64748B', fontSize: 10, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.attendees}</div>
            )}
          </>
        )}
        {/* Continuation indicator on non-first days */}
        {isMultiDay && !isFirst && (
          <div style={{ fontWeight: 600, color: `${ev.color}99`, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ev.title}
          </div>
        )}

        {/* Delete — only show on first visible day */}
        {isFirst && (
          confirmDelete === ev.id ? (
            <div style={{ marginTop: 5, display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => handleDelete(ev.id)} style={{
                padding: '2px 8px', fontSize: 10, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5',
              }}>Delete</button>
              <button onClick={() => setConfirmDelete(null)} style={{
                padding: '2px 8px', fontSize: 10, borderRadius: 6, cursor: 'pointer',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748B',
              }}>Cancel</button>
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(ev.id); }}
              style={{
                position: 'absolute', top: 5, right: 5,
                background: 'transparent', border: 'none', color: '#475569',
                cursor: 'pointer', fontSize: 11, padding: '0 2px', lineHeight: 1, opacity: 0.6,
              }}
            >✕</button>
          )
        )}
      </div>
    );
  };

  const canSave = formTitle.trim() && formDate;
  const isMultiDayForm = formEndDate && formEndDate > formDate;

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
          Team Calendar
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <WhatsAppButton compact label="Share" text={buildWhatsAppText()} />
          <button onClick={() => openAddForm(toDateStr(now))} style={{
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#A5B4FC', padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}>+ Add Event</button>
        </div>
      </div>
      <p style={{ margin: '0 0 20px', color: '#64748B', fontSize: 13 }}>
        {monthNames[now.getMonth()]} {now.getFullYear()} — Week view
      </p>

      {/* Add / Edit form */}
      {showForm && (
        <div style={{
          background: 'rgba(99,102,241,0.06)', borderRadius: 16, padding: 24,
          marginBottom: 20, border: '1px solid rgba(99,102,241,0.15)', animation: 'slideIn 0.3s ease',
        }}>
          <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: 15, color: '#E2E8F0' }}>
            {editingEvent ? 'Edit Event' : 'Add Event'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>

            {/* Title */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Title *</label>
              <input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="Event name"
                autoFocus
                style={inputStyle}
              />
            </div>

            {/* All-day toggle */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <div
                  onClick={() => setFormAllDay(v => !v)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, position: 'relative', transition: 'background 0.2s',
                    background: formAllDay ? '#6366F1' : 'rgba(255,255,255,0.1)',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: formAllDay ? 21 : 3,
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: formAllDay ? '#A5B4FC' : '#94A3B8' }}>
                  All day
                </span>
              </label>
            </div>

            {/* Start Date */}
            <div>
              <label style={labelStyle}>{isMultiDayForm ? 'Start Date *' : 'Date *'}</label>
              <input
                type="date"
                value={formDate}
                onChange={e => {
                  setFormDate(e.target.value);
                  // keep endDate >= startDate
                  if (formEndDate && formEndDate < e.target.value) setFormEndDate(e.target.value);
                }}
                style={inputStyle}
              />
              {formDate && !formEndDate && dayIndexFromDate(formDate) === null && (
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#FCA5A5' }}>Weekends aren't shown in the week view.</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label style={labelStyle}>End Date <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
              <input
                type="date"
                value={formEndDate}
                min={formDate}
                onChange={e => setFormEndDate(e.target.value)}
                style={inputStyle}
              />
              {isMultiDayForm && (
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8' }}>Multi-day event — spans across columns.</p>
              )}
            </div>

            {/* Time & Duration — hidden when All Day */}
            {!formAllDay && (
              <>
                <div>
                  <label style={labelStyle}>Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Duration (min)</label>
                  <select value={formDuration} onChange={e => setFormDuration(e.target.value)} style={inputStyle}>
                    {['15', '30', '45', '60', '90', '120'].map(d => (
                      <option key={d} value={d} style={{ background: '#1E2030' }}>{d} min</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Attendees */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Attendees</label>
              <input
                value={formAttendees}
                onChange={e => setFormAttendees(e.target.value)}
                placeholder="e.g. Everyone, or Esra, Leyla"
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {['Everyone', ...TEAM_MEMBERS.map(m => m.name)].map(name => (
                  <button key={name} onClick={() => setFormAttendees(name)} style={{
                    padding: '3px 10px', borderRadius: 12, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                    background: formAttendees === name ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: formAttendees === name ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)',
                    color: formAttendees === name ? '#A5B4FC' : '#64748B',
                  }}>{name}</button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {EVENT_COLORS.map(c => (
                  <button key={c} onClick={() => setFormColor(c)} style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: formColor === c ? '3px solid #fff' : '3px solid transparent',
                    boxShadow: formColor === c ? `0 0 0 2px ${c}` : 'none',
                    transition: 'all 0.15s',
                  }} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={!canSave} style={{
              padding: '10px 24px',
              background: canSave ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'rgba(255,255,255,0.06)',
              border: 'none', color: canSave ? '#fff' : '#475569',
              borderRadius: 8, fontWeight: 600,
              cursor: canSave ? 'pointer' : 'not-allowed', fontSize: 14,
            }}>{editingEvent ? 'Save Changes' : 'Add Event'}</button>
            <button onClick={closeForm} style={{
              padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94A3B8', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Week grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, minHeight: 400 }}>
        {weekDays.map((day, di) => {
          const isToday = toDateStr(day) === todayStr();
          const dayDateStr = toDateStr(day);
          const { allDay: allDayEvents, timed: timedEvents } = getEventsForDay(dayDateStr);
          const hasAnyEvents = allDayEvents.length > 0 || timedEvents.length > 0;

          return (
            <div key={di} style={{
              background: isToday ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
              borderRadius: 12, padding: 'clamp(8px, 2vw, 14px)',
              border: isToday ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {/* Day header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: isToday ? '#A5B4FC' : '#64748B',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>{dayNames[day.getDay()]}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    fontSize: 'clamp(14px, 2vw, 18px)', fontWeight: 700, fontFamily: "'Space Mono', monospace",
                    color: isToday ? '#A5B4FC' : '#94A3B8',
                    background: isToday ? 'rgba(99,102,241,0.15)' : 'transparent',
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{day.getDate()}</span>
                  <button
                    onClick={() => openAddForm(dayDateStr)}
                    title="Add event"
                    style={{
                      width: 22, height: 22, borderRadius: '50%', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#64748B', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1, fontWeight: 700,
                    }}
                  >+</button>
                </div>
              </div>

              {/* All-day events — pinned at top */}
              {allDayEvents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {allDayEvents.map(ev => renderEventCard(ev, dayDateStr))}
                </div>
              )}

              {/* Divider between all-day and timed if both present */}
              {allDayEvents.length > 0 && timedEvents.length > 0 && (
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />
              )}

              {/* Timed events */}
              {timedEvents.map(ev => renderEventCard(ev, dayDateStr))}

              {/* Empty state */}
              {!hasAnyEvents && (
                <div
                  onClick={() => openAddForm(dayDateStr)}
                  style={{
                    fontSize: 12, color: '#334155', fontStyle: 'italic',
                    textAlign: 'center', padding: '20px 0', cursor: 'pointer',
                    borderRadius: 8, border: '1px dashed rgba(255,255,255,0.06)',
                  }}
                >+ Add</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Shared input style
const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, color: '#E2E8F0', fontSize: 14, outline: 'none', colorScheme: 'dark',
};

const labelStyle = {
  fontSize: 12, fontWeight: 600, color: '#94A3B8',
  display: 'block', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.06em',
};
