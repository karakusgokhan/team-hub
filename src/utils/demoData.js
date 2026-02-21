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

export const DEMO_MESSAGES = [];

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

export const DEMO_CALENDAR = [];
