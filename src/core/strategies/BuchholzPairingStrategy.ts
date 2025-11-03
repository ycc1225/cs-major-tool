import type {
  IPairingStrategy,
  Match,
  Participant,
} from '../../types/domain.ts';

type PairIndices = [number, number];
type PrioritySet6 = [PairIndices, PairIndices, PairIndices];

// Valve 规则书的6队配对优先级，保证难度分最大，因为算法比较复杂，所以写死优先级
// prettier-ignore
const PRIORITY_LIST_6_TEAMS: PrioritySet6[] = [
    [[0, 5], [1, 4], [2, 3]], // Prio 1: 1v6, 2v5, 3v4
    [[0, 5], [1, 3], [2, 4]], // Prio 2: 1v6, 2v4, 3v5
    [[0, 4], [1, 5], [2, 3]], // Prio 3: 1v5, 2v6, 3v4
    [[0, 4], [1, 3], [2, 5]], // Prio 4: 1v5, 2v4, 3v6
    [[0, 3], [1, 5], [2, 4]], // Prio 5: 1v4, 2v6, 3v5
    [[0, 3], [1, 4], [2, 5]], // Prio 6: 1v4, 2v5, 3v6
    [[0, 5], [1, 2], [3, 4]], // Prio 7: 1v6, 2v3, 4v5
    [[0, 4], [1, 2], [3, 5]], // Prio 8: 1v5, 2v3, 4v6
    [[0, 2], [1, 5], [3, 4]], // Prio 9: 1v3, 2v6, 4v5
    [[0, 2], [1, 4], [3, 5]], // Prio 10: 1v3, 2v5, 4v6
    [[0, 3], [1, 2], [4, 5]], // Prio 11: 1v4, 2v3, 5v6
    [[0, 2], [1, 3], [4, 5]], // Prio 12: 1v3, 2v4, 5v6
    [[0, 1], [2, 5], [3, 4]], // Prio 13: 1v2, 3v6, 4v5
    [[0, 1], [2, 4], [3, 5]], // Prio 14: 1v2, 3v5, 4v6
    [[0, 1], [2, 3], [4, 5]], // Prio 15: 1v2, 3v4, 5v6
];

/**
 * 瑞士轮第3-5轮策略
 */
export class BuchholzPairingStrategy implements IPairingStrategy {
  public generateMatches(
    participantsInPool: Participant[],
    round: number
  ): Match[] {
    const rankedList = [...participantsInPool].sort(this.compareParticipants);
    const poolSize = rankedList.length;

    // 根据池大小调用不同策略
    switch (poolSize) {
      // R3 (1-1), R3 (2-0, 0-2) 使用标准贪心算法
      case 8:
      case 4:
        return this.generateMatchesGreedy(rankedList, round);

      // R4, R5 (6-team pools) 使用硬编码优先级
      case 6:
        return this.generateMatchesFor6(rankedList, round);

      // 2 队池
      case 2:
        return [this.createMatch(rankedList[0], rankedList[1], round, 1)];

      default:
        console.error('Unreachable pool size');
        return [];
    }
  }
  // --- 辅助函数 ---
  // 确认难度排名，1.难度分（降序）> 2.初始种子（升序）
  private compareParticipants(a: Participant, b: Participant): number {
    if (a.buchholz !== b.buchholz) {
      return b.buchholz - a.buchholz;
    }
    return a.seed - b.seed;
  }
  // 检查两队是否交手
  private hasPlayed(a: Participant, b: Participant): boolean {
    return a.playedOpponentIds.includes(b.id);
  }
  // 创建Match对象
  private createMatch(
    a: Participant,
    b: Participant,
    round: number,
    matchIndex: number
  ): Match {
    return {
      id: `R${round}-P${a.wins}-${a.losses}-M${matchIndex}`,
      round: round,
      participant1: a,
      participant2: b,
      poolRecord: `${a.wins}-${a.losses}`,
      status: 'pending',
      result: {
        winnerId: null,
        scores: [0, 0],
      },
    };
  }
  // --- 不同池子大小使用的规则 ---
  private generateMatchesFor6(
    rankedList: Participant[],
    round: number
  ): Match[] {
    for (const prioritySet of PRIORITY_LIST_6_TEAMS) {
      const [pair1, pair2, pair3] = prioritySet;
      const p1a = rankedList[pair1[0]];
      const p1b = rankedList[pair1[1]];
      const p2a = rankedList[pair2[0]];
      const p2b = rankedList[pair2[1]];
      const p3a = rankedList[pair3[0]];
      const p3b = rankedList[pair3[1]];
      if (
        !this.hasPlayed(p1a, p1b) &&
        !this.hasPlayed(p2a, p2b) &&
        !this.hasPlayed(p3a, p3b)
      ) {
        return [
          this.createMatch(p1a, p1b, round, 1),
          this.createMatch(p2a, p2b, round, 2),
          this.createMatch(p3a, p3b, round, 3),
        ];
      }
    }
    // 所有优先级都失败，意味着必定有重复对局使用贪心算法
    console.warn(
      `BuchholzPairingStrategy(6-Team): 无法找到无重复对局配对，强制重复对局`
    );
    return this.generateMatchesGreedy(rankedList, round);
  }
  // R3(4/8队),R4/R5回退的算法使用 "Greedy Best vs Worst" 保证难度分差最大
  private generateMatchesGreedy(
    rankedList: Participant[],
    round: number
  ): Match[] {
    const matches: Match[] = [];
    const pairedIds = new Set<string>();
    let matchIndex = 1;

    for (let i = 0; i < rankedList.length; i++) {
      const teamA = rankedList[i];
      if (pairedIds.has(teamA.id)) continue;
      let teamB: Participant | null = null;
      for (let j = rankedList.length - 1; j > i; j--) {
        const potentialTeamB = rankedList[j];
        if (
          !pairedIds.has(potentialTeamB.id) &&
          !this.hasPlayed(teamA, potentialTeamB)
        ) {
          teamB = potentialTeamB;
          break;
        }
      }
      if (!teamB) {
        for (let j = rankedList.length - 1; j > i; j--) {
          if (!pairedIds.has(rankedList[j].id)) {
            teamB = rankedList[j];
            console.warn(
              `BuchholzPairingStrategy(Greedy): 队伍${teamA.name}与${teamB.name}发生重复对局`
            );
            break;
          }
        }
      }
      if (teamB) {
        pairedIds.add(teamA.id);
        pairedIds.add(teamB.id);
        matches.push(this.createMatch(teamA, teamB, round, matchIndex++));
      }
    }
    return matches;
  }
}
