# Quick start (Windows)

## 1. Install Node.js
Use Node.js 20+.

## 2. Install dependencies
Open PowerShell in this folder:

```powershell
npm install
```

## 3. Start the app

```powershell
npm run dev
```

Open:

`http://localhost:5173`

## 4. Demo mode
You can run the prototype without MongoDB. If `MONGO_URI` is missing, the backend uses in-memory users and simulation history. This is for local/demo use only; data resets when the server restarts.

## 5. Persistent mode
Copy `server/.env.example` to `server/.env` and add a MongoDB Atlas connection string plus a strong `JWT_SECRET`. Restart the server.

## 6. What to test
1. Create account
2. Log out
3. Log in
4. Open Simulator
5. Run SIP scenario
6. Open F&O and verify the friction gate
7. Run F&O scenario
8. Open History
9. Open Learn and switch English/Tamil

## 7. Before public deployment
- Use MongoDB Atlas
- Set a strong JWT_SECRET
- Set NODE_ENV=production
- Configure HTTPS
- Configure production CLIENT_URL
- Replace demo fallback data with a verified/licensed market-data source
- Review financial/compliance language with an appropriate professional
