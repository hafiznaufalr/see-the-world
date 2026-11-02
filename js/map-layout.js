const MAP_LAYOUT = {
  top: 9,
  bottom: 89,
  leftX: 22,
  rightX: 78,
  centerX: 50,
};

/**
 * Build zigzag node positions for N destinations.
 * Last node is always centered (finale). Path length follows count — no dangling tail.
 */
function buildMapNodePositions(count) {
  count = Math.max(0, Number(count) || 0);
  if (!count) return [];

  const positions = [];
  for (let i = 0; i < count; i += 1) {
    const y =
      count === 1
        ? (MAP_LAYOUT.top + MAP_LAYOUT.bottom) / 2
        : MAP_LAYOUT.top + ((MAP_LAYOUT.bottom - MAP_LAYOUT.top) * i) / (count - 1);
    const isLast = i === count - 1;
    const x = isLast ? MAP_LAYOUT.centerX : i % 2 === 0 ? MAP_LAYOUT.leftX : MAP_LAYOUT.rightX;
    positions.push({ x: x, y: y });
  }

  return positions;
}

function buildMapPath(points) {
  if (!points.length) return '';
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const midY = (prev.y + curr.y) / 2;
    d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
  }

  return d;
}

function measurePathLengthAtNode(pathEl, nodeIndex, positions) {
  if (nodeIndex < 0) return 0;

  const target = positions[nodeIndex];
  if (!target || !pathEl) return 0;

  const total = pathEl.getTotalLength();
  let bestLen = 0;
  let bestDist = Infinity;

  for (let step = 0; step <= 120; step += 1) {
    const len = (step / 120) * total;
    const point = pathEl.getPointAtLength(len);
    const dist = (point.x - target.x) ** 2 + (point.y - target.y) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      bestLen = len;
    }
  }

  return bestLen;
}

function measureAllNodePathLengths(pathEl, positions) {
  return positions.map((_, index) => measurePathLengthAtNode(pathEl, index, positions));
}

// Back-compat for any callers expecting the old 11-stop layout constants
const MAP_NODE_POSITIONS = buildMapNodePositions(11);
const MAP_PATH_D = buildMapPath(MAP_NODE_POSITIONS);
