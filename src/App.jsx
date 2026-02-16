import React, { useState, useEffect } from 'react';
import { DEFAULT_AIRTABLE_CONFIG, TEAM_MEMBERS } from './utils/config';
import { todayStr } from './utils/helpers';
import { airtableFetch } from './utils/airtable';
import { DEMO_CHECKINS, DEMO_PRIORITIES, DEMO_MESSAGES, DEMO_CALENDAR } from './utils/demoData';

import CheckIn from './components/CheckIn';
import Priorities from './components/Priorities';
import MessageBoard from './components/MessageBoard';
import Calendar from './components/Calendar';
import Settings from './components/Settings';

const TABS = [
  { id: 'checkin', label: 'Check-in', icon: '📍' },
  { id: 'priorities', label: 'Priorities', icon: '🎯' },
  { id: 'board', label: 'Board', icon: '💬' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('checkin');
  const [config, setConfig] = useState(() => {
    // Try to load saved config from localStorage
    try {
      const saved = localStorage.getItem('teamhub_config');
      return saved ? JSON.parse(saved) : DEFAULT_AIRTABLE_CONFIG;
    } catch {
      return DEFAULT_AIRTABLE_CONFIG;
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [currentUser] = useState('Gökhan'); // TODO: add login

  // Data state — starts with demo data, replaced by Airtable when connected
  const [checkins, setCheckins] = useState(DEMO_CHECKINS);
  const [priorities, setPriorities] = useState(DEMO_PRIORITIES);
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [calendarEvents] = useState(DEMO_CALENDAR);
  const [isConnected, setIsConnected] = useState(false);

  // Save config to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('teamhub_config', JSON.stringify(config));
    } catch { /* ignore */ }
  }, [config]);

  // Load data from Airtable when config changes
  useEffect(() => {
    if (!config.apiKey || !config.baseId) {
      setIsConnected(false);
      return;
    }

    const loadData = async () => {
      // Test with a simple fetch
      const teamData = await airtableFetch(config, 'TeamMembers', { maxRecords: 1 });
      if (!teamData) {
        setIsConnected(false);
        return;
      }
      setIsConnected(true);

      // Load check-ins for today
      const checkInData = await airtableFetch(config, 'DailyCheckIns', {
        filterByFormula: `{Date} = '${todayStr()}'`,
      });
      if (checkInData?.records?.length > 0) {
        setCheckins(checkInData.records.map(r => ({
          id: r.id,
          person: r.fields.Person,
          status: r.fields.Status,
          note: r.fields.Note || '',
          date: r.fields.Date,
          time: r.fields.Time,
        })));
      }

      // Load messages
      const msgData = await airtableFetch(config, 'Messages', {
        sort: JSON.stringify([{ field: 'CreatedAt', direction: 'desc' }]),
        maxRecords: 50,
      });
      if (msgData?.records?.length > 0) {
        setMessages(msgData.records.map(r => ({
          id: r.id,
          person: r.fields.Person,
          text: r.fields.Text,
          time: r.fields.CreatedAt || r.createdTime,
          channel: r.fields.Channel || 'general',
          pinned: r.fields.Pinned || false,
        })));
      }
    };

    loadData();
  }, [config]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const userCheckedIn = checkins.find(c => c.person === currentUser && c.date === todayStr());

  return (
    <div>
      {/* Header */}
      <header style={{
        padding: '20px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,17,23,0.8)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 4px 16px rgba(99,102,241,0.3)'
          }}>⚡</div>
          <div>
            <h1 style={{
              margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em',
              fontFamily: "'Space Mono', monospace", color: '#F8FAFC',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              TeamHub
              {isConnected && (
                <span style={{
                  fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#6EE7B7',
                  padding: '2px 8px', borderRadius: 10, fontWeight: 600
                }}>LIVE</span>
              )}
              {!isConnected && (
                <span style={{
                  fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#FCD34D',
                  padding: '2px 8px', borderRadius: 10, fontWeight: 600
                }}>DEMO</span>
              )}
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {greeting}, {currentUser}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!userCheckedIn && (
            <button onClick={() => setActiveTab('checkin')} style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none',
              color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13,
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              animation: 'pulse 2s infinite'
            }}>
              <span>📍</span> Check In
            </button>
          )}
          <button onClick={() => setShowSettings(!showSettings)} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#94A3B8', padding: '8px 12px', borderRadius: 8, fontSize: 13,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}>⚙ Settings</button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <Settings config={config} setConfig={setConfig} onClose={() => setShowSettings(false)} />
      )}

      {/* Tab Navigation */}
      <nav style={{
        display: 'flex', gap: 4, padding: '16px 32px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 20px',
            background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === tab.id ? '2px solid #6366F1' : '2px solid transparent',
            color: activeTab === tab.id ? '#A5B4FC' : '#64748B',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            borderRadius: '8px 8px 0 0', transition: 'all 0.2s'
          }}>
            <span style={{ fontSize: 16 }}>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
        {activeTab === 'checkin' && (
          <CheckIn checkins={checkins} setCheckins={setCheckins} currentUser={currentUser} />
        )}
        {activeTab === 'priorities' && (
          <Priorities priorities={priorities} />
        )}
        {activeTab === 'board' && (
          <MessageBoard messages={messages} setMessages={setMessages} currentUser={currentUser} />
        )}
        {activeTab === 'calendar' && (
          <Calendar events={calendarEvents} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '16px 32px', borderTop: '1px solid rgba(255,255,255,0.04)',
        textAlign: 'center', fontSize: 11, color: '#334155', marginTop: 40
      }}>
        TeamHub · Powered by Airtable · Built with Claude
      </footer>
    </div>
  );
}
