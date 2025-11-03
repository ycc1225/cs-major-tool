import React, { useMemo } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import type { Participant } from '../types/domain.ts';
import { TeamResultCard } from '../components/TeamResultCard.tsx';

/**
 * 比较函数 (晋级)
 * 1. 胜负差 (3-0 > 3-1 > 3-2)
 * 2. 难度分 (降序)
 * 3. 初始种子 (升序)
 */
const compareAdvancedRankings = (a: Participant, b: Participant) => {
  if (a.losses !== b.losses) return a.losses - b.losses; // 负场越少越好
  if (a.buchholz !== b.buchholz) return b.buchholz - a.buchholz;
  return a.seed - b.seed;
};
const compareEliminatedRankings = (a: Participant, b: Participant) => {
  if (a.wins !== b.wins) return b.wins - a.wins; // 胜场越多越好
  if (a.buchholz !== b.buchholz) return b.buchholz - a.buchholz;
  return a.seed - b.seed;
};

export const ResultsColumn: React.FC = () => {
  const activeTournament = useTournamentStore(
    (state) => state.predictionTournament ?? state.tournament
  );
  const participants = activeTournament.participants;
  const allMatches = activeTournament.matches;
  const config = activeTournament.config;

  const stageConfig = config.stages[0]; // 假设我们总是在处理第一个阶段
  const winsToAdvance = stageConfig.swiss?.winsToAdvance ?? 3;
  const lossesToEliminate = stageConfig.swiss?.lossesToEliminate ?? 3;

  const advancedTeams = useMemo(() => {
    return participants
      .filter((p) => p.wins === winsToAdvance)
      .sort(compareAdvancedRankings);
  }, [participants, winsToAdvance]);

  const eliminatedTeams = useMemo(() => {
    return participants
      .filter((p) => p.losses === lossesToEliminate)
      .sort(compareEliminatedRankings);
  }, [participants, lossesToEliminate]);

  // 如果还没有队伍完成比赛，不渲染此列
  if (advancedTeams.length === 0 && eliminatedTeams.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col bg-[#1e1e1e] p-3 rounded-lg min-w-[300px]">
      <h2 className="text-xl font-bold mb-4 text-center">最终结果</h2>

      {/* 渲染晋级池 */}
      <div className="mb-3">
        <h3 className="text-xl font-semibold text-green-400 mb-2 px-1">
          晋级 ({advancedTeams.length} / 8)
        </h3>
        <div className="flex flex-col gap-1">
          {advancedTeams.map((p) => (
            <TeamResultCard
              key={p.id}
              participant={p}
              allParticipants={participants}
              allMatches={allMatches}
            />
          ))}
        </div>
      </div>

      {/* 渲染淘汰池 */}
      <div className="mb-3">
        <h3 className="text-xl font-semibold text-red-400 mb-2 px-1">
          淘汰 ({eliminatedTeams.length} / 8)
        </h3>
        <div className="flex flex-col gap-1">
          {eliminatedTeams.map((p) => (
            <TeamResultCard
              key={p.id}
              participant={p}
              allParticipants={participants}
              allMatches={allMatches}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
