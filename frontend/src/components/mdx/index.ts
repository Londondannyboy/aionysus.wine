export { InvestmentScore } from './InvestmentScore';
export { DrinkingWindowChart } from './DrinkingWindowChart';
export { TastingProfile } from './TastingProfile';

// MDX components registry
export const mdxComponents = {
  InvestmentScore: require('./InvestmentScore').InvestmentScore,
  DrinkingWindowChart: require('./DrinkingWindowChart').DrinkingWindowChart,
  TastingProfile: require('./TastingProfile').TastingProfile,
};
