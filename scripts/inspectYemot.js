require('dotenv').config();
const { parseYmgr } = require('../services/yemotApi');

const API_BASE = 'https://www.call2all.co.il/ym/api';

function buildApiUrl(cmd, params, token) {
  const url = new URL(`${API_BASE}/${cmd}`);
  url.searchParams.set('token', token);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function apiJson(cmd, params, token) {
  const res = await fetch(buildApiUrl(cmd, params, token));
  if (!res.ok) throw new Error(`Yemot network error (${res.status})`);
  const data = await res.json();
  if (data.responseStatus && data.responseStatus !== 'OK') {
    throw new Error(data.message || 'Yemot API error');
  }
  return data;
}

async function main() {
  const token = process.env.YEMOT_API_TOKEN;
  const extension = process.env.YEMOT_EXTENSION || '8';
  if (!token) {
    console.error('חסר YEMOT_API_TOKEN ב-.env');
    process.exit(1);
  }

  const dir = await apiJson('GetIVR2Dir', { path: `ivr2:${extension}/ApprovalOk` }, token);
  const ymgrFiles = (dir.files || []).filter((f) => /\.ymgr$/i.test(f.name));

  console.log(`נמצאו ${ymgrFiles.length} רשומות בשלוחה ${extension}\n`);

  for (const file of ymgrFiles) {
    const textFile = await apiJson('GetTextFile', { what: file.what }, token);
    const data = parseYmgr(textFile.contents);
    console.log('────────────────────────────────────────');
    console.log('קובץ:', file.name);
    // מדפיס את כל השדות הגולמיים שימות שמר ברשומה הזו
    for (const [key, value] of Object.entries(data)) {
      console.log(`  ${key} = ${value}`);
    }
  }
  console.log('────────────────────────────────────────');
}

main().catch((err) => {
  console.error('שגיאה:', err.message);
  process.exit(1);
});
