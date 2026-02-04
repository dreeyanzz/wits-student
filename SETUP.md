# Student Portal Setup

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## Available Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run eject` - Eject from Create React App (⚠️ irreversible)

## What's Fixed

- ✅ Removed that cringe start.bat file
- ✅ Using proper npm scripts now
- ✅ Dev server runs on `npm run dev`

## Project Structure

```
student-portal/
├── src/
│   ├── components/
│   │   ├── Login.jsx           ✅ Done
│   │   └── SessionRestoreOverlay.jsx
│   ├── services/
│   │   └── auth.js
│   ├── styles/
│   │   └── Login.css
│   ├── App.js
│   └── index.js
├── public/
└── package.json
```

## Migration Progress

### ✅ Part 1: Login
- [x] Login component converted to React
- [x] Auth service implemented
- [x] Session restore overlay
- [x] Error handling

### 🔄 Part 2-7: To be implemented
- [ ] Dashboard
- [ ] Schedule
- [ ] Grades
- [ ] View Professors
- [ ] View Course Offerings
- [ ] Change Password

---

Just run `npm install` then `npm run dev` and you're good to go! 🚀
