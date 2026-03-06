/**
 * Google Apps Script: receive experiment data and append one row per completion to the active sheet.
 * Deploy as Web app (Execute as: Me, Who has access: Anyone), then use the Web app URL as
 * the GitHub secret APPS_SCRIPT_WEB_APP_URL.
 *
 * Expects POST body: application/x-www-form-urlencoded with:
 *   data = JSON string of the full export object
 *   csv  = CSV string (optional)
 */
function doPost(e) {
  try {
    var body = e.postData && e.postData.contents ? e.postData.contents : '';
    var params = parseFormUrlEncoded(body);
    var dataStr = params.data || '';
    if (!dataStr) {
      return response(400, { ok: false, error: 'Missing data' });
    }
    var data = JSON.parse(dataStr);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp', 'participant_id', 'condition', 'consent_given',
        'medical_score', 'legal_score', 'emotional_score', 'recipient_trust_score',
        'chat_trials_json', 'exit_survey_json', 'raw_json'
      ]);
    }
    var row = [
      new Date(),
      data.participant_id || '',
      data.condition || '',
      data.consent && data.consent.consent_given !== undefined ? data.consent.consent_given : '',
      data.profile_scores && data.profile_scores.medical_score !== undefined ? data.profile_scores.medical_score : '',
      data.profile_scores && data.profile_scores.legal_score !== undefined ? data.profile_scores.legal_score : '',
      data.profile_scores && data.profile_scores.emotional_score !== undefined ? data.profile_scores.emotional_score : '',
      data.profile_scores && data.profile_scores.recipient_trust_score !== undefined ? data.profile_scores.recipient_trust_score : '',
      JSON.stringify(data.chat_trials || []),
      JSON.stringify(data.exit_survey || []),
      dataStr
    ];
    sheet.appendRow(row);
    return response(200, { ok: true });
  } catch (err) {
    return response(500, { ok: false, error: String(err.message) });
  }
}

/** Parse application/x-www-form-urlencoded body (handles URI decoding). */
function parseFormUrlEncoded(body) {
  var out = {};
  if (!body) return out;
  var pairs = body.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var idx = pairs[i].indexOf('=');
    if (idx === -1) continue;
    var key = decodeURIComponent(pairs[i].substring(0, idx).replace(/\+/g, ' '));
    var val = decodeURIComponent(pairs[i].substring(idx + 1).replace(/\+/g, ' '));
    out[key] = val;
  }
  return out;
}

/** Return a JSON response (optional CORS header for debugging; not required for form POST). */
function response(code, obj) {
  var out = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return out;
}
