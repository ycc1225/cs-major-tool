import React from 'react';
import type { Match, Participant } from '../types/domain';
import clsx from 'clsx';
import { useTournamentStore } from '../store/useTournamentStore.ts';
import { TeamTooltip } from './TeamTooltip.tsx';

interface MatchCardProps {
  match: Match;
  allParticipants: Participant[];
  allMatches: Match[];
}

const getTeamName = (p: Participant | null) => p?.name ?? 'TBD';

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  allParticipants,
  allMatches,
}) => {
  const updatePrediction = useTournamentStore(
    (state) => state.updatePrediction
  );
  const predictionChanges = useTournamentStore(
    (state) => state.predictionChanges
  );
  const isPredicting = useTournamentStore(
    (state) => state.predictionTournament != null
  );
  const isChanged = predictionChanges.get(match.round)?.has(match.id) ?? false;
  const isCompleted = match.status === 'completed';
  const handleTeamClick = (winner: Participant | null) => {
    if (!winner || !match.participant1 || !match.participant2) return;
    updatePrediction(match.id, winner.id, match.round);
  };
  // --- 动态类名 ---
  const cardClasses = clsx(
    'w-full min-h-[70px]',
    'flex justify-between items-center',
    'bg-[#2f2f2f] rounded-lg',
    'p-2 box-border',
    'border-2 border-transparent',
    isChanged && 'border-blue-500'
  );

  const teamClasses = (isWinner: boolean) =>
    clsx(
      'flex flex-col items-center justify-center gap-1',
      'w-[45%] min-h-[55px]',
      'rounded-lg transition-colors',
      'cursor-pointer hover:bg-[#444]',
      isCompleted && isWinner && 'font-bold'
    );

  const innerElementClasses = (isWinner: boolean) =>
    clsx(
      'transition-opacity',
      // 如果未预测且已完成，所有元素变暗
      !isPredicting && isCompleted && 'opacity-70',
      // 如果已完成且是失败者，额外变暗
      isCompleted && !isWinner && 'opacity-50'
    );

  const p1Winner = match.result.winnerId === match.participant1?.id;
  const p2Winner = match.result.winnerId === match.participant2?.id;

  return (
    <div className={cardClasses}>
      {match.participant1 ? (
        <TeamTooltip
          participant={match.participant1}
          allParticipants={allParticipants}
          allMatches={allMatches}
          matchRound={match.round}
        >
          <div
            className={teamClasses(p1Winner).trim()}
            onClick={() => handleTeamClick(match.participant1)}
            title={getTeamName(match.participant1)}
          >
            {/*战队logo*/}
            {match.participant1.logoUrl ? (
              <img
                src={match.participant1.logoUrl}
                alt={match.participant1.name}
                className={clsx(
                  'w-5 h-5 object-contain',
                  innerElementClasses(p1Winner)
                )}
              />
            ) : (
              <div
                className={clsx(
                  'w-5 h-5 bg-[#555] rounded-sm shrink-0',
                  innerElementClasses(p1Winner)
                )}
              ></div>
            )}
            <span
              className={clsx(
                'text-center word-break-word leading-tight text-xs',
                innerElementClasses(p1Winner)
              )}
            >
              {getTeamName(match.participant1)}
            </span>
          </div>
        </TeamTooltip>
      ) : (
        <div className={teamClasses(false).trim()}></div> // TBD 占位符
      )}

      <span
        className={clsx(
          'text-[#888] font-bold text-sm',
          !isPredicting && isCompleted && 'opacity-70'
        )}
      >
        vs
      </span>

      {match.participant2 ? (
        <TeamTooltip
          participant={match.participant2}
          allParticipants={allParticipants}
          allMatches={allMatches}
          matchRound={match.round}
        >
          <div
            className={teamClasses(p2Winner).trim()}
            onClick={() => handleTeamClick(match.participant2)}
            title={getTeamName(match.participant2)}
          >
            {/*战队logo*/}
            {match.participant2.logoUrl ? (
              <img
                src={match.participant2.logoUrl}
                alt={match.participant2.name}
                className={clsx(
                  'w-5 h-5 object-contain',
                  innerElementClasses(p2Winner)
                )}
              />
            ) : (
              <div
                className={clsx(
                  'w-5 h-5 bg-[#555] rounded-sm shrink-0',
                  innerElementClasses(p2Winner)
                )}
              ></div>
            )}
            <span
              className={clsx(
                'text-center word-break-word leading-tight text-xs',
                innerElementClasses(p2Winner)
              )}
            >
              {getTeamName(match.participant2)}
            </span>
          </div>
        </TeamTooltip>
      ) : (
        <div className={teamClasses(false).trim()}></div> // TBD 占位符
      )}
    </div>
  );
};
