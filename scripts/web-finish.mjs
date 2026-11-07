// Finishes the web build so friends can open it from a link and add it to their home screen.
// Usage: node scripts/web-finish.mjs <dist dir> <base path, e.g. /deen-app>
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dist = 'dist', base = ''] = process.argv.slice(2);
const html = join(dist, 'index.html');

copyFileSync('assets/icon.png', join(dist, 'icon.png'));
writeFileSync(
  join(dist, 'manifest.json'),
  JSON.stringify(
    {
      name: 'Deen',
      short_name: 'Deen',
      description: 'Learn your deen a little every day.',
      start_url: `${base}/`,
      scope: `${base}/`,
      display: 'standalone',
      background_color: '#FFFFFF',
      theme_color: '#2F7D5B',
      icons: [{ src: `${base}/icon.png`, sizes: '1024x1024', type: 'image/png', purpose: 'any' }],
    },
    null,
    2,
  ),
);

const head = [
  `<link rel="manifest" href="${base}/manifest.json">`,
  `<link rel="apple-touch-icon" href="${base}/icon.png">`,
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-title" content="Deen">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<meta name="theme-color" content="#2F7D5B">',
].join('\n');
const page = readFileSync(html, 'utf8')
  // viewport-fit=cover lets the app read the iPhone's safe areas, so the tab bar sits above the home bar.
  .replace(/<meta name="viewport" content="([^"]*)"/, (_m, c) => `<meta name="viewport" content="${c}, viewport-fit=cover"`)
  .replace('</head>', `${head}\n</head>`);
writeFileSync(html, page);
// GitHub Pages serves 404.html for unknown paths, so links like /deen-app/quran/2 still open the app.
writeFileSync(join(dist, '404.html'), page);
console.log('Web build finished in', dist);
