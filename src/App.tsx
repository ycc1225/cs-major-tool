import React from 'react';
import { useTournamentStore } from './store/useTournamentStore';
import { AustinMajorSwissConfig } from './config/AustinMajorSwissConfig.ts';
import { RoundColumn } from './features/RoundColumn';
import { ResultsColumn } from './features/ResultColumn.tsx';
import { AustinPlayoffConfig } from './config/AustinMajorPlayoff.config.ts';
import clsx from 'clsx';
import { PlayoffBracket } from './features/PlayoffBracket.tsx';

const SwissView: React.FC = () => (
  <div className="flex flex-row gap-4 overflow-x-auto pb-4">
    <RoundColumn round={1} />
    <RoundColumn round={2} />
    <RoundColumn round={3} />
    <RoundColumn round={4} />
    <RoundColumn round={5} />
    <ResultsColumn />
  </div>
);

function App() {
  const loadTournament = useTournamentStore((state) => state.loadTournament);
  const activeConfigId = useTournamentStore(
    (state) => state.tournament.config.id
  );
  const format = useTournamentStore(
    (state) => state.tournament.config.stages[0].format
  );

  const isPredicting = useTournamentStore(
    (state) => state.predictionTournament != null
  );
  const clearPrediction = useTournamentStore((state) => state.clearPrediction);

  // 在组件首次加载时，调用 Action 来加载数据并生成 R1
  React.useEffect(() => {
    loadTournament(AustinMajorSwissConfig);
  }, [loadTournament]);

  const loadSwiss = () => loadTournament(AustinMajorSwissConfig);
  const loadPlayoff = () => loadTournament(AustinPlayoffConfig);
  const advanceToNextStage = useTournamentStore(
    (state) => state.advanceToNextStage
  );

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 p-4">
      <div className="text-center mb-6 relative">
        <h1 className="text-3xl font-bold">CS Major 瑞士轮工具</h1>

        {isPredicting && (
          <div
            className="absolute top-0 right-0 bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center gap-4
                       animate-pulse" // 添加一点动画提示
          >
            <span>正在进行 What-If 预测...</span>
            <button
              onClick={clearPrediction}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
              title="返回“P1全胜”基础时间线"
            >
              &times; 清除
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={loadSwiss}
          className={clsx(
            'py-2 px-4 rounded-lg text-white font-semibold',
            activeConfigId === AustinMajorSwissConfig.id
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          )}
        >
          加载 瑞士轮 (Swiss)
        </button>
        <button
          onClick={loadPlayoff}
          className={clsx(
            'py-2 px-4 rounded-lg text-white font-semibold',
            activeConfigId === AustinPlayoffConfig.id
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          )}
        >
          加载 淘汰赛 (Playoff)
        </button>
        {/* 只在 'swiss' 模式下显示   */}
        {format === 'swiss' && (
          <>
            <button
              onClick={advanceToNextStage}
              className="py-2 px-4 rounded-lg text-black font-semibold bg-green-500 hover:bg-green-400"
              title="使用当前（或预测的）结果开始淘汰赛"
            >
              ➡️ 前往下一轮
            </button>
          </>
        )}
      </div>
      <div>
        {format === 'swiss' && <SwissView />}
        {format === 'single-elimination' && <PlayoffBracket />}
      </div>
    </div>
  );
}

export default App;
