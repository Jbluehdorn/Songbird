export const TICKS_PER_QUARTER = 480;
export const SIXTEENTH_TICKS = TICKS_PER_QUARTER / 4;
export const MAX_PHRASE_BARS = 8;

export const METERS = {
  '4/4': { numerator: 4, denominator: 4, quartersPerBar: 4, pulseQuarters: 1 },
  '3/4': { numerator: 3, denominator: 4, quartersPerBar: 3, pulseQuarters: 1 },
  '6/8': { numerator: 6, denominator: 8, quartersPerBar: 3, pulseQuarters: 1.5 },
} as const;

export type Meter = keyof typeof METERS;
export type Timing = { meter: Meter; displayBpm: number; confirmed: boolean };

export function ticksPerBar(meter: Meter): number {
  return METERS[meter].quartersPerBar * TICKS_PER_QUARTER;
}

export function halfBarTicks(meter: Meter): number {
  return ticksPerBar(meter) / 2;
}

export function quarterBpm(timing: Timing): number {
  if (!Number.isFinite(timing.displayBpm) || timing.displayBpm <= 0) {
    throw new RangeError('Tempo must be a finite, positive number.');
  }
  return timing.displayBpm * METERS[timing.meter].pulseQuarters;
}

export function ticksToSeconds(ticks: number, timing: Timing): number {
  if (!Number.isFinite(ticks)) throw new RangeError('Musical position must be finite.');
  return (ticks / TICKS_PER_QUARTER) * (60 / quarterBpm(timing));
}

export function sourceSecondsToTicks(
  seconds: number,
  sourceSecondsAtTickZero: number,
  timing: Timing,
): number {
  if (!Number.isFinite(seconds) || !Number.isFinite(sourceSecondsAtTickZero)) {
    throw new RangeError('Source positions must be finite.');
  }
  return (
    ((seconds - sourceSecondsAtTickZero) * quarterBpm(timing) * TICKS_PER_QUARTER) / 60
  );
}
