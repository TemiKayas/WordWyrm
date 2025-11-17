# Dual-Environment Testing Guide

## ✅ Implementation Complete!

The game now works in **both Phaser Editor and WordWyrm** with zero changes to the user experience.

---

## 🧪 How to Test

### Test 1: Phaser Editor (Mock Data)

**Steps:**
1. **Open** Phaser Editor
2. **Open** `lib/tower-defense/editor/UIScene.scene`
3. **Click** the "Play" button (or press F12)
4. **Expected behavior:**
   - Game loads with 10 mock quiz questions
   - Fully playable tower defense
   - Console shows: `[TowerDefenseScene] No quiz provided, fetching from GameDataService...`
   - Console shows: `Running in: phaser-editor`
   - Session saves to **localStorage**

**Console Log Example:**
```
[TowerDefenseScene] No quiz provided, fetching from GameDataService...
[TowerDefenseScene] Environment: { environment: 'phaser-editor', hostname: '', url: 'file://...' }
[GameDataService] Running in Phaser Editor - using mock quiz data
[TowerDefenseScene] Quiz loaded: 10 questions
```

---

### Test 2: WordWyrm Production (Real Data)

**Steps:**
1. **Run** `npm run dev`
2. **Navigate** to `http://localhost:3000/play/td`
3. **Expected behavior:**
   - Game loads with real quiz from teacher's upload
   - Fully playable as before
   - Console shows: `[TowerDefenseScene] Using quiz from WordWyrm (passed via init)`
   - Session saves to **database** (via API)

**Console Log Example:**
```
[TowerDefenseScene] Using quiz from WordWyrm (passed via init)
```

---

## 🎮 What Changed

### For Phaser Editor Users (NEW!):
- ✅ Can play the full game without running `npm run dev`
- ✅ Uses 10 general knowledge mock questions
- ✅ Saves progress to browser localStorage
- ✅ Completely offline - no backend needed
- ✅ Faster iteration for UI/gameplay testing

### For WordWyrm Users (NO CHANGE):
- ✅ Same experience as before
- ✅ Real quiz data from database
- ✅ Progress saved to database
- ✅ Full feature parity
- ✅ Zero breaking changes

---

## 🔍 Verification Checklist

### Phaser Editor Test:
- [ ] Game launches in preview
- [ ] Quiz popups appear with mock questions
- [ ] Tower placement works
- [ ] Wave progression works
- [ ] Game over shows score
- [ ] Console shows "phaser-editor" environment
- [ ] Check localStorage for saved session:
  ```javascript
  // In browser console:
  localStorage.getItem('towerDefenseSession')
  ```

### WordWyrm Test:
- [ ] Game loads at /play/td
- [ ] Quiz uses real teacher data
- [ ] Session saves to database
- [ ] No console errors
- [ ] Game plays exactly as before
- [ ] Score tracked correctly

---

## 📊 Environment Detection

The game automatically detects which environment it's running in:

### Phaser Editor Detection:
```typescript
// Detected when:
- hostname === '' (file:// protocol)
- hostname === 'localhost'
- hostname === '127.0.0.1'
- URL doesn't contain 'wordwyrm'
```

### WordWyrm Detection:
```typescript
// Detected when:
- URL contains 'wordwyrm'
- Running on production domain
```

---

## 🐛 Troubleshooting

### Issue: Quiz not loading in Phaser Editor
**Check:**
1. Open browser console (F12)
2. Look for error messages
3. Verify `GameDataService.ts` exists in `lib/tower-defense/`

**Solution:**
```bash
# Verify file exists
ls lib/tower-defense/GameDataService.ts
```

### Issue: WordWyrm shows mock data instead of real quiz
**Check:**
1. Console should show "Using quiz from WordWyrm"
2. If not, check that quiz is being passed in `/play/td/page.tsx`

**Solution:**
Ensure quiz is passed to component:
```typescript
<TowerDefenseGame quiz={quizData} />
```

### Issue: Session not saving
**Phaser Editor:**
- Check browser console for errors
- Verify localStorage is enabled
- Check: `localStorage.getItem('towerDefenseSession')`

**WordWyrm:**
- Check network tab for API calls
- Verify `/api/game-session` endpoint exists

---

## 📝 Mock Quiz Questions

The GameDataService provides 10 mock questions:
1. Capital of France
2. Basic math (2+2)
3. Planet closest to Sun
4. Largest ocean
5. Romeo and Juliet author
6. Speed of light
7. Number of continents
8. Chemical symbol for gold
9. Mona Lisa painter
10. Largest mammal

These ensure consistent testing in Phaser Editor!

---

## 🚀 Next Steps

### Recommended Testing Order:
1. ✅ **First:** Test in Phaser Editor
   - Verify mock data loads
   - Play through a few waves
   - Check game over screen shows score
   - Verify localStorage has session data

2. ✅ **Second:** Test in WordWyrm
   - Run `npm run dev`
   - Play at `/play/td`
   - Verify real quiz data
   - Check database has session record

3. ✅ **Third:** Compare both
   - Gameplay should be identical
   - Only difference is quiz source
   - Verify no breaking changes

### Future Enhancements:
- [ ] Add debug menu in Phaser Editor
- [ ] Custom quiz upload for testing
- [ ] Difficulty selector for mock quizzes
- [ ] Leaderboard sync (if implemented)

---

## 💡 Tips for Development

### Phaser Editor Workflow:
1. Edit UIScene visually
2. Test immediately with "Play" button
3. Iterate quickly without backend

### Debugging:
```javascript
// Check current environment
gameDataService.getEnvironmentInfo()

// View saved session
localStorage.getItem('towerDefenseSession')

// Clear saved session
localStorage.removeItem('towerDefenseSession')
```

### Switching Environments:
The detection is automatic - just test in different contexts:
- File system = Phaser Editor mode
- localhost:3000 = WordWyrm mode (if URL doesn't have 'wordwyrm')
- production.wordwyrm.com = WordWyrm mode

---

**Happy Testing! 🎮**

If you encounter any issues, check the console logs first - they show detailed information about environment detection and data loading.
