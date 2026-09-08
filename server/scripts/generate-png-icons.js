const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table for PNG chunk checksums
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const crcInput = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createCareerOSPng(size, isMaskable = false) {
  // Scanlines: each row has 1 filter byte (0) + size * 4 (RGBA)
  const rowBytes = 1 + size * 4;
  const rawData = Buffer.alloc(rowBytes * size);

  // Background colors
  const bgR = isMaskable ? 0x7C : 0x08;
  const bgG = isMaskable ? 0x6C : 0x0B;
  const bgB = isMaskable ? 0xF2 : 0x14;

  const cardR = 0x7C;
  const cardG = 0x6C;
  const cardB = 0xF2;

  const cornerRadius = size * 0.22;
  const cardInset = isMaskable ? size * 0.15 : size * 0.08;
  const cardCornerRadius = size * 0.18;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Check outer rounded box
      let inOuter = true;
      if (!isMaskable) {
        const dx = Math.max(0, Math.max(cornerRadius - x, x - (size - cornerRadius)));
        const dy = Math.max(0, Math.max(cornerRadius - y, y - (size - cornerRadius)));
        if (dx * dx + dy * dy > cornerRadius * cornerRadius) {
          inOuter = false;
        }
      }

      if (!inOuter) {
        // Transparent outside rounded corner
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Check inner emblem card
      const cxMin = cardInset;
      const cxMax = size - cardInset;
      const cyMin = cardInset;
      const cyMax = size - cardInset;

      let inCard = false;
      if (x >= cxMin && x <= cxMax && y >= cyMin && y <= cyMax) {
        const cdx = Math.max(0, Math.max(cardCornerRadius - (x - cxMin), (x - cxMin) - (cxMax - cxMin - cardCornerRadius)));
        const cdy = Math.max(0, Math.max(cardCornerRadius - (y - cyMin), (y - cyMin) - (cyMax - cyMin - cardCornerRadius)));
        if (cdx * cdx + cdy * cdy <= cardCornerRadius * cardCornerRadius) {
          inCard = true;
        }
      }

      // Check checkmark emblem
      // Segment 1: from (0.28 * size, 0.50 * size) to (0.44 * size, 0.65 * size)
      // Segment 2: from (0.44 * size, 0.65 * size) to (0.72 * size, 0.35 * size)
      const p1x = size * 0.30;
      const p1y = size * 0.50;
      const p2x = size * 0.44;
      const p2y = size * 0.64;
      const p3x = size * 0.70;
      const p3y = size * 0.36;
      const strokeHalf = size * 0.045;

      function distToSegment(px, py, ax, ay, bx, by) {
        const l2 = (bx - ax) * (bx - ax) + (by - ay) * (by - ay);
        if (l2 === 0) return Math.hypot(px - ax, py - ay);
        let t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
      }

      const d1 = distToSegment(x, y, p1x, p1y, p2x, p2y);
      const d2 = distToSegment(x, y, p2x, p2y, p3x, p3y);
      const inStroke = Math.min(d1, d2) <= strokeHalf;

      if (inStroke) {
        // Crisp white checkmark
        rawData[pxOffset] = 0xFF;
        rawData[pxOffset + 1] = 0xFF;
        rawData[pxOffset + 2] = 0xFF;
        rawData[pxOffset + 3] = 0xFF;
      } else if (inCard || isMaskable) {
        rawData[pxOffset] = cardR;
        rawData[pxOffset + 1] = cardG;
        rawData[pxOffset + 2] = cardB;
        rawData[pxOffset + 3] = 0xFF;
      } else {
        rawData[pxOffset] = bgR;
        rawData[pxOffset + 1] = bgG;
        rawData[pxOffset + 2] = bgB;
        rawData[pxOffset + 3] = 0xFF;
      }
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression: Deflate
  ihdrData[11] = 0; // Filter: 0
  ihdrData[12] = 0; // Interlace: None

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.resolve(__dirname, '../client/public/icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Generate 192x192 PNG
fs.writeFileSync(path.join(outDir, 'icon-192x192.png'), createCareerOSPng(192, false));
console.log('Generated icon-192x192.png');

// Generate 512x512 PNG
fs.writeFileSync(path.join(outDir, 'icon-512x512.png'), createCareerOSPng(512, false));
console.log('Generated icon-512x512.png');

// Generate 512x512 Maskable PNG
fs.writeFileSync(path.join(outDir, 'icon-maskable-512x512.png'), createCareerOSPng(512, true));
console.log('Generated icon-maskable-512x512.png');
