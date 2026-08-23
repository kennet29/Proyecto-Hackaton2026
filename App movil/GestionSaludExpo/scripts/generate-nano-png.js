/**
 * @file App movil/GestionSaludExpo/scripts/generate-nano-png.js
 * @description Implementa los elementos TypeScript de este módulo.
 */
const path = require('path');
const sharp = require('../../../Backend/node_modules/sharp');

const pairs = [
  ['Nano 14 de febrero.svg', 'nano-valentin.png'],
  ['Nano Gladiador.svg', 'nano-gladiador.png'],
  ['Nano Hallowen.svg', 'nano-halloween.png'],
  ['Nano Navideño.svg', 'nano-navideno.png'],
  ['Nano Patriota.svg', 'nano-patriota.png'],
  ['Nano Bienestar.svg', 'nano-bienestar.png'],
  ['Nano Gestion.svg', 'nano-gestion.png'],
  ['Nano Menu.svg', 'nano-menu.png'],
  ['Nano verde 75px.svg', 'nano-medico.png'],
];

const sourceDir = path.join(__dirname, '..', 'src', 'svg');
const outputDir = path.join(__dirname, '..', 'src', 'assets', 'nano');

Promise.all(
  pairs.map(([input, output]) =>
    sharp(path.join(sourceDir, input), { density: 300 })
      .resize(300, 300, { fit: 'contain' })
      .png()
      .toFile(path.join(outputDir, output)),
  ),
).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
