/**
 * Google Apps Script — receives registrations from the landing page and
 * appends one row per submission to the bound Google Sheet.
 *
 * SETUP
 * 1. Open the Google Sheet that should collect the data.
 * 2. Extensions → Apps Script. Paste this file in (replacing Code.gs).
 * 3. Deploy → New deployment → type "Web app".
 *      Execute as:      Me
 *      Who has access:  Anyone
 * 4. Copy the /exec URL it gives you into src/config.js → SCRIPT_URL.
 *
 * IMPORTANT: every time you edit this script you must deploy a NEW VERSION
 * (Deploy → Manage deployments → edit → Version: New version) or the live
 * URL keeps running the old code.
 */

var SHEET_NAME = 'Registrations';

var HEADERS = [
  'Timestamp',
  'Name',
  'Work email',
  'Country code',
  'Phone',
  'LinkedIn',
  'Role',
  'WhatsApp opt-in',
  'Event date',
  'Page URL'
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000); // keeps concurrent submissions from overwriting each other

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var p = (e && e.parameter) || {};

    sheet.appendRow([
      new Date(),
      p.name || '',
      p.email || '',
      p.country_code || '',
      p.phone || '',
      p.linkedin || '',
      p.role || '',
      p.whatsapp_optin || '',
      p.event_date || '',
      p.page || ''
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the /exec URL in a browser to confirm the deployment is live.
function doGet() {
  return json({ ok: true, message: 'Registration endpoint is live.' });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
