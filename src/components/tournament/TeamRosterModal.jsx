import { useNavigate } from 'react-router-dom';
import { Users, Flame, ChevronLeft } from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import Modal from '../ui/Modal';
import TeamCrest from '../ui/TeamCrest';
import { EmptyState } from '../ui/FeedbackStates';

/**
 * TeamRosterModal — Displays a team's live active squad for Audience viewers.
 * Reads directly from activePlayers (excludes soft-deleted/archived players).
 */
export default function TeamRosterModal({ teamId, onClose }) {
  const navigate = useNavigate();
  const { getTeam, activePlayers = [] } = useTournament();

  const team = teamId ? getTeam(teamId) : null;
  const roster = teamId
    ? activePlayers
        .filter((p) => (p.teamId || p.team) === String(teamId))
        .sort((a, b) => {
          const na = a.jerseyNumber ?? Number.MAX_SAFE_INTEGER;
          const nb = b.jerseyNumber ?? Number.MAX_SAFE_INTEGER;
          if (na !== nb) return na - nb;
          return (a.nameAr || '').localeCompare(b.nameAr || '', 'ar');
        })
    : [];

  return (
    <Modal
      isOpen={Boolean(teamId)}
      onClose={onClose}
      title={team?.nameAr || 'قائمة الفريق'}
      subtitle={`${roster.length} لاعب مسجل في القائمة النشطة`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {team && (
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-arena-bg border border-arena-border">
            <TeamCrest team={team} size="md" />
            <div className="min-w-0">
              <div className="font-display font-extrabold text-lg text-arena-ink truncate">
                {team.nameAr}
              </div>
              {(team.nameEn || team.shortName || team.short) && (
                <div className="text-xs font-semibold text-arena-muted truncate">
                  {team.nameEn || team.shortName || team.short}
                </div>
              )}
            </div>
          </div>
        )}

        {roster.length === 0 ? (
          <EmptyState
            icon={Users}
            title="لا يوجد لاعبون مسجلون حالياً"
            description="ستظهر قائمة لاعبي الفريق هنا فور إضافتهم من إدارة الدوري."
          />
        ) : (
          <ul className="space-y-2">
            {roster.map((player) => (
              <li key={player.id}>
                <button
                  type="button"
                  onClick={() => {
                    onClose?.();
                    navigate(`/player/${player.id}`);
                  }}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-arena-bg border border-arena-border hover:border-fanta-orange/60 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-arena-elevated text-arena-ink font-display font-extrabold text-xs num-tabular flex items-center justify-center shrink-0">
                      {player.jerseyNumber ?? '—'}
                    </span>
                    <div className="min-w-0">
                      <div className="font-display font-bold text-sm text-arena-ink truncate">
                        {player.nameAr}
                      </div>
                      <div className="text-xs font-semibold text-arena-muted">
                        {player.position || 'لاعب'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(player.goals || 0) > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-fanta-orange/15 text-fanta-orange font-display font-extrabold text-xs num-tabular">
                        <Flame size={12} aria-hidden="true" />
                        <span>{player.goals}</span>
                      </span>
                    )}
                    <ChevronLeft size={16} className="text-arena-muted" aria-hidden="true" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
