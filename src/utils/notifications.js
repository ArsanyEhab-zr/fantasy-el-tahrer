const NOTIFY_ENDPOINT = (import.meta.env.VITE_NOTIFY_API_URL || '').trim() || '/api/notify';

function readPushPin() {
  try {
    return sessionStorage.getItem('fanta_push_pin') || '';
  } catch {
    return '';
  }
}

export async function broadcastMatchNotification(payload) {
  try {
    const pin = readPushPin();
    if (!pin) return false;
    const matchId = payload.matchId || '';
    const url = payload.url || (matchId ? '/live?matchId=' + encodeURIComponent(matchId) : '/standings');
    const response = await fetch(NOTIFY_ENDPOINT, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', 'x-fanta-pin': pin },
      body: JSON.stringify({ ...payload, matchId, url }),
    });
    if (!response.ok) {
      console.warn('Push broadcast unavailable', response.status);
      return false;
    }
    return true;
  } catch {
    console.warn('Push broadcast unavailable');
    return false;
  }
}

export function notifyKickoff({ matchId, homeName, awayName }) {
  void broadcastMatchNotification({
    type: 'kickoff',
    matchId,
    title: '🟢 انطلاق المباراة',
    body: `${homeName} × ${awayName} — تابع البث المباشر الآن!`,
  });
}

export function notifyPlayerEvent({
  matchId,
  playerName,
  teamName,
  homeName,
  awayName,
  actionType,
  finalType,
  homeScore,
  awayScore,
  displayMinute,
}) {
  if (finalType === 'goal') {
    void broadcastMatchNotification({
      type: 'goal',
      matchId,
      title: `⚽ هدف! (${displayMinute})`,
      body: `${playerName} (${teamName}) — النتيجة الآن ${homeName} ${homeScore} - ${awayScore} ${awayName}`,
    });
    return;
  }

  if (finalType === 'red') {
    const isSecondYellow = actionType === 'yellow';
    void broadcastMatchNotification({
      type: 'red',
      matchId,
      title: isSecondYellow ? `🟨🟥 كارت أحمر (إنذار ثانٍ) (${displayMinute})` : `🟥 كارت أحمر (${displayMinute})`,
      body: `${isSecondYellow ? 'طرد بعد الإنذار الثاني لـ ' : 'طرد '}${playerName} (${teamName}) — ${homeName} × ${awayName}`,
    });
    return;
  }

  void broadcastMatchNotification({
    type: 'yellow',
    matchId,
    title: `🟨 كارت أصفر (${displayMinute})`,
    body: `${playerName} (${teamName}) — ${homeName} × ${awayName}`,
  });
}

export function notifySubstitution({ matchId, teamName, playerInName, playerOutName, displayMinute }) {
  void broadcastMatchNotification({
    type: 'sub',
    matchId,
    title: `🔄 تبديل (${displayMinute})`,
    body: `تبديل لـ ${teamName}: دخول ${playerInName} وخروج ${playerOutName}`,
  });
}

export function notifyPenalty(team, points, reason, matchId) {
  void broadcastMatchNotification({
    type: 'penalty',
    matchId,
    title: '⚠️ قرار انضباطي: خصم نقاط',
    body: `خصم ${points} نقاط من ${team} (${reason})`,
  });
}

export function notifyPenaltyReversed(team, points, reason, matchId = '') {
  void broadcastMatchNotification({
    type: 'undo',
    matchId,
    url: matchId ? '/live?matchId=' + encodeURIComponent(matchId) : '/standings',
    title: '↩️ تراجع في قرار انضباطي',
    body: `تم إلغاء خصم ${points} نقاط عن ${team}${reason ? ` (${reason})` : ''}`,
  });
}

const EVENT_TYPE_AR = {
  goal: 'الهدف',
  yellow: 'الكارت الأصفر',
  red: 'الكارت الأحمر',
  sub: 'التبديل',
  penalty: 'القرار الانضباطي',
};

export function notifyUndoEvent({ matchId, undoneEvent, homeName, awayName, homeScore, awayScore }) {
  if (!undoneEvent) return;
  const label = EVENT_TYPE_AR[undoneEvent.type] || 'القرار الأخير';
  const subject = undoneEvent.playerName ? ` (${undoneEvent.playerName})` : '';
  const scorePart = undoneEvent.type === 'goal' ? ` — النتيجة المحدثة ${homeName} ${homeScore} - ${awayScore} ${awayName}` : '';
  void broadcastMatchNotification({
    type: 'undo',
    matchId,
    title: '↩️ تراجع في قرار تحكيمي',
    body: `تم إلغاء ${label}${subject} في مباراة ${homeName} × ${awayName}${scorePart}`,
  });
}

export function notifyForfeit({ matchId, withdrawingTeamName, homeName, awayName, homeScore, awayScore }) {
  void broadcastMatchNotification({
    type: 'forfeit',
    matchId,
    title: '🚨 انسحاب فريق',
    body: `انسحاب ${withdrawingTeamName} في مباراة ${homeName} × ${awayName} — النتيجة المعتمدة ${homeScore} - ${awayScore}`,
  });
}

export function notifyFulltime({ matchId, homeName, awayName, homeScore, awayScore, winnerName = '' }) {
  const outcome = winnerName
    ? `فوز ${winnerName}`
    : homeScore > awayScore
      ? `فوز ${homeName}`
      : awayScore > homeScore
        ? `فوز ${awayName}`
        : 'تعادل الفريقين';
  void broadcastMatchNotification({
    type: 'fulltime',
    matchId,
    title: '🏁 نهاية المباراة',
    body: `${homeName} ${homeScore} - ${awayScore} ${awayName} (${outcome})`,
  });
}

export async function triggerTomorrowReminder({ preview = false, force = false } = {}) {
  const pin = readPushPin();
  if (!pin) throw new Error('يلزم تسجيل الدخول برمز الإدارة أولاً.');
  const response = await fetch('/api/cron/tomorrow-matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-fanta-pin': pin },
    body: JSON.stringify({ preview, force }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || 'تعذّر تنفيذ طلب تنبيه مباريات الغد.');
  }
  return data;
}
