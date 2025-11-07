import type {
  IPairingStrategy,
  Match,
  Participant,
} from '../../../types/domain.ts';

export class PlayoffSeedBasedPairingStrategy implements IPairingStrategy {
  private getRoundName(round: number, poolSize: number): string {
    if (poolSize === 8) return 'Quarterfinal';
    if (poolSize === 4) return 'Semifinal';
    if (poolSize === 2) return 'Final';
    return `Round ${round}`;
  }
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
    const poolRecord = this.getRoundName(round, count);

    if (count % 2 !== 0) {
      console.warn('PlayoffSeedBasedPairingStrategy: 队伍数量为奇数!');
      return matches;
    }

    for (let i = 0; i < halfSize; i++) {
      const participant1 = sortedParticipants[i];
      const participant2 = sortedParticipants[count - 1 - i]; // (1v8, 2v7...) (1v4, 2v3)

      const newMatch: Match = {
        id: `${poolRecord}-M${i + 1}`,
        round: round,
        participant1: participant1,
        participant2: participant2,
        poolRecord: poolRecord,
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
