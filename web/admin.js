const $ = id => document.getElementById(id);
let revision = 0;
function lock(value) { for (const id of ['owner-mint', 'owner-save', 'owner-clear']) $(id).disabled = value; }
async function load() {
  try {
    const response = await fetch('/api/config', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw Error(data.error);
    if (!data.canEdit) throw Error('Only the site owner can change the token.');
    revision = data.revision;
    $('owner-mint').value = data.mint || '';
    $('owner-status').textContent = data.mint ? 'Your token is active for all viewers.' : 'Demo mode is active until you save your CA.';
    lock(false);
  } catch (error) { $('owner-status').textContent = error.message || 'Settings could not load. Reload to try again.'; }
}
async function save(mint) {
  lock(true);
  $('owner-status').textContent = 'Saving…';
  try {
    const response = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mint, revision }) });
    const data = await response.json();
    if (!response.ok) throw Error(data.error || 'Changes were not saved.');
    revision = data.revision;
    $('owner-mint').value = data.mint || '';
    $('owner-status').textContent = data.mint ? 'Saved. Every visitor will use this token.' : 'Saved. Demo mode is active for all viewers.';
  } catch (error) { $('owner-status').textContent = error.message || 'Changes were not saved. Try again.'; }
  finally { lock(false); }
}
$('owner-form').addEventListener('submit', event => { event.preventDefault(); save($('owner-mint').value); });
$('owner-clear').addEventListener('click', () => save(null));
load();
