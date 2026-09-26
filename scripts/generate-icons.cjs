const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create PNG buffer from raw RGBA pixel data
function createPNG(width, height, getPixel) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines with filter byte 0
  const rowLength = width * 4 + 1;
  const rawData = Buffer.alloc(rowLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 calculation for PNG chunks
function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < body.length; i++) {
    crc = crcTable[(crc ^ body[i]) & 0xff] ^ (crc >>> 8);
  }
  crc = (crc ^ 0xffffffff) >>> 0;

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([length, body, crcBuf]);
}

// Generate aesthetic Lake Ripple icon (circular waves like stone dropped into calm water)
function drawRipplePixel(x, y, width, height, isMaskable = false) {
  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = (y - cy) * 1.05; // slightly elliptic water surface perspective
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxR = width * 0.48;

  // Background deep dark lake water with subtle cyan/blue depth gradient
  const bgGradY = y / height;
  let bgR = Math.round(5 + 8 * (1 - dist / maxR));
  let bgG = Math.round(9 + 14 * (1 - dist / maxR));
  let bgB = Math.round(18 + 26 * (1 - dist / maxR));

  // If not maskable, round squircle container corners
  if (!isMaskable) {
    const rx = width * 0.22;
    const qx = Math.max(0, Math.abs(x - cx) - (cx - rx));
    const qy = Math.max(0, Math.abs(y - cy) - (cy - rx));
    const cornerDist = Math.sqrt(qx * qx + qy * qy);
    if (cornerDist > rx) {
      return [0, 0, 0, 0]; // transparent outside squircle
    }
  }

  // Wave ripple radii (expanding circular wave fronts)
  // Wave 1: 0.14 * width
  // Wave 2: 0.24 * width
  // Wave 3: 0.34 * width
  // Wave 4: 0.43 * width
  const waveR1 = width * 0.14;
  const waveR2 = width * 0.24;
  const waveR3 = width * 0.34;
  const waveR4 = width * 0.43;

  // Normalized angle for specular highlight (light coming from top-left ~ -135 deg)
  const angle = Math.atan2(dy, dx);
  const lightAngle = -2.35; // top-left
  const lightFactor = Math.max(0, Math.cos(angle - lightAngle));
  const shadowFactor = Math.max(0, Math.cos(angle - (lightAngle + Math.PI)));

  let highlight = 0;
  let shadow = 0;
  let glowColor = [34, 211, 238]; // #22d3ee cyan

  // Calculate distance to each concentric wave crest
  const waves = [
    { r: waveR1, width: width * 0.045, intensity: 1.0, color: [255, 255, 255] },
    { r: waveR2, width: width * 0.040, intensity: 0.85, color: [103, 232, 249] },
    { r: waveR3, width: width * 0.035, intensity: 0.65, color: [56, 189, 248] },
    { r: waveR4, width: width * 0.030, intensity: 0.45, color: [99, 102, 241] },
  ];

  for (const w of waves) {
    const d = Math.abs(dist - w.r);
    if (d < w.width) {
      const factor = (1 - d / w.width);
      // Bell curve profile
      const bell = factor * factor;
      // Sunlight reflection on crest
      const crestLight = bell * (0.4 + 0.6 * lightFactor) * w.intensity;
      const crestShadow = bell * (0.3 * shadowFactor) * w.intensity;

      if (crestLight > highlight) {
        highlight = crestLight;
        glowColor = w.color;
      }
      if (crestShadow > shadow) {
        shadow = crestShadow;
      }
    }
  }

  // Central Stone / Droplet Impact Point
  const impactR = width * 0.065;
  if (dist < impactR) {
    const dropFactor = 1 - dist / impactR;
    const dropBell = dropFactor * dropFactor;
    // Brilliant white and cyan droplet core
    const rDrop = Math.round(255 * dropBell + bgR * (1 - dropBell));
    const gDrop = Math.round(255 * dropBell * 0.95 + bgG * (1 - dropBell));
    const bDrop = Math.round(255 * dropBell * 0.9 + bgB * (1 - dropBell));
    return [rDrop, gDrop, bDrop, 255];
  }

  // Little splash droplets in air around impact
  const dX = dx / width;
  const dY = dy / height;
  const splashDots = [
    { x: -0.06, y: -0.04, r: 0.012 },
    { x: 0.07, y: -0.03, r: 0.010 },
    { x: 0.00, y: -0.08, r: 0.013 },
    { x: 0.01, y: 0.07, r: 0.011 },
  ];
  for (const dot of splashDots) {
    const dotDist = Math.sqrt((dX - dot.x) ** 2 + (dY - dot.y) ** 2);
    if (dotDist < dot.r) {
      return [255, 255, 255, 255];
    }
  }

  // Blend lake surface + wave highlights & shadows
  let finalR = bgR * (1 - shadow * 0.5);
  let finalG = bgG * (1 - shadow * 0.5);
  let finalB = bgB * (1 - shadow * 0.5);

  if (highlight > 0) {
    finalR = Math.min(255, finalR + glowColor[0] * highlight);
    finalG = Math.min(255, finalG + glowColor[1] * highlight);
    finalB = Math.min(255, finalB + glowColor[2] * highlight);
  }

  return [Math.round(finalR), Math.round(finalG), Math.round(finalB), 255];
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192
console.log('Generating pwa-192x192.png (water ripples)...');
const png192 = createPNG(192, 192, (x, y, w, h) => drawRipplePixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// Generate 512x512
console.log('Generating pwa-512x512.png (water ripples)...');
const png512 = createPNG(512, 512, (x, y, w, h) => drawRipplePixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// Generate maskable 512x512
console.log('Generating pwa-maskable-512x512.png (water ripples maskable)...');
const pngMaskable = createPNG(512, 512, (x, y, w, h) => drawRipplePixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

// Generate apple-touch-icon 180x180
console.log('Generating apple-touch-icon.png (water ripples)...');
const pngApple = createPNG(180, 180, (x, y, w, h) => drawRipplePixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

console.log('All water ripple icons generated successfully!');
