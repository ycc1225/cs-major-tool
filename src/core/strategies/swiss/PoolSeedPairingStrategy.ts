import type {
  Participant,
  Match,
  IPairingStrategy,
} from '../../../types/domain.ts';

export class PoolSeedGreedyPairingStrategy implements IPairingStrategy {
  /**
   * 瑞士轮第二轮配对，每个池子内折叠配对(1v8,2v7,...)
   * @param participantsInPool
   * @param round
   */
  public generateMatches(
    participantsInPool: Participant[],
    round: number
  ): Match[] {
    const matches: Match[] = [];

    const sortedParticipants = [...participantsInPool].sort(
      (a, b) => a.seed - b.seed
    );
    const count = sortedParticipants.length;
    const halfSize = count / 2;

    for (let i = 0; i < halfSize; i++) {
      const participant1 = sortedParticipants[i];
      const participant2 = sortedParticipants[count - 1 - i];

      const newMatch: Match = {
        id: `R${round}-P${participant1.wins}-${participant1.losses}-M${i + 1}`,
        round: round,
        participant1: participant1,
        participant2: participant2,
        poolRecord: `${participant1.wins}-${participant1.losses}`,
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
