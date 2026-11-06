import { spawn } from 'node:child_process';
import path from 'node:path';

const ffmpeg = process.env.FOODCITY_FFMPEG || 'D:\\Python\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';

const filePath = process.argv[process.argv.length - 1];

function runFFmpeg(args) {
  return new Promise((resolve) => {
    const child = spawn(ffmpeg, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    child.stderr.on('data', b => err += b);
    child.on('close', () => resolve(err));
  });
}

const err = await runFFmpeg(['-hide_banner', '-i', filePath]);

let duration = 0;
const durMatch = err.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
if (durMatch) {
  const hours = parseFloat(durMatch[1]);
  const mins = parseFloat(durMatch[2]);
  const secs = parseFloat(durMatch[3]);
  duration = hours * 3600 + mins * 60 + secs;
}

const streams = [];

const streamMatches = err.matchAll(/Stream #0:\d+.*?: (Video|Audio): ([\w\d]+).*?(?:, (\d+)x(\d+))?/g);
for (const m of streamMatches) {
  const type = m[1].toLowerCase();
  let codec = m[2].toLowerCase();
  if (codec.includes('h264') || codec.includes('avc')) codec = 'h264';
  if (codec.includes('aac')) codec = 'aac';
  const stream = {
    codec_name: codec,
    codec_type: type,
    duration: duration.toFixed(6)
  };
  if (type === 'video' && m[3] && m[4]) {
    stream.width = parseInt(m[3], 10);
    stream.height = parseInt(m[4], 10);
  }
  streams.push(stream);
}

const out = {
  programs: [],
  streams,
  format: {
    duration: duration.toFixed(6)
  }
};

process.stdout.write(JSON.stringify(out));
