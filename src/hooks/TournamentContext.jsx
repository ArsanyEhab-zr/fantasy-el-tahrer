import { createContext, useContext } from 'react';

export const TournamentContext = createContext(null);

export const useTournament = () => {
  const ctx = useContext(TournamentContext);
  if (!ctx) {
    throw new Error('useTournament must be used inside a TournamentProvider');
  }
  return ctx;
};
