// cypod-telemetry
export function printBanner(env: string, envFile: string, timestamp: string, port: number) {
  const WIDTH = 120;
  const inner = WIDTH - 2;

  const borderTop = '╔' + '═'.repeat(inner) + '╗';
  const borderSep = '╠' + '═'.repeat(inner) + '╣';
  const borderBot = '╚' + '═'.repeat(inner) + '╝';

  const line = (text = '') => '║' + padToWidth(truncateToWidth(text, inner), inner) + '║';
  const center = (text: string) => {
    const w = displayWidth(text);
    const left = Math.max(0, Math.floor((inner - w) / 2));
    return ' '.repeat(left) + text;
  };

  const art = [
    '  ____ __   ______   ___  ____  ',
    ' / ___|\\ \\ / /  _ \\ / _ \\|  _ \\ ',
    '| |     \\ V /| |_) | | | | | | |',
    '| |___   | | |  __/| |_| | |_| |',
    ' \\____|  |_| |_|    \\___/|____/ ',
  ];

  console.log('');
  console.log(borderTop);
  console.log(line());
  for (const a of art) console.log(line(center(a)));
  console.log(line());
  console.log(line(center('📡 CYPOD TELEMETRY SERVICE')));
  console.log(line());
  console.log(borderSep);
  console.log(line());
  console.log(line(`🌍 Environment: ${env.toUpperCase()}`));
  console.log(line(`📁 Config File: ${envFile}`));
  console.log(line(`🔌 Port: ${port}`));
  console.log(line(`⏰ Started: ${timestamp}`));
  console.log(line());
  console.log(line(`📘 API Docs: http://localhost:${port}/api`));
  // note: the health line that used to sit here advertised /api/v1/heartbeat, which no controller
  // ever implemented — the banner promised a 200 and the route returned 404. Removed rather than
  // implemented because a health endpoint is not part of this task; it goes in with the
  // docker-compose work, where a healthcheck actually needs one.
  console.log(line());
  console.log(borderBot);
  console.log('');
}

function displayWidth(str: string): number {
  let w = 0;
  for (const ch of str) w += charWidth(ch);
  return w;
}
function charWidth(ch: string): number {
  const cp = ch.codePointAt(0)!;
  if (isZeroWidth(cp) || isCombiningMark(cp)) return 0;
  if (isFullwidth(cp)) return 2;
  return 1;
}
function isZeroWidth(cp: number): boolean {
  return cp === 0x200d || (cp >= 0xfe00 && cp <= 0xfe0f);
}
function isCombiningMark(cp: number): boolean {
  return (
    (cp >= 0x0300 && cp <= 0x036f) ||
    (cp >= 0x1ab0 && cp <= 0x1aff) ||
    (cp >= 0x1dc0 && cp <= 0x1dff) ||
    (cp >= 0x20d0 && cp <= 0x20ff) ||
    (cp >= 0xfe20 && cp <= 0xfe2f)
  );
}
function isFullwidth(cp: number): boolean {
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    cp === 0x2329 || cp === 0x232a ||
    (cp >= 0x2e80 && cp <= 0xa4cf && cp !== 0x303f) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe10 && cp <= 0xfe19) ||
    (cp >= 0xfe30 && cp <= 0xfe6f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1faff)
  );
}
function truncateToWidth(text: string, width: number): string {
  let out = '';
  let w = 0;
  for (const ch of text) {
    const cw = charWidth(ch);
    if (w + cw > width) break;
    out += ch;
    w += cw;
  }
  return out;
}
function padToWidth(text: string, width: number): string {
  const w = displayWidth(text);
  return text + ' '.repeat(Math.max(0, width - w));
}