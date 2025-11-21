import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Image dimensions (same as game canvas)
const WIDTH = 1440;
const HEIGHT = 810;

// Stage colors
const STAGE_1_COLOR = { r: 139, g: 195, b: 74 };  // Green grass
const STAGE_2_COLOR = { r: 141, g: 110, b: 99 };  // Brown damaged
const STAGE_3_COLOR = { r: 62, g: 39, b: 35 };    // Dark burned

async function generateBackground(color, filename) {
  try {
    await sharp({
      create: {
        width: WIDTH,
        height: HEIGHT,
        channels: 3,
        background: color
      }
    })
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'assets', 'game', filename));

    console.log(`✓ Generated ${filename}`);
  } catch (error) {
    console.error(`✗ Error generating ${filename}:`, error);
  }
}

async function main() {
  console.log('Generating stage background images...');
  await generateBackground(STAGE_1_COLOR, 'Stage1_BG.png');
  await generateBackground(STAGE_2_COLOR, 'Stage2_BG.png');
  await generateBackground(STAGE_3_COLOR, 'Stage3_BG.png');
  console.log('Done!');
}

main();
