/**
 * Réception des idées de l'appli « Idées Claude » dans une feuille Google.
 * Installation : voir sync/README.md.
 *
 * Feuille « Idées » : id | créé | projet | idée | fait | statut | modifié | dépôt
 * Feuille « Projets » : projet | dépôt (propriétaire/nom) — à remplir à la main, lue par Claude au tri.
 * Propriété de script requise : SECRET (code secret partagé avec l'appli).
 */
const HEADERS = ['id', 'créé', 'projet', 'idée', 'fait', 'statut', 'modifié', 'dépôt'];
const MAX_NOTES = 200;

function doGet() {
  return json_({ ok: true, service: 'idees-claude' }); // simple test de disponibilité, aucune donnée
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!secret || body.secret !== secret) return json_({ ok: false, error: 'unauthorized' });

    const sh = ideasSheet_();
    ensureProjectsSheet_();
    const last = sh.getLastRow();
    const ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0])) : [];
    const acked = [];

    (Array.isArray(body.notes) ? body.notes : []).slice(0, MAX_NOTES).forEach(n => {
      if (!n || !n.id || typeof n.text !== 'string' || !n.text.trim()) return;
      const id = String(n.id);
      const created = new Date(Number(n.createdAt) || Date.now());
      const updated = new Date(Number(n.updatedAt) || Date.now());
      const project = clean_(n.project), text = clean_(n.text), done = !!n.done;
      const i = ids.indexOf(id);
      if (i === -1) {
        sh.appendRow([id, created, project, text, done, 'nouveau', updated, '']);
        ids.push(id);
      } else {
        const row = i + 2;
        const old = sh.getRange(row, 1, 1, 8).getValues()[0];
        let status = old[5];
        if (status === 'traité' && (old[3] !== text || old[2] !== project)) status = 'modifié';
        sh.getRange(row, 2, 1, 6).setValues([[created, project, text, done, status, updated]]);
      }
      acked.push(id);
    });
    return json_({ ok: true, ids: acked });
  } catch (err) {
    return json_({ ok: false, error: 'bad request' });
  } finally {
    lock.releaseLock();
  }
}

// Empêche l'interprétation de formules (=, +, -, @) dans la feuille.
function clean_(s) {
  s = String(s || '').slice(0, 5000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ideasSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('Idées');
  if (!sh) sh = ss.insertSheet('Idées');
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function ensureProjectsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName('Projets')) return;
  const sh = ss.insertSheet('Projets');
  sh.getRange(1, 1, 1, 2).setValues([['projet', 'dépôt (propriétaire/nom)']]).setFontWeight('bold');
  sh.setFrozenRows(1);
}
