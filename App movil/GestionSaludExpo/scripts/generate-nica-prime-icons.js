/** Genera los iconos rasterizados que Expo/Android necesitan desde el SVG maestro. */
const path = require('path');
const sharp = require('../../../Backend/node_modules/sharp');

const projectRoot = path.resolve(__dirname, '..');
const source = path.join(projectRoot, 'src', 'Nica Prime Blanco.svg');
const assets = path.join(projectRoot, 'assets');

const transparentCanvas = (size) => ({
  create: {
    width: size,
    height: size,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
});

async function centeredLogo(sourceBuffer, canvasSize, logoSize, monochrome = false) {
  let pipeline = sharp(sourceBuffer).resize({
    width: logoSize,
    height: logoSize,
    fit: 'inside',
    withoutEnlargement: false,
  });
  if (monochrome) pipeline = pipeline.tint('#FFFFFF');
  const logo = await pipeline.png().toBuffer();
  return sharp(transparentCanvas(canvasSize))
    .composite([{ input: logo, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function main() {
  const trimmedLogo = await sharp(source, { density: 300 }).trim().png().toBuffer();
  const standardLogo = await centeredLogo(trimmedLogo, 1024, 820);
  const adaptiveForeground = await centeredLogo(trimmedLogo, 512, 340);
  const monochrome = await centeredLogo(trimmedLogo, 432, 286, true);

  await Promise.all([
    sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 4,
        background: '#FFFFFF',
      },
    })
      .composite([{ input: standardLogo, gravity: 'centre' }])
      .removeAlpha()
      .png()
      .toFile(path.join(assets, 'nica-prime-icon.png')),
    sharp(adaptiveForeground).toFile(path.join(assets, 'nica-prime-foreground.png')),
    sharp(monochrome).toFile(path.join(assets, 'nica-prime-monochrome.png')),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
