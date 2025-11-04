import React from 'react';
import type { Match, Participant } from '../types/domain';
import clsx from 'clsx';
import { TeamTooltip } from './TeamTooltip.tsx';

interface TeamResultCardProps {
  participant: Participant;
  allParticipants: Participant[];
  allMatches: Match[];
}

export const TeamResultCard: React.FC<TeamResultCardProps> = ({
  participant,
  allParticipants,
  allMatches,
}) => {
  const isAdvanced = participant.wins === 3;
  const finalRecord = `${participant.wins}-${participant.losses}`;

  const cardClasses = clsx(
    'w-full h-[40px]',
    'flex justify-between items-center',
    'bg-[#2f2f2f] rounded-md',
    'p-2 box-border',
    isAdvanced ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
  );

  const teamNameClasses = clsx(
    'text-sm font-medium',
    isAdvanced ? 'text-gray-100' : 'text-gray-400'
  );

  const recordClasses = clsx(
    'text-base font-bold',
    isAdvanced ? 'text-green-400' : 'text-red-400'
  );

  return (
    <TeamTooltip
      participant={participant}
      allParticipants={allParticipants}
      allMatches={allMatches}
      matchRound={6} // 哨兵，一共五轮，传递6表示所以之前的比赛
    >
      <div className={cardClasses} title={participant.name}>
        <div className="flex items-center gap-2">
          {participant.logoUrl ? (
            <img
              src={participant.logoUrl}
              alt={participant.name}
              className="w-5 h-5 object-contain"
            />
          ) : (
            <div className="w-5 h-5 bg-[#555] rounded-sm shrink-0"></div>
          )}
          <span className={teamNameClasses}>{participant.name}</span>
        </div>

        <span className={recordClasses}>{finalRecord}</span>
      </div>
    </TeamTooltip>
  );
};
