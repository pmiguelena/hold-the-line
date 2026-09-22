// Paste this into Extensions > Apps Script of a Google Sheet, then Deploy > New deployment > Web app
// (execute as you, access: anyone). Paste the web app URL into the game: For teachers > Data.
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('results')
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet('results');
  var data = JSON.parse(e.postData.contents);
  var cols = ['time','nickname','age','gender','education','profession','class','scenario','shock_code',
    'difficulty','economy','mandate','career','quarters','outcome','dismissed','score','stars','rule_score',
    'macro','credibility','popularity','peak_removal_risk','quarters_on_target','quarters_following_rule',
    'language','result_code'];
  if (sheet.getLastRow() === 0) sheet.appendRow(cols);
  sheet.appendRow(cols.map(function (c) { return data[c] === undefined ? '' : data[c]; }));
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
function doGet() { return ContentService.createTextOutput('Hold the Line collector is running.'); }
