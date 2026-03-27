import type React from 'react';
import AnalysisPage from './AnalysisPage';

const ShortTermPage: React.FC = () => (
  <AnalysisPage analysisType="short_term" title="短期分析" subtitle="趋势交易 · 1天-2周" />
);

export default ShortTermPage;
