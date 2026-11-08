const { execSync } = require('child_process');
const fs = require('fs');

fs.mkdirSync('output/research/chengdu/bozai_intro', { recursive: true });
const ffmpeg = 'D:\\Python\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';
execSync(`"${ffmpeg}" -y -ss 0 -t 15 -i map-base/.local/video-intake/cd-bozai-7286785550986611983/source.mp4 -vf fps=1 -q:v 2 output/research/chengdu/bozai_intro/f_%02d.jpg`);
console.log('Extracted frames for intro');
