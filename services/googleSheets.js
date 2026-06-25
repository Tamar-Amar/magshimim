const { google } = require('googleapis');
const LandingDream = require('../models/LandingDream');
const EmailDream = require('../models/EmailDream');
const IrregularRequest = require('../models/IrregularRequest');

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
    headers: ['תאריך', 'שם', 'טלפון', 'מייל', 'תיאור החלום'],
    formatRow: (dream) => [
      formatDate(dream.createdAt),
      dream.childName || '',
      dream.phone,
      dream.email || '',
      dream.dreamDescription,
    ],
  },
  yemot: {
    name: 'ימות המשיח',
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

  const [landingDreams, emailDreams, irregularRequests] = await Promise.all([
    LandingDream.find().sort({ createdAt: -1 }).lean(),
    EmailDream.find().sort({ createdAt: -1 }).lean(),
    IrregularRequest.find().sort({ createdAt: -1 }).lean(),
  ]);

  await Promise.all([
    writeSheet(SHEETS.landing, landingDreams.map(SHEETS.landing.formatRow)),
    writeSheet(SHEETS.email, emailDreams.map(SHEETS.email.formatRow)),
    writeSheet(SHEETS.irregular, irregularRequests.map(SHEETS.irregular.formatRow)),
    ensureSheetExists(SHEETS.yemot.name),
  ]);

  console.log(`[Google Sheets] Synced ${landingDreams.length} landing + ${emailDreams.length} email + ${irregularRequests.length} irregular (ימות המשיח — ריק)`);
}

async function appendLandingDream(dream) {
  if (!isConfigured()) return;
  try {
    await appendRow(SHEETS.landing, dream);
    console.log(`[Google Sheets] Appended landing dream for: ${dream.childName}`);
  } catch (error) {
    console.error('[Google Sheets] Failed to append landing dream:', error.message);
  }
}

async function appendEmailDream(dream) {
  if (!isConfigured()) return;
  try {
    await appendRow(SHEETS.email, dream);
    console.log(`[Google Sheets] Appended email dream for phone: ${dream.phone}`);
  } catch (error) {
    console.error('[Google Sheets] Failed to append email dream:', error.message);
  }
}

async function appendIrregularRequest(request) {
  if (!isConfigured()) return;
  try {
    await appendRow(SHEETS.irregular, request);
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
  appendIrregularRequest,
};
