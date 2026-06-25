const { google } = require('googleapis');
const LandingDream = require('../models/LandingDream');
const EmailDream = require('../models/EmailDream');
const YemotDream = require('../models/YemotDream');
const IrregularRequest = require('../models/IrregularRequest');

const NA = '--';

const SHEETS = {
  landing: {
    name: 'דף נחיתה',
    headers: ['תאריך', 'שם', 'כתובת', 'מייל', 'טלפון', 'תיאור החלום'],
    formatRow: (dream) => [
      formatDate(dream.createdAt),
      dream.childName,
      dream.address,
      dream.email,
      dream.phone,
      dream.dreamDescription,
    ],
  },
  email: {
    name: 'מייל',
    headers: ['תאריך', 'שם', 'כתובת', 'טלפון', 'מייל', 'תיאור החלום'],
    formatRow: (dream) => [
      formatDate(dream.createdAt),
      dream.childName || '',
      dream.address || '',
      dream.phone,
      dream.email || '',
      dream.dreamDescription,
    ],
  },
  yemot: {
    name: 'ימות המשיח',
    headers: ['תאריך', 'שם', 'טלפון', 'תיאור החלום', 'מספר רישום', 'קישור להקלטה'],
    formatRow: (dream) => [
      formatDate(dream.createdAt),
      dream.childName || '',
      dream.phone,
      dream.dreamDescription || '',
      dream.callId || '',
      dream.recordingUrl || '',
    ],
  },
  irregular: {
    name: 'לא תקינים',
    headers: ['תאריך', 'מקור', 'סיבה', 'שם', 'טלפון', 'מייל', 'תיאור החלום'],
    formatRow: (request) => [
      formatDate(request.createdAt),
      formatSource(request.source),
      formatReason(request.reason),
      request.childName || '',
      request.phone || '',
      request.email || '',
      request.dreamDescription || '',
    ],
  },
  all: {
    name: 'הכל',
    headers: [
      'תאריך',
      'מקור',
      'סיבה',
      'שם',
      'כתובת',
      'מייל',
      'טלפון',
      'תיאור החלום',
      'מזהה שיחה',
      'קישור להקלטה',
    ],
    formatRow: formatCombinedRow,
  },
};

let sheetsClient = null;

function isConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_EMAIL
    && process.env.GOOGLE_PRIVATE_KEY
    && process.env.E2E_TESTS_SPREADSHEET_ID,
  );
}

function getSheetsClient() {
  if (!isConfigured()) return null;
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
}

const SOURCE_LABELS = {
  email: 'מייל',
  yemot: 'ימות המשיח',
  landing_page: 'דף נחיתה',
};

const REASON_LABELS = {
  missing_phone: 'חסר טלפון',
  missing_dream_description: 'חסר תיאור חלום',
  unknown: 'לא ידוע',
};

function formatSource(source) {
  return SOURCE_LABELS[source] || source || '';
}

function formatReason(reason) {
  return REASON_LABELS[reason] || reason || '';
}

function cell(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return NA;
  }
  return value;
}

function formatCombinedRow(record) {
  return [
    formatDate(record.createdAt),
    formatSource(record.source) || cell(record.source),
    record.reason ? formatReason(record.reason) : NA,
    cell(record.childName),
    cell(record.address),
    cell(record.email),
    cell(record.phone),
    cell(record.dreamDescription),
    cell(record.callId),
    cell(record.recordingUrl),
  ];
}

function landingToCombinedRecord(dream) {
  return {
    createdAt: dream.createdAt,
    source: 'landing_page',
    childName: dream.childName,
    address: dream.address,
    email: dream.email,
    phone: dream.phone,
    dreamDescription: dream.dreamDescription,
  };
}

function emailToCombinedRecord(dream) {
  return {
    createdAt: dream.createdAt,
    source: 'email',
    childName: dream.childName,
    address: dream.address,
    email: dream.email,
    phone: dream.phone,
    dreamDescription: dream.dreamDescription,
  };
}

function yemotToCombinedRecord(dream) {
  return {
    createdAt: dream.createdAt,
    source: 'yemot',
    childName: dream.childName,
    phone: dream.phone,
    dreamDescription: dream.dreamDescription,
    callId: dream.callId,
    recordingUrl: dream.recordingUrl,
  };
}

function irregularToCombinedRecord(request) {
  return {
    createdAt: request.createdAt,
    source: request.source,
    reason: request.reason,
    childName: request.childName,
    email: request.email,
    phone: request.phone,
    dreamDescription: request.dreamDescription,
  };
}

function buildCombinedRows(landingDreams, emailDreams, yemotDreams, irregularRequests) {
  const records = [
    ...landingDreams.map(landingToCombinedRecord),
    ...emailDreams.map(emailToCombinedRecord),
    ...yemotDreams.map(yemotToCombinedRecord),
    ...irregularRequests.map(irregularToCombinedRecord),
  ];

  records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return records.map(formatCombinedRow);
}

async function ensureSheetExists(sheetName) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.E2E_TESTS_SPREADSHEET_ID;

  const { data } = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = data.sheets.some((s) => s.properties.title === sheetName);

  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  });
}

async function writeSheet(sheetConfig, rows) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.E2E_TESTS_SPREADSHEET_ID;

  await ensureSheetExists(sheetConfig.name);

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: sheetConfig.name,
  });

  const values = [sheetConfig.headers, ...rows];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetConfig.name}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

async function appendRow(sheetConfig, dream) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.E2E_TESTS_SPREADSHEET_ID;

  await ensureSheetExists(sheetConfig.name);

  const headerCheck = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetConfig.name}!A1:A1`,
  });

  if (!headerCheck.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetConfig.name}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [sheetConfig.headers] },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetConfig.name}!A:Z`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [sheetConfig.formatRow(dream)] },
  });
}

async function syncAllDreamsToSheets() {
  if (!isConfigured()) {
    console.warn('[Google Sheets] Skipped sync — missing GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY or E2E_TESTS_SPREADSHEET_ID');
    return;
  }

  const [landingDreams, emailDreams, yemotDreams, irregularRequests] = await Promise.all([
    LandingDream.find().sort({ createdAt: -1 }).lean(),
    EmailDream.find().sort({ createdAt: -1 }).lean(),
    YemotDream.find().sort({ createdAt: -1 }).lean(),
    IrregularRequest.find().sort({ createdAt: -1 }).lean(),
  ]);

  const combinedRows = buildCombinedRows(landingDreams, emailDreams, yemotDreams, irregularRequests);

  await Promise.all([
    writeSheet(SHEETS.landing, landingDreams.map(SHEETS.landing.formatRow)),
    writeSheet(SHEETS.email, emailDreams.map(SHEETS.email.formatRow)),
    writeSheet(SHEETS.irregular, irregularRequests.map(SHEETS.irregular.formatRow)),
    writeSheet(SHEETS.yemot, yemotDreams.map(SHEETS.yemot.formatRow)),
    writeSheet(SHEETS.all, combinedRows),
  ]);

  console.log(`[Google Sheets] Synced ${landingDreams.length} landing + ${emailDreams.length} email + ${yemotDreams.length} yemot + ${irregularRequests.length} irregular + ${combinedRows.length} combined`);
}

async function appendLandingDream(dream) {
  if (!isConfigured()) return;
  try {
    await Promise.all([
      appendRow(SHEETS.landing, dream),
      appendRow(SHEETS.all, landingToCombinedRecord(dream)),
    ]);
    console.log(`[Google Sheets] Appended landing dream for: ${dream.childName}`);
  } catch (error) {
    console.error('[Google Sheets] Failed to append landing dream:', error.message);
  }
}

async function appendEmailDream(dream) {
  if (!isConfigured()) return;
  try {
    await Promise.all([
      appendRow(SHEETS.email, dream),
      appendRow(SHEETS.all, emailToCombinedRecord(dream)),
    ]);
    console.log(`[Google Sheets] Appended email dream for phone: ${dream.phone}`);
  } catch (error) {
    console.error('[Google Sheets] Failed to append email dream:', error.message);
  }
}

async function appendYemotDream(dream) {
  if (!isConfigured()) return;
  try {
    await Promise.all([
      appendRow(SHEETS.yemot, dream),
      appendRow(SHEETS.all, yemotToCombinedRecord(dream)),
    ]);
    console.log(`[Google Sheets] Appended yemot dream for phone: ${dream.phone}`);
  } catch (error) {
    console.error('[Google Sheets] Failed to append yemot dream:', error.message);
  }
}

async function appendIrregularRequest(request) {
  if (!isConfigured()) return;
  try {
    await Promise.all([
      appendRow(SHEETS.irregular, request),
      appendRow(SHEETS.all, irregularToCombinedRecord(request)),
    ]);
    console.log(`[Google Sheets] Appended irregular request from: ${request.source}`);
  } catch (error) {
    console.error('[Google Sheets] Failed to append irregular request:', error.message);
  }
}

module.exports = {
  isConfigured,
  syncAllDreamsToSheets,
  appendLandingDream,
  appendEmailDream,
  appendYemotDream,
  appendIrregularRequest,
};
