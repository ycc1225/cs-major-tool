import type {
  Participant,
  Match,
  IPairingStrategy,
} from '../../../types/domain.ts';

/**
 * 实现了 IPairingStrategy 接口，用于瑞士轮第 1 轮。
 * 按种子排名 (1v9, 2v10...) 进行配对。
 */
export class SwissSeedBasedPairingStrategy implements IPairingStrategy {
  /**
   * 为第一轮生成对局
   * @param participantsInPool - 应该是所有 0-0 的参与者 (16队)
   * @param round - 当前轮次 (应为 1)
   */
  public generateMatches(
    participantsInPool: Participant[],
    round: number
  ): Match[] {
    const matches: Match[] = [];
    const sortedParticipants = [...participantsInPool].sort(
      (a, b) => a.seed - b.seed
    );

    const halfSize = sortedParticipants.length / 2;
    if (sortedParticipants.length % 2 !== 0) {
      console.warn(
        'SwissSeedBasedPairingStrategy: 参与者数量为奇数，这不符合标准瑞士轮。'
      );
      return matches;
    }

    for (let i = 0; i < halfSize; i++) {
      const participant1 = sortedParticipants[i];
      const participant2 = sortedParticipants[i + halfSize];

      const newMatch: Match = {
        id: `R${round}-P${participant1.wins}-${participant1.losses}-M${i + 1}`,
        round: round,
        participant1: participant1,
        participant2: participant2,
        poolRecord: '0-0',
        status: 'pending',
        result: {
          winnerId: null,
          scores: [0, 0],
        },
      };
      matches.push(newMatch);
    }

    return matches;
  }
}
