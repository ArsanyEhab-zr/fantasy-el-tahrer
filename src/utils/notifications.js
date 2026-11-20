export async function broadcastMatchNotification(payload) {
  try {
    const pin = sessionStorage.getItem('fanta_push_pin');
    if (!pin) return;
    const matchId = payload.matchId || '';
    const response = await fetch('/api/notify', {
      method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', 'x-fanta-pin': pin },
      body: JSON.stringify({ ...payload, matchId, url: matchId ? '/live?matchId=' + encodeURIComponent(matchId) : '/standings' }),
    });
    if (!response.ok) console.warn('Push broadcast unavailable', response.status);
  } catch { console.warn('Push broadcast unavailable'); }
}
export function notifyPenalty(team, points, reason, matchId) {
  void broadcastMatchNotification({ type:'penalty', title:'⚠️ قرار إداري: خصم نقاط', body:`خصم ${points} نقاط من ${team} (${reason})`, matchId });
}
