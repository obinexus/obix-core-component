export type JfixStrategy = 'transform-scale' | 'box-shadow' | 'fixed-size';

export interface JfixHoverConfig {
  strategy: JfixStrategy;
  bgColor?: string;
  textColor?: string;
  scale?: number;
  shadow?: string;
}

export const JFIX_STRATEGIES: Record<JfixStrategy, JfixStrategy> = {
  'transform-scale': 'transform-scale',
  'box-shadow': 'box-shadow',
  'fixed-size': 'fixed-size',
};

export const DEFAULT_JFIX_STRATEGY: JfixStrategy = 'transform-scale';
