# Tower Defense UI Update Guide - Phaser Editor Approach

## Overview
This guide explains how to update the Tower Defense UI to match the SVG wireframes using Phaser Editor (the proper way to edit `.scene` files).

## Step 1: Prepare SVG Button Assets

I've created individual SVG button components in `public/assets/game/ui/`:
- `button-tower.svg` - 77x100px rounded rectangle for tower buttons (tan #FAE6C3)
- `button-small.svg` - 117x33px rounded rectangle for lives/gold displays
- `button-start-wave.svg` - 146x38px rounded rectangle for wave button
- `button-start-game.svg` - 252x72px rounded rectangle for start game button (lime green #95B607)

All buttons have:
- Brown stroke (#473025, 3px width)
- Proper rounded corners (rx values from SVG wireframes)

## Step 2: Convert SVG to PNG (Optional)

Phaser works best with PNG/WebP images. You can either:

**Option A: Use SVGs directly** (Phaser 3 supports SVG)
- Add SVGs to `public/assets/game/ui/`
- Reference them in `asset-pack.json`

**Option B: Convert to PNG** (recommended for performance)
Use an online tool or command line:
```bash
# Using Inkscape (if installed)
inkscape button-tower.svg --export-filename=button-tower.png --export-width=77 --export-height=100

# Or use an online SVG to PNG converter
```

## Step 3: Add Assets to Asset Pack

Edit `lib/tower-defense/asset-pack.json` and add the new button images:

```json
{
  "section1": {
    "files": [
      {
        "url": "assets/game/ui/button-tower.png",
        "type": "image",
        "key": "ui_button_tower"
      },
      {
        "url": "assets/game/ui/button-small.png",
        "type": "image",
        "key": "ui_button_small"
      },
      {
        "url": "assets/game/ui/button-start-wave.png",
        "type": "image",
        "key": "ui_button_start_wave"
      },
      {
        "url": "assets/game/ui/button-start-game.png",
        "type": "image",
        "key": "ui_button_start_game"
      }
    ]
  }
}
```

## Step 4: Open Phaser Editor

1. Open Phaser Editor 3
2. Load the WordWyrm project
3. Navigate to `lib/tower-defense/editor/`
4. Open `UIScene.scene`

## Step 5: Replace Rectangle Buttons with Image Buttons

For each button element in the scene:

### Start Game Button
1. Delete the existing `Rectangle` object named `startGameButtonBg`
2. Add new `Image` object:
   - **Texture Key**: `ui_button_start_game`
   - **Position**: x=960, y=540
   - **Origin**: 0.5, 0.5
   - **Interactive**: Yes, with hitArea matching button size
   - **Name**: `startGameButtonBg`

### Tower Buttons (Ballista, Trebuchet, Knight, etc.)
1. Delete existing `Rectangle` backgrounds
2. Add `Image` objects:
   - **Texture Key**: `ui_button_tower`
   - **Positions**: Keep same x/y coordinates
   - **Origin**: 0.5, 0.5
   - **Interactive**: Yes
   - Keep the same names (`ballistaBtnBg`, `trebuchetBtnBg`, etc.)

### Small Buttons (Lives, Gold, Wave)
1. Delete existing `Rectangle` backgrounds
2. Add `Image` objects:
   - **Texture Key**: `ui_button_small` or `ui_button_start_wave`
   - Keep existing positions
   - **Origin**: 0.5, 0.5
   - Keep same names

## Step 6: Update Background Color

In `UIScene.scene` or scene settings:
1. Set scene background color to `#FFFAF2` (cream from wireframe)
2. This replaces the grass map background

## Step 7: Export from Phaser Editor

1. Save the scene in Phaser Editor
2. Phaser Editor will automatically regenerate `UIScene.ts`
3. The TypeScript file will have proper `Image` types instead of `Rectangle`

## Step 8: Test in Game

```bash
npm run dev
```

Navigate to `/play/td` and verify:
- All buttons have rounded corners
- Colors match wireframe (tan buttons, brown borders)
- Start game button is lime green
- Background is cream colored
- All interactions still work

## Alternative: Quick Manual Update (Not Recommended)

If you don't have Phaser Editor, you can manually edit `UIScene.scene` JSON:

```json
{
  "type": "Image",
  "id": "ballistaBtnBg",
  "label": "ballistaBtnBg",
  "texture": {
    "key": "ui_button_tower"
  },
  "x": 548,
  "y": 980,
  "originX": 0.5,
  "originY": 0.5
}
```

Then run the Phaser Editor code generator or manually update `UIScene.ts`.

## Benefits of This Approach

✅ **Non-destructive**: Works with Phaser Editor workflow
✅ **Reusable**: Button SVGs can be used across scenes
✅ **Maintainable**: Changes in Phaser Editor update TypeScript automatically
✅ **Scalable**: SVG buttons scale cleanly for responsive design
✅ **Performance**: Single image per button type (9-slice scaling possible)

## Notes

- Keep the original `.scene` files in version control
- Don't manually edit generated `UIScene.ts` - use Phaser Editor
- Button icons (ballista, wizard, etc.) stay the same - just backgrounds change
- Text labels overlay on top of button images

## Color Reference from SVG Wireframes

- **Button Background**: #FAE6C3 (tan/beige)
- **Button Stroke**: #473025 (brown), 3px width
- **Start Game Button**: #95B607 (lime green)
- **Scene Background**: #FFFAF2 (cream)
- **Text Color**: #473025 (brown)
