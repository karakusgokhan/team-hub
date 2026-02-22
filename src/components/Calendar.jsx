import React, { useState, useMemo } from 'react';
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

// Does an event appear on a given date string?
function eventAppearsOnDay(ev, dayDateStr) {
  const start = ev.date;
  const end   = ev.endDate || ev.date;
  return dayDateStr >= start && dayDateStr <= end;
}

// Week view: is this the first weekday column the event appears in?
function isFirstVisibleDay(ev, dayDateStr, weekDayStrs) {
  const first = weekDayStrs.find(d => eventAppearsOnDay(ev, d));
  return first === dayDateStr;
}

// Week view: is this the last weekday column the event appears in?
function isLastVisibleDay(ev, dayDateStr, weekDayStrs) {
  const last = [...weekDayStrs].reverse().find(d => eventAppearsOnDay(ev, d));
  return last === dayDateStr;
}

// Build full month grid: array of 7-column week rows covering the month
// Each cell: { dateStr, inMonth: bool }
function buildMonthGrid(year, month) {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1);
  // Start grid on Monday of the week containing the 1st
  const startDow = firstDay.getDay(); // 0=Sun
  const daysBefore = startDow === 0 ? 6 : startDow - 1; // days to go back to reach Monday
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - daysBefore);

  const lastDay = new Date(year, month + 1, 0);
  const endDow = lastDay.getDay();
  const daysAfter = endDow === 0 ? 0 : 7 - endDow;
  const gridEnd = new Date(lastDay);
  gridEnd.setDate(gridEnd.getDate() + daysAfter);

  const weeks = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push({
        dateStr: toDateStr(cur),
        inMonth: cur.getMonth() === month,
        date: new Date(cur),
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

// For a given week row in month grid, get events and their row assignments (to handle multi-day spanning)
// Returns: Map of eventId -> rowIndex (0-based), and the max rows needed
function assignEventRows(weekCells, events) {
  // collect all events that appear in this week
  const weekStrs = weekCells.map(c => c.dateStr);
  const weekEvents = events.filter(ev =>
    weekStrs.some(d => eventAppearsOnDay(ev, d))
  );
  // Sort: all-day first, then by start date, then by duration (longer first)
  weekEvents.sort((a, b) => {
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    const aLen = a.endDate ? (new Date(a.endDate) - new Date(a.date)) : 0;
    const bLen = b.endDate ? (new Date(b.endDate) - new Date(b.date)) : 0;
    return bLen - aLen;
  });

  // Greedy row assignment: for each event, find the first row where it doesn't conflict
  const rowMap = new Map(); // eventId -> rowIndex
  const rowSlots = []; // rowSlots[rowIndex] = array of { start, end } occupied day indices

  for (const ev of weekEvents) {
    const evStart = weekStrs.findIndex(d => eventAppearsOnDay(ev, d));
    const evEnd   = weekStrs.slice().reverse().findIndex(d => eventAppearsOnDay(ev, d));
    const evEndIdx = weekStrs.length - 1 - evEnd;
    if (evStart === -1) continue;

    let assignedRow = -1;
    for (let r = 0; r < rowSlots.length; r++) {
      const occupied = rowSlots[r].some(slot => !(slot.end < evStart || slot.start > evEndIdx));
      if (!occupied) { assignedRow = r; break; }
    }
    if (assignedRow === -1) {
      assignedRow = rowSlots.length;
      rowSlots.push([]);
    }
    rowSlots[assignedRow].push({ start: evStart, end: evEndIdx });
    rowMap.set(ev.id, assignedRow);
  }

  return { rowMap, maxRows: rowSlots.length, weekEvents };
}

export default function Calendar({ events, setEvents, currentUser, config, onWriteError }) {
  const now = new Date();
  const today = todayStr();

  // ── View mode ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'

  // ── Week view state ────────────────────────────────────────────────────────
  const weekDays = getWeekDays();
  const weekDayStrs = weekDays.map(d => toDateStr(d));

  // ── Month view navigation ──────────────────────────────────────────────────
  const [monthYear, setMonthYear] = useState(now.getFullYear());
  const [monthMonth, setMonthMonth] = useState(now.getMonth()); // 0-indexed

  const goPrevMonth = () => {
    if (monthMonth === 0) { setMonthYear(y => y - 1); setMonthMonth(11); }
    else setMonthMonth(m => m - 1);
  };
  const goNextMonth = () => {
    if (monthMonth === 11) { setMonthYear(y => y + 1); setMonthMonth(0); }
    else setMonthMonth(m => m + 1);
  };
  const goToday = () => { setMonthYear(now.getFullYear()); setMonthMonth(now.getMonth()); };

  const monthGrid = useMemo(() => buildMonthGrid(monthYear, monthMonth), [monthYear, monthMonth]);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [showForm,      setShowForm]      = useState(false);
  const [editingEvent,  setEditingEvent]  = useState(null);
  const [formTitle,     setFormTitle]     = useState('');
  const [formDate,      setFormDate]      = useState(toDateStr(now));
  const [formEndDate,   setFormEndDate]   = useState('');
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

  const openEditForm = (ev, e) => {
    if (e) e.stopPropagation();
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
    const dayIdx = dayIndexFromDate(formDate);
    const endDate = formEndDate && formEndDate >= formDate ? formEndDate : formDate;
    const coversWeekday = weekDayStrs.some(d => d >= formDate && d <= endDate);
    // In month view we allow any date; in week view still need weekday coverage
    if (viewMode === 'week' && !dayIdx && !coversWeekday) return;

    const eventData = {
      title:     formTitle.trim(),
      date:      formDate,
      endDate:   endDate,
      day:       dayIdx,
      allDay:    formAllDay,
      time:      formAllDay ? '' : formTime,
      duration:  formAllDay ? 0 : (parseInt(formDuration, 10) || 60),
      attendees: formAttendees.trim(),
      color:     formColor,
    };

    // Build Airtable fields, omitting empty/invalid values so Airtable doesn't reject them.
    // Date fields must be omitted (not set to '') when absent.
    // Text fields must be omitted (not set to '') when absent.
    const airtableFields = {
      Title: eventData.title,
      Date:  eventData.date,
      AllDay: eventData.allDay,
      Color:  eventData.color,
      ...(eventData.endDate && eventData.endDate !== eventData.date ? { EndDate: eventData.endDate } : {}),
      ...(!eventData.allDay && eventData.time  ? { StartTime: eventData.time } : {}),
      ...(!eventData.allDay && eventData.duration ? { Duration: eventData.duration } : {}),
      ...(eventData.attendees ? { Attendees: eventData.attendees } : {}),
    };

    if (editingEvent) {
      const updated = { ...editingEvent, ...eventData };
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e));
      closeForm();
      if (config?.apiKey && config?.baseId) {
        const result = await airtableUpdate(config, 'Events', editingEvent.id, airtableFields);
        if (!result) onWriteError?.('Event update failed to save to Airtable. Check the browser console (F12).');
      }
    } else {
      const tempId = `ev${Date.now()}`;
      const newEvent = { id: tempId, ...eventData };
      setEvents(prev => [...prev, newEvent]);
      closeForm();
      if (config?.apiKey && config?.baseId) {
        const result = await airtableCreate(config, 'Events', {
          ...airtableFields,
          CreatedBy: currentUser,
        });
        if (result?.id) {
          setEvents(prev => prev.map(e => e.id === tempId ? { ...e, id: result.id } : e));
        } else {
          onWriteError?.('Event saved locally but failed to write to Airtable. Check the browser console (F12) for the error details — likely a field name mismatch.');
        }
      }
    }
  };

  const handleDelete = async (eventId, e) => {
    if (e) e.stopPropagation();
    setEvents(prev => prev.filter(ev => ev.id !== eventId));
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
          ? `  📅 [All day] ${e.title}${e.attendees ? ' (' + e.attendees + ')' : ''}`
          : `  📅 ${e.time} - ${e.title}${e.attendees ? ' (' + e.attendees + ')' : ''}`
      ).join('\n');
      return `*${label}:*\n${evts}`;
    }).join('\n\n');
    const weekStr = new Date(getMonday(now)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `📅 *Team Schedule - Week of ${weekStr}*\n\n${lines}`;
  };

  // ── Week view helpers ──────────────────────────────────────────────────────
  const getEventsForDay = (dayDateStr) => {
    const all = events.filter(e => eventAppearsOnDay(e, dayDateStr));
    const allDay = all.filter(e => e.allDay);
    const timed  = all.filter(e => !e.allDay).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return { allDay, timed };
  };

  const renderWeekEventCard = (ev, dayDateStr) => {
    const isFirst = isFirstVisibleDay(ev, dayDateStr, weekDayStrs);
    const isLast  = isLastVisibleDay(ev, dayDateStr, weekDayStrs);
    const isMultiDay = ev.endDate && ev.endDate !== ev.date;

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
        onClick={(e) => openEditForm(ev, e)}
      >
        {(isFirst || !isMultiDay) && (
          <>
            <div style={{ fontWeight: 600, color: '#E2E8F0', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ev.title}
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
        {isMultiDay && !isFirst && (
          <div style={{ fontWeight: 600, color: `${ev.color}99`, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ev.title}
          </div>
        )}
        {isFirst && (
          confirmDelete === ev.id ? (
            <div style={{ marginTop: 5, display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
              <button onClick={(e) => handleDelete(ev.id, e)} style={{
                padding: '2px 8px', fontSize: 10, fontWeight: 700, borderRadius: 6, cursor: 'pointer',
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5',
              }}>Delete</button>
              <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }} style={{
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

  // ── Month view renderer ────────────────────────────────────────────────────
  const MON_DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const MAX_VISIBLE_ROWS = 3; // show up to 3 event rows per cell, then "+N more"

  const renderMonthView = () => {
    return (
      <div>
        {/* Month day-of-week header row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
          {MON_DAY_NAMES.map(d => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#475569',
              textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0',
            }}>{d}</div>
          ))}
        </div>

        {/* Week rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {monthGrid.map((week, wi) => {
            const { rowMap, maxRows, weekEvents } = assignEventRows(week, events);
            const weekStrs = week.map(c => c.dateStr);

            // For each row slot 0..maxRows-1, determine which event occupies it per cell
            // Build: rowSlotEvents[rowIndex] = array of { event, startIdx, endIdx } segments
            const rowSlotEvents = [];
            for (let r = 0; r < Math.min(maxRows, MAX_VISIBLE_ROWS + 1); r++) {
              rowSlotEvents[r] = [];
            }
            for (const ev of weekEvents) {
              const r = rowMap.get(ev.id);
              if (r === undefined || r >= MAX_VISIBLE_ROWS + 1) continue;
              const startIdx = weekStrs.findIndex(d => eventAppearsOnDay(ev, d));
              const endIdx   = weekStrs.slice().reverse().findIndex(d => eventAppearsOnDay(ev, d));
              const endIdxFwd = weekStrs.length - 1 - endIdx;
              if (startIdx === -1) continue;
              rowSlotEvents[r].push({ ev, startIdx, endIdx: endIdxFwd });
            }

            // Count overflow per cell
            const overflowCounts = week.map((cell, ci) => {
              return weekEvents.filter(ev => {
                const r = rowMap.get(ev.id);
                return r !== undefined && r >= MAX_VISIBLE_ROWS && eventAppearsOnDay(ev, cell.dateStr);
              }).length;
            });

            const ROW_HEIGHT = 22; // px per event row slot
            const CELL_PADDING = 6;
            const HEADER_HEIGHT = 28;
            const cellMinHeight = HEADER_HEIGHT + CELL_PADDING * 2 + Math.min(maxRows, MAX_VISIBLE_ROWS) * (ROW_HEIGHT + 2) + (overflowCounts.some(c => c > 0) ? ROW_HEIGHT : 0);

            return (
              <div key={wi} style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 2, minHeight: Math.max(90, cellMinHeight),
              }}>
                {week.map((cell, ci) => {
                  const isToday = cell.dateStr === today;
                  const isWeekend = ci >= 5; // Sat/Sun
                  const overflow = overflowCounts[ci];

                  return (
                    <div
                      key={ci}
                      onClick={() => openAddForm(cell.dateStr)}
                      style={{
                        background: isToday
                          ? 'rgba(99,102,241,0.08)'
                          : cell.inMonth
                            ? isWeekend ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.025)'
                            : 'rgba(0,0,0,0.15)',
                        border: isToday
                          ? '1px solid rgba(99,102,241,0.3)'
                          : '1px solid rgba(255,255,255,0.04)',
                        borderRadius: 6,
                        padding: `${CELL_PADDING}px 4px`,
                        cursor: 'pointer',
                        minHeight: Math.max(90, cellMinHeight),
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Date number */}
                      <div style={{ textAlign: 'right', marginBottom: 2, paddingRight: 2 }}>
                        <span style={{
                          fontSize: 12,
                          fontWeight: isToday ? 700 : 400,
                          fontFamily: "'Space Mono', monospace",
                          color: isToday
                            ? '#A5B4FC'
                            : cell.inMonth
                              ? isWeekend ? '#475569' : '#94A3B8'
                              : '#2D3748',
                          background: isToday ? 'rgba(99,102,241,0.2)' : 'transparent',
                          borderRadius: '50%',
                          width: 22, height: 22,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {cell.date.getDate()}
                        </span>
                      </div>

                      {/* Event rows — rendered as absolute-position strips */}
                      <div style={{ position: 'relative' }}>
                        {rowSlotEvents.slice(0, MAX_VISIBLE_ROWS).map((rowEvents, ri) => {
                          // Find the segment for this cell
                          const seg = rowEvents.find(s => s.startIdx <= ci && s.endIdx >= ci);
                          if (!seg) return <div key={ri} style={{ height: ROW_HEIGHT, marginBottom: 2 }} />;
                          const isFirst = ci === seg.startIdx;
                          const isLast  = ci === seg.endIdx;
                          const ev = seg.ev;
                          return (
                            <div
                              key={ri}
                              onClick={e => openEditForm(ev, e)}
                              style={{
                                height: ROW_HEIGHT,
                                marginBottom: 2,
                                background: `${ev.color}22`,
                                borderLeft:   isFirst ? `3px solid ${ev.color}` : 'none',
                                borderTop:    `1px solid ${ev.color}33`,
                                borderBottom: `1px solid ${ev.color}33`,
                                borderRight:  isLast  ? `1px solid ${ev.color}33` : 'none',
                                borderRadius: `${isFirst ? 4 : 0}px ${isLast ? 4 : 0}px ${isLast ? 4 : 0}px ${isFirst ? 4 : 0}px`,
                                display: 'flex', alignItems: 'center',
                                paddingLeft: isFirst ? 5 : 3,
                                paddingRight: 4,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                // extend to edges for continuation
                                marginLeft: isFirst ? 0 : -4,
                                marginRight: isLast ? 0 : -4,
                              }}
                            >
                              {isFirst && (
                                <span style={{
                                  fontSize: 10, fontWeight: 600, color: '#E2E8F0',
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                  display: 'flex', alignItems: 'center', gap: 3,
                                }}>
                                  {!ev.allDay && ev.time && (
                                    <span style={{ color: ev.color, fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>
                                      {ev.time.replace(':','h')}
                                    </span>
                                  )}
                                  {ev.allDay && <span style={{ color: ev.color, flexShrink: 0 }}>●</span>}
                                  {ev.title}
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {/* Overflow count */}
                        {overflow > 0 && (
                          <div style={{
                            height: ROW_HEIGHT, display: 'flex', alignItems: 'center',
                            paddingLeft: 4, fontSize: 10, color: '#64748B', fontWeight: 600,
                          }}>
                            +{overflow} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const canSave = formTitle.trim() && formDate;
  const isMultiDayForm = formEndDate && formEndDate > formDate;

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
          Team Calendar
        </h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden',
          }}>
            {['week', 'month'].map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: '7px 14px', background: viewMode === v ? 'rgba(99,102,241,0.2)' : 'transparent',
                border: 'none', color: viewMode === v ? '#A5B4FC' : '#64748B',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}>{v === 'week' ? '≡ Week' : '⊞ Month'}</button>
            ))}
          </div>
          <WhatsAppButton compact label="Share" text={buildWhatsAppText()} />
          <button onClick={() => openAddForm(toDateStr(now))} style={{
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#A5B4FC', padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
          }}>+ Add Event</button>
        </div>
      </div>

      {/* ── Month nav bar (month view only) ──────────────────────────────── */}
      {viewMode === 'month' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={goPrevMonth} style={navBtnStyle}>←</button>
          <span style={{ fontWeight: 700, fontSize: 16, fontFamily: "'Space Mono', monospace", color: '#E2E8F0', minWidth: 160, textAlign: 'center' }}>
            {monthNames[monthMonth]} {monthYear}
          </span>
          <button onClick={goNextMonth} style={navBtnStyle}>→</button>
          {(monthYear !== now.getFullYear() || monthMonth !== now.getMonth()) && (
            <button onClick={goToday} style={{
              padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#A5B4FC',
            }}>↩ Today</button>
          )}
        </div>
      )}

      {/* ── Week view subtitle ────────────────────────────────────────────── */}
      {viewMode === 'week' && (
        <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: 13 }}>
          {monthNames[now.getMonth()]} {now.getFullYear()} — Week view
        </p>
      )}

      {/* ── Add / Edit form ───────────────────────────────────────────────── */}
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
                  if (formEndDate && formEndDate < e.target.value) setFormEndDate(e.target.value);
                }}
                style={inputStyle}
              />
              {formDate && !formEndDate && viewMode === 'week' && dayIndexFromDate(formDate) === null && (
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
            {editingEvent && (
              confirmDelete === editingEvent.id ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button onClick={(e) => handleDelete(editingEvent.id, e)} style={{
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
                <button onClick={() => setConfirmDelete(editingEvent.id)} style={{
                  padding: '10px 16px', background: 'transparent', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#F87171', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                  marginLeft: 'auto',
                }}>Delete</button>
              )
            )}
          </div>
        </div>
      )}

      {/* ── Week view grid ────────────────────────────────────────────────── */}
      {viewMode === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, minHeight: 400 }}>
          {weekDays.map((day, di) => {
            const isToday = toDateStr(day) === today;
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

                {allDayEvents.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {allDayEvents.map(ev => renderWeekEventCard(ev, dayDateStr))}
                  </div>
                )}

                {allDayEvents.length > 0 && timedEvents.length > 0 && (
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />
                )}

                {timedEvents.map(ev => renderWeekEventCard(ev, dayDateStr))}

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
      )}

      {/* ── Month view ────────────────────────────────────────────────────── */}
      {viewMode === 'month' && renderMonthView()}
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

const navBtnStyle = {
  padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#94A3B8', transition: 'all 0.15s',
};
