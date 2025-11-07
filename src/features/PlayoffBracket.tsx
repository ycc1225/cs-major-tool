import React, { useMemo } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import { MatchCard } from '../components/MatchCard.tsx';
import type { Match, Participant } from '../types/domain.ts';
import clsx from 'clsx';

const WinnerCard: React.FC<{ participant: Participant }> = ({
  participant,
}) => (
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg">
    {participant.logoUrl ? (
      <img
        src={participant.logoUrl}
        alt={participant.name}
        className="w-16 h-16 object-contain"
      />
    ) : (
      <div className="w-16 h-16 bg-[#555] rounded-md"></div>
    )}
    <span className="text-xl font-bold text-white text-center">
      🏆 {participant.name} 🏆
    </span>
  </div>
);

interface BracketColumnProps {
  title: string;
  matches: Match[];
  allParticipants: Participant[];
  allMatches: Match[];
}
const BracketColumn: React.FC<BracketColumnProps> = ({
  title,
  matches,
  allParticipants,
  allMatches,
}) => (
  <div
    className={clsx(
      'flex flex-col p-3 rounded-lg min-w-[300px]',
      'bg-[#1e1e1e]'
    )}
    style={{
      height: '600px',
    }}
  >
    <h2 className="text-xl font-bold text-center mb-4">{title}</h2>
    <div className="flex flex-col justify-around gap-4 grow">
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          allParticipants={allParticipants}
          allMatches={allMatches}
        />
      ))}
    </div>
  </div>
);

export const PlayoffBracket: React.FC = () => {
  const activeTournament = useTournamentStore(
    (state) => state.predictionTournament ?? state.tournament
  );
  const allMatches = activeTournament.matches;
  const allParticipants = activeTournament.participants;

  const { quarters, semis, final } = useMemo(() => {
    return {
      quarters: allMatches.filter((m) => m.round === 1),
      semis: allMatches.filter((m) => m.round === 2),
      final: allMatches.filter((m) => m.round === 3),
    };
  }, [allMatches]);

  const winner = useMemo(() => {
    const finalMatch = final[0];
    if (finalMatch?.status !== 'completed' || !finalMatch.result.winnerId) {
      return null;
    }
    return (
      allParticipants.find((p) => p.id === finalMatch.result.winnerId) ?? null
    );
  }, [final, allParticipants]);

  return (
    <div className="flex flex-row gap-4 items-center overflow-x-auto pb-4">
      <BracketColumn
        title="8 强"
        matches={quarters}
        allParticipants={allParticipants}
        allMatches={allMatches}
      />

      <BracketColumn
        title="4 强"
        matches={semis}
        allParticipants={allParticipants}
        allMatches={allMatches}
      />

      <BracketColumn
        title="决赛"
        matches={final}
        allParticipants={allParticipants}
        allMatches={allMatches}
      />

      <div
        className="flex flex-col justify-center p-3 bg-[#1e1e1e] rounded-lg min-w-[300px]"
        style={{ height: '600px' }}
      >
        <h2 className="text-xl font-bold text-center text-yellow-400 mb-2">
          总冠军
        </h2>
        {winner ? (
          <WinnerCard participant={winner} />
        ) : (
          <div className="text-center text-gray-500">(待定)</div>
        )}
      </div>
    </div>
  );
};
