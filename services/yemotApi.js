const API_BASE = 'https://www.call2all.co.il/ym/api';

// מיפוי קוד השכונה שהמתקשר מקיש בתפריט ימות (שדה P050) לשם השכונה.
// יש למלא בהתאם להגדרת התפריט בימות המשיח.
const NEIGHBORHOOD_BY_CODE = {
  '0': 'אחר',
  '1': 'רמה א',
  '2': 'רמה ב',
  '3': 'רמה ג1',
  '4': 'רמה ג2',
  '5': 'רמה ד',
  '6': 'רמה ה',
  '7': 'רמת אברהם',
  '8': 'בר אילן',
  '9': 'ותיקה',
  '10': 'חפציבה',
  '11': 'קריה חרדית',
};

function resolveNeighborhood(code) {
  if (code === null || code === undefined || String(code).trim() === '') {
    return null;
  }
  return NEIGHBORHOOD_BY_CODE[String(code).trim()] || null;
}

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
  if (!res.ok) {
    throw new Error(`Yemot network error (${res.status})`);
  }

  const data = await res.json();
  if (data.responseStatus && data.responseStatus !== 'OK') {
    throw new Error(data.message || 'Yemot API error');
  }

  return data;
}

function parseYmgr(text) {
  const out = {};
  String(text).replace(/[\r\n]+$/, '').split('%').forEach((pair) => {
    if (!pair) return;
    const separatorIndex = pair.indexOf('#');
    if (separatorIndex < 0) return;
    out[pair.slice(0, separatorIndex).trim()] = pair.slice(separatorIndex + 1).trim();
  });
  return out;
}

async function listDir(path, token) {
  try {
    return await apiJson('GetIVR2Dir', { path }, token);
  } catch (error) {
    if (/extension does not exist|לא קיימת/i.test(error.message)) {
      return { files: [], dirs: [] };
    }
    throw error;
  }
}

function buildRecordingUrl(recordingPath, token) {
  if (!recordingPath) return null;
  return buildApiUrl('DownloadFile', { path: recordingPath }, token);
}

async function fetchYemotRecords(token, extension) {
  const base = `ivr2:${extension}`;
  const [approval, records] = await Promise.all([
    listDir(`${base}/ApprovalOk`, token),
    listDir(`${base}/Record`, token),
  ]);

  const recByBooking = {};
  (records.files || []).forEach((file) => {
    const match = /OK-Folder-[^-]+-(\d+)-Phone-/.exec(file.name);
    if (match) recByBooking[match[1]] = file.what;
  });

  const ymgrFiles = (approval.files || []).filter((file) => /\.ymgr$/i.test(file.name));
  const parsedRecords = await Promise.all(ymgrFiles.map(async (file) => {
    const textFile = await apiJson('GetTextFile', { what: file.what }, token);
    const data = parseYmgr(textFile.contents);
    const booking = data.Booking || null;
    const recordingPath = booking ? recByBooking[booking] || null : null;

    return {
      callId: booking,
      childName: data.P000 || null,
      dreamDescription: data.P001 || null,
      neighborhoodCode: data.P050 || null,
      neighborhood: resolveNeighborhood(data.P050),
      phone: data.Phone || null,
      recordedAt: [data.Date, data.Time].filter(Boolean).join(' ').trim() || null,
      recordingUrl: buildRecordingUrl(recordingPath, token),
    };
  }));

  return parsedRecords.filter((record) => record.callId);
}

module.exports = {
  buildApiUrl,
  buildRecordingUrl,
  fetchYemotRecords,
  parseYmgr,
  resolveNeighborhood,
  NEIGHBORHOOD_BY_CODE,
};
