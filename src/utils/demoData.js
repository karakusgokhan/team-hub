/**
 * Demo data for TeamHub
 * Used when Airtable is not connected. 
 * Once Airtable is set up, this file is ignored.
 */

import { todayStr, getMonday } from './helpers';

export const DEMO_CHECKINS = [
  { id: 'c1', person: 'Esra', status: 'office', note: 'Strategy session at 2pm', date: todayStr(), time: '08:45' },
  { id: 'c2', person: 'Gökhan', status: 'office', note: '', date: todayStr(), time: '09:02' },
  { id: 'c3', person: 'Leyla', status: 'remote', note: 'Available all day, campaign deadline', date: todayStr(), time: '09:15' },
  { id: 'c4', person: 'Pınar', status: 'office', note: 'Platform demo at 11am', date: todayStr(), time: '08:30' },
  { id: 'c5', person: 'Seda', status: 'remote', note: 'Field visits in the afternoon', date: todayStr(), time: '09:30' },
];

export const DEMO_PRIORITIES = [
  {
    id: 'p1', person: 'Leyla', week: getMonday(new Date()),
    priorities: ['Finalize Q1 campaign brief', 'Social media content calendar', 'Press release for partnership', 'Review brand guidelines update'],
    status: ['done', 'in-progress', 'todo', 'in-progress'],
  },
  {
    id: 'p2', person: 'Pınar', week: getMonday(new Date()),
    priorities: ['Website migration testing', 'CRM integration review', 'Analytics dashboard setup'],
    status: ['in-progress', 'todo', 'done'],
  },
  {
    id: 'p3', person: 'Seda', week: getMonday(new Date()),
    priorities: ['Local partner meetings', 'Community event planning', 'Monthly field report'],
    status: ['in-progress', 'in-progress', 'todo'],
  },
  {
    id: 'p4', person: 'Esra', week: getMonday(new Date()),
    priorities: ['Investor update', 'Hiring plan review', 'Team retreat follow-up'],
    status: ['done', 'in-progress', 'todo'],
  },
  {
    id: 'p5', person: 'Gökhan', week: getMonday(new Date()),
    priorities: ['TeamHub deployment', 'Q1 budget review', 'Performance review cycle'],
    status: ['in-progress', 'done', 'todo'],
  },
];

export const DEMO_MESSAGES = [
  { id: 'm1', person: 'Esra', text: 'Great work on the partnership announcement everyone! Let\'s keep the momentum going this week. 🎉', time: new Date(Date.now() - 3600000 * 2).toISOString(), channel: 'general', pinned: true },
  { id: 'm2', person: 'Leyla', text: 'Campaign assets are ready for review in the shared drive. Please take a look before Wednesday.', time: new Date(Date.now() - 3600000 * 5).toISOString(), channel: 'marketing', pinned: false },
  { id: 'm3', person: 'Pınar', text: 'New CRM integration is live on staging. Please test your workflows and flag any issues.', time: new Date(Date.now() - 3600000 * 8).toISOString(), channel: 'general', pinned: false },
  { id: 'm4', person: 'Gökhan', text: 'Reminder: Timesheets due by Friday 5pm. Use the tracker: https://karakusgokhan.github.io/timesheet-tracker/', time: new Date(Date.now() - 3600000 * 24).toISOString(), channel: 'general', pinned: true },
  { id: 'm5', person: 'Seda', text: 'Local partner meeting went well — notes shared in the drive. Leyla, can we sync on the press angle?', time: new Date(Date.now() - 3600000 * 26).toISOString(), channel: 'marketing', pinned: false },
];

export const DEMO_CALENDAR = [
  { id: 'e1', title: 'All Hands', time: '10:00', duration: 60, day: 1, color: '#D4634B', attendees: 'Everyone' },
  { id: 'e2', title: 'Marketing Sync', time: '14:00', duration: 45, day: 1, color: '#8B5CF6', attendees: 'Leyla, Seda, Esra' },
  { id: 'e3', title: 'Digital Platform Review', time: '11:00', duration: 60, day: 2, color: '#10B981', attendees: 'Pınar, Gökhan' },
  { id: 'e4', title: '1:1 Esra ↔ Leyla', time: '15:00', duration: 30, day: 3, color: '#D4634B', attendees: 'Esra, Leyla' },
  { id: 'e5', title: 'Campaign Review', time: '10:00', duration: 45, day: 3, color: '#8B5CF6', attendees: 'Leyla, Pınar, Seda' },
  { id: 'e6', title: 'Local Ops Planning', time: '09:00', duration: 60, day: 4, color: '#F59E0B', attendees: 'Seda, Esra' },
  { id: 'e7', title: 'Team Lunch', time: '12:30', duration: 60, day: 5, color: '#EC4899', attendees: 'Everyone' },
  { id: 'e8', title: 'Content Calendar Review', time: '16:00', duration: 30, day: 5, color: '#8B5CF6', attendees: 'Leyla, Gökhan' },
];
