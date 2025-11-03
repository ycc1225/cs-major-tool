import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom'; // 1. 导入 createPortal
import type { Match, Participant } from '../types/domain.ts';
import clsx from 'clsx';

interface TooltipContentProps {
  participant: Participant;
  allParticipants: Participant[];
  allMatches: Match[];
  matchRound: number;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  style: React.CSSProperties | null;
}

const TooltipContent: React.FC<TooltipContentProps> = ({
  participant,
  allParticipants,
  allMatches,
  matchRound,
  tooltipRef,
  style,
}) => {
  // 使用 useMemo 计算实时数据
  const { realtimeOpponents, realtimeBuchholz } = useMemo(() => {
    const opponentsToCalc = participant.playedOpponentIds.slice(
      0,
      matchRound - 1
    );

    let buchholzScore = 0;

    // 创建一个 Map，用于快速查找对手本轮的比赛池，无需回溯获取难度分
    const opponentMatchInThisRoundMap = new Map<string, Match>();
    for (const match of allMatches) {
      if (match.round === matchRound) {
        if (match.participant1)
          opponentMatchInThisRoundMap.set(match.participant1.id, match);
        if (match.participant2)
          opponentMatchInThisRoundMap.set(match.participant2.id, match);
      }
    }

    // 用于快速查找已晋级/淘汰的队伍
    const pMap = new Map(allParticipants.map((p) => [p.id, p]));

    // 循环计算
    const opponentDetails = opponentsToCalc.map((oppId) => {
      let contribution = 0;
      let record = '?-?';

      const opponentMatch = opponentMatchInThisRoundMap.get(oppId);

      if (opponentMatch) {
        // --- 案例 A：找到了 ---
        // 对手表明还在 "ongoing" 状态，我们用他们 *本轮* 的战绩池
        // p1 和 p2 战绩总是一样的
        const poolRecord = opponentMatch.poolRecord; // e.g., "2-1"
        const [wins, losses] = poolRecord.split('-').map(Number);

        contribution = wins - losses;
        record = poolRecord;
      } else {
        // --- 案例 B：没找到 ---
        // 这意味着对手在本轮 *之前* 就已经晋级 (e.g., 3-0) 或淘汰 (e.g., 0-3)
        // 我们用他们的 *最终* 战绩来计算
        const finalOpponentState = pMap.get(oppId);
        if (finalOpponentState) {
          contribution = finalOpponentState.wins - finalOpponentState.losses;
          record = `${finalOpponentState.wins}-${finalOpponentState.losses}`;
        }
      }

      buchholzScore += contribution;

      return {
        id: oppId,
        name: pMap.get(oppId)?.name ?? '???',
        record: record,
        contribution: contribution,
      };
    });

    return {
      realtimeOpponents: opponentDetails,
      realtimeBuchholz: buchholzScore,
    };
  }, [allMatches, allParticipants, matchRound, participant.playedOpponentIds]);
  const title =
    matchRound > 5 ? '最终难度分 (Buchholz)' : `难度分 (截至 R${matchRound})`;

  return (
    <div
      ref={tooltipRef}
      style={style ?? undefined}
      className={clsx('glowing-border-wrapper', !style && 'opacity-0')}
      onMouseEnter={(e) => e.stopPropagation()}
    >
      <div className="w-60 bg-[#1e1e1e] rounded-lg p-3">
        <h4 className="text-base font-bold mb-1 text-gray-200">
          {participant.name}
        </h4>

        <div className="flex justify-between text-xs text-gray-300 py-1">
          <span>初始种子 (Seed)</span>
          <span className="font-medium">#{participant.seed}</span>
        </div>

        <hr className="border-gray-600 my-1" />

        <div className="text-xs">
          <h5 className="font-semibold mb-1 text-gray-200">{title}</h5>
          <div className="flex text-[10px] text-gray-400 font-medium">
            <span className="w-1/2">交手对手</span>
            <span className="w-1/4 text-center">对手战绩</span>
            <span className="w-1/4 text-right">难度分贡献</span>
          </div>
          <div className="space-y-0.5 mt-1">
            {/* 5. (修改) 使用实时对手列表 */}
            {realtimeOpponents.length === 0 && (
              <div className="text-gray-400 text-[10px] text-center py-1">
                (尚未交手)
              </div>
            )}
            {realtimeOpponents.map((opp) => {
              const contributionClass = clsx(
                'font-medium text-right w-1/4',
                opp.contribution > 0 && 'text-green-400',
                opp.contribution < 0 && 'text-red-400',
                opp.contribution === 0 && 'text-gray-400'
              );
              return (
                <div key={opp.id} className="flex text-[10px] text-gray-200">
                  <span className="w-1/2 truncate" title={opp.name}>
                    {opp.name}
                  </span>
                  <span className="w-1/4 text-center">{opp.record}</span>
                  <span className={contributionClass}>
                    {opp.contribution > 0
                      ? `+${opp.contribution}`
                      : opp.contribution}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <hr className="border-gray-600 my-1" />

        <div className="flex justify-between text-xs py-1 font-bold">
          <span className="text-gray-200">总难度分 (Total)</span>
          <span
            className={clsx(
              realtimeBuchholz > 0 && 'text-green-400',
              realtimeBuchholz < 0 && 'text-red-400',
              realtimeBuchholz === 0 && 'text-gray-400'
            )}
          >
            {realtimeBuchholz}
          </span>
        </div>
      </div>
    </div>
  );
};

interface TeamTooltipProps {
  participant: Participant;
  allParticipants: Participant[];
  allMatches: Match[];
  matchRound: number;
  children: React.ReactElement;
}

export const TeamTooltip: React.FC<TeamTooltipProps> = ({
  participant,
  allParticipants,
  allMatches,
  matchRound,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<React.CSSProperties | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null); // 子节点
  const tooltipRef = useRef<HTMLDivElement>(null); // 本身

  // 计算位置的 Effect
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current.offsetHeight;
      const tooltipWidth = tooltipRef.current.offsetWidth; // 240px

      // 计算 Top: 触发器顶部 - Tooltip高度 - 8px间距
      let top = triggerRect.top - tooltipHeight - 8;
      // 计算 Left: 触发器中心 - Tooltip宽度的一半
      let left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;

      // 边缘检测：防止 X 轴溢出
      if (left < 8) left = 8; // 离左边缘太近
      if (left + tooltipWidth > window.innerWidth - 8) {
        left = window.innerWidth - tooltipWidth - 8; // 离右边缘太近
      }
      // 边缘检测：防止 Y 轴溢出
      if (top < 8) {
        top = triggerRect.bottom + 8; // 空间不够，移动到下方
      }

      setPosition({ top, left });
    }
  }, [isVisible, participant.id, allMatches, allParticipants, matchRound]); // 依赖 isVisible 和 participant.id (确保重算)

  // 克隆 (卡片) 并附加 ref 和 hover 事件
  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: () => setIsVisible(true),
    onMouseLeave: () => {
      setIsVisible(false);
      setPosition(null);
    },
  });

  return (
    <>
      {trigger}
      {isVisible &&
        createPortal(
          <TooltipContent
            participant={participant}
            allParticipants={allParticipants}
            allMatches={allMatches}
            matchRound={matchRound}
            tooltipRef={tooltipRef}
            style={position}
          />,
          document.body // 将Tooltip渲染在body组件上
        )}
    </>
  );
};
