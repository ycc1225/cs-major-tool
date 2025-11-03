import type {
  IProgressionStrategy,
  Participant,
  StageConfig,
} from '../../types/domain.ts';

type ProgressionResult = {
  advanced: Participant[];
  eliminated: Participant[];
  ongoing: Participant[];
};

export class SwissProgressionStrategy implements IProgressionStrategy {
  /**
   * 检查队伍状态
   * @param participants 参赛者
   * @param config 赛制信息
   */
  checkProgression(
    participants: Participant[],
    config: StageConfig
  ): ProgressionResult {
    const advanced: Participant[] = [];
    const eliminated: Participant[] = [];
    const ongoing: Participant[] = [];

    const winsToAdvance = config.swiss?.winsToAdvance ?? 3;
    const lossesToEliminate = config.swiss?.lossesToEliminate ?? 3;

    for (const p of participants) {
      if (p.wins === winsToAdvance) {
        advanced.push(p);
      } else if (p.losses === lossesToEliminate) {
        eliminated.push(p);
      } else {
        ongoing.push(p);
      }
    }

    return { advanced, eliminated, ongoing };
  }
}
