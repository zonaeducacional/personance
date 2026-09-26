// Client-side pure JavaScript ID3 tag and audio metadata extractor

export interface ParsedAudioMetadata {
  title: string;
  artist: string;
  album: string;
  year?: string;
  duration: number;
  coverUrl?: string;
}

export async function parseAudioFile(file: File): Promise<ParsedAudioMetadata> {
  const defaultMeta = parseFromFilename(file.name);
  let duration = 0;
  let coverUrl: string | undefined = undefined;
  let title = defaultMeta.title;
  let artist = defaultMeta.artist;
  let album = 'Álbum Desconhecido';
  let year = '';

  // 1. Get exact duration using HTMLAudioElement
  try {
    duration = await getAudioDuration(file);
  } catch {
    duration = 180;
  }

  // 2. Read first 128KB to parse ID3v2 tags (TIT2, TPE1, TALB, TYER, APIC)
  try {
    const buffer = await file.slice(0, 196608).arrayBuffer();
    const id3 = parseID3v2(buffer);
    if (id3) {
      if (id3.title) title = id3.title;
      if (id3.artist) artist = id3.artist;
      if (id3.album) album = id3.album;
      if (id3.year) year = id3.year;
      if (id3.coverBlob) {
        coverUrl = URL.createObjectURL(id3.coverBlob);
      }
    }
  } catch (err) {
    console.warn('ID3 parsing skipped or partial:', err);
  }

  // If no cover extracted, create a vibrant algorithmic cover
  if (!coverUrl) {
    coverUrl = generateCoverGradient(title, artist);
  }

  return {
    title,
    artist,
    album,
    year,
    duration: Math.round(duration),
    coverUrl,
  };
}

// Clean filename to extract artist and song title
function parseFromFilename(filename: string): { title: string; artist: string } {
  const cleanName = filename.replace(/\.(mp3|wav|ogg|m4a|flac|aac)$/i, '').trim();

  // Pattern: "Artist - Title" or "Artist - [Track] Title"
  if (cleanName.includes(' - ')) {
    const parts = cleanName.split(' - ');
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    };
  }

  // Pattern: "01. Title" or "01 Title"
  const trackNumMatch = cleanName.match(/^(\d{1,3}[\s._-]+)(.+)$/);
  if (trackNumMatch) {
    return {
      artist: 'Artista Local',
      title: trackNumMatch[2].trim(),
    };
  }

  return {
    artist: 'Artista Local',
    title: cleanName,
  };
}

// Extract audio duration
function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;

    audio.onloadedmetadata = () => {
      const dur = audio.duration;
      URL.revokeObjectURL(objectUrl);
      resolve(isFinite(dur) && dur > 0 ? dur : 180);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(180);
    };

    // Timeout fallback after 3 seconds
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      resolve(180);
    }, 3000);
  });
}

// Parse ID3v2 binary headers and text frames
function parseID3v2(buffer: ArrayBuffer): {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  coverBlob?: Blob;
} | null {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 10) return null;

  // Check ID3 header 'ID3'
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return null;
  }

  const version = bytes[3]; // e.g. 3 for ID3v2.3, 4 for ID3v2.4
  let offset = 10;
  const result: { title?: string; artist?: string; album?: string; year?: string; coverBlob?: Blob } = {};

  const decoder = new TextDecoder('utf-8', { fatal: false });
  const isoDecoder = new TextDecoder('iso-8859-1');

  while (offset + 10 < bytes.length) {
    // Read 4-character frame ID
    const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

    // Frame size
    let frameSize = 0;
    if (version === 4) {
      // Syncsafe int
      frameSize = (bytes[offset + 4] << 21) | (bytes[offset + 5] << 14) | (bytes[offset + 6] << 7) | bytes[offset + 7];
    } else {
      frameSize = (bytes[offset + 4] << 24) | (bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7];
    }

    if (frameSize <= 0 || offset + 10 + frameSize > bytes.length) break;

    const frameData = bytes.subarray(offset + 10, offset + 10 + frameSize);

    // Parse Text Frames
    if (frameId.startsWith('T') && frameId !== 'TXXX') {
      const encoding = frameData[0];
      const textBytes = frameData.subarray(1);
      let text = '';
      try {
        text = encoding === 0 ? isoDecoder.decode(textBytes) : decoder.decode(textBytes);
        text = text.replace(/\0+$/, '').trim();
      } catch {
        text = '';
      }

      if (frameId === 'TIT2') result.title = text;
      else if (frameId === 'TPE1' || frameId === 'TPE2') result.artist = text;
      else if (frameId === 'TALB') result.album = text;
      else if (frameId === 'TYER' || frameId === 'TDRC') result.year = text;
    }

    // Parse Attached Picture (APIC)
    if (frameId === 'APIC') {
      try {
        let p = 1;
        // MIME type
        let mime = '';
        while (p < frameData.length && frameData[p] !== 0) {
          mime += String.fromCharCode(frameData[p]);
          p++;
        }
        p++; // skip null
        const pictureType = frameData[p]; // 3 is cover front
        p++;
        // Skip description string
        while (p < frameData.length && frameData[p] !== 0) {
          p++;
        }
        p++; // skip null terminator

        if (p < frameData.length) {
          const imgBytes = frameData.subarray(p);
          const mimeType = mime.includes('png') ? 'image/png' : 'image/jpeg';
          result.coverBlob = new Blob([imgBytes], { type: mimeType });
        }
      } catch (err) {
        console.warn('APIC parsing error', err);
      }
    }

    offset += 10 + frameSize;
  }

  return result;
}

// Generate aesthetic vibrant vinyl SVG cover
export function generateCoverGradient(title: string, artist: string): string {
  const hues = [
    ['#4158D0', '#C850C0', '#FFCC70'],
    ['#0093E9', '#80D0C7', '#00416A'],
    ['#85FFBD', '#FFFB7D', '#0093E9'],
    ['#FBAB7E', '#F7CE68', '#FA709A'],
    ['#8EC5FC', '#E0C3FC', '#4158D0'],
    ['#08AEEA', '#2AF598', '#1e3c72'],
    ['#21D4FD', '#B721FF', '#2b5876'],
    ['#FA8BFF', '#2BD2FF', '#2BFF88'],
  ];

  // Hash title to pick consistent color
  let hash = 0;
  for (let i = 0; i < (title + artist).length; i++) {
    hash = (hash << 5) - hash + (title + artist).charCodeAt(i);
    hash |= 0;
  }
  const palette = hues[Math.abs(hash) % hues.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette[0]}"/>
        <stop offset="50%" stop-color="${palette[1]}"/>
        <stop offset="100%" stop-color="${palette[2]}"/>
      </linearGradient>
      <radialGradient id="v" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.8"/>
      </radialGradient>
    </defs>
    <rect width="500" height="500" fill="url(#bg)"/>
    <rect width="500" height="500" fill="url(#v)"/>
    
    <!-- Vinyl grooving circles -->
    <circle cx="250" cy="250" r="210" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/>
    <circle cx="250" cy="250" r="170" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <circle cx="250" cy="250" r="130" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="6 8"/>
    <circle cx="250" cy="250" r="80" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    
    <!-- Center Label -->
    <circle cx="250" cy="250" r="40" fill="#0d0f18"/>
    <circle cx="250" cy="250" r="12" fill="#ffffff" fill-opacity="0.9"/>
    
    <text x="36" y="420" font-family="system-ui, sans-serif" font-weight="800" font-size="28" fill="#ffffff" letter-spacing="1">
      ${escapeXml(title.slice(0, 24))}
    </text>
    <text x="36" y="452" font-family="system-ui, sans-serif" font-weight="500" font-size="16" fill="rgba(255,255,255,0.85)">
      ${escapeXml(artist.slice(0, 30))}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
