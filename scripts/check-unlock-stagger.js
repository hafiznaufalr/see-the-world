// ponytail: tiny check for mobile stagger math used by runUnlockSequence
const UNLOCK_STAGGER_MS = 550;
const UNLOCK_STAGGER_MOBILE_MS = 360;

function getUnlockStaggerMs(count, isMobile) {
  if (!isMobile) return UNLOCK_STAGGER_MS;
  return count > 4 ? 280 : UNLOCK_STAGGER_MOBILE_MS;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(getUnlockStaggerMs(2, false) === 550, 'desktop stagger');
assert(getUnlockStaggerMs(2, true) === 360, 'mobile few chapters');
assert(getUnlockStaggerMs(5, true) === 280, 'mobile many chapters');
console.log('unlock stagger check ok');
