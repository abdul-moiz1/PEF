import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createRoundFavicon() {
  const inputPath = path.join(__dirname, '../attached_assets/image_1764668370239.png');
  const outputPath = path.join(__dirname, '../client/public/favicon.png');
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    const size = Math.min(metadata.width, metadata.height);
    const radius = size / 2;
    
    const circleShape = Buffer.from(
      `<svg width="${size}" height="${size}">
        <circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/>
      </svg>`
    );
    
    await sharp(inputPath)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .composite([{
        input: circleShape,
        blend: 'dest-in'
      }])
      .png()
      .toFile(outputPath);
    
    console.log('Round favicon created successfully at:', outputPath);
  } catch (error) {
    console.error('Error creating favicon:', error);
    process.exit(1);
  }
}

createRoundFavicon();
