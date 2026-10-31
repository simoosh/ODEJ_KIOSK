// Lecture des atomes de premier niveau d'un MP4. Sans dépendance.
import { closeSync, fstatSync, openSync, readSync } from 'node:fs';

/** true si l'atome moov précède mdat : la vidéo démarre alors en streaming depuis le CDN. */
export function isFaststart(path) {
  const fd = openSync(path, 'r');
  try {
    const { size } = fstatSync(fd);
    const header = Buffer.alloc(16);
    let offset = 0;
    while (offset + 8 <= size) {
      readSync(fd, header, 0, 16, offset);
      const type = header.toString('latin1', 4, 8);
      if (type === 'moov') return true;
      if (type === 'mdat') return false;
      const short = header.readUInt32BE(0);
      const length = short === 1 ? Number(header.readBigUInt64BE(8)) : short;
      if (length < 8) return false;
      offset += length;
    }
    return false;
  } finally {
    closeSync(fd);
  }
}
