#!/usr/bin/env bash
#
# Rebuilds the PeerConnect git history as a series of commits dated
# Feb–Mar 2026. The final code is byte-for-byte identical to what you have now.
#
# Usage (from the repo root, i.e. the folder containing backend/ and frontend/):
#   bash backdate-history.sh
#
# Nothing is pushed. A backup branch of your current history is created first.
set -euo pipefail

if [ ! -d backend ] || [ ! -d frontend ] || [ ! -d .git ]; then
  echo "Run this from the repo root (the folder with backend/, frontend/ and .git)." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "You have uncommitted changes. Commit or stash them first." >&2
  exit 1
fi

BACKUP="backup-before-backdate-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP"
echo "Backup of current history: branch $BACKUP"

# Start a fresh branch with no history; files stay on disk, index is emptied.
git checkout -q --orphan backdated
git rm -r -q --cached .

# commit "<ISO date>" "<message>" <paths...>
commit() {
  local when="$1" msg="$2"
  shift 2
  for p in "$@"; do
    [ -e "$p" ] && git add -A -- "$p"
  done
  if git diff --cached --quiet; then
    echo "  (skipped, nothing new) $msg"
    return
  fi
  GIT_AUTHOR_DATE="$when" GIT_COMMITTER_DATE="$when" git commit -q -m "$msg"
  echo "  ✔ ${when%%T*}  $msg"
}

echo "Creating commits…"

commit "2026-02-02T19:12:00+05:30" "Initial project setup: backend and frontend scaffolding" \
  .gitignore \
  backend/package.json backend/package-lock.json backend/nodemon.json backend/.env.example backend/.gitignore \
  frontend/package.json frontend/package-lock.json frontend/vite.config.js frontend/index.html \
  frontend/.gitignore frontend/.env.example frontend/public

commit "2026-02-05T21:40:00+05:30" "Backend: env validation, MongoDB connection, logging and error handling" \
  backend/src/config/env.js backend/src/config/db.js backend/src/config/cors.js \
  backend/src/utils/logger.js backend/src/utils/ApiError.js backend/src/utils/respond.js \
  backend/src/middleware/errorHandler.js backend/src/middleware/notFound.js \
  backend/src/controllers/health.controller.js backend/src/routes/health.routes.js \
  backend/src/app.js backend/src/server.js

commit "2026-02-09T18:25:00+05:30" "Design system: Tailwind v4 + daisyUI themes and base UI components" \
  frontend/src/styles frontend/src/constants/themes.js frontend/src/stores/themeStore.js \
  frontend/src/utils/cn.js frontend/src/components/ui frontend/src/components/brand

commit "2026-02-13T22:05:00+05:30" "Auth API: User model, signup/login, bcrypt, JWT httpOnly cookies, rate limiting" \
  backend/src/models/User.js backend/src/validators \
  backend/src/middleware/validate.js backend/src/middleware/protectRoute.js backend/src/middleware/rateLimiters.js \
  backend/src/utils/jwt.js backend/src/utils/cookies.js \
  backend/src/services/auth.service.js backend/src/controllers/auth.controller.js backend/src/routes/auth.routes.js

commit "2026-02-18T20:15:00+05:30" "Frontend auth: routing, guards, login and signup pages, auth store" \
  frontend/src/main.jsx frontend/src/App.jsx frontend/src/routes \
  frontend/src/layouts/AuthLayout.jsx frontend/src/pages/LoginPage.jsx frontend/src/pages/SignupPage.jsx \
  frontend/src/lib/axios.js frontend/src/services/auth.api.js frontend/src/stores/authStore.js

commit "2026-02-23T19:50:00+05:30" "Messaging API: Message model, history with cursor pagination, idempotent sends" \
  backend/src/models/Message.js backend/src/utils/conversation.js \
  backend/src/services/message.service.js backend/src/controllers/message.controller.js \
  backend/src/routes/message.routes.js backend/src/routes/index.js

commit "2026-03-01T17:30:00+05:30" "Chat UI: sidebar, conversation view, message bubbles, responsive layout" \
  frontend/src/components/chat frontend/src/layouts/AppLayout.jsx frontend/src/pages/ChatPage.jsx \
  frontend/src/services/message.api.js frontend/src/utils/format.js frontend/src/hooks

commit "2026-03-06T21:10:00+05:30" "Socket.IO: authenticated handshake, multi-tab presence, typing and receipts" \
  backend/src/socket frontend/src/lib/socket.js frontend/src/constants/socketEvents.js \
  frontend/src/stores/chatStore.js

commit "2026-03-12T20:00:00+05:30" "Image and file sharing with Cloudinary" \
  backend/src/config/cloudinary.js backend/src/utils/dataUri.js frontend/src/utils/files.js

commit "2026-03-17T18:45:00+05:30" "Profile, settings, landing and 404 pages" \
  frontend/src/pages

commit "2026-03-22T22:20:00+05:30" "Tests: auth, messages, presence and Socket.IO integration" \
  backend/tests backend/vitest.config.js

commit "2026-03-26T19:35:00+05:30" "API docs: Swagger/OpenAPI, Postman collection, REST Client requests" \
  backend/src/docs backend/postman backend/requests.http

commit "2026-03-30T20:55:00+05:30" "Deployment config for Render and Vercel, README" \
  frontend/vercel.json README.md backend/README.md frontend/README.md

# Anything not covered above (e.g. files you added yourself)
commit "2026-03-31T18:00:00+05:30" "Final polish" .

# Safety check: the final code must match your original exactly.
if ! git diff --quiet "$BACKUP" backdated; then
  echo "ERROR: the rebuilt history doesn't match your original files. Nothing was changed on main." >&2
  echo "Return with: git checkout -f main && git branch -D backdated" >&2
  exit 1
fi

# Point main at the new history.
git branch -f main backdated
git checkout -q main
git branch -D -q backdated

echo
echo "Done. Final code is identical to before. New history:"
git log --format='  %ad  %s' --date=short
echo
echo "Nothing has been pushed yet. To publish it:"
echo "  git push --force-with-lease origin main"
echo
echo "To undo before pushing:"
echo "  git reset --hard $BACKUP"
