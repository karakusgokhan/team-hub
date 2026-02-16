/**
 * Team Configuration
 * 
 * Edit this file to update team members, channels, and other settings.
 * This is the single source of truth when Airtable is not connected.
 */

export const TEAM_MEMBERS = [
  { id: '1', name: 'Esra', role: 'Founder', avatar: 'E', color: '#D4634B' },
  { id: '2', name: 'Gökhan', role: 'Director', avatar: 'G', color: '#4B8BD4' },
  { id: '3', name: 'Leyla', role: 'Marketing & Communications', avatar: 'L', color: '#8B5CF6' },
  { id: '4', name: 'Pınar', role: 'Digital Development Manager', avatar: 'P', color: '#10B981' },
  { id: '5', name: 'Seda', role: 'Local Management', avatar: 'S', color: '#F59E0B' },
];

export const CHANNELS = ['general', 'marketing'];

/**
 * Airtable table names — must match what you create in Airtable
 */
export const AIRTABLE_TABLES = {
  teamMembers: 'TeamMembers',
  checkIns: 'DailyCheckIns',
  priorities: 'WeeklyPriorities',
  messages: 'Messages',
};

/**
 * Default Airtable config — users enter their own in Settings
 */
export const DEFAULT_AIRTABLE_CONFIG = {
  apiKey: '',
  baseId: '',
};
