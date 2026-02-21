/**
 * Demo data for TeamHub
 * Used when Airtable is not connected.
 * Once Airtable is set up, this file is ignored.
 */

import { todayStr, getMonday } from './helpers';

export const DEMO_CHECKINS = [];

// Flat format — one record per priority item
export const DEMO_PRIORITIES = [
  { id: 'p1',  person: 'Leyla',  week: getMonday(new Date()), priority: 'Finalize Q1 campaign brief',    status: 'done',        sortOrder: 1 },
  { id: 'p2',  person: 'Leyla',  week: getMonday(new Date()), priority: 'Social media content calendar',  status: 'in-progress', sortOrder: 2 },
  { id: 'p3',  person: 'Leyla',  week: getMonday(new Date()), priority: 'Press release for partnership',  status: 'todo',        sortOrder: 3 },
  { id: 'p4',  person: 'Leyla',  week: getMonday(new Date()), priority: 'Review brand guidelines update', status: 'in-progress', sortOrder: 4 },
  { id: 'p5',  person: 'Pınar',  week: getMonday(new Date()), priority: 'Website migration testing',      status: 'in-progress', sortOrder: 1 },
  { id: 'p6',  person: 'Pınar',  week: getMonday(new Date()), priority: 'CRM integration review',         status: 'todo',        sortOrder: 2 },
  { id: 'p7',  person: 'Pınar',  week: getMonday(new Date()), priority: 'Analytics dashboard setup',      status: 'done',        sortOrder: 3 },
  { id: 'p8',  person: 'Seda',   week: getMonday(new Date()), priority: 'Local partner meetings',         status: 'in-progress', sortOrder: 1 },
  { id: 'p9',  person: 'Seda',   week: getMonday(new Date()), priority: 'Community event planning',       status: 'in-progress', sortOrder: 2 },
  { id: 'p10', person: 'Seda',   week: getMonday(new Date()), priority: 'Monthly field report',            status: 'todo',        sortOrder: 3 },
  { id: 'p11', person: 'Esra',   week: getMonday(new Date()), priority: 'Investor update',                status: 'done',        sortOrder: 1 },
  { id: 'p12', person: 'Esra',   week: getMonday(new Date()), priority: 'Hiring plan review',              status: 'in-progress', sortOrder: 2 },
  { id: 'p13', person: 'Esra',   week: getMonday(new Date()), priority: 'Team retreat follow-up',          status: 'todo',        sortOrder: 3 },
  { id: 'p14', person: 'Gökhan', week: getMonday(new Date()), priority: 'TeamHub deployment',              status: 'in-progress', sortOrder: 1 },
  { id: 'p15', person: 'Gökhan', week: getMonday(new Date()), priority: 'Q1 budget review',                status: 'done',        sortOrder: 2 },
  { id: 'p16', person: 'Gökhan', week: getMonday(new Date()), priority: 'Performance review cycle',        status: 'todo',        sortOrder: 3 },
];

export const DEMO_MESSAGES = [
  { id: 'm1', person: 'Esra', text: 'Great work on the partnership announcement everyone! Let\'s keep the momentum going this week. 🎉', time: new Date(Date.now() - 3600000 * 2).toISOString(), channel: 'general', pinned: true },
  { id: 'm2', person: 'Leyla', text: 'Campaign assets are ready for review in the shared drive. Please take a look before Wednesday.', time: new Date(Date.now() - 3600000 * 5).toISOString(), channel: 'marketing', pinned: false },
  { id: 'm3', person: 'Pınar', text: 'New CRM integration is live on staging. Please test your workflows and flag any issues.', time: new Date(Date.now() - 3600000 * 8).toISOString(), channel: 'general', pinned: false },
  { id: 'm4', person: 'Gökhan', text: 'Reminder: Timesheets due by Friday 5pm.', time: new Date(Date.now() - 3600000 * 24).toISOString(), channel: 'general', pinned: true },
  { id: 'm5', person: 'Seda', text: 'Local partner meeting went well — notes shared in the drive. Leyla, can we sync on the press angle?', time: new Date(Date.now() - 3600000 * 26).toISOString(), channel: 'marketing', pinned: false },
];

export const DEMO_DECISIONS = [
  {
    id: 'd1',
    title: 'Move to weekly all-hands format',
    description: 'Replace bi-weekly all-hands with weekly 30-minute standups to improve alignment. Trial period: Q1.',
    decidedBy: 'Esra',
    date: '2026-02-17',
    category: 'operations',
    status: 'active',
  },
  {
    id: 'd2',
    title: 'Launch Instagram content series in March',
    description: 'Approved 8-week branded content series focused on local community stories. Budget: 5,000 TL.',
    decidedBy: 'Leyla',
    date: '2026-02-14',
    category: 'marketing',
    status: 'active',
  },
  {
    id: 'd3',
    title: 'Adopt TeamHub for internal communications',
    description: 'Migrate from WhatsApp group updates to TeamHub for check-ins and priorities tracking.',
    decidedBy: 'Gökhan',
    date: '2026-02-10',
    category: 'product',
    status: 'active',
  },
  {
    id: 'd4',
    title: 'Pause LinkedIn advertising',
    description: 'Q4 LinkedIn ads underperformed vs. organic. Reallocating budget to Instagram.',
    decidedBy: 'Leyla',
    date: '2026-01-28',
    category: 'marketing',
    status: 'reversed',
  },
];

export const DEMO_TASKS = [
  {
    id: 't1',
    title: 'Finalize Q1 marketing budget',
    description: 'Review and approve the full Q1 budget with Esra before Friday.',
    assignedTo: 'Leyla',
    createdBy: 'Esra',
    dueDate: '2026-02-28',
    priority: 'high',
    status: 'in-progress',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 't2',
    title: 'Deploy TeamHub to production',
    description: 'Final deploy with all new features enabled and Airtable connected.',
    assignedTo: 'Gökhan',
    createdBy: 'Gökhan',
    dueDate: '2026-02-22',
    priority: 'urgent',
    status: 'in-progress',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 't3',
    title: 'Write March content calendar',
    description: 'Minimum 20 posts planned, mix of Reels and carousels.',
    assignedTo: 'Leyla',
    createdBy: 'Leyla',
    dueDate: '2026-02-25',
    priority: 'medium',
    status: 'todo',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: 't4',
    title: 'Fix CRM data import error',
    description: 'Duplicate contacts appearing after the Feb 12 sync. Blocked on vendor response.',
    assignedTo: 'Pınar',
    createdBy: 'Pınar',
    dueDate: '2026-02-19',
    priority: 'urgent',
    status: 'blocked',
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
  {
    id: 't5',
    title: 'Local partner meeting notes',
    description: 'Compile and distribute notes from the Feb 18 partner session.',
    assignedTo: 'Seda',
    createdBy: 'Seda',
    dueDate: '2026-02-24',
    priority: 'low',
    status: 'done',
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
  },
  {
    id: 't6',
    title: 'Review performance review framework',
    description: 'Share revised template with team leads by end of week.',
    assignedTo: 'Esra',
    createdBy: 'Gökhan',
    dueDate: '2026-02-21',
    priority: 'medium',
    status: 'todo',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
];

// Calendar events — use real date strings + day index derived from date
// day: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
function weekDateStr(dayOffset) {
  // dayOffset: 0=Mon of this week, 1=Tue, …, 4=Fri
  const monday = new Date(getMonday(new Date()) + 'T12:00:00');
  const d = new Date(monday);
  d.setDate(monday.getDate() + dayOffset);
  return d.toISOString().split('T')[0];
}

export const DEMO_CALENDAR = [
  { id: 'e1', title: 'All Hands',              time: '10:00', duration: 60,  day: 1, date: weekDateStr(0), color: '#D4634B', attendees: 'Everyone' },
  { id: 'e2', title: 'Marketing Sync',          time: '14:00', duration: 45,  day: 1, date: weekDateStr(0), color: '#8B5CF6', attendees: 'Leyla, Seda, Esra' },
  { id: 'e3', title: 'Digital Platform Review', time: '11:00', duration: 60,  day: 2, date: weekDateStr(1), color: '#10B981', attendees: 'Pınar, Gökhan' },
  { id: 'e4', title: '1:1 Esra ↔ Leyla',       time: '15:00', duration: 30,  day: 3, date: weekDateStr(2), color: '#D4634B', attendees: 'Esra, Leyla' },
  { id: 'e5', title: 'Campaign Review',         time: '10:00', duration: 45,  day: 3, date: weekDateStr(2), color: '#8B5CF6', attendees: 'Leyla, Pınar, Seda' },
  { id: 'e6', title: 'Local Ops Planning',      time: '09:00', duration: 60,  day: 4, date: weekDateStr(3), color: '#F59E0B', attendees: 'Seda, Esra' },
  { id: 'e7', title: 'Team Lunch',              time: '12:30', duration: 60,  day: 5, date: weekDateStr(4), color: '#EC4899', attendees: 'Everyone' },
  { id: 'e8', title: 'Content Calendar Review', time: '16:00', duration: 30,  day: 5, date: weekDateStr(4), color: '#8B5CF6', attendees: 'Leyla, Gökhan' },
];
