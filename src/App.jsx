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
import UserSelector from './components/UserSelector';

const TABS = [
  { id: 'checkin', label: 'Check-in', icon: '📍' },
  { id: 'priorities', label: 'Priorities', icon: '🎯' },
  { id: 'board', label: 'Board', icon: '💬' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('checkin');
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('teamhub_config');
      return saved ? JSON.parse(saved) : DEFAULT_AIRTABLE_CONFIG;
    } catch {
      return DEFAULT_AIRTABLE_CONFIG;
    }
  });
  const [showSettings, setShowSettings] = useState(false);

  // Current user — persisted in localStorage, null means not selected yet
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return localStorage.getItem('teamhub_user') || null;
    } catch {
      return null;
    }
  });

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

  // Handle user selection
  const handleSelectUser = (name) => {
    try {
      localStorage.setItem('teamhub_user', name);
    } catch { /* ignore */ }
    setCurrentUser(name);
  };

  // Switch user
  const handleSwitchUser = () => {
    try {
      localStorage.removeItem('teamhub_user');
    } catch { /* ignore */ }
    setCurrentUser(null);
  };

  // Load data from Airtable when config changes
  useEffect(() => {
    if (!config.apiKey || !config.baseId) {
      setIsConnected(false);
      return;
    }

    const loadData = async () => {
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

  // Show user selector if no user chosen yet
  if (!currentUser) {
    return <UserSelector onSelect={handleSelectUser} />;
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const userCheckedIn = checkins.find(c => c.person === currentUser && c.date === todayStr());
  const currentMember = TEAM_MEMBERS.find(m => m.name === currentUser);

  return (
    <div>
      {/* Header */}
      <header style={{
        padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 32px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(15,17,23,0.8)', backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
        gap: 8,
      }}>
        {/* Left: Logo + greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 4px 16px rgba(99,102,241,0.3)'
          }}>⚡</div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              margin: 0, fontSize: 'clamp(15px, 3vw, 20px)', fontWeight: 700, letterSpacing: '-0.02em',
              fontFamily: "'Space Mono', monospace", color: '#F8FAFC',
              display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap'
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
            <p style={{
              margin: 0, fontSize: 'clamp(10px, 2vw, 11px)', color: '#64748B',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {greeting}, {currentUser}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!userCheckedIn && (
            <button onClick={() => setActiveTab('checkin')} style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none',
              color: '#fff', padding: 'clamp(6px, 2vw, 8px) clamp(10px, 3vw, 16px)',
              borderRadius: 8, fontSize: 'clamp(11px, 2vw, 13px)',
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              animation: 'pulse 2s infinite', whiteSpace: 'nowrap'
            }}>
              <span>📍</span>
              <span style={{ display: 'none' }} className="btn-label-full">Check In</span>
              <span>Check In</span>
            </button>
          )}

          {/* User avatar / switch */}
          <button
            onClick={handleSwitchUser}
            title="Switch user"
            style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: currentMember?.color || '#6366F1',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', fontFamily: "'Space Mono', monospace",
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 2px 8px rgba(0,0,0,0.3)`,
            }}
          >
            {currentMember?.avatar || currentUser[0]}
          </button>

          <button onClick={() => setShowSettings(!showSettings)} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#94A3B8', padding: 'clamp(6px, 2vw, 8px) clamp(8px, 2vw, 12px)',
            borderRadius: 8, fontSize: 'clamp(12px, 2vw, 13px)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            whiteSpace: 'nowrap'
          }}>⚙ <span style={{ display: window.innerWidth > 480 ? 'inline' : 'none' }}>Settings</span></button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <Settings config={config} setConfig={setConfig} onClose={() => setShowSettings(false)} />
      )}

      {/* Tab Navigation */}
      <nav style={{
        display: 'flex', gap: 2, padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 32px) 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: 'clamp(8px, 2vw, 10px) clamp(10px, 3vw, 20px)',
            background: activeTab === tab.id ? 'rgba(99,102,241,0.15)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === tab.id ? '2px solid #6366F1' : '2px solid transparent',
            color: activeTab === tab.id ? '#A5B4FC' : '#64748B',
            fontSize: 'clamp(12px, 2.5vw, 14px)', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            borderRadius: '8px 8px 0 0', transition: 'all 0.2s',
            whiteSpace: 'nowrap', flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}>
            <span style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{
        padding: 'clamp(16px, 4vw, 24px) clamp(16px, 4vw, 32px)',
        maxWidth: 1100, margin: '0 auto'
      }}>
        {activeTab === 'checkin' && (
          <CheckIn checkins={checkins} setCheckins={setCheckins} currentUser={currentUser} config={config} />
        )}
        {activeTab === 'priorities' && (
          <Priorities priorities={priorities} />
        )}
        {activeTab === 'board' && (
          <MessageBoard messages={messages} setMessages={setMessages} currentUser={currentUser} config={config} />
        )}
        {activeTab === 'calendar' && (
          <Calendar events={calendarEvents} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 32px)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        textAlign: 'center', fontSize: 11, color: '#334155', marginTop: 40
      }}>
        TeamHub · Powered by Airtable · Built with Claude
      </footer>
    </div>
  );
}
