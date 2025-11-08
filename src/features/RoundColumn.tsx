import React, { useMemo } from 'react';
import { useTournamentStore } from '../store/useTournamentStore';
import { MatchPool } from './MatchPool';
import type { Match } from '../types/domain.ts';
import clsx from 'clsx'; // 导入你创建的 MatchPool

interface RoundColumnProps {
  round: number;
}

export const RoundColumn: React.FC<RoundColumnProps> = ({ round }) => {
  const activeTournament = useTournamentStore(
    (state) => state.predictionTournament ?? state.tournament
  );

  const allMatches = activeTournament.matches;
  const allParticipants = activeTournament.participants;

  // 使用 useMemo 过滤出本轮的所有比赛
  const roundMatches = useMemo(() => {
    return allMatches.filter((m) => m.round === round);
  }, [allMatches, round]);

  // 将本轮比赛按战绩分组
  const pools = useMemo(() => {
    const grouped: Record<string, Match[]> = {}; // 如 "2-0", "1-1", "0-2"

    for (const match of roundMatches) {
      // 我们使用 participant1 的战绩作为池的 key
      // (因为瑞士轮同池的队伍战绩总是一样的)

      const poolKey = match.id.slice(4, 7);

      if (!grouped[poolKey]) {
        grouped[poolKey] = [];
      }
      grouped[poolKey].push(match);
    }
    return grouped;
  }, [roundMatches]);

  // Major 瑞士轮的战绩池有固定的渲染顺序
  //    (2-0 总是在 1-1 上面)
  const poolOrder = ['2-0', '1-1', '0-2', '2-1', '1-2', '2-2', '1-0', '0-1'];

  // 过滤和排序 key
  const sortedPoolKeys = Object.keys(pools).sort(
    (a, b) => poolOrder.indexOf(a) - poolOrder.indexOf(b)
  );

  // 如果这一轮还没有开始，不渲染
  if (roundMatches.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(
        'flex flex-col p-3 rounded-lg min-w-[300px]',
        'bg-[#1e1e1e]'
      )}
    >
      <h2 className="text-xl font-bold mb-4 text-center">第 {round} 轮</h2>
      <div className="flex flex-col justify-center gap-4 grow">
        {/* 渲染所有战绩池 */}
        {sortedPoolKeys.map((poolKey) => (
          <MatchPool
            key={poolKey}
            title={`战绩池 ${poolKey}`}
            matches={pools[poolKey]}
            allParticipants={allParticipants}
            allMatches={allMatches}
          />
        ))}
      </div>
    </div>
  );
};
