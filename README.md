# AppartManage Notifications Backend

Lightweight Node/Express service that sends Firebase Cloud Messaging (FCM) pushes.

## Setup

1) Copy `env.example` to `.env` and fill in:
- `PORT` (default 4000)
- `ALLOWED_ORIGINS` (comma-separated)
- Either `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON string) **or** `FIREBASE_SERVICE_ACCOUNT_PATH` (file path).

2) Install dependencies:
```bash
npm install
```

3) Run:
```bash
npm run dev   # with nodemon
# or
npm start
```

## Endpoints
- `GET /health` — health check
- `POST /api/devices` — register a device token for a user  
  Body: `{ "userId": "123", "token": "...", "platform": "ios|android|web" }`
- `POST /api/notify/token` — send to one token  
  Body: `{ "token": "...", "title": "...", "body": "...", "data": { "type": "...", ... } }`
- `POST /api/notify/user` — send to all tokens for a user (stored in-memory; swap for DB)  
  Body: `{ "userId": "123", "title": "...", "body": "...", "data": { ... } }`
- `POST /api/notify/topic` — send to a topic  
  Body: `{ "topic": "apartment_123", "title": "...", "body": "...", "data": { ... } }`

## Notes
- Token storage is in-memory; replace `src/tokenStore.js` with a database for production.
- Client must POST tokens to `/api/devices` after login and on app start when the token changes.
- Data payloads are stringified if not strings, so you can send objects safely.

