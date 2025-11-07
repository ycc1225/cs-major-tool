import type {
  Participant,
  TournamentConfig,
  TournamentState,
} from '../types/domain.ts';
import { SwissEngine } from '../core/SwissEngine.ts';
import { create } from 'zustand/react';
import { AustinMajorSwissConfig } from '../config/AustinMajorSwissConfig.ts';
import type { ITournamentEngine } from '../core/ITournamentEngine.ts';
import { PlayoffEngine } from '../core/PlayoffEngine.ts';
import { AustinPlayoffConfig } from '../config/AustinMajorPlayoff.config.ts';

// 记录用户自定义更改的表，结构为Map<Round,Map<MatchID,WinnerID>>
type PredictionChanges = Map<number, Map<string, string>>;

interface State {
  tournament: TournamentState; // 初始默认状态
  predictionChanges: PredictionChanges;
  predictionTournament: TournamentState | null; // 用户自行修改的预测状态
  engine: ITournamentEngine;
}

interface Actions {
  loadTournament: (config: TournamentConfig) => void;
  updatePrediction: (
    clickedMatchId: string,
    newWinnerId: string,
    clickedRound: number
  ) => void;
  clearPrediction: () => void;
  advanceToNextStage: () => void;
}

const engineFactory = new Map<string, () => ITournamentEngine>([
  ['swiss', () => new SwissEngine()],
  ['single-elimination', () => new PlayoffEngine()],
]);

/**
 * 比较函数 (晋级)
 * 1. 胜负差 (3-0 > 3-1 > 3-2)
 * 2. 难度分 (降序)
 * 3. 初始种子 (升序)
 */
export const compareAdvancedRankings = (a: Participant, b: Participant) => {
  if (a.losses !== b.losses) return a.losses - b.losses; // 负场越少越好
  if (a.buchholz !== b.buchholz) return b.buchholz - a.buchholz;
  return a.seed - b.seed;
};
export const compareEliminatedRankings = (a: Participant, b: Participant) => {
  if (a.wins !== b.wins) return b.wins - a.wins; // 胜场越多越好
  if (a.buchholz !== b.buchholz) return b.buchholz - a.buchholz;
  return a.seed - b.seed;
};

// 运行模拟
const runFullSimulation = (
  engine: ITournamentEngine,
  config: TournamentConfig,
  overrideResults: Map<string, string | null>
): TournamentState => {
  let simulatedState: TournamentState = {
    config: config,
    currentStageIndex: 0,
    participants: JSON.parse(JSON.stringify(config.participants)), // 对参赛者深拷贝
    matches: [],
  };
  let currentRound = 0;
  const maxRound =
    config.stages[0].format === 'swiss'
      ? 5
      : config.stages[0].format === 'single-elimination'
        ? 3
        : 5;

  while (currentRound < maxRound) {
    const nextRound = currentRound + 1;
    const stateAfterGen = engine.generateNextRound(
      simulatedState,
      currentRound
    );
    const newPendingMatches = stateAfterGen.matches.filter(
      (m) => m.round === nextRound && m.status === 'pending'
    );
    if (newPendingMatches.length === 0) break; // 如果没有待修改的比赛，说明所有队伍都已晋级/淘汰

    let stateAfterSimulation = stateAfterGen;
    for (const match of newPendingMatches) {
      if (!match.participant1 || !match.participant2) continue;
      // 从预测表中找到模拟结果，默认为左边的队伍获胜
      let winnerId: string | null = null;
      if (overrideResults.has(match.id)) {
        winnerId = overrideResults.get(match.id) ?? match.participant1.id;
      } else {
        winnerId = match.participant1.id;
      }

      const score1 = winnerId === match.participant1.id ? 1 : 0;
      const score2 = winnerId === match.participant2.id ? 1 : 0;
      stateAfterSimulation = engine.updateMatchResult(
        stateAfterSimulation,
        match.id,
        score1,
        score2
      );
    }
    simulatedState = stateAfterSimulation;
    currentRound += 1;
  }
  return simulatedState;
};

export const useTournamentStore = create<State & Actions>((set, get) => {
  const initialEmptyState: TournamentState = {
    config: AustinMajorSwissConfig,
    currentStageIndex: 0,
    participants: AustinMajorSwissConfig.participants,
    matches: [],
  };

  // 创建引擎实例
  const initialEngine = new SwissEngine();
  // 返回 Store 的 State 和 Actions
  return {
    // --- State ---
    tournament: initialEmptyState,
    predictionTournament: null,
    engine: initialEngine,
    predictionChanges: new Map(),
    // --- Actions ---
    // 加载默认对局并默认左边获胜
    loadTournament: (config) => {
      const stageFormat = config.stages[0].format;
      const engineCreator = engineFactory.get(stageFormat);
      if (!engineCreator) {
        console.error(`加载失败，无法找到${stageFormat}对应引擎`);
        return;
      }
      const newEngine = engineCreator();
      const initialState = runFullSimulation(newEngine, config, new Map());
      set({
        engine: newEngine,
        tournament: initialState,
        predictionChanges: new Map(),
        predictionTournament: null,
      });
    },
    updatePrediction: (
      clickedMatchId: string,
      newWinnerId: string,
      clickedRound: number
    ) => {
      const { tournament, engine, predictionChanges } = get();
      const newChanges: PredictionChanges = new Map(predictionChanges);
      // 先删除未来轮次的预测
      for (let i = clickedRound + 1; i <= 5; i++) {
        newChanges.delete(i);
      }
      if (!newChanges.has(clickedRound)) {
        newChanges.set(clickedRound, new Map());
      }
      newChanges.get(clickedRound)!.set(clickedMatchId, newWinnerId);
      const mergedOverrides = new Map<string, string | null>();
      for (const [, roundChanges] of newChanges.entries()) {
        for (const [matchId, winnerId] of roundChanges.entries()) {
          mergedOverrides.set(matchId, winnerId);
        }
      }
      const predictionTournament = runFullSimulation(
        engine,
        tournament.config,
        mergedOverrides
      );
      set({
        predictionChanges: newChanges,
        predictionTournament: predictionTournament,
      });
    },
    clearPrediction: () => {
      set({
        predictionChanges: new Map(),
        predictionTournament: null,
      });
    },
    advanceToNextStage: () => {
      const { tournament, predictionTournament } = get();
      const activeTournament = predictionTournament ?? tournament;
      const currentConfig = activeTournament.config;
      const currentStage = currentConfig.stages[0];
      const winsToAdvance = currentStage.swiss?.winsToAdvance ?? 3;
      const advancingParticipants = activeTournament.participants.filter(
        (p) => p.wins === winsToAdvance
      );
      const sortedAdvancingTeams = advancingParticipants.sort(
        compareAdvancedRankings
      );
      const newPlayoffParticipants = sortedAdvancingTeams.map(
        (team, index) => ({
          ...team,
          seed: index + 1, // 新种子
          wins: 0,
          losses: 0,
          buchholz: 0,
          playedOpponentIds: [],
        })
      );
      const newPlayoffConfig: TournamentConfig = {
        ...AustinPlayoffConfig,
        participants: newPlayoffParticipants,
      };
      get().loadTournament(newPlayoffConfig);
    },
  };
});
