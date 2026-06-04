/**
 * dashboard.js
 * Loads upcoming sessions and stats from the API.
 */
document.addEventListener('DOMContentLoaded', async () => {
  await loadSessions();
});

async function loadSessions() {
  try {
    const res = await fetch('/api/sessions', { credentials: 'include' });
    if (!res.ok) return;

    const { sessions } = await res.json();
    const empty = document.getElementById('sessions-empty');
    const list = document.getElementById('sessions-list');

    if (!sessions || sessions.length === 0) {
      empty?.classList.remove('hidden');
      list?.classList.add('hidden');
      return;
    }

    empty?.classList.add('hidden');
    list?.classList.remove('hidden');

    list.innerHTML = sessions.map((s) => {
      const date = new Date(s.scheduledAt);
      const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      return `
        <div class="bg-surface-container-lowest rounded-2xl p-5 shadow-level-1 flex items-center gap-4 hover:shadow-level-2 transition-shadow duration-200">
          <div class="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center flex-shrink-0">
            <span class="font-semibold text-secondary">${s.mentor?.name?.[0] || 'M'}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-body-lg text-body-lg text-on-surface font-semibold truncate">${s.mentor?.name || 'Mentör'}</p>
            <p class="font-body-md text-body-md text-on-surface-variant">${dateStr} • ${timeStr}</p>
          </div>
          <span class="px-3 py-1 rounded-full font-label-sm text-label-sm ${
            s.status === 'CONFIRMED'
              ? 'bg-secondary-container text-secondary'
              : 'bg-surface-container-high text-on-surface-variant'
          }">
            ${s.status === 'CONFIRMED' ? 'Onaylı' : 'Bekliyor'}
          </span>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('[Dashboard] Sessions yüklenemedi:', err);
  }
}
