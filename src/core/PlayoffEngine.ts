import type { ITournamentEngine } from './ITournamentEngine.ts';
import { PlayoffProgressionStrategy } from './strategies/singleElimination/PlayoffProgressionStrategy.ts';
import { PlayoffSeedBasedPairingStrategy } from './strategies/singleElimination/PlayoffSeedBasedPairingStrategy.ts';
import type { Match, Participant, TournamentState } from '../types/domain.ts';

export class PlayoffEngine implements ITournamentEngine {
  private pairingStrategy = new PlayoffSeedBasedPairingStrategy();
  private progressionStrategy = new PlayoffProgressionStrategy();

  public updateMatchResult(
    currentState: TournamentState,
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
      (p) => p.id === matchToUpdate.participant1!.id
    );
    const p2 = currentState.participants.find(
      (p) => p.id === matchToUpdate.participant2!.id
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
      result: { scores: [score1, score2], winnerId: winner.id },
    };

    const updatedP1: Participant = {
      ...p1,
      playedOpponentIds: [...p1.playedOpponentIds, p2.id],
      wins: p1.id === winner.id ? p1.wins + 1 : p1.wins,
      losses: p1.id === loser.id ? p1.losses + 1 : p1.losses,
      seed: p1.seed > p2.seed ? p2.seed : p1.seed,
    };

    const updatedP2: Participant = {
      ...p2,
      playedOpponentIds: [...p2.playedOpponentIds, p1.id],
      wins: p2.id === winner.id ? p2.wins + 1 : p2.wins,
      losses: p2.id === loser.id ? p2.losses + 1 : p2.losses,
      seed: p2.seed > p1.seed ? p1.seed : p2.seed,
    };

    const newMatches = currentState.matches.map((m) =>
      m.id === matchId ? updatedMatch : m
    );
    const newParticipants = currentState.participants.map((p) =>
      p.id === p1.id ? updatedP1 : p.id === p2.id ? updatedP2 : p
    );

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

    const { ongoing } = this.progressionStrategy.checkProgression(
      currentState.participants,
      currentStageConfig
    );
    if (ongoing.length === 0) {
      console.log(`淘汰赛已完成`);
      return currentState;
    }
    const newMatches = this.pairingStrategy.generateMatches(ongoing, nextRound);
    return {
      ...currentState,
      matches: [...currentState.matches, ...newMatches],
      participants: currentState.participants,
    };
  }
}
