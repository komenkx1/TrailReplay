import { describe, expect, it } from 'vitest';
import { getAverageGradeAtProgress, getElevationAtProgress } from './elevationProfile';

describe('elevation profile interpolation', () => {
  const points = [
    { progress: 0.1, elevation: 100 },
    { progress: 0.4, elevation: 220 },
    { progress: 0.9, elevation: 120 },
  ];

  it('interpolates smoothly between sparse GPX samples', () => {
    expect(getElevationAtProgress(points, 0.25)).toBeCloseTo(160);
    expect(getElevationAtProgress(points, 0.65)).toBeCloseTo(170);
  });

  it('clamps progress outside the segment', () => {
    expect(getElevationAtProgress(points, 0)).toBe(100);
    expect(getElevationAtProgress(points, 1)).toBe(120);
  });

  it('handles empty and repeated-progress data safely', () => {
    expect(getElevationAtProgress([], 0.5)).toBe(0);
    expect(getElevationAtProgress([
      { progress: 0, elevation: 100 },
      { progress: 0, elevation: 200 },
      { progress: 1, elevation: 300 },
    ], 0.5)).toBe(250);
  });
});

describe('elevation profile average grade', () => {
  const points = [
    { progress: 0, distance: 0, elevation: 10 },
    { progress: 0.25, distance: 100, elevation: 15 },
    { progress: 0.5, distance: 200, elevation: 20 },
    { progress: 0.75, distance: 300, elevation: 25 },
    { progress: 1, distance: 400, elevation: 30 },
  ];

  it('calculates the average grade across a 200 m window around the marker', () => {
    expect(getAverageGradeAtProgress(points, 0.5)).toBeCloseTo(5);
  });

  it('returns no grade at the segment endpoints or without enough distance', () => {
    expect(getAverageGradeAtProgress(points, 0)).toBeNull();
    expect(getAverageGradeAtProgress([
      { progress: 0, distance: 0, elevation: 10 },
      { progress: 1, distance: 80, elevation: 20 },
    ], 0.5)).toBeNull();
  });
});
