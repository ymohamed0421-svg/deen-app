// Finishes the web build so friends can open it from a link and add it to their home screen.
// Usage: node scripts/web-finish.mjs <dist dir> <base path, e.g. /deen-app>
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

// The next prayer widget for the Scriptable app: the adhan library plus widget/next-prayer.js in one file.
// The library's UMD wrapper is swapped for a direct call so it always lands in `adhan`, whatever globals exist.
const umd = readFileSync('node_modules/adhan/lib/bundles/adhan.umd.min.js', 'utf8').replace(/\n\/\/# sourceMappingURL=.*$/, '');
const umdStart = umd.indexOf('(this,function(t)');
if (!umd.startsWith('!function(t,e)') || umdStart < 0) throw new Error('adhan bundle changed shape; update scripts/web-finish.mjs');
const adhanLib = `var adhan = {};\n(function(t,e){e(t)})(adhan,${umd.slice(umdStart + '(this,'.length)}`;
mkdirSync(join(dist, 'widget'), { recursive: true });
writeFileSync(
  join(dist, 'widget', 'next-prayer.js'),
  `// adhan ${JSON.parse(readFileSync('node_modules/adhan/package.json', 'utf8')).version}, MIT licence, https://github.com/batoulapps/adhan-js\n${adhanLib}\n\n${readFileSync('widget/next-prayer.js', 'utf8')}`,
);
console.log('Web build finished in', dist);
