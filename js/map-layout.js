const MAP_NODE_POSITIONS = [
  { x: 22, y: 9 },
  { x: 78, y: 17 },
  { x: 22, y: 25 },
  { x: 78, y: 33 },
  { x: 22, y: 41 },
  { x: 78, y: 49 },
  { x: 22, y: 57 },
  { x: 78, y: 65 },
  { x: 22, y: 73 },
  { x: 78, y: 81 },
  { x: 50, y: 89 },
];

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

const MAP_PATH_D = buildMapPath(MAP_NODE_POSITIONS);

function measurePathLengthAtNode(pathEl, nodeIndex) {
  if (nodeIndex < 0) return 0;

  const target = MAP_NODE_POSITIONS[nodeIndex];
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

function measureAllNodePathLengths(pathEl) {
  return MAP_NODE_POSITIONS.map((_, index) => measurePathLengthAtNode(pathEl, index));
}
