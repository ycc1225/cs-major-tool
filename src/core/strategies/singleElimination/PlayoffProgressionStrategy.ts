import type {
  IProgressionStrategy,
  Participant,
  StageConfig,
} from '../../../types/domain.ts';
export class PlayoffProgressionStrategy implements IProgressionStrategy {
  checkProgression(
    participants: Participant[],
    config: StageConfig
  ): {
    advanced: Participant[];
    eliminated: Participant[];
    ongoing: Participant[];
  } {
    const advanced: Participant[] = [];
    const eliminated: Participant[] = [];
    const ongoing: Participant[] = [];

    const winsToAdvance = config.singleElimination?.winsToAdvance ?? 3; // 8队3胜夺冠
    const lossesToEliminate = config.singleElimination?.lossesToEliminate ?? 1;

    for (const p of participants) {
      if (p.wins === winsToAdvance) {
        advanced.push(p);
      } else if (p.losses >= lossesToEliminate) {
        eliminated.push(p);
      } else {
        ongoing.push(p);
      }
    }
    return { advanced, eliminated, ongoing };
  }
}
