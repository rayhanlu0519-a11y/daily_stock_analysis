import type React from 'react';
import OverviewPage from './OverviewPage';

/**
 * HomePage now renders the OverviewPage (market dashboard).
 * Analysis functionality has moved to dedicated pages: /short-term, /speculation, /value
 */
const HomePage: React.FC = () => <OverviewPage />;

export default HomePage;
