# How to Run

## First time setup
```
npm install
```

## Start dev servers (both at once)
```
npm run dev
```
- **API server**: http://localhost:3001
- **App (mobile-optimized)**: http://localhost:5173

## Mobile testing
Open http://localhost:5173 in Chrome or Safari on your phone (must be on the same WiFi).
Or use the network URL shown in the Vite terminal output.

To install as a home screen app:
- **iPhone**: Open in Safari → Share → Add to Home Screen
- **Android**: Open in Chrome → menu → Install app

## Seed database (runs automatically on first startup)
```
cd server && npm run seed
```
