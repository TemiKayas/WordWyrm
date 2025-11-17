# Phaser Editor Preview Setup

## Current Limitation

Phaser Editor's browser preview works best for **visual scene testing**, not full TypeScript game testing with complex imports.

## Options for Testing:

### Option 1: Visual UI Testing (Current - Works Now)
**What you can test:**
- ✅ UI Scene layout
- ✅ Button positions
- ✅ Visual design
- ✅ Asset display

**How to test:**
1. Open `UIScene.scene` in Phaser Editor
2. Use the **Scene Editor** (not browser preview)
3. Visually edit UI elements
4. Changes save automatically

**Limitation:** No gameplay, just visual design

---

### Option 2: Full Game Testing (Recommended)
**Use WordWyrm's development server:**

```bash
# Terminal
npm run dev
```

Then visit: `http://localhost:3000/play/td`

**What you get:**
- ✅ Full game with all features
- ✅ Mock quiz data (via GameDataService)
- ✅ All tower defense mechanics
- ✅ Real gameplay testing
- ✅ Hot reload on changes

---

### Option 3: Standalone Build (Advanced)

Create a standalone build that works in Phaser Editor:

1. **Compile TypeScript to JavaScript:**
```bash
cd lib/tower-defense/editor
npx tsc UIScene.ts --module es2020 --target es2020
```

2. **Open in browser:**
Navigate to `http://127.0.0.1:3470/editor/external/index.html`

---

## Recommended Workflow

### For UI Design:
1. **Edit** UIScene.scene in Phaser Editor (visual)
2. **Save** (auto-compiles to UIScene.ts)
3. **Test** in Phaser Editor Scene view (layout only)

### For Gameplay Testing:
1. **Run** `npm run dev`
2. **Visit** `http://localhost:3000/play/td`
3. **Test** full game with GameDataService
4. **Iterate** quickly with hot reload

### For Full Integration:
1. **Make changes** in Phaser Editor
2. **Test layout** in Scene Editor
3. **Test gameplay** in npm run dev
4. **Deploy** when ready

---

## Why This Limitation?

Phaser Editor's browser preview:
- ❌ Can't easily handle TypeScript modules
- ❌ Can't import from parent directories (../tower-defense/)
- ❌ Limited to single-scene previews
- ✅ Great for visual scene editing
- ✅ Perfect for asset preview
- ✅ Fast for UI layout iteration

**Solution:** Use `npm run dev` for full game testing!

---

## Quick Test Commands

```bash
# Visual UI design (Phaser Editor)
# Just open UIScene.scene and edit visually

# Full game testing (Recommended)
npm run dev
# Then visit: http://localhost:3000/play/td

# Build for production
npm run build
```

---

## What You Already Have Working

✅ **GameDataService** - Dual environment support
✅ **Mock quiz data** - 10 questions ready
✅ **Session saving** - localStorage/database
✅ **Full game** - Playable in npm run dev
✅ **UI Scene** - Editable in Phaser Editor

**Everything works - just use npm run dev for full testing!** 🚀
