/**
 * Airtable API utility for TeamHub
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://airtable.com and create a new base called "TeamHub"
 * 2. Create the tables listed in TABLES below with the specified fields
 * 3. Go to https://airtable.com/create/tokens and create a Personal Access Token
 *    - Scopes: data.records:read, data.records:write
 *    - Access: Your TeamHub base
 * 4. Copy your Base ID from the Airtable URL: https://airtable.com/BASE_ID/...
 * 5. Enter both in the TeamHub Settings panel
 * 
 * TABLE SCHEMAS:
 * 
 * TeamMembers:
 *   - Name (Single line text) — e.g. "Esra"
 *   - Role (Single line text) — e.g. "Founder"
 *   - Color (Single line text) — e.g. "#D4634B"
 *   - Avatar (Single line text) — e.g. "E" (first letter)
 * 
 * DailyCheckIns:
 *   - Person (Single line text) — team member name
 *   - Status (Single select) — "office", "remote", "out"
 *   - Note (Single line text) — optional note
 *   - Date (Date) — YYYY-MM-DD
 *   - Time (Single line text) — e.g. "09:15"
 * 
 * WeeklyPriorities:
 *   - Person (Single line text)
 *   - Week (Date) — Monday of the week, YYYY-MM-DD
 *   - Priority (Single line text) — one priority per record
 *   - Status (Single select) — "todo", "in-progress", "done"
 *   - SortOrder (Number) — for ordering priorities
 * 
 * Messages:
 *   - Person (Single line text)
 *   - Text (Long text)
 *   - Channel (Single select) — "general", "marketing", etc.
 *   - Pinned (Checkbox)
 *   - CreatedAt (Created time) — auto-populated by Airtable
 */

const AIRTABLE_API = 'https://api.airtable.com/v0';

/**
 * Generic Airtable fetch with error handling
 */
export async function airtableFetch(config, table, params = {}) {
  if (!config.apiKey || !config.baseId) return null;

  const url = new URL(`${AIRTABLE_API}/${config.baseId}/${encodeURIComponent(table)}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.append(k, String(v));
    }
  });

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Airtable error: ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    console.error(`[Airtable] Fetch from ${table} failed:`, e.message);
    return null;
  }
}

/**
 * Create a record in Airtable
 */
export async function airtableCreate(config, table, fields) {
  if (!config.apiKey || !config.baseId) return null;

  try {
    const res = await fetch(
      `${AIRTABLE_API}/${config.baseId}/${encodeURIComponent(table)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Airtable create error: ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    console.error(`[Airtable] Create in ${table} failed:`, e.message);
    return null;
  }
}

/**
 * Update a record in Airtable
 */
export async function airtableUpdate(config, table, recordId, fields) {
  if (!config.apiKey || !config.baseId) return null;

  try {
    const res = await fetch(
      `${AIRTABLE_API}/${config.baseId}/${encodeURIComponent(table)}/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Airtable update error: ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    console.error(`[Airtable] Update in ${table} failed:`, e.message);
    return null;
  }
}

/**
 * Delete a record in Airtable
 */
export async function airtableDelete(config, table, recordId) {
  if (!config.apiKey || !config.baseId) return null;

  try {
    const res = await fetch(
      `${AIRTABLE_API}/${config.baseId}/${encodeURIComponent(table)}/${recordId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${config.apiKey}` },
      }
    );
    if (!res.ok) throw new Error(`Airtable delete error: ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(`[Airtable] Delete in ${table} failed:`, e.message);
    return null;
  }
}

/**
 * Check if Airtable is configured and reachable
 */
export async function testConnection(config) {
  if (!config.apiKey || !config.baseId) {
    return { ok: false, error: 'API key and Base ID are required' };
  }

  try {
    const res = await fetch(
      `${AIRTABLE_API}/${config.baseId}/TeamMembers?maxRecords=1`,
      { headers: { Authorization: `Bearer ${config.apiKey}` } }
    );
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, error: 'Invalid API key' };
    if (res.status === 404) return { ok: false, error: 'Base not found — check your Base ID' };
    if (res.status === 422) return { ok: false, error: 'TeamMembers table not found — please create it in Airtable' };
    return { ok: false, error: `Unexpected error: ${res.status}` };
  } catch (e) {
    return { ok: false, error: 'Network error — check your connection' };
  }
}
