import React, { useEffect } from 'react';
import { useTournamentStore } from './store/useTournamentStore';
import { sampleMajorConfig } from './config/sampleMajor.config';
import { RoundColumn } from './features/RoundColumn';
import { ResultsColumn } from './features/ResultColumn.tsx';

function App() {
  const loadAndSimulate = useTournamentStore(
    (state) => state.loadAndSimulateDefault
  );

  const isPredicting = useTournamentStore(
    (state) => state.predictionTournament != null
  );
  const clearPrediction = useTournamentStore((state) => state.clearPrediction);

  // 在组件首次加载时，调用 Action 来加载数据并生成 R1
  useEffect(() => {
    loadAndSimulate(sampleMajorConfig);
  }, [loadAndSimulate]);

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

      <div className="flex flex-row gap-4 overflow-x-auto pb-4">
        <RoundColumn round={1} />
        <RoundColumn round={2} />
        <RoundColumn round={3} />
        <RoundColumn round={4} />
        <RoundColumn round={5} />

        {/* (不变) 渲染结果列 */}
        <ResultsColumn />
      </div>
    </div>
  );
}

export default App;
