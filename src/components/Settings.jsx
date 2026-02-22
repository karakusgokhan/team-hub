import React, { useState } from 'react';
import { testConnection } from '../utils/airtable';

export default function Settings({ config, setConfig, onClose }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(config);
    setTestResult(result);
    setTesting(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease'
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#1E2030', borderRadius: 16, padding: 32, width: 500,
        maxHeight: '85vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)', animation: 'slideIn 0.3s ease'
      }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
          ⚙ Settings
        </h2>
        <p style={{ color: '#64748B', fontSize: 13, marginBottom: 24 }}>
          Connect to your Airtable base to sync team data. The app works in demo mode without a connection.
        </p>

        {/* Token status — injected at build time, not user-editable */}
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 8,
          background: config.apiKey ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${config.apiKey ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600,
            color: config.apiKey ? '#6EE7B7' : '#FCA5A5' }}>
            {config.apiKey
              ? '🔑 Personal Access Token: active'
              : '⚠️ Personal Access Token: not configured — contact your admin'}
          </p>
        </div>

        {/* Base ID — editable in case a team wants to switch bases */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6,
            textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>Base ID</label>
          <input
            value={config.baseId} placeholder="app..."
            onChange={(e) => setConfig(prev => ({ ...prev, baseId: e.target.value }))}
            type="text"
            style={{
              width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E2E8F0',
              fontSize: 14, outline: 'none', fontFamily: "'Space Mono', monospace"
            }}
          />
        </div>

        {/* Test connection */}
        <button onClick={handleTest} disabled={testing || !config.apiKey || !config.baseId} style={{
          padding: '8px 16px', background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8', borderRadius: 8,
          cursor: (!config.apiKey || !config.baseId) ? 'not-allowed' : 'pointer',
          fontSize: 13, fontWeight: 600, marginBottom: 12, opacity: (!config.apiKey || !config.baseId) ? 0.4 : 1
        }}>
          {testing ? 'Testing...' : '🔌 Test Connection'}
        </button>

        {testResult && (
          <div style={{
            padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13,
            background: testResult.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${testResult.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: testResult.ok ? '#6EE7B7' : '#FCA5A5'
          }}>
            {testResult.ok ? '✅ Connected successfully!' : `❌ ${testResult.error}`}
          </div>
        )}

        {/* Airtable setup guide */}
        <div style={{
          marginTop: 12, padding: 16, background: 'rgba(99,102,241,0.08)',
          borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)'
        }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#A5B4FC', marginBottom: 8 }}>📋 Airtable Setup Guide</p>
          <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', lineHeight: 1.7 }}>
            1. Create a base called <strong style={{ color: '#C7D2FE' }}>HarmonyHub</strong> in Airtable<br />
            2. Create these tables with the listed fields:<br /><br />
            <strong style={{ color: '#C7D2FE' }}>TeamMembers</strong> — Name, Role, Color, Avatar<br />
            <strong style={{ color: '#C7D2FE' }}>DailyCheckIns</strong> — Person, Status, Note, Date, Time<br />
            <strong style={{ color: '#C7D2FE' }}>WeeklyPriorities</strong> — Person, Week, Priority, Status, SortOrder<br />
            <strong style={{ color: '#C7D2FE' }}>Messages</strong> — Person, Text, Channel, Pinned, CreatedAt<br /><br />
            3. Create a <a href="https://airtable.com/create/tokens" target="_blank" rel="noreferrer" style={{ color: '#A5B4FC' }}>Personal Access Token</a> with read/write scopes<br />
            4. Copy your Base ID from the URL
          </p>
        </div>

        {/* WhatsApp integration guide */}
        <div style={{
          marginTop: 12, padding: 16, background: 'rgba(37,211,102,0.08)',
          borderRadius: 12, border: '1px solid rgba(37,211,102,0.15)'
        }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#6EE7B7', marginBottom: 8 }}>📱 WhatsApp Integration</p>
          <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', lineHeight: 1.7 }}>
            <strong style={{ color: '#A7F3D0' }}>Built-in:</strong> Share buttons on every tab open WhatsApp with pre-formatted messages. Just pick your team group and send.<br /><br />
            <strong style={{ color: '#A7F3D0' }}>Automation (optional):</strong> Use <a href="https://make.com" target="_blank" rel="noreferrer" style={{ color: '#6EE7B7' }}>Make.com</a> to auto-send daily check-in reminders and weekly summaries to WhatsApp via your Business account.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px 16px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            border: 'none', color: '#fff', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14
          }}>Save & Close</button>
        </div>
      </div>
    </div>
  );
}
