import React, { useState } from 'react';
import { CHANNELS } from '../utils/config';
import { timeAgo, shareToWhatsApp, linkifyText } from '../utils/helpers';
import { airtableCreate, airtableUpdate, airtableDelete } from '../utils/airtable';
import { Avatar, WhatsAppIcon } from './Shared';

export default function MessageBoard({ messages, setMessages, currentUser, config, onWriteError }) {
  const [channel,        setChannel]        = useState('general');
  const [newMsg,         setNewMsg]         = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText,       setEditText]       = useState('');
  const [confirmDelete,  setConfirmDelete]  = useState(null);

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    const msg = {
      id: `m${Date.now()}`,
      person: currentUser,
      text: newMsg.trim(),
      time: new Date().toISOString(),
      channel,
      pinned: false,
    };
    setMessages(prev => [msg, ...prev]);
    setNewMsg('');

    if (config?.apiKey && config?.baseId) {
      const result = await airtableCreate(config, 'Messages', {
        Person:  currentUser,
        Text:    msg.text,
        Channel: channel,
        Pinned:  false,
        // CreatedAt is omitted — Airtable auto-populates it as a "Created time" field
      }, onWriteError);
      if (result?.id) {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, id: result.id } : m));
      }
    }
  };

  const openEditMessage = (m) => {
    setEditingMessage(m);
    setEditText(m.text);
    setConfirmDelete(null);
  };

  const closeEdit = () => {
    setEditingMessage(null); setEditText(''); setConfirmDelete(null);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim() || !editingMessage) return;
    const updated = { ...editingMessage, text: editText.trim() };
    setMessages(prev => prev.map(m => m.id === editingMessage.id ? updated : m));
    closeEdit();
    if (config?.apiKey && config?.baseId) {
      await airtableUpdate(config, 'Messages', editingMessage.id, { Text: updated.text }, onWriteError);
    }
  };

  const handleDeleteMessage = async (id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    closeEdit();
    if (config?.apiKey && config?.baseId) {
      await airtableDelete(config, 'Messages', id);
    }
  };

  const channelMessages = messages.filter(m => m.channel === channel);
  const pinnedMessages  = channelMessages.filter(m => m.pinned);
  const regularMessages = channelMessages.filter(m => !m.pinned);

  return (
    <div style={{ animation: 'slideIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
          Message Board
        </h2>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {CHANNELS.map(ch => (
            <button key={ch} onClick={() => setChannel(ch)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: channel === ch ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
              border: channel === ch ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
              color: channel === ch ? '#A5B4FC' : '#64748B'
            }}>#{ch}</button>
          ))}
        </div>
      </div>

      {/* Pinned */}
      {pinnedMessages.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.06)', borderRadius: 12, padding: 16, marginBottom: 20,
          border: '1px solid rgba(245,158,11,0.15)'
        }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📌 Pinned</p>
          {pinnedMessages.map(m => {
            const isOwner = m.person === currentUser;
            return (
              <div
                key={m.id}
                onClick={() => isOwner && openEditMessage(m)}
                style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', cursor: isOwner ? 'pointer' : 'default' }}
              >
                <Avatar name={m.person} size={24} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{m.person}: </span>
                  <span dangerouslySetInnerHTML={{ __html: linkifyText(m.text) }} style={{ fontSize: 13, color: '#CBD5E1' }} />
                </div>
                {isOwner && (
                  <span style={{ fontSize: 10, color: '#475569', flexShrink: 0, alignSelf: 'center' }}>✏</span>
                )}
                <button onClick={(e) => { e.stopPropagation(); shareToWhatsApp(`📌 *${m.person}:* ${m.text}`); }} title="Share to WhatsApp" style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 4,
                  opacity: 0.5, flexShrink: 0
                }}>
                  <WhatsAppIcon size={12} color="#25D366" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Compose */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: editingMessage ? 12 : 24, padding: '8px 12px',
        background: 'rgba(255,255,255,0.03)', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)', alignItems: 'center'
      }}>
        <Avatar name={currentUser} size={36} />
        <input
          value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Post to #${channel}...`}
          style={{
            flex: 1, padding: '10px 14px', background: 'transparent',
            border: 'none', color: '#E2E8F0', fontSize: 14, outline: 'none'
          }}
        />
        <button onClick={handleSend} style={{
          padding: '8px 20px',
          background: newMsg.trim() ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'rgba(255,255,255,0.06)',
          border: 'none', color: newMsg.trim() ? '#fff' : '#475569', borderRadius: 8,
          fontWeight: 600, cursor: newMsg.trim() ? 'pointer' : 'default', fontSize: 14,
          transition: 'all 0.2s'
        }}>Send</button>
      </div>

      {/* Edit panel — shown when editing a message */}
      {editingMessage && (
        <div style={{
          background: 'rgba(99,102,241,0.06)', borderRadius: 12, padding: 16, marginBottom: 24,
          border: '1px solid rgba(99,102,241,0.15)', animation: 'slideIn 0.3s ease',
        }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#A5B4FC', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ✏ Editing your message
          </p>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={3}
            autoFocus
            style={{
              width: '100%', padding: '10px 14px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, color: '#E2E8F0', fontSize: 14, outline: 'none',
              resize: 'vertical', fontFamily: 'inherit', marginBottom: 12,
            }}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={handleSaveEdit} disabled={!editText.trim()} style={{
              padding: '8px 20px',
              background: editText.trim() ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'rgba(255,255,255,0.06)',
              border: 'none', color: editText.trim() ? '#fff' : '#475569',
              borderRadius: 8, fontWeight: 600, cursor: editText.trim() ? 'pointer' : 'not-allowed', fontSize: 14,
            }}>Save</button>
            <button onClick={closeEdit} style={{
              padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              color: '#94A3B8', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            }}>Cancel</button>

            {confirmDelete === editingMessage.id ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                <button onClick={() => handleDeleteMessage(editingMessage.id)} style={{
                  padding: '8px 16px', background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5',
                  borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}>Confirm Delete</button>
                <button onClick={() => setConfirmDelete(null)} style={{
                  padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94A3B8', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                }}>Keep</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(editingMessage.id)} style={{
                padding: '8px 16px', background: 'transparent',
                border: '1px solid rgba(239,68,68,0.2)', color: '#F87171',
                borderRadius: 8, cursor: 'pointer', fontSize: 14, marginLeft: 'auto',
              }}>Delete</button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {regularMessages.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            color: '#334155', fontSize: 14,
            border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <div style={{ fontWeight: 600, color: '#475569', marginBottom: 6 }}>No messages yet</div>
            <div style={{ fontSize: 13 }}>Be the first to post in #{channel}</div>
          </div>
        )}
        {regularMessages.map(m => {
          const isOwner = m.person === currentUser;
          const isEditing = editingMessage?.id === m.id;
          return (
            <div
              key={m.id}
              onClick={() => isOwner && openEditMessage(m)}
              style={{
                display: 'flex', gap: 12, padding: '12px 16px',
                borderRadius: 12,
                background: isEditing ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                border: isEditing ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.04)',
                alignItems: 'flex-start',
                cursor: isOwner ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
            >
              <Avatar name={m.person} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{m.person}</span>
                  <span style={{ fontSize: 11, color: '#475569', fontFamily: "'Space Mono', monospace" }}>{timeAgo(m.time)}</span>
                  {isOwner && (
                    <span style={{ fontSize: 10, color: '#475569' }}>✏</span>
                  )}
                </div>
                <p dangerouslySetInnerHTML={{ __html: linkifyText(m.text) }} style={{ margin: 0, fontSize: 14, color: '#CBD5E1', lineHeight: 1.5, wordBreak: 'break-word' }} />
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); shareToWhatsApp(`💬 *${m.person}:* ${m.text}`); }}
                title="Share to WhatsApp"
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 6,
                  opacity: 0.3, transition: 'opacity 0.2s', borderRadius: 6, flexShrink: 0
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0.3}
              >
                <WhatsAppIcon size={14} color="#25D366" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
