import React from 'react';
import { TEAM_MEMBERS } from '../utils/config';
import { getMonday } from '../utils/helpers';
import { Avatar, PriorityStatus, WhatsAppButton } from './Shared';

export default function Priorities({ priorities }) {
  const now = new Date();

  const buildWhatsAppText = () => {
    const lines = priorities.map(p => {
      const items = p.priorities.map((item, i) => {
        const icon = p.status[i] === 'done' ? '✅' : p.status[i] === 'in-progress' ? '🔄' : '⬜';
        return `  ${icon} ${item}`;
      }).join('\n');
      return `*${p.person}:*\n${items}`;
    }).join('\n\n');
    const weekStr = new Date(getMonday(now)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `🎯 *Weekly Priorities — Week of ${weekStr}*\n\n${lines}`;
  };

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
          Weekly Priorities
        </h2>
        <WhatsAppButton compact label="Share Priorities" text={buildWhatsAppText()} />
      </div>
      <p style={{ margin: '0 0 24px', color: '#64748B', fontSize: 13 }}>
        Week of {new Date(getMonday(now)).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {priorities.map(p => {
          const member = TEAM_MEMBERS.find(t => t.name === p.person);
          const doneCount = p.status.filter(s => s === 'done').length;
          const progress = Math.round((doneCount / p.priorities.length) * 100);
          return (
            <div key={p.id} style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 20,
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <Avatar name={p.person} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{p.person}</span>
                  <span style={{ color: '#64748B', fontSize: 12, marginLeft: 8 }}>{member?.role}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 80, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progress}%`, height: '100%', borderRadius: 3,
                      background: progress === 100 ? '#10B981' : 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#64748B', fontFamily: "'Space Mono', monospace" }}>
                    {doneCount}/{p.priorities.length}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {p.priorities.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)', borderRadius: 8
                  }}>
                    <PriorityStatus status={p.status[i]} />
                    <span style={{
                      fontSize: 13, flex: 1,
                      textDecoration: p.status[i] === 'done' ? 'line-through' : 'none',
                      color: p.status[i] === 'done' ? '#64748B' : '#E2E8F0'
                    }}>{item}</span>
                    <span style={{
                      fontSize: 11, color: '#64748B', textTransform: 'capitalize',
                      fontFamily: "'Space Mono', monospace"
                    }}>{p.status[i].replace('-', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
