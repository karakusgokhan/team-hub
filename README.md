# HarmonyHub

A lightweight team operations hub built for small teams who want a single place for daily coordination — without the overhead of enterprise tools.

HarmonyHub is a private web app that lives at a single URL. Team members pick their name, check in each morning, share their weekly priorities, post messages, log decisions, track tasks, and see what's on the team calendar. All data is stored in your own Airtable base — no third-party accounts, no per-seat pricing.

---

## Live URL

**https://karakusgokhan.github.io/team-hub/**

---

## Features

### 📍 Check-in
Team members declare their status each morning — In Office, Remote, or Out — with an optional note. The full team's status for the day is visible at a glance. Includes a WhatsApp share button to broadcast the day's status.

### 🎯 Weekly Priorities
Each team member adds their top priorities for the week (Monday–Sunday). Items are marked as To Do, In Progress, or Done. Completed items stay visible but struck-through until the week ends. Navigate back to past weeks to review what was worked on. Priorities are stored per-person per-week in Airtable.

### 💬 Board
A simple team message board with channel support (General, Marketing). Messages can be pinned to the top. Each message has a per-post WhatsApp share button. Posts are sorted newest-first, with pinned messages always at the top.

### 📋 Decisions
A searchable log of team decisions. Each decision has a title, description, category (Product, Marketing, Operations, Finance, HR), decided-by field, date, and status (Active, Revised, Reversed). Useful as a record of why choices were made.

### ✅ Tasks
A task tracker with assignee, due date, priority (Low, Medium, High, Urgent), and status (To Do, In Progress, Done, Blocked). Filterable by status. Overdue tasks are highlighted. Each team member can see their own open tasks count in the header.

### 📅 Calendar
A team event calendar with both Week view and Month view. Supports all-day events, multi-day spanning events, and timed events with duration. Events display as colored blocks. Clicking a day opens a quick Add Event form. Clicking an event opens it for editing. Includes a WhatsApp share button for the week's schedule.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (via Vite) |
| Styling | Inline styles — no CSS framework |
| Data | Airtable REST API |
| Auth | None — name selection stored in `localStorage` |
| Hosting | GitHub Pages |
| Deployment | `gh-pages` npm package |

---

## Airtable Setup

The app uses **Base ID `appnajwI6eftRR7Vh`**. Create the following 7 tables in that base with these exact field names and types.

> **Field names are case-sensitive.** They must match exactly as listed.

---

### 1. `TeamMembers`
Used only for connection verification — the app reads 1 record on startup to confirm the API key works. No specific fields are required; just ensure the table exists.

| Field | Type | Notes |
|---|---|---|
| Name | Single line text | Optional, for your own reference |

---

### 2. `DailyCheckIns`
One record per person per day.

| Field | Type | Notes |
|---|---|---|
| `Person` | Single line text | Team member's name |
| `Date` | Date | Format: `YYYY-MM-DD` |
| `Status` | Single line text | `office`, `remote`, or `out` |
| `Note` | Single line text | Optional status note |
| `Time` | Single line text | Time of check-in (display only) |

---

### 3. `WeeklyPriorities`
One record per priority item per person per week.

| Field | Type | Notes |
|---|---|---|
| `Person` | Single line text | Team member's name |
| `Week` | Date | Monday of the week, format `YYYY-MM-DD` |
| `Priority` | Single line text | The priority text |
| `Status` | Single line text | `todo`, `in-progress`, or `done` |
| `SortOrder` | Number | Controls display order within the week |
| `CreatedBy` | Single line text | Written on creation |

---

### 4. `Messages`
One record per board message.

| Field | Type | Notes |
|---|---|---|
| `Person` | Single line text | Author's name |
| `Text` | Long text | Message content |
| `Channel` | Single line text | `general` or `marketing` |
| `Pinned` | Checkbox | Pinned messages appear at the top |
| `CreatedAt` | Date with time | Creation timestamp |

---

### 5. `Decisions`
One record per logged decision.

| Field | Type | Notes |
|---|---|---|
| `Title` | Single line text | Short decision title |
| `Description` | Long text | Full context or rationale |
| `DecidedBy` | Single line text | Name of the decision-maker |
| `Date` | Date | Format: `YYYY-MM-DD` |
| `Category` | Single line text | `product`, `marketing`, `operations`, `finance`, or `hr` |
| `Status` | Single line text | `active`, `revised`, or `reversed` |
| `CreatedBy` | Single line text | Written on creation |

---

### 6. `Tasks`
One record per task.

| Field | Type | Notes |
|---|---|---|
| `Title` | Single line text | Task name |
| `Description` | Long text | Optional details |
| `AssignedTo` | Single line text | Team member's name |
| `CreatedBy` | Single line text | Creator's name |
| `DueDate` | Date | Optional, format: `YYYY-MM-DD` |
| `Priority` | Single line text | `low`, `medium`, `high`, or `urgent` |
| `Status` | Single line text | `todo`, `in-progress`, `done`, or `blocked` |
| `CreatedAt` | Date with time | Creation timestamp |

---

### 7. `Events`
One record per calendar event.

| Field | Type | Notes |
|---|---|---|
| `Title` | Single line text | Event name |
| `Date` | Date | Start date, format: `YYYY-MM-DD` |
| `EndDate` | Date | End date for multi-day events (optional) |
| `AllDay` | Checkbox | When checked, hides time and duration fields |
| `StartTime` | Single line text | e.g. `10:00` — omitted for all-day events |
| `Duration` | Number | Duration in minutes — omitted for all-day events |
| `Attendees` | Single line text | e.g. `Everyone` or `Esra, Leyla` (optional) |
| `Color` | Single line text | Hex color code, e.g. `#6366F1` |
| `CreatedBy` | Single line text | Written on creation |

---

## How to Run Locally

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Clone the repository
git clone https://github.com/karakusgokhan/team-hub.git
cd team-hub

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173/team-hub/`.

No environment variables are required — Airtable credentials are entered through the in-app Settings panel and stored in `localStorage`.

---

## Deployment

The app deploys to GitHub Pages using the `gh-pages` package:

```bash
npm run deploy
```

This runs `vite build` to produce a production build in `/dist`, then publishes that directory to the `gh-pages` branch. GitHub Pages serves it from:

**https://karakusgokhan.github.io/team-hub/**

The `base: '/team-hub/'` setting in `vite.config.js` ensures all asset paths resolve correctly under the subdirectory.

---

## Settings — Connecting to Airtable

1. Open the app at the live URL and select your name
2. Click the **⚙** button in the top-right corner
3. Enter your credentials:
   - **Base ID:** `appnajwI6eftRR7Vh`
   - **Personal Access Token:** your Airtable PAT (starts with `pat...`)
4. Click **Save & Connect**

The header badge will change from **DEMO** to **LIVE** once the connection is verified. Credentials are saved in `localStorage` — each team member enters them once per device.

To generate a Personal Access Token: go to [airtable.com/create/tokens](https://airtable.com/create/tokens), create a token with **data.records:read** and **data.records:write** scopes, and grant it access to the `appnajwI6eftRR7Vh` base.

---

## Project Structure

```
team-hub/
├── src/
│   ├── components/
│   │   ├── Calendar.jsx      ← Team calendar (week + month view)
│   │   ├── CheckIn.jsx       ← Daily check-in tab
│   │   ├── Decisions.jsx     ← Decision log tab
│   │   ├── MessageBoard.jsx  ← Team message board tab
│   │   ├── Priorities.jsx    ← Weekly priorities tab
│   │   ├── Settings.jsx      ← Settings modal (Airtable config)
│   │   ├── Shared.jsx        ← Avatar, badges, WhatsApp button
│   │   ├── Tasks.jsx         ← Task tracker tab
│   │   └── UserSelector.jsx  ← Name picker on first load
│   ├── utils/
│   │   ├── airtable.js       ← Airtable fetch/create/update/delete
│   │   ├── config.js         ← Team members, channels, table names
│   │   ├── demoData.js       ← Empty initial state (no demo data)
│   │   └── helpers.js        ← Date helpers, WhatsApp share
│   ├── App.jsx               ← Root component, data loading, routing
│   ├── main.jsx              ← Entry point
│   └── index.css             ← Global styles + animations
├── index.html
├── vite.config.js
└── package.json
```

---

## Editing Team Members

Team members are defined in `src/utils/config.js`. To add or change team members, edit the `TEAM_MEMBERS` array and redeploy with `npm run deploy`.

```js
export const TEAM_MEMBERS = [
  { id: '1', name: 'Esra',   role: 'Founder',                     avatar: 'E', color: '#D4634B' },
  { id: '2', name: 'Gökhan', role: 'Director',                    avatar: 'G', color: '#4B8BD4' },
  { id: '3', name: 'Leyla',  role: 'Marketing & Communications',  avatar: 'L', color: '#8B5CF6' },
  { id: '4', name: 'Pınar',  role: 'Digital Development Manager', avatar: 'P', color: '#10B981' },
  { id: '5', name: 'Seda',   role: 'Local Management',            avatar: 'S', color: '#F59E0B' },
];
```

---

Built with Claude for the team.
