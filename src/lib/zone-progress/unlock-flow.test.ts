import { describe, it, expect } from 'vitest';
import { resolveUnlockState, computeReleaseDate } from './unlock-flow.service';
import type { ZoneProgressStrategy } from './unlock-flow.types';

const BASE_STRATEGY: ZoneProgressStrategy = {
  id: 'test-id',
  institution_id: 'inst-1',
  zone: 'matches',
  strategy: 'SHOTS',
  target: 100,
  currentCount: 0,
  achievedTarget: false,
  achievedTargetDate: null,
  daysToRelease: 14,
  releaseDate: null,
  targetDate: null,
  released: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('resolveUnlockState', () => {
  it('returns open when released is true', () => {
    const strategy: ZoneProgressStrategy = { ...BASE_STRATEGY, released: true };
    expect(resolveUnlockState(strategy)).toEqual({ type: 'open' });
  });

  it('returns countdown when achievedTarget is true and releaseDate is in the future', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);

    const strategy: ZoneProgressStrategy = {
      ...BASE_STRATEGY,
      achievedTarget: true,
      achievedTargetDate: new Date().toISOString(),
      releaseDate: future.toISOString(),
    };

    const state = resolveUnlockState(strategy);
    expect(state.type).toBe('countdown');
    if (state.type === 'countdown') {
      expect(state.daysRemaining).toBeGreaterThan(0);
      expect(state.daysRemaining).toBeLessThanOrEqual(10);
    }
  });

  it('returns open when achievedTarget is true but releaseDate has passed', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);

    const strategy: ZoneProgressStrategy = {
      ...BASE_STRATEGY,
      achievedTarget: true,
      achievedTargetDate: new Date(past.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      releaseDate: past.toISOString(),
    };

    expect(resolveUnlockState(strategy)).toEqual({ type: 'open' });
  });

  it('returns progress for shots strategy when target not yet achieved', () => {
    const strategy: ZoneProgressStrategy = {
      ...BASE_STRATEGY,
      currentCount: 40,
      target: 100,
    };

    const state = resolveUnlockState(strategy);
    expect(state.type).toBe('progress');
    if (state.type === 'progress') {
      expect(state.strategy).toBe('SHOTS');
      expect(state.current).toBe(40);
      expect(state.target).toBe(100);
      expect(state.progress).toBeCloseTo(0.4);
    }
  });

  it('returns progress for people strategy when target not yet achieved', () => {
    const strategy: ZoneProgressStrategy = {
      ...BASE_STRATEGY,
      strategy: 'PEOPLE',
      currentCount: 25,
      target: 50,
    };

    const state = resolveUnlockState(strategy);
    expect(state.type).toBe('progress');
    if (state.type === 'progress') {
      expect(state.strategy).toBe('PEOPLE');
      expect(state.current).toBe(25);
      expect(state.target).toBe(50);
      expect(state.progress).toBeCloseTo(0.5);
    }
  });

  it('caps progress at 1.0 even if currentCount exceeds target', () => {
    const strategy: ZoneProgressStrategy = {
      ...BASE_STRATEGY,
      currentCount: 150,
      target: 100,
    };

    const state = resolveUnlockState(strategy);
    expect(state.type).toBe('progress');
    if (state.type === 'progress') {
      expect(state.progress).toBe(1);
    }
  });

  it('uses achievedTargetDate + daysToRelease when releaseDate is null', () => {
    const achievedDate = new Date();
    achievedDate.setDate(achievedDate.getDate() - 5); // 5 days ago

    const strategy: ZoneProgressStrategy = {
      ...BASE_STRATEGY,
      achievedTarget: true,
      achievedTargetDate: achievedDate.toISOString(),
      daysToRelease: 14,
      releaseDate: null,
    };

    const state = resolveUnlockState(strategy);
    expect(state.type).toBe('countdown');
    if (state.type === 'countdown') {
      // 14 days from 5 days ago = 9 days remaining
      expect(state.daysRemaining).toBeCloseTo(9, 0);
    }
  });

  it('uses targetDate + daysToRelease when targetDate is set and releaseDate is null', () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 2); // 2 days ago

    const strategy: ZoneProgressStrategy = {
      ...BASE_STRATEGY,
      achievedTarget: true,
      achievedTargetDate: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      targetDate: targetDate.toISOString(),
      daysToRelease: 7,
      releaseDate: null,
    };

    const state = resolveUnlockState(strategy);
    expect(state.type).toBe('countdown');
    if (state.type === 'countdown') {
      // 7 days from 2 days ago = 5 days remaining
      expect(state.daysRemaining).toBeCloseTo(5, 0);
    }
  });

  it('prefers manually-set releaseDate over computed date', () => {
    const manualRelease = new Date();
    manualRelease.setDate(manualRelease.getDate() + 3);

    const achievedDate = new Date();
    achievedDate.setDate(achievedDate.getDate() - 1);

    const strategy: ZoneProgressStrategy = {
      ...BASE_STRATEGY,
      achievedTarget: true,
      achievedTargetDate: achievedDate.toISOString(),
      daysToRelease: 14, // would give 13 days, but manual override says 3
      releaseDate: manualRelease.toISOString(),
    };

    const state = resolveUnlockState(strategy);
    expect(state.type).toBe('countdown');
    if (state.type === 'countdown') {
      expect(state.daysRemaining).toBeCloseTo(3, 0);
    }
  });
});

describe('computeReleaseDate', () => {
  it('returns releaseDate when explicitly set', () => {
    const releaseDate = '2026-04-01T00:00:00Z';
    const strategy: ZoneProgressStrategy = { ...BASE_STRATEGY, releaseDate };
    expect(computeReleaseDate(strategy)).toEqual(new Date(releaseDate));
  });

  it('returns targetDate + daysToRelease when releaseDate is null', () => {
    const targetDate = '2026-03-01T00:00:00Z';
    const strategy: ZoneProgressStrategy = {
      ...BASE_STRATEGY,
      targetDate,
      releaseDate: null,
      daysToRelease: 10,
    };
    const expected = new Date('2026-03-11T00:00:00Z');
    expect(computeReleaseDate(strategy)).toEqual(expected);
  });

  it('returns achievedTargetDate + daysToRelease when targetDate and releaseDate are null', () => {
    const achievedTargetDate = '2026-03-01T00:00:00Z';
    const strategy: ZoneProgressStrategy = {
      ...BASE_STRATEGY,
      achievedTargetDate,
      targetDate: null,
      releaseDate: null,
      daysToRelease: 7,
    };
    const expected = new Date('2026-03-08T00:00:00Z');
    expect(computeReleaseDate(strategy)).toEqual(expected);
  });

  it('returns null when all date fields are null', () => {
    const strategy: ZoneProgressStrategy = {
      ...BASE_STRATEGY,
      releaseDate: null,
      targetDate: null,
      achievedTargetDate: null,
    };
    expect(computeReleaseDate(strategy)).toBeNull();
  });
});
