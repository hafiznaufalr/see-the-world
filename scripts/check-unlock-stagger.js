// ponytail: tiny check for unlock stagger + path duration math
const UNLOCK_STAGGER_MS = 550;
const UNLOCK_STAGGER_MOBILE_MS = 360;

function getUnlockStaggerMs(count, isMobile) {
  if (!isMobile) return UNLOCK_STAGGER_MS;
  return count > 4 ? 280 : UNLOCK_STAGGER_MOBILE_MS;
}

function pathDurationMs(count, initialDelay, staggerMs) {
  return initialDelay + Math.max(0, count - 1) * staggerMs;
}

function easePathProgress(t) {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(getUnlockStaggerMs(2, false) === 550, 'desktop stagger');
assert(getUnlockStaggerMs(2, true) === 360, 'mobile few chapters');
assert(getUnlockStaggerMs(5, true) === 280, 'mobile many chapters');
assert(pathDurationMs(1, 220, 360) === 220, 'single-node path duration');
assert(pathDurationMs(3, 220, 360) === 940, 'multi-node path duration');
assert(Math.abs(easePathProgress(0) - 0) < 1e-9, 'ease start');
assert(Math.abs(easePathProgress(1) - 1) < 1e-9, 'ease end');
assert(Math.abs(easePathProgress(0.5) - 0.5) < 1e-9, 'ease mid');
console.log('unlock stagger check ok');
