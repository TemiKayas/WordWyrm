# Tower Defense - Phaser Editor Project

This is the reorganized Tower Defense game project, structured for Phaser Editor 2D integration.

## 📁 Project Structure

```
lib/tower-defense/
├── scenes/
│   └── TowerDefenseScene.ts          # Main game scene
├── managers/
│   ├── ProjectileManager.ts          # Handles projectile spawning and movement
│   ├── CombatManager.ts              # Damage calculations and combat logic
│   ├── EnemyManager.ts               # Enemy spawning and movement
│   ├── TowerManager.ts               # Tower placement and stats
│   ├── AbilityManager.ts             # Special abilities (Lightning, etc.)
│   └── StageManager.ts               # Stage transitions and map changes
├── config/
│   ├── GameConfig.ts                 # Global game configuration
│   ├── Stage1Config.ts               # Stage 1 (Rounds 1-20) map layout
│   ├── Stage2Config.ts               # Stage 2 (Rounds 21-40) dual helix paths
│   └── Stage3Config.ts               # Stage 3 (Rounds 41+) complex loop
├── types/
│   └── GameTypes.ts                  # TypeScript type definitions
├── editor/
│   ├── UIScene.scene                 # Phaser Editor scene file (NEW UI)
│   ├── UIScene.ts                    # Generated TypeScript from UIScene.scene
│   ├── Scene.scene                   # Test scene
│   ├── Scene.ts                      # Generated from test scene
│   └── EditorScene.ts                # Generated scene (old)
├── assets/                           # LOCAL copy of game assets for Phaser Editor
│   ├── README.md                     # Asset documentation
│   ├── Tower_*.PNG                   # Tower sprites (6 files)
│   ├── Projectile_*.PNG              # Projectile sprites (6 files)
│   ├── Icon_*.PNG                    # UI icons (9 files)
│   └── Stage*_BG.png                 # Stage backgrounds (8 files)
└── EditorSceneLoader.ts              # Helper for loading editor scenes
```

## 🔄 Status

**Current**: This is a COPY of the working tower defense game.
**Original**: Files remain in `lib/phaser/` for backup.

## 🎯 Purpose

This reorganized structure allows Phaser Editor 2D to:
- ✅ Access all game files in one place
- ✅ Edit and compile scenes
- ✅ Generate UI layouts visually
- ✅ Maintain clean separation of concerns

## 📝 Next Steps

### 1. Update Phaser Editor Project Settings
Point Phaser Editor to this directory:
- **Project Root**: `lib/tower-defense/`
- **Assets**: `../../public/assets/` (relative path)
- **Output**: `editor/` (generated TypeScript)

### 2. Fix Import Paths
All imports need to be updated to use the new structure:

**Old**:
```typescript
import { Tower } from '../types/GameTypes';
import { TowerManager } from '../managers/TowerManager';
```

**New**:
```typescript
import { Tower } from '@/lib/tower-defense/types/GameTypes';
import { TowerManager } from '@/lib/tower-defense/managers/TowerManager';
```

### 3. Update Game Integration
Update `components/game/TowerDefenseGame.tsx` to import from new location:

```typescript
const TowerDefenseSceneModule = await import('@/lib/tower-defense/scenes/TowerDefenseScene');
const UISceneModule = await import('@/lib/tower-defense/editor/UIScene');
```

## 🚀 Workflow

### Editing in Phaser Editor:
1. Open `editor/UIScene.scene` in Phaser Editor
2. Visually design UI elements
3. Save → auto-generates `UIScene.ts`
4. Refresh game to see changes

### Code Changes:
1. Edit TypeScript files in `scenes/`, `managers/`, etc.
2. Build and test
3. Commit when ready

## ⚠️ Important Notes

- **DO NOT** delete original files in `lib/phaser/` yet
- This is a working copy for conversion
- Test thoroughly before removing originals
- Import paths need to be updated (see above)

## 📦 Files Copied

- **1** Scene file (TowerDefenseScene.ts)
- **6** Manager files
- **4** Config files
- **1** Types file
- **4** Editor scene files (UIScene.scene, UIScene.ts, Scene.scene, Scene.ts)
- **1** Helper file (EditorSceneLoader.ts)
- **29** Asset files (towers, projectiles, icons, backgrounds)
- **2** Documentation files (README.md)

**Total**: 48 files

---

**Created**: 2025-11-14
**Updated**: 2025-11-15 - Added assets directory
**Status**: ✅ Complete - Phaser Editor integration finished
