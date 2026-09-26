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

// Generate aesthetic Resonance sonic disc icon
function drawIconPixel(x, y, width, height, isMaskable = false) {
  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxR = width * 0.46;

  // Background deep dark purple/slate gradient
  const bgGrad = y / height;
  let bgR = Math.round(10 + 12 * bgGrad);
  let bgG = Math.round(11 + 14 * bgGrad);
  let bgB = Math.round(18 + 24 * bgGrad);

  // If not maskable, round corners
  if (!isMaskable) {
    const rx = width * 0.22;
    // Box rounded rect distance test
    const qx = Math.max(0, Math.abs(dx) - (cx - rx));
    const qy = Math.max(0, Math.abs(dy) - (cy - rx));
    const cornerDist = Math.sqrt(qx * qx + qy * qy);
    if (cornerDist > rx) {
      return [0, 0, 0, 0]; // transparent outside rounded rect
    }
  }

  // Draw sonic vinyl grooves and glowing resonance rings
  const angle = Math.atan2(dy, dx);

  // Ring 1 (outer cyan/purple sound ring)
  const ring1Dist = Math.abs(dist - maxR * 0.76);
  if (ring1Dist < width * 0.035) {
    const glow = 1 - ring1Dist / (width * 0.035);
    // Cyan to magenta gradient along angle
    const t = (angle + Math.PI) / (2 * Math.PI);
    const rRing = Math.round(0 * (1 - t) + 240 * t);
    const gRing = Math.round(242 * (1 - t) + 60 * t);
    const bRing = Math.round(254 * (1 - t) + 180 * t);
    return [
      Math.round(bgR * (1 - glow) + rRing * glow),
      Math.round(bgG * (1 - glow) + gRing * glow),
      Math.round(bgB * (1 - glow) + bRing * glow),
      255,
    ];
  }

  // Ring 2 (mid sound ring)
  const ring2Dist = Math.abs(dist - maxR * 0.52);
  if (ring2Dist < width * 0.025) {
    const glow = 1 - ring2Dist / (width * 0.025);
    return [
      Math.round(bgR * (1 - glow) + 160 * glow),
      Math.round(bgG * (1 - glow) + 100 * glow),
      Math.round(bgB * (1 - glow) + 250 * glow),
      255,
    ];
  }

  // Center vinyl disc core
  if (dist <= maxR * 0.35) {
    if (dist <= maxR * 0.12) {
      // Inner glowing core
      return [255, 60, 100, 255];
    }
    if (dist <= maxR * 0.15) {
      // Core ring
      return [255, 255, 255, 255];
    }
    // Vinyl center label
    return [24, 25, 38, 255];
  }

  // Play triangle symbol in center
  const triX = dx / (maxR * 0.18);
  const triY = dy / (maxR * 0.18);
  if (triX >= -0.3 && triX <= 0.5 && Math.abs(triY) <= (0.5 - triX * 0.5)) {
    return [255, 255, 255, 255];
  }

  // Grooves (fine rings)
  if (dist > maxR * 0.35 && dist < maxR * 0.95) {
    const groove = Math.sin(dist * 0.8) > 0.85;
    if (groove) {
      bgR = Math.min(255, bgR + 15);
      bgG = Math.min(255, bgG + 15);
      bgB = Math.min(255, bgB + 25);
    }
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate 192x192
console.log('Generating pwa-192x192.png...');
const png192 = createPNG(192, 192, (x, y, w, h) => drawIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// Generate 512x512
console.log('Generating pwa-512x512.png...');
const png512 = createPNG(512, 512, (x, y, w, h) => drawIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// Generate maskable 512x512
console.log('Generating pwa-maskable-512x512.png...');
const pngMaskable = createPNG(512, 512, (x, y, w, h) => drawIconPixel(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

// Generate apple-touch-icon 180x180
console.log('Generating apple-touch-icon.png...');
const pngApple = createPNG(180, 180, (x, y, w, h) => drawIconPixel(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

// Generate favicon.ico (can also just copy png or serve png)
console.log('Icons generated successfully.');
