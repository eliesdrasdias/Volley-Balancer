const sharp = require("sharp");
const path = require("node:path");

const WIDTH = 1200;
const HEIGHT = 630;
const OUT = path.join(__dirname, "..", "public", "og-image.jpg");

const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a1930"/><stop offset="1" stop-color="#004b8d"/>
    </linearGradient>
    <pattern id="lines" width="72" height="72" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <path d="M0 0V72" stroke="#fff" stroke-opacity=".035" stroke-width="2"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#lines)"/>
  <rect width="14" height="630" fill="#ffc107"/>
  <circle cx="1040" cy="360" r="235" fill="#ff7b00" opacity=".13"/>
  <circle cx="1080" cy="400" r="155" fill="#ffc107" opacity=".09"/>
  <g transform="translate(900 100)" fill="none" stroke="#ffc107" stroke-width="8" opacity=".9">
    <circle cx="100" cy="100" r="86"/>
    <path d="M14 100h172M100 14c-36 25-54 54-54 86s18 61 54 86m0-172c36 25 54 54 54 86s-18 61-54 86"/>
  </g>
  <text x="84" y="248" fill="#fff" font-family="Arial, sans-serif" font-size="60" font-weight="700">Times de vôlei</text>
  <text x="84" y="322" fill="#fff" font-family="Arial, sans-serif" font-size="60" font-weight="700">equilibrados em 1 clique</text>
  <rect x="88" y="369" width="76" height="6" rx="3" fill="#ffc107"/>
  <text x="88" y="429" fill="#dbeafe" font-family="Arial, sans-serif" font-size="27">Monte três times justos a partir da lista do WhatsApp.</text>
  <g transform="translate(88 477)" font-family="Arial, sans-serif" font-weight="700" fill="#fff">
    <rect width="228" height="52" rx="14" fill="#ffffff" fill-opacity=".13"/><text x="18" y="33" font-size="18">3 times equilibrados</text>
    <rect x="244" width="174" height="52" rx="14" fill="#ffffff" fill-opacity=".13"/><text x="260" y="33" font-size="18">18 jogadores</text>
  </g>
  <text x="88" y="588" fill="#bfdbfe" font-family="Arial, sans-serif" font-size="18">volei.eliesdras.dev.br</text>
</svg>`);

sharp(svg)
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(OUT)
  .then(({ width, height, size }) => {
    console.log(`Imagem gerada: ${OUT} (${width}x${height}, ${size} bytes)`);
  })
  .catch((error) => {
    console.error("Falha ao gerar og-image.jpg:", error);
    process.exitCode = 1;
  });
