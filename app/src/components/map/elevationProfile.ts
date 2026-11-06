export interface ElevationProfileSample {
  elevation: number;
  progress: number;
}

export interface ElevationProfileGradeSample extends ElevationProfileSample {
  /** Cumulative route distance, in metres. */
  distance: number;
}

function getElevationAtDistance(
  points: ElevationProfileGradeSample[],
  distance: number,
): number {
  const first = points[0];
  const last = points.at(-1)!;
  if (distance <= first.distance) return first.elevation;
  if (distance >= last.distance) return last.elevation;

  let low = 1;
  let high = points.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle].distance < distance) low = middle + 1;
    else high = middle;
  }

  const next = points[low];
  const previous = points[low - 1];
  const span = next.distance - previous.distance;
  if (span <= 0) return next.elevation;

  const ratio = (distance - previous.distance) / span;
  return previous.elevation + (next.elevation - previous.elevation) * ratio;
}

/** Average grade over a 200 m window centered on the playback marker. */
export function getAverageGradeAtProgress(
  points: ElevationProfileGradeSample[],
  progress: number,
): number | null {
  if (points.length < 2) return null;

  const first = points[0];
  const last = points.at(-1)!;
  if (progress <= first.progress || progress >= last.progress) return null;

  let low = 1;
  let high = points.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle].progress < progress) low = middle + 1;
    else high = middle;
  }

  const next = points[low];
  const previous = points[low - 1];
  const progressSpan = next.progress - previous.progress;
  if (progressSpan <= 0) return null;

  const progressRatio = (progress - previous.progress) / progressSpan;
  const markerDistance = previous.distance + (next.distance - previous.distance) * progressRatio;
  const startDistance = Math.max(first.distance, markerDistance - 100);
  const endDistance = Math.min(last.distance, markerDistance + 100);
  const distanceSpan = endDistance - startDistance;
  if (distanceSpan < 100) return null;

  const startElevation = getElevationAtDistance(points, startDistance);
  const endElevation = getElevationAtDistance(points, endDistance);
  if (startElevation <= 0 || endElevation <= 0) return null;

  return ((endElevation - startElevation) / distanceSpan) * 100;
}

/** Interpolates a sorted profile without scanning every GPX sample per frame. */
export function getElevationAtProgress(
  points: ElevationProfileSample[],
  progress: number,
): number {
  if (points.length === 0) return 0;

  const first = points[0];
  const last = points[points.length - 1];
  if (progress <= first.progress) return first.elevation;
  if (progress >= last.progress) return last.elevation;

  let low = 1;
  let high = points.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle].progress < progress) low = middle + 1;
    else high = middle;
  }

  const next = points[low];
  const previous = points[low - 1];
  const span = next.progress - previous.progress;
  if (span <= 0) return next.elevation;

  const ratio = (progress - previous.progress) / span;
  return previous.elevation + (next.elevation - previous.elevation) * ratio;
}
