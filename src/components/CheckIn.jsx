import React, { useState } from 'react';
import { TEAM_MEMBERS } from '../utils/config';
import { todayStr } from '../utils/helpers';
import { airtableCreate } from '../utils/airtable';
import { Avatar, StatusBadge, WhatsAppButton } from './Shared';

export default function CheckIn({ checkins, setCheckins, currentUser, config, onWriteError }) {
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState('office');
  const [note, setNote] = useState('');

  const now = new Date();

  const handleCheckin = async () => {
    const checkInTime = new Date();
    const newCheckin = {
      id: `c${Date.now()}`,
      person: currentUser,
      status,
      note,
      date: todayStr(),
      time: checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setCheckins(prev => [newCheckin, ...prev.filter(c => c.person !== currentUser)]);
    setShowForm(false);
    setNote('');

    if (config?.apiKey && config?.baseId) {
      const fields = {
        Person: currentUser,
        Date:   newCheckin.date,
        Status: status,
        Time:   newCheckin.time,
        ...(note.trim() ? { Note: note.trim() } : {}),
      };
      const result = await airtableCreate(config, 'DailyCheckIns', fields);
      if (!result) {
        onWriteError?.('Check-in saved locally but failed to write to Airtable. Check the browser console (F12) for the error details — likely a field name mismatch.');
      }
    }
  };

  const todayCheckins = checkins.filter(c => c.date === todayStr());

  const buildWhatsAppText = () => {
    const statusIcons = { office: '🏢', remote: '🏠', out: '🔴' };
    const lines = TEAM_MEMBERS.map(m => {
      const ci = todayCheckins.find(c => c.person === m.name);
      if (!ci) return `⏳ ${m.name} - Not checked in`;
      const label = ci.status === 'office' ? 'In Office' : ci.status === 'remote' ? 'Remote' : 'Out';
      return `${statusIcons[ci.status]} ${m.name} - ${label}${ci.note ? ' (' + ci.note + ')' : ''}`;
    }).join('\n');
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    return `📍 *Team Status - ${dateStr}*\n\n${lines}`;
  };

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
            Today's Check-in
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {!showForm && (
          <div style={{ display: 'flex', gap: 8 }}>
            <WhatsAppButton compact label="Share Status" text={buildWhatsAppText()} />
            <button onClick={() => setShowForm(true)} style={{
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#A5B4FC', padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: 600
            }}>+ Update Status</button>
          </div>
        )}
      </div>

      {/* Quick check-in form */}
      {showForm && (
        <div style={{
          background: 'rgba(99,102,241,0.06)', borderRadius: 16, padding: 24,
          marginBottom: 20, border: '1px solid rgba(99,102,241,0.15)',
          animation: 'slideIn 0.3s ease'
        }}>
          <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 15 }}>Where are you today?</p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { val: 'office', label: '🏢 In Office' },
              { val: 'remote', label: '🏠 Remote' },
              { val: 'out', label: '🔴 Out' },
            ].map(opt => (
              <button key={opt.val} onClick={() => setStatus(opt.val)} style={{
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                background: status === opt.val ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: status === opt.val ? '2px solid #6366F1' : '2px solid rgba(255,255,255,0.08)',
                color: status === opt.val ? '#A5B4FC' : '#94A3B8',
                transition: 'all 0.2s'
              }}>{opt.label}</button>
            ))}
          </div>
          <input
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Any notes? (optional)"
            style={{
              width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0',
              fontSize: 14, outline: 'none', marginBottom: 12
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleCheckin} style={{
              padding: '10px 24px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              border: 'none', color: '#fff', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14
            }}>Check In</button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '10px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94A3B8', borderRadius: 8, cursor: 'pointer', fontSize: 14
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {['office', 'remote', 'out'].map(s => {
          const count = todayCheckins.filter(c => c.status === s).length;
          const labels = { office: 'In Office', remote: 'Remote', out: 'Out' };
          const icons = { office: '🏢', remote: '🏠', out: '🔴' };
          return (
            <div key={s} style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 20px',
              border: '1px solid rgba(255,255,255,0.06)', flex: '1 1 120px', minWidth: 120
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
                {icons[s]} {count}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{labels[s]}</div>
            </div>
          );
        })}
      </div>

      {/* Team list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {TEAM_MEMBERS.map(member => {
          const ci = todayCheckins.find(c => c.person === member.name);
          return (
            <div key={member.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
              background: ci ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
              borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)',
              opacity: ci ? 1 : 0.5, transition: 'all 0.2s'
            }}>
              <Avatar name={member.name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{member.name}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{member.role}</div>
              </div>
              {ci ? (
                <>
                  <StatusBadge status={ci.status} />
                  {ci.note && <span style={{ fontSize: 12, color: '#94A3B8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ci.note}</span>}
                  <span style={{ fontSize: 11, color: '#475569', fontFamily: "'Space Mono', monospace" }}>{ci.time}</span>
                </>
              ) : (
                <span style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>Not checked in yet</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
