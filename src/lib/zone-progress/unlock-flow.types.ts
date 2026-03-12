export type ZoneStrategy = 'SHOTS' | 'PEOPLE';

export type UnlockFlowStateType = 'locked' | 'open' | 'countdown' | 'progress';

export interface LockedState {
  type: 'locked';
}

export interface OpenState {
  type: 'open';
}

export interface CountdownState {
  type: 'countdown';
  releaseDate: Date;
  daysRemaining: number;
}

export interface ProgressState {
  type: 'progress';
  strategy: ZoneStrategy;
  current: number;
  target: number;
  /** Value between 0 and 1 */
  progress: number;
}

export type UnlockFlowState =
  | LockedState
  | OpenState
  | CountdownState
  | ProgressState;

export interface ZoneProgressStrategy {
  id: string;
  institution_id: string;
  zone: string;
  strategy: ZoneStrategy;
  /** Required count to achieve target */
  target: number;
  /** Current count toward target */
  currentCount: number;
  /** Whether the target has been achieved */
  achievedTarget: boolean;
  achievedTargetDate: string | null;
  /** Days after target achievement before zone releases */
  daysToRelease: number;
  /** Calculated or manually-overridden release date */
  releaseDate: string | null;
  /** Manually-set target date (overrides achievedTargetDate + daysToRelease when set) */
  targetDate: string | null;
  /** Whether the zone has been released (open) */
  released: boolean;
  created_at: string;
  updated_at: string;
}
