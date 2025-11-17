# Tower Defense Game Assets

All visual assets for the Phaser tower defense game are now available in this directory for Phaser Editor access.

## Asset Inventory

### 🏰 Tower Sprites (6 files)
- `Tower_Ballista.PNG` - Ballista tower (purple, fast fire)
- `Tower_Catapult.PNG` - Trebuchet tower (orange, slow powerful shots)
- `Tower_MeleeBack.PNG` - Knight tower back layer
- `Tower_MeleeFront.PNG` - Knight tower front layer (layered sprite)
- `Tower_WizardBack.PNG` - Archmage tower back layer
- `Tower_WizardFront.PNG` - Archmage tower front layer (layered sprite)

### 🎯 Projectile Sprites (6 files)
- `Projectile_Ballista.PNG` - Ballista arrow
- `Projectile_Catapult.PNG` - Trebuchet boulder
- `Projectile_Archer.PNG` - Alternative arrow
- `Projectile_Cannon.PNG` - Cannon ball
- `Projectile_Melee.PNG` - Melee slash effect
- `Projectile_Wizard.PNG` - Wizard spell projectile

### 🎨 UI Icons (9 files)
- `Icon_Ballista.PNG` - Ballista button icon
- `Icon_Catapult.PNG` - Trebuchet button icon
- `Icon_Melee.PNG` - Knight button icon
- `Icon_Wizard.PNG` - Archmage button icon
- `Icon_PowerUp.PNG` - Training Camp icon
- `Icon_Lightning.PNG` - Lightning ability icon
- `Icon_Freeze.PNG` - Freeze ability icon
- `Icon_Select.PNG` - Selection indicator

### 🗺️ Stage Backgrounds (8 files)
- `Stage1_BG.png` - Grassland stage (Rounds 1-20)
- `Stage2_BG.png` - Desert stage (Rounds 21-40)
- `Stage3_BG.png` - Ice stage (Rounds 41+)
- `stage2.png` - Stage 2 variant
- `stage3.png` - Stage 3 variant
- `GrassMap.PNG` - Grass texture
- `back.PNG` - Generic background layer
- `front.PNG` - Generic foreground layer

## Phaser Editor Usage

These assets are now accessible to Phaser Editor 2D for:
- ✅ Visual scene design
- ✅ Drag-and-drop asset placement
- ✅ Sprite previews in the editor
- ✅ Asset browser integration

## File Organization

**Location**: `lib/tower-defense/assets/`
**Source**: Copied from `public/assets/game/`
**Runtime Loading**: Game loads from `/assets/game/` at runtime
**Total Size**: ~2.9 MB (29 image files)

## Notes

- Mixed case extensions (.PNG vs .png) are intentional - preserve as-is
- Melee and Wizard towers use dual-layer sprites for depth
- All icons are sized for UI buttons
- Stage backgrounds are optimized for 1280x720 game resolution
