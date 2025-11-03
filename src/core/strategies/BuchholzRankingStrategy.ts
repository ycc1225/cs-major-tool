import type { Participant, IRankingStrategy } from '../../types/domain';

export class BuchholzRankingStrategy implements IRankingStrategy {
  /**
   * (纯函数)
   * 计算所有参与者的BOUZ分，并返回一个 *新* 的参与者数组。
   */
  public updateRankings(participants: Participant[]): Participant[] {
    const winsMap = new Map<string, number>();
    const losesMap = new Map<string, number>();
    for (const p of participants) {
      winsMap.set(p.id, p.wins);
      losesMap.set(p.id, p.losses);
    }

    return participants.map((participant) => {
      let buchholzScore = 0;

      for (const Id of participant.playedOpponentIds) {
        const Wins = winsMap.get(Id);
        const Losses = losesMap.get(Id);
        if (Wins !== undefined && Losses !== undefined) {
          buchholzScore += Wins - Losses;
        }
      }

      // 2. 返回新的 participant 对象
      return { ...participant, buchholz: buchholzScore };
    });
  }
}
