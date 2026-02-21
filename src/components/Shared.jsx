import React from 'react';
import { TEAM_MEMBERS } from '../utils/config';
import { shareToWhatsApp } from '../utils/helpers';

// ─── Avatar ──────────────────────────────────────────────────────
export function Avatar({ name, size = 36 }) {
  const person = TEAM_MEMBERS.find(t => t.name === name);
  const color = person?.color || '#6B7280';
  const letter = person?.avatar || name?.[0] || '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 700, flexShrink: 0,
      boxShadow: `0 2px 8px ${color}44`
    }}>{letter}</div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const styles = {
    office: { bg: '#DCFCE7', text: '#166534', label: '🏢 In Office' },
    remote: { bg: '#DBEAFE', text: '#1E40AF', label: '🏠 Remote' },
    out: { bg: '#FEE2E2', text: '#991B1B', label: '🔴 Out' },
  };
  const s = styles[status] || styles.out;
  return (
    <span style={{
      background: s.bg, color: s.text, padding: '4px 12px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap'
    }}>{s.label}</span>
  );
}

// ─── Priority Status Dot ─────────────────────────────────────────
export function PriorityStatus({ status }) {
  const s = {
    done: { bg: '#DCFCE7', text: '#166534', icon: '✓' },
    'in-progress': { bg: '#FEF3C7', text: '#92400E', icon: '◐' },
    todo: { bg: '#F3F4F6', text: '#6B7280', icon: '○' },
  }[status] || { bg: '#F3F4F6', text: '#6B7280', icon: '○' };
  return (
    <span style={{
      background: s.bg, color: s.text, width: 22, height: 22, borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 700, flexShrink: 0
    }}>{s.icon}</span>
  );
}

// ─── WhatsApp Share Button ───────────────────────────────────────
export function WhatsAppButton({ text, label = 'Share to WhatsApp', compact = false }) {
  return (
    <button onClick={() => shareToWhatsApp(text)} style={{
      background: '#25D366', border: 'none', color: '#fff',
      padding: compact ? '6px 12px' : '8px 16px', borderRadius: 8,
      fontSize: compact ? 12 : 13, fontWeight: 600, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6,
      boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
      transition: 'all 0.2s'
    }}>
      <WhatsAppIcon size={compact ? 14 : 16} />
      {label}
    </button>
  );
}

// ─── Category Badge ──────────────────────────────────────────────
export function CategoryBadge({ category, colorMap }) {
  const color = colorMap?.[category] || '#64748B';
  return (
    <span style={{
      background: `${color}22`, color, border: `1px solid ${color}44`,
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      textTransform: 'capitalize', letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>{category}</span>
  );
}

// ─── Pill Badge ───────────────────────────────────────────────────
export function PillBadge({ label, bg, color }) {
  return (
    <span style={{
      background: bg, color, padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>{label}</span>
  );
}

// ─── WhatsApp Icon (used in button and inline) ───────────────────
export function WhatsAppIcon({ size = 16, color = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
