# PeerConnect: Frontend

React 19 + Vite + Tailwind CSS v4 + daisyUI 5 + Zustand + Socket.IO client. Deployed to **Vercel**.
Full setup: see the [main README](../README.md).

## Quick start

Start the backend first (`cd ../backend && npm run dev`), then in a second terminal:

```bash
npm install
npm run dev        # http://localhost:5173
```

Vite proxies `/api` and `/socket.io` to `http://localhost:5001` (see `vite.config.js`). No `.env` needed locally.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build on :4173 |

## Deploying to Vercel

1. `vercel.json`: replace `YOUR-RENDER-SERVICE` with your Render service name; commit and push.
2. Import the repo on Vercel with **Root Directory = `frontend`** (preset: Vite).
3. Environment variable: `VITE_SOCKET_URL=https://<your-service>.onrender.com`.

`vercel.json` forwards `/api/*` to Render (keeping the auth cookie first-party) and serves `index.html` for every other path so client-side routes survive a refresh.

## State management (Zustand)

| Store | Holds |
|---|---|
| `authStore` | user, signup/login/logout/profile, socket lifecycle, online user ids |
| `chatStore` | contacts, open conversation, messages, optimistic sending, receipts, typing, socket handlers |
| `themeStore` | theme mode + accent, saved to localStorage |

Components subscribe with narrow selectors (e.g. `useChatStore((s) => s.typing[id])`), so a new message re-renders the message list, not the whole app.

## Design system: "Ember on Ink"

Tokens live in `src/styles/index.css`: daisyUI themes `ember-dark` / `ember-light`, five accent colours, and extra tokens exposed as Tailwind utilities:

| Utility | Use |
|---|---|
| `bg-base-100`, `bg-surface-1/2/3` | Background, panels, cards/received bubbles, hover/inputs |
| `border-line`, `border-line-strong` | Borders (surfaces are separated by borders, not shadows) |
| `text-fg`, `text-fg-muted`, `text-fg-subtle` | Text levels |
| `bg-primary`, `bg-primary-subtle`, `hover:bg-primary-hover` | Accent |
| `bg-bubble-out`, `text-bubble-out-fg` | Your message bubbles |
| `text-meta` (13px), `text-message` (15px) | Metadata, message text |
| `rounded-bubble`, `animate-message-in`, `shadow-pop` | Bubbles, entrance animation, popovers |
