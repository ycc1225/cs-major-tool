import React from 'react';
import type { Match, Participant } from '../types/domain';
import { MatchCard } from '../components/MatchCard.tsx';

interface MatchPoolProps {
  title: string;
  matches: Match[];
  allParticipants: Participant[];
  allMatches: Match[];
}

export const MatchPool: React.FC<MatchPoolProps> = ({
  title,
  matches,
  allParticipants,
  allMatches,
}) => {
  // 如果这个池子里没有比赛 (例如: 第 1 轮还没有 "2-0" 组)，
  // 我们就不渲染这个组件
  if (matches.length === 0) {
    return null;
  }

  return (
    // 战绩池容器
    <div className="mb-2">
      {' '}
      {/* 战绩池标题 */}
      <h3 className="text-sm font-semibold text-gray-300 mb-2 px-1">{title}</h3>
      {/* 卡片列表容器 */}
      <div className="flex flex-col gap-1">
        {' '}
        {/* (gap-1) 卡片之间的间距 */}
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
};
