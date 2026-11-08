// ponytail: assert cloud clear state machine (locked → clearing → gone)
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function nextCloudState(state, action) {
  // state: { hasClouds, clearing, locked }
  if (action === 'unlock-instant') {
    return { hasClouds: false, clearing: false, locked: false };
  }
  if (action === 'unlock-animate') {
    if (!state.hasClouds) {
      return { hasClouds: false, clearing: false, locked: false };
    }
    return { hasClouds: true, clearing: true, locked: false };
  }
  if (action === 'clear-end') {
    return { hasClouds: false, clearing: false, locked: state.locked };
  }
  throw new Error('unknown action');
}

const locked = { hasClouds: true, clearing: false, locked: true };

assert(
  JSON.stringify(nextCloudState(locked, 'unlock-instant')) ===
    JSON.stringify({ hasClouds: false, clearing: false, locked: false }),
  'instant unlock removes clouds'
);

const clearing = nextCloudState(locked, 'unlock-animate');
assert(clearing.clearing === true, 'animate unlock enters clearing');
assert(clearing.hasClouds === true, 'clouds stay during clear');
assert(clearing.locked === false, 'locked class drops while clearing');

const gone = nextCloudState(clearing, 'clear-end');
assert(gone.hasClouds === false && gone.clearing === false, 'animationend removes clouds');

assert(
  JSON.stringify(nextCloudState({ hasClouds: false, clearing: false, locked: true }, 'unlock-animate')) ===
    JSON.stringify({ hasClouds: false, clearing: false, locked: false }),
  'no-op when clouds already absent'
);

const CLOUD_PARTS = ['haze', 'a', 'b', 'c'];
assert(CLOUD_PARTS.length === 4, 'four cloud parts');
assert(CLOUD_PARTS[0] === 'haze', 'haze base layer first');

console.log('cloud clear check ok');
