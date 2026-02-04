# Running the App

## Quick Start

### Option 1: Use Batch File (Easiest)
```
start.bat
```
or
```
dev.bat
```

### Option 2: Use NPM directly
```
npm start
```

### Option 3: If npm doesn't work in PowerShell
```
npx react-scripts start
```

## If You See "react-scripts is not recognized"

This is a PowerShell issue. Use one of these solutions:

1. **Run the batch file instead:**
   ```
   .\start.bat
   ```

2. **Use Command Prompt (cmd) instead of PowerShell:**
   - Open Command Prompt
   - Navigate to project: `cd C:\Users\dreeyanzz\Documents\dev\student-portal`
   - Run: `npm start`

3. **Use npx directly:**
   ```
   npx react-scripts start
   ```

## The App Should Open At

http://localhost:3000

## To Stop the Server

Press `Ctrl+C` in the terminal

## Common Issues

**Port 3000 already in use?**
```
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Module not found errors?**
```
npm install
```

**Nothing works?**
Close all terminals, restart your computer, then run `start.bat`
