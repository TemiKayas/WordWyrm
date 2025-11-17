# Making Tower Defense Fully Playable in Both Environments

## Overview

This guide explains how to make the game work in **both** Phaser Editor (for development/testing) and WordWyrm (for production users).

## Difficulty Assessment

**Overall: EASY to MODERATE (4-6 hours)**

### Breakdown:
- ✅ **Easy** (2 hours): Basic dual-environment setup with mock data
- 🟡 **Moderate** (4 hours): Full integration with both environments
- 🔴 **Optional** (2+ hours): Advanced features (cloud saves, leaderboards)

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Tower Defense Game                    │
│  (Works in both Phaser Editor & WordWyrm)      │
└───────────────┬─────────────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
  Phaser Editor      WordWyrm
  ┌──────────┐      ┌──────────┐
  │ Mock     │      │ Real     │
  │ Quiz     │      │ API      │
  │ Data     │      │ Calls    │
  ├──────────┤      ├──────────┤
  │ Local    │      │ Database │
  │ Storage  │      │ Sessions │
  └──────────┘      └──────────┘
```

---

## Implementation Steps

### Step 1: Update TowerDefenseScene to Use Data Service

**In `lib/tower-defense/scenes/TowerDefenseScene.ts`:**

```typescript
import { gameDataService, Quiz } from '@/lib/tower-defense/GameDataService';

export default class TowerDefenseScene extends Phaser.Scene {
  // ... existing properties ...

  async create() {
    // Environment detection
    const env = gameDataService.getEnvironmentInfo();
    console.log('Running in:', env.environment);

    // Load quiz data (works in both environments!)
    this.quizData = await gameDataService.getQuizData();

    // Rest of your create() code...
    this.scene.launch('UIScene');
    this.uiScene = this.scene.get('UIScene') as any;
    this.setupUIEventHandlers();

    // ... etc
  }

  async gameOver() {
    // Save session (works in both environments!)
    await gameDataService.saveGameSession({
      score: this.calculateScore(),
      waveNumber: this.waveNumber,
      gold: this.gold,
      lives: this.lives,
      towersPlaced: this.totalTowersPlaced,
      correctAnswers: this.totalCorrectAnswers
    });

    // Show game over screen...
  }

  calculateScore(): number {
    return (this.waveNumber * 100) +
           (this.gold * 2) +
           (this.totalCorrectAnswers * 50);
  }
}
```

### Step 2: Update Asset Loading

The game already loads assets correctly in both environments because:
- Phaser Editor uses the asset pack from the local directory
- WordWyrm loads from `/assets/game/` via the public folder

**No changes needed!** ✅

### Step 3: Handle Quiz Component

**Current**: Quiz data passed as prop to TowerDefenseGame component
**Updated**: Quiz data fetched inside the scene

**In `components/game/TowerDefenseGame.tsx`:**

```typescript
// AFTER (Works in both environments):
const TowerDefenseGame = ({ quiz }: { quiz?: Quiz }) => {
  // quiz is optional - scene will fetch it if not provided

  const initGame = async () => {
    const config = {
      // ... game config ...
      scene: [
        {
          key: 'TowerDefenseScene',
          class: TowerDefenseScene,
          data: { quizOverride: quiz } // Pass quiz if available
        },
        UIScene
      ]
    };
    // ...
  };
}
```

**In TowerDefenseScene:**

```typescript
async create() {
  // Check if quiz was passed from React component
  const quizOverride = this.scene.settings.data?.quizOverride;

  if (quizOverride) {
    // Use quiz from WordWyrm (passed via component)
    this.quizData = quizOverride;
  } else {
    // Fetch quiz (Phaser Editor or fallback)
    this.quizData = await gameDataService.getQuizData();
  }
}
```

### Step 4: Create Standalone HTML for Phaser Editor

**Create `lib/tower-defense/index.html`:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tower Defense - Phaser Editor Preview</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #2d2d2d;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    #game-container {
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.js"></script>
</head>
<body>
  <div id="game-container"></div>

  <script type="module">
    // Import your game scenes
    import TowerDefenseScene from './scenes/TowerDefenseScene.js';
    import UIScene from './editor/UIScene.js';

    const config = {
      type: Phaser.AUTO,
      width: 1280,
      height: 720,
      backgroundColor: '#2d2d2d',
      parent: 'game-container',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      },
      scene: [TowerDefenseScene, UIScene]
    };

    const game = new Phaser.Game(config);
  </script>
</body>
</html>
```

---

## Testing in Both Environments

### Testing in Phaser Editor:

1. **Open** `UIScene.scene` in Phaser Editor
2. **Click Play** (F12)
3. Game should:
   - ✅ Load with mock quiz questions
   - ✅ Show all UI elements
   - ✅ Be fully playable
   - ✅ Save progress to localStorage

**Console should show:**
```
[GameDataService] Running in Phaser Editor - using mock quiz data
Running in: phaser-editor
```

### Testing in WordWyrm:

1. **Run** `npm run dev`
2. **Navigate** to `/play/td`
3. Game should:
   - ✅ Load real quiz from database
   - ✅ Save progress to database
   - ✅ Work exactly as before
   - ✅ No breaking changes

**Console should show:**
```
[GameDataService] Running in WordWyrm - fetching quiz from API
Running in: wordwyrm
```

---

## Benefits of This Approach

### ✅ For Development:
- **Faster iteration**: Test in Phaser Editor without running full Next.js stack
- **Isolated testing**: Test game mechanics without backend dependencies
- **Visual debugging**: Use Phaser Editor's tools
- **No database needed**: Work offline with mock data

### ✅ For Production:
- **No changes to user experience**: WordWyrm users see no difference
- **Same codebase**: No separate versions to maintain
- **Backward compatible**: All existing features work
- **Easy deployment**: No additional configuration

### ✅ For Collaboration:
- **Designers can test**: Non-developers can preview UI changes
- **QA friendly**: Test without database setup
- **Demo ready**: Show game without full infrastructure

---

## What Stays the Same

✅ **Asset loading** - Works in both
✅ **Game mechanics** - No changes
✅ **UI rendering** - Identical in both
✅ **Performance** - Same Phaser engine
✅ **User experience** - Seamless in WordWyrm

---

## What's Different

### Phaser Editor:
- Uses mock quiz questions (10 general knowledge questions)
- Saves to localStorage instead of database
- No user authentication required
- Runs standalone (no Next.js server)

### WordWyrm:
- Uses real quiz from teacher's upload
- Saves to PostgreSQL database
- Requires user authentication
- Integrated with Next.js app

---

## Migration Checklist

- [ ] **Step 1**: Copy `GameDataService.ts` to project
- [ ] **Step 2**: Update TowerDefenseScene imports
- [ ] **Step 3**: Replace quiz fetch with `gameDataService.getQuizData()`
- [ ] **Step 4**: Add session saving with `gameDataService.saveGameSession()`
- [ ] **Step 5**: Make quiz prop optional in TowerDefenseGame component
- [ ] **Step 6**: Test in Phaser Editor (should use mock data)
- [ ] **Step 7**: Test in WordWyrm (should use real API)
- [ ] **Step 8**: Verify no breaking changes in production

---

## Advanced Features (Optional)

### Option 1: Remote Testing
Allow Phaser Editor to use real WordWyrm API:

```typescript
// In GameDataService.ts
isPhaserEditor(): boolean {
  // Add flag to use remote API even in Phaser Editor
  const forceAPI = localStorage.getItem('useRemoteAPI') === 'true';
  return !forceAPI && (/* existing checks */);
}
```

### Option 2: Custom Quiz Upload
Add UI in Phaser Editor to upload custom quiz JSON:

```typescript
// Allow pasting quiz JSON for testing
window.setCustomQuiz = (quizJson: string) => {
  localStorage.setItem('customQuiz', quizJson);
};
```

### Option 3: Difficulty Selector
Add environment-specific settings:

```typescript
// In Phaser Editor, add debug menu
if (gameDataService.isPhaserEditor()) {
  this.addDebugMenu(); // Difficulty, wave skip, infinite gold, etc.
}
```

---

## Troubleshooting

### Issue: Quiz not loading in Phaser Editor
**Solution**: Check browser console for errors. Ensure `GameDataService.ts` is imported correctly.

### Issue: Game works in Phaser Editor but breaks in WordWyrm
**Solution**: Make sure quiz prop is still being passed. Check environment detection logic.

### Issue: Assets not loading
**Solution**: Verify asset-pack.json paths are correct for both environments.

---

## Time Estimate

| Task | Time | Difficulty |
|------|------|------------|
| Create GameDataService | 30 min | Easy |
| Update TowerDefenseScene | 1 hour | Easy |
| Test in both environments | 1 hour | Easy |
| Fix any integration issues | 1-2 hours | Moderate |
| Add polish/debugging tools | 1 hour | Easy |
| **Total** | **4-6 hours** | **Easy-Moderate** |

---

## Conclusion

Making the game work in both Phaser Editor and WordWyrm is **definitely feasible** and **not very difficult**. The key is the abstraction layer (GameDataService) that handles environment differences transparently.

**Recommendation**: Implement this! It will significantly improve your development workflow while maintaining the same user experience in production.

---

**Next Steps:**
1. Review the `GameDataService.ts` file
2. Test the mock quiz in Phaser Editor
3. Integrate into TowerDefenseScene
4. Verify WordWyrm still works
5. Enjoy faster iteration! 🚀
