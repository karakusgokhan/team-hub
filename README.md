# ⚡ TeamHub

Internal team communication hub — daily check-ins, weekly priorities, message board, and team calendar with WhatsApp integration.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173/team-hub/
```

## Deploy to GitHub Pages

```bash
# 1. Create a repo called "team-hub" on GitHub

# 2. Push this code
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/karakusgokhan/team-hub.git
git push -u origin main

# 3. Deploy
npm run deploy

# Your app will be live at: https://karakusgokhan.github.io/team-hub/
```

## Connect to Airtable

1. Create a base called **TeamHub** in [Airtable](https://airtable.com)
2. Create these tables:

| Table | Fields |
|-------|--------|
| **TeamMembers** | Name (text), Role (text), Color (text), Avatar (text) |
| **DailyCheckIns** | Person (text), Status (single select: office/remote/out), Note (text), Date (date), Time (text) |
| **WeeklyPriorities** | Person (text), Week (date), Priority (text), Status (single select: todo/in-progress/done), SortOrder (number) |
| **Messages** | Person (text), Text (long text), Channel (single select: general/marketing), Pinned (checkbox), CreatedAt (created time) |

3. Create a [Personal Access Token](https://airtable.com/create/tokens) with `data.records:read` and `data.records:write` scopes
4. Open TeamHub → Settings → enter your token and Base ID → Test Connection

## WhatsApp Integration

**Built-in:** Every tab has a green "Share to WhatsApp" button that opens WhatsApp with a pre-formatted message. Pick your team group chat and send.

**Automation (optional):** Use [Make.com](https://make.com) with your Business WhatsApp to:
- Send morning check-in reminders automatically
- Forward pinned announcements to WhatsApp
- Send weekly priority summaries every Monday

## Project Structure

```
team-hub/
├── src/
│   ├── components/
│   │   ├── CheckIn.jsx      ← Daily check-in tab
│   │   ├── Priorities.jsx   ← Weekly priorities tab
│   │   ├── MessageBoard.jsx ← Message board tab
│   │   ├── Calendar.jsx     ← Team calendar tab
│   │   ├── Settings.jsx     ← Settings modal (Airtable config)
│   │   └── Shared.jsx       ← Avatar, badges, WhatsApp button
│   ├── utils/
│   │   ├── airtable.js      ← Airtable API functions
│   │   ├── config.js        ← Team members, channels, table names
│   │   ├── demoData.js      ← Demo data (used without Airtable)
│   │   └── helpers.js       ← Date formatting, WhatsApp share
│   ├── App.jsx              ← Main app component
│   ├── main.jsx             ← Entry point
│   └── index.css            ← Global styles
├── index.html
├── vite.config.js
└── package.json
```

## Editing Team Members

Edit `src/utils/config.js` to add/remove team members:

```javascript
export const TEAM_MEMBERS = [
  { id: '1', name: 'Esra', role: 'Founder', avatar: 'E', color: '#D4634B' },
  // add more...
];
```

## Tech Stack

- **React 18** + **Vite** (fast dev & build)
- **Airtable** (backend/database)
- **GitHub Pages** (hosting)
- **WhatsApp wa.me links** (sharing)

---

Built with Claude for the team. 🚀
