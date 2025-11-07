import type { TournamentConfig } from '../types/domain';

/**
 * 8 队单败淘汰赛的示例配置
 */
export const AustinPlayoffConfig: TournamentConfig = {
  id: 'blast_austin_2025',
  name: 'BLAST.TV Austin Major 2025 - Playoffs',

  // 初始的 8 支队伍
  participants: [
    {
      id: 't1',
      name: 'Spirit',
      seed: 1,
      logoUrl: '/logos/Spirit.webp',
      wins: 0,
      losses: 0,
      buchholz: 0,
      playedOpponentIds: [],
    },
    {
      id: 't2',
      name: 'FURIA',
      seed: 2,
      logoUrl: '/logos/Furia.svg',
      wins: 0,
      losses: 0,
      buchholz: 0,
      playedOpponentIds: [],
    },
    {
      id: 't3',
      name: 'FaZe',
      seed: 3,
      logoUrl: '/logos/Faze.webp',
      wins: 0,
      losses: 0,
      buchholz: 0,
      playedOpponentIds: [],
    },
    {
      id: 't4',
      name: 'NaVi',
      seed: 4,
      logoUrl: '/logos/Navi.svg',
      wins: 0,
      losses: 0,
      buchholz: 0,
      playedOpponentIds: [],
    },
    {
      id: 't5',
      name: 'Vitality',
      seed: 5,
      logoUrl: '/logos/Vitality.webp',
      wins: 0,
      losses: 0,
      buchholz: 0,
      playedOpponentIds: [],
    },
    {
      id: 't6',
      name: 'The MongolZ',
      seed: 6,
      logoUrl: '/logos/TheMongolz.webp',
      wins: 0,
      losses: 0,
      buchholz: 0,
      playedOpponentIds: [],
    },
    {
      id: 't7',
      name: 'paiN',
      seed: 7,
      logoUrl: '/logos/Pain.webp',
      wins: 0,
      losses: 0,
      buchholz: 0,
      playedOpponentIds: [],
    },
    {
      id: 't8',
      name: 'MOUZ',
      seed: 8,
      logoUrl: '/logos/Mouz.svg',
      wins: 0,
      losses: 0,
      buchholz: 0,
      playedOpponentIds: [],
    },
  ],

  // 阶段定义
  stages: [
    {
      id: 'playoff',
      name: 'Playoff Stage',
      format: 'single-elimination', // <-- 使用新 format

      singleElimination: {
        winsToAdvance: 3, // 8队 (R1), 4队 (R2), 2队 (R3) -> 3胜夺冠
        lossesToEliminate: 1, // 单败赛制
      },
    },
  ],
};
