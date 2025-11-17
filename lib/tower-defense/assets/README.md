# Tower Defense Game Assets

This directory contains all visual assets used by the Phaser tower defense game.

## Asset Categories

### Tower Sprites (6 files)
- `Tower_Ballista.PNG` - Ballista tower sprite
- `Tower_Catapult.PNG` - Trebuchet tower sprite
- `Tower_MeleeBack.PNG` - Knight tower back layer
- `Tower_MeleeFront.PNG` - Knight tower front layer
- `Tower_WizardBack.PNG` - Archmage tower back layer
- `Tower_WizardFront.PNG` - Archmage tower front layer

### Projectile Sprites (6 files)
- `Projectile_Ballista.PNG` - Ballista arrow projectile
- `Projectile_Catapult.PNG` - Trebuchet boulder projectile
- `Projectile_Archer.PNG` - Alternative arrow projectile
- `Projectile_Cannon.PNG` - Cannon projectile
- `Projectile_Melee.PNG` - Melee attack effect
- `Projectile_Wizard.PNG` - Wizard spell projectile

### UI Icons (9 files)
- `Icon_Ballista.PNG` - Ballista tower button icon
- `Icon_Catapult.PNG` - Trebuchet tower button icon
- `Icon_Melee.PNG` - Knight tower button icon
- `Icon_Wizard.PNG` - Archmage tower button icon
- `Icon_PowerUp.PNG` - Training Camp icon
- `Icon_Lightning.PNG` - Lightning ability icon
- `Icon_Freeze.PNG` - Freeze ability icon
- `Icon_Select.PNG` - Selection indicator icon

### Stage Backgrounds (8 files)
- `Stage1_BG.png` - Stage 1 background
- `Stage2_BG.png` - Stage 2 background
- `Stage3_BG.png` - Stage 3 background
- `stage2.png` - Stage 2 variant
- `stage3.png` - Stage 3 variant
- `GrassMap.PNG` - Grass map texture
- `back.PNG` - Generic background
- `front.PNG` - Generic foreground

## Notes

- **Original Location**: These assets are also available in `public/assets/game/`
- **Phaser Editor Access**: This local copy allows Phaser Editor 2D to reference assets directly
- **Case Sensitivity**: Note mixed case extensions (.PNG vs .png) - preserve as-is for compatibility
- **Layered Sprites**: Melee and Wizard towers use dual-layer sprites (back + front)

## Asset Loading

Assets are loaded in `TowerDefenseScene.ts` preload() method using keys:
- Towers: `tower_ballista`, `tower_catapult`, etc.
- Projectiles: `projectile_ballista`, `projectile_catapult`, etc.
- Backgrounds: `stage1_bg`, `stage2_bg`, `stage3_bg`

The game loads from the public directory at runtime (`/assets/game/`), but Phaser Editor can use these local copies for visual design.
