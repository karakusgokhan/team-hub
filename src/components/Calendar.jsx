import React from 'react';
import { dayNames, monthNames, todayStr, getMonday, getWeekDays } from '../utils/helpers';
import { WhatsAppButton } from './Shared';

export default function Calendar({ events }) {
  const now = new Date();
  const weekDays = getWeekDays();

  const buildWhatsAppText = () => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const lines = dayLabels.map((label, i) => {
      const dayEvents = events.filter(e => e.day === i + 1);
      if (dayEvents.length === 0) return `*${label}:* No events`;
      const evts = dayEvents.map(e => `  📅 ${e.time} — ${e.title} (${e.attendees})`).join('\n');
      return `*${label}:*\n${evts}`;
    }).join('\n\n');
    const weekStr = new Date(getMonday(now)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `📅 *Team Schedule — Week of ${weekStr}*\n\n${lines}`;
  };

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
          Team Calendar
        </h2>
        <WhatsAppButton compact label="Share Schedule" text={buildWhatsAppText()} />
      </div>
      <p style={{ margin: '0 0 24px', color: '#64748B', fontSize: 13 }}>
        {monthNames[now.getMonth()]} {now.getFullYear()} — Week view
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8,
        minHeight: 400
      }}>
        {weekDays.map((day, di) => {
          const isToday = day.toISOString().split('T')[0] === todayStr();
          const dayEvents = events.filter(e => e.day === di + 1);
          return (
            <div key={di} style={{
              background: isToday ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
              borderRadius: 12, padding: 14,
              border: isToday ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(255,255,255,0.04)',
              display: 'flex', flexDirection: 'column', gap: 8
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: isToday ? '#A5B4FC' : '#64748B',
                  textTransform: 'uppercase', letterSpacing: '0.06em'
                }}>{dayNames[day.getDay()]}</span>
                <span style={{
                  fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                  color: isToday ? '#A5B4FC' : '#94A3B8',
                  background: isToday ? 'rgba(99,102,241,0.15)' : 'transparent',
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{day.getDate()}</span>
              </div>
              {dayEvents.map(ev => (
                <div key={ev.id} style={{
                  padding: '8px 10px', borderRadius: 8, fontSize: 12,
                  background: `${ev.color}15`, borderLeft: `3px solid ${ev.color}`,
                  cursor: 'default'
                }}>
                  <div style={{ fontWeight: 600, color: '#E2E8F0', marginBottom: 2 }}>{ev.title}</div>
                  <div style={{ color: '#64748B', fontFamily: "'Space Mono', monospace", fontSize: 11 }}>
                    {ev.time} · {ev.duration}min
                  </div>
                  <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>{ev.attendees}</div>
                </div>
              ))}
              {dayEvents.length === 0 && (
                <div style={{ fontSize: 12, color: '#334155', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                  No events
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
