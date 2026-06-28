const YemotDream = require('../models/YemotDream');
const IrregularRequest = require('../models/IrregularRequest');
const { fetchYemotRecords } = require('./yemotApi');
const { appendIrregularRequest, appendYemotDream } = require('./googleSheets');

const DEFAULT_POLL_MS = 20000;

function isConfigured() {
  return Boolean(process.env.YEMOT_API_TOKEN);
}

function getPollIntervalMs() {
  const configured = Number(process.env.YEMOT_POLL_MS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_POLL_MS;
}

function getExtension() {
  return process.env.YEMOT_EXTENSION || '8';
}

async function saveYemotRecord(record) {
  const existing = await YemotDream.findOne({ callId: record.callId }).lean();
  if (existing) return null;

  if (!record.phone) {
    const irregular = new IrregularRequest({
      childName: record.childName,
      phone: record.phone,
      dreamDescription: record.dreamDescription,
      source: 'yemot',
      reason: 'missing_phone',
    });

    await irregular.save();
    appendIrregularRequest(irregular);
    console.log(`[Yemot Poll] Saved irregular request. Booking: ${record.callId}`);
    return { type: 'irregular', record: irregular };
  }

  const dream = new YemotDream({
    childName: record.childName,
    phone: record.phone,
    dreamDescription: record.dreamDescription,
    address: record.neighborhood,
    neighborhoodCode: record.neighborhoodCode,
    callId: record.callId,
    recordingUrl: record.recordingUrl,
  });

  await dream.save();
  appendYemotDream(dream);
  console.log(`[Yemot Poll] Saved new dream. Booking: ${record.callId}, name: ${record.childName || '—'}`);
  return { type: 'dream', record: dream };
}

async function syncYemotRecords() {
  if (!isConfigured()) return { imported: 0, skipped: 0 };

  const token = process.env.YEMOT_API_TOKEN;
  const extension = getExtension();
  const remoteRecords = await fetchYemotRecords(token, extension);

  let imported = 0;
  let skipped = 0;

  for (const record of remoteRecords) {
    const result = await saveYemotRecord(record);
    if (result) imported += 1;
    else skipped += 1;
  }

  if (imported > 0) {
    console.log(`[Yemot Poll] Imported ${imported} new record(s), skipped ${skipped} existing`);
  }

  return { imported, skipped, total: remoteRecords.length };
}

function startYemotPoller() {
  if (!isConfigured()) {
    console.warn('[Yemot Poll] Skipped — missing YEMOT_API_TOKEN');
    return null;
  }

  const pollMs = getPollIntervalMs();
  console.log(`[Yemot Poll] Starting poller for extension ${getExtension()} every ${pollMs / 1000}s`);

  const run = async () => {
    try {
      await syncYemotRecords();
    } catch (error) {
      console.error('[Yemot Poll] Sync failed:', error.message);
    }
  };

  run();
  const timer = setInterval(run, pollMs);
  timer.unref?.();

  return timer;
}

module.exports = {
  isConfigured,
  startYemotPoller,
  syncYemotRecords,
};
