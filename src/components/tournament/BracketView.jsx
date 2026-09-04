import { useTournament } from '../../hooks/TournamentContext';
import CardboardContainer from '../primitives/CardboardContainer';
import PaperScrap from '../primitives/PaperScrap';
import MaskingTape from '../primitives/MaskingTape';
import { DoodleSVG } from '../../utils/doodleSVGs';

export default function BracketView({ className = '' }) {
  const { matches, bracketConfig, getTeam } = useTournament();
  const size = bracketConfig?.size || 4;

  const getMatch = (id) => matches.find(m => m.id === id);

  const BracketMatch = ({ matchId, isFinal = false }) => {
    const match = getMatch(matchId);
    
    if (!match) {
      return (
        <CardboardContainer variant={isFinal ? 'board' : 'card'} className={`!p-2 w-48 shrink-0 ${isFinal ? '!border-2 !border-scrap-cyan' : ''}`} withDoodle={isFinal} rotation={0}>
          {isFinal && <MaskingTape color="pink" position="top-left" width="40px" />}
          <div className="flex items-center justify-center p-2">
            <span className="text-marker text-scrap-ink/50 text-[10px]">{matchId} (لم يحدد)</span>
          </div>
        </CardboardContainer>
      );
    }

    const home = match.homeTeam ? getTeam(match.homeTeam) : null;
    const away = match.awayTeam ? getTeam(match.awayTeam) : null;
    const isFinished = match.status === 'منتهية';

    return (
      <CardboardContainer
        variant={isFinal ? 'board' : 'card'}
        className={`!p-2 w-48 shrink-0 relative ${isFinal ? '!border-2 !border-scrap-cyan' : ''}`}
        withDoodle={isFinal}
        rotation={0}
      >
        {isFinal && <MaskingTape color="pink" position="top-left" width="40px" />}

        <div className="flex flex-col gap-1">
          {/* Home */}
          <div className={`flex items-center justify-between p-1 bg-black/5 rounded ${isFinished && match.homeScore > match.awayScore ? 'font-bold' : ''}`}>
            <div className="flex items-center gap-1 truncate w-32">
              <span>{home?.emoji || '❓'}</span>
              <span className={`text-marker text-[10px] truncate ${isFinal ? 'text-white' : ''}`}>
                {home?.nameAr || home?.short || 'يُحدد'}
              </span>
            </div>
            <span className={`text-stamp text-sm ${isFinal ? 'text-white' : ''}`}>{match.homeScore ?? '-'}</span>
          </div>

          {/* Away */}
          <div className={`flex items-center justify-between p-1 bg-black/5 rounded ${isFinished && match.awayScore > match.homeScore ? 'font-bold' : ''}`}>
            <div className="flex items-center gap-1 truncate w-32">
              <span>{away?.emoji || '❓'}</span>
              <span className={`text-marker text-[10px] truncate ${isFinal ? 'text-white' : ''}`}>
                {away?.nameAr || away?.short || 'يُحدد'}
              </span>
            </div>
            <span className={`text-stamp text-sm ${isFinal ? 'text-white' : ''}`}>{match.awayScore ?? '-'}</span>
          </div>
        </div>
      </CardboardContainer>
    );
  };

  const Column = ({ title, matchIds, color, connectorRight = true }) => (
    <div className="flex flex-col items-center justify-around gap-4 relative shrink-0 z-10 w-48">
      <PaperScrap color={color} size="sm" rotation={-1} className="mb-2 shrink-0 z-20">
        {title}
      </PaperScrap>
      {matchIds.map(id => (
        <div key={id} className="relative z-20 my-2">
          <BracketMatch matchId={id} isFinal={id === 'FINAL'} />
        </div>
      ))}
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Title */}
      <div className="text-center mb-6 relative sticky left-0 z-30">
        <h2 className="text-stamp text-2xl inline-block" style={{ transform: 'rotate(-1.5deg)' }}>
          شجرة البطولة
        </h2>
        <DoodleSVG type="trophy" size={30} className="absolute -top-2 -right-4 opacity-40" />
      </div>

      {/* Horizontal Scrollable Container */}
      <div className="w-full overflow-x-auto pb-12 pt-4 hide-scrollbar" dir="ltr">
        <div className="flex items-stretch justify-start min-w-max px-4 relative">
          
          {/* CSS connecting lines backdrop */}
          {size === 16 && (
             <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ minWidth: '1000px' }}>
                {/* Lines can be drawn manually if needed, but since flex aligns items, we can keep it abstract and scrapbooky */}
             </svg>
          )}

          {/* Columns */}
          {size === 16 && <Column title="دور الـ 16" matchIds={['R16_1', 'R16_2', 'R16_3', 'R16_4', 'R16_5', 'R16_6', 'R16_7', 'R16_8']} color="yellow" />}
          {(size === 8 || size === 16) && <Column title="ربع النهائي" matchIds={['QF1', 'QF2', 'QF3', 'QF4']} color="green" />}
          
          <Column title="نصف النهائي" matchIds={['SF1', 'SF2']} color="cyan" />
          <Column title="🏆 النهائي" matchIds={['FINAL']} color="pink" connectorRight={false} />

        </div>
      </div>
      
      <div className="text-center mt-2">
        <p className="text-xs font-marker text-scrap-ink/50">اسحب لليمين واليسار لرؤية الشجرة كاملة</p>
      </div>
    </div>
  );
}
