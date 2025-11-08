export interface Participant {
  id: string;
  name: string;
  seed: number; //种子序号
  logoUrl?: string;
  wins: number;
  losses: number;
  buchholz: number; //BU分
  playedOpponentIds: string[];
}

export interface Match {
  id: string;
  round: number; // 第几轮
  participant1: string;
  participant2: string;

  poolRecord: string;

  status: 'pending' | 'completed' | 'live';

  result: {
    winnerId: string | null;
    scores: [number, number];
  };
}

export interface StageConfig {
  id: string;
  name: string;
  format: 'swiss' | 'single-elimination' | 'group';

  // 瑞士轮特定规则
  swiss?: {
    winsToAdvance: number;
    lossesToEliminate: number;
    // 每一轮使用什么配对策略 (key是轮次)
    // e.g., { 1: 'seed_1v9', 2: 'seed_greedy', 3: 'buchholz' }
    pairingStrategies: Record<number, string>;
    // 本阶段使用的排名策略 (e.g., 'buchholz')
    rankingStrategy: string;
  };
  singleElimination?: {
    winsToAdvance: number;
    lossesToEliminate: number;
  };
  results: Match[];
}

// 锦标赛的定义（从配置文件中读取）
export interface TournamentConfig {
  id: string;
  name: string;
  stages: StageConfig[];
  participants: Participant[]; // 初始的、未经修改的完整参与者列表
}

// 竞标赛的状态，实时变化的
export interface TournamentState {
  config: TournamentConfig;
  currentStageIndex: number;
  participants: Participant[]; // 包含最新 wins/losses/buchholz 的队伍状态
  matches: Match[]; // 所有已发生或将发生的比赛
}

// 排名策略，更新比赛后的排名
export interface IRankingStrategy {
  updateRankings(participants: Participant[]): Participant[];
}

// 配对策略，产生新的比赛对局
export interface IPairingStrategy {
  generateMatches(participantsInPool: Participant[], round: number): Match[];
}

// 晋级/淘汰策略，修改队伍状态
export interface IProgressionStrategy {
  checkProgression(
    participants: Participant[],
    config: StageConfig
  ): {
    advanced: Participant[];
    eliminated: Participant[];
    ongoing: Participant[];
  };
}
