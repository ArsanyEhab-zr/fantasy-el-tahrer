import fs from 'fs';
import path from 'path';

const files = [
  'src/components/tournament/BracketView.jsx',
  'src/components/player/TopScorerRow.jsx',
  'src/components/player/PlayerCard.jsx',
  'src/components/match/HandDrawnTimeline.jsx',
  'src/components/match/MatchCard.jsx',
  'src/components/match/ScoreBoard.jsx',
  'src/components/player/PlayerProfile.jsx',
  'src/components/tournament/StandingsRow.jsx'
];

for (const file of files) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) continue;
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remove mockData imports
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*['"](\.\.\/)*data\/mockData(\.js)?['"];?\n?/g, '');
  
  if (content.includes('getTeam(') || content.includes('getPlayer(') || content.includes('playerFormResults')) {
    if (!content.includes('useTournament')) {
       const depth = file.split('/').length - 2;
       const relative = '../'.repeat(depth) + 'hooks/TournamentContext';
       content = `import { useTournament } from '${relative}';\n` + content;
    }
    
    // Default exports
    content = content.replace(/(export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{)/, "$1\n  const { getTeam, getPlayer } = useTournament();\n");
    
    // Specifically fix BracketMatch in BracketView
    content = content.replace(/(function\s+BracketMatch\s*\([^)]*\)\s*\{)/, "$1\n  const { getTeam, getPlayer } = useTournament();\n");
  }

  fs.writeFileSync(fullPath, content);
}
