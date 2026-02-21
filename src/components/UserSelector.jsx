import React from 'react';
import { TEAM_MEMBERS } from '../utils/config';

export default function UserSelector({ onSelect }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'radial-gradient(ellipse at top, #1a1d2e 0%, #0F1117 60%)',
    }}>
      {/* Logo */}
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, marginBottom: 20,
        boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
      }}>⚡</div>

      <h1 style={{
        margin: '0 0 8px',
        fontSize: 'clamp(24px, 5vw, 32px)',
        fontWeight: 700,
        fontFamily: "'Space Mono', monospace",
        color: '#F8FAFC',
        textAlign: 'center',
      }}>Welcome to TeamHub</h1>

      <p style={{
        margin: '0 0 40px',
        color: '#64748B',
        fontSize: 'clamp(14px, 3vw, 16px)',
        textAlign: 'center',
      }}>Who are you? Tap your name to continue.</p>

      {/* Team member cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 14,
        width: '100%',
        maxWidth: 600,
      }}>
        {TEAM_MEMBERS.map(member => (
          <button
            key={member.id}
            onClick={() => onSelect(member.name)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '24px 16px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#F8FAFC',
              WebkitTapHighlightColor: 'transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `rgba(${hexToRgb(member.color)}, 0.12)`;
              e.currentTarget.style.border = `1px solid rgba(${hexToRgb(member.color)}, 0.4)`;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 24px rgba(${hexToRgb(member.color)}, 0.2)`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onTouchStart={e => {
              e.currentTarget.style.background = `rgba(${hexToRgb(member.color)}, 0.12)`;
              e.currentTarget.style.border = `1px solid rgba(${hexToRgb(member.color)}, 0.4)`;
            }}
            onTouchEnd={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)';
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: member.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#fff',
              fontFamily: "'Space Mono', monospace",
              boxShadow: `0 4px 16px rgba(${hexToRgb(member.color)}, 0.4)`,
            }}>
              {member.avatar}
            </div>

            {/* Name & Role */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{member.name}</div>
              <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{member.role}</div>
            </div>
          </button>
        ))}
      </div>

      <p style={{
        marginTop: 32,
        color: '#334155',
        fontSize: 12,
        textAlign: 'center',
      }}>Your choice will be remembered on this device.</p>
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '99, 102, 241';
}
