import type { TournamentState } from '../types/domain.ts';

/**
 * 定义一个锦标赛引擎必须实现的通用接口
 */
export interface ITournamentEngine {
  /**
   * (纯函数) 根据比赛结果更新锦标赛状态。
   * @param currentState 当前状态
   * @param matchId 要更新的比赛 ID
   * @param score1 队伍1的分数
   * @param score2 队伍2的分数
   * @returns 一个 *新* 的 TournamentState
   */
  updateMatchResult(
    currentState: TournamentState,
    matchId: string,
    score1: number,
    score2: number
  ): TournamentState;

  /**
   * (纯函数) 为下一轮生成比赛。
   * @param currentState 当前状态
   * @param currentRound 当前是第几轮 (从 0 开始)
   * @returns 一个 新 的 TournamentState，包含新生成的比赛
   */
  generateNextRound(
    currentState: TournamentState,
    currentRound: number
  ): TournamentState;
}
