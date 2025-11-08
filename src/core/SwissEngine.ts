import type {
  IPairingStrategy,
  IProgressionStrategy,
  IRankingStrategy,
  Match,
  Participant,
  TournamentState,
} from '../types/domain.ts';
import { BuchholzRankingStrategy } from './strategies/swiss/BuchholzRankingStrategy.ts';
import { SwissSeedBasedPairingStrategy } from './strategies/swiss/SwissSeedBasedPairingStrategy.ts';
import { PoolSeedGreedyPairingStrategy } from './strategies/swiss/PoolSeedPairingStrategy.ts';
import { BuchholzPairingStrategy } from './strategies/swiss/BuchholzPairingStrategy.ts';
import { SwissProgressionStrategy } from './strategies/swiss/SwissProgressionStrategy.ts';
import type { ITournamentEngine } from './ITournamentEngine.ts';

// 引擎，用于将定义的策略组合为完整的规则
// 无状态服务，所有函数均为纯函数，必须返回新的状态对象
export class SwissEngine implements ITournamentEngine {
  // 策略注册表
  private rankingStrategies = new Map<string, IRankingStrategy>();
  private pairingStrategies = new Map<string, IPairingStrategy>();
  private progressionStrategies = new Map<string, IProgressionStrategy>();

  constructor() {
    this.registerStrategies();
  }

  private registerStrategies(): void {
    // 排名策略
    this.rankingStrategies.set('buchholz', new BuchholzRankingStrategy());

    // 配对策略
    this.pairingStrategies.set('seed_1v9', new SwissSeedBasedPairingStrategy());
    this.pairingStrategies.set(
      'seed_greedy',
      new PoolSeedGreedyPairingStrategy()
    );
    this.pairingStrategies.set('buchholz', new BuchholzPairingStrategy());

    // 晋级淘汰策略
    this.progressionStrategies.set('swiss', new SwissProgressionStrategy());
  }

  public updateMatchResult(
    currentState: TournamentState, // << 3. 接收当前状态
    matchId: string,
    score1: number,
    score2: number
  ): TournamentState {
    const matchToUpdate = currentState.matches.find((m) => m.id === matchId);
    if (
      !matchToUpdate ||
      matchToUpdate.status === 'completed' ||
      !matchToUpdate.participant1 ||
      !matchToUpdate.participant2
    ) {
      console.warn(`无法更新 ${matchId}`);
      return currentState;
    }

    const p1 = currentState.participants.find(
      (p) => p.id === matchToUpdate.participant1!
    );
    const p2 = currentState.participants.find(
      (p) => p.id === matchToUpdate.participant2!
    );
    if (!p1 || !p2) {
      console.error(`找不到Match ${matchId} 的参与者`);
      return currentState;
    }

    const winner = score1 > score2 ? p1 : p2;
    const loser = score1 > score2 ? p2 : p1;

    const updatedMatch: Match = {
      ...matchToUpdate,
      status: 'completed',
      result: {
        scores: [score1, score2],
        winnerId: winner.id,
      },
    };

    const updatedP1: Participant = {
      ...p1,
      playedOpponentIds: [...p1.playedOpponentIds, p2.id],
      wins: p1.id === winner.id ? p1.wins + 1 : p1.wins,
      losses: p1.id === loser.id ? p1.losses + 1 : p1.losses,
    };

    const updatedP2: Participant = {
      ...p2,
      playedOpponentIds: [...p2.playedOpponentIds, p1.id],
      wins: p2.id === winner.id ? p2.wins + 1 : p2.wins,
      losses: p2.id === loser.id ? p2.losses + 1 : p2.losses,
    };
    const newMatches = currentState.matches.map((m) =>
      m.id === matchId ? updatedMatch : m
    );
    const newParticipants = currentState.participants.map((p) =>
      p.id === p1.id ? updatedP1 : p.id === p2.id ? updatedP2 : p
    );
    const currentStageConfig =
      currentState.config.stages[currentState.currentStageIndex];
    const rankingStrategy = this.rankingStrategies.get(
      currentStageConfig.swiss!.rankingStrategy
    );
    if (rankingStrategy) {
      const rankedParticipants =
        rankingStrategy.updateRankings(newParticipants);
      return {
        ...currentState,
        matches: newMatches,
        participants: rankedParticipants,
      };
    }

    return {
      ...currentState,
      matches: newMatches,
      participants: newParticipants,
    };
  }

  public generateNextRound(
    currentState: TournamentState,
    currentRound: number
  ): TournamentState {
    const nextRound = currentRound + 1;
    const currentStageConfig =
      currentState.config.stages[currentState.currentStageIndex];
    // --- 检查队伍状态 ---
    const progressionStrategy = this.progressionStrategies.get(
      currentStageConfig.format
    );
    if (!progressionStrategy) {
      console.error(`找不到${currentStageConfig.format}晋级策略`);
      return currentState;
    }

    const { ongoing } = progressionStrategy.checkProgression(
      currentState.participants,
      currentStageConfig
    );
    // 如果所有队伍都完成晋级/淘汰，则当前阶段完成
    if (ongoing.length === 0) {
      console.log(`阶段${currentStageConfig.name}完成`);
      return currentState;
    }
    // 对于ongoing的队伍，进入下一轮，先更新难度分
    let participantsForPairing = [...ongoing];
    const nextPairingStrategyName =
      currentStageConfig.swiss?.pairingStrategies[nextRound];
    if (nextPairingStrategyName === 'buchholz') {
      const rankingStrategy = this.rankingStrategies.get(
        currentStageConfig.swiss!.rankingStrategy
      );
      if (rankingStrategy) {
        const rankedParticipants = rankingStrategy.updateRankings(
          currentState.participants
        );
        const rankedMap = new Map(rankedParticipants.map((p) => [p.id, p]));
        participantsForPairing = ongoing.map((p) => rankedMap.get(p.id) || p);
      }
    }

    // 按战绩分组如(2-0,1-1,0-2)
    const pools = new Map<string, Participant[]>();
    for (const p of participantsForPairing) {
      const key = `${p.wins}-${p.losses}`;
      if (!pools.has(key)) {
        pools.set(key, []);
      }
      pools.get(key)!.push(p);
    }
    // 给每个池配对
    const pairingStrategy = this.pairingStrategies.get(
      nextPairingStrategyName!
    );
    if (!pairingStrategy) {
      console.error(`找不到${nextPairingStrategyName}的配对策略`);
      return currentState;
    }

    let newMatches: Match[] = [];
    for (const [poolName, participantsInPool] of pools.entries()) {
      console.log(`为${poolName}池${nextRound}生成对阵...`);
      const matchesForPool = pairingStrategy.generateMatches(
        participantsInPool,
        nextRound
      );
      newMatches = [...newMatches, ...matchesForPool];
    }

    return {
      ...currentState,
      matches: [...currentState.matches, ...newMatches],
      // 如果难度分更新，则需要更新参与者列表
      participants:
        nextPairingStrategyName === 'buchholz'
          ? currentState.participants.map(
              (p) => participantsForPairing.find((rp) => rp.id === p.id) || p
            )
          : currentState.participants,
    };
  }
}
