// Positions follow the chapter count. Finale sits centered; the rest zigzag.
// ponytail: even vertical steps. Upgrade path is a hand-tuned path if a count looks uneven.
function buildNodePositions(count) {
  const positions = [];
  const top = 9;
  const bottom = 89;
  const step = count > 1 ? (bottom - top) / (count - 1) : 0;

  for (let i = 0; i < count; i += 1) {
    const y = i === count - 1 ? bottom : Math.round((top + step * i) * 10) / 10;
    let x = i % 2 === 0 ? 22 : 78;
    if (count > 1 && i === count - 1) x = 50;
    positions.push({ x, y });
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

function measurePathLengthAtNode(pathEl, positions, nodeIndex) {
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
  return positions.map((_, index) => measurePathLengthAtNode(pathEl, positions, index));
}

if (typeof module !== 'undefined' && require.main === module) {
  const eleven = buildNodePositions(11);
  const expectedY = [9, 17, 25, 33, 41, 49, 57, 65, 73, 81, 89];
  if (eleven.length !== 11) throw new Error('eleven count');
  expectedY.forEach((y, i) => {
    const x = i === 10 ? 50 : i % 2 === 0 ? 22 : 78;
    if (eleven[i].y !== y || eleven[i].x !== x) {
      throw new Error(`eleven slot ${i}: ${JSON.stringify(eleven[i])}`);
    }
  });

  const ten = buildNodePositions(10);
  if (ten.length !== 10) throw new Error('ten count');
  if (ten[0].y !== 9 || ten[9].y !== 89 || ten[9].x !== 50) throw new Error('ten span');
  if (new Set(ten.map((p) => `${p.x},${p.y}`)).size !== 10) throw new Error('ten overlap');
  if (!buildMapPath(ten).startsWith('M 22 9')) throw new Error('ten path');
  console.log('map layout check ok');
}
