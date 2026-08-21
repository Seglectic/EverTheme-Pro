// ╭──────────────────────────────╮
// │  Connector Geometry          │
// │  Routes callouts with axial  │
// │  and 45-degree segments.     │
// ╰──────────────────────────────╯

export type ConnectorPoint = { x: number; y: number };
export type ConnectorRect = { top: number; right: number; bottom: number; left: number; width: number; height: number };

const sign = (value: number) => value < 0 ? -1 : value > 0 ? 1 : 0;
const samePoint = (first: ConnectorPoint, second: ConnectorPoint) => first.x === second.x && first.y === second.y;

export const buildConnectorPoints = (source: ConnectorRect, target: ConnectorRect): ConnectorPoint[] => {
  const sourceCenter = { x: source.left + source.width / 2, y: source.top + source.height / 2 };
  const targetCenter = { x: target.left + target.width / 2, y: target.top + target.height / 2 };
  const horizontal = Math.abs(targetCenter.x - sourceCenter.x) >= Math.abs(targetCenter.y - sourceCenter.y);
  const points: ConnectorPoint[] = [];

  if (horizontal) {
    const direction = sign(targetCenter.x - sourceCenter.x) || 1;
    const start = { x: direction > 0 ? source.right : source.left, y: sourceCenter.y };
    const end = { x: direction > 0 ? target.left : target.right, y: targetCenter.y };
    const lead = Math.min(24, Math.abs(end.x - start.x) / 3);
    const firstTurn = { x: start.x + direction * lead, y: start.y };
    const remainingX = end.x - firstTurn.x;
    const remainingY = end.y - firstTurn.y;
    const diagonal = Math.min(Math.abs(remainingX), Math.abs(remainingY));
    const secondTurn = {
      x: firstTurn.x + sign(remainingX) * diagonal,
      y: firstTurn.y + sign(remainingY) * diagonal,
    };
    points.push(start, firstTurn, secondTurn, { x: secondTurn.x, y: end.y }, end);
  } else {
    const direction = sign(targetCenter.y - sourceCenter.y) || 1;
    const start = { x: sourceCenter.x, y: direction > 0 ? source.bottom : source.top };
    const end = { x: targetCenter.x, y: direction > 0 ? target.top : target.bottom };
    const lead = Math.min(24, Math.abs(end.y - start.y) / 3);
    const firstTurn = { x: start.x, y: start.y + direction * lead };
    const remainingX = end.x - firstTurn.x;
    const remainingY = end.y - firstTurn.y;
    const diagonal = Math.min(Math.abs(remainingX), Math.abs(remainingY));
    const secondTurn = {
      x: firstTurn.x + sign(remainingX) * diagonal,
      y: firstTurn.y + sign(remainingY) * diagonal,
    };
    points.push(start, firstTurn, secondTurn, { x: end.x, y: secondTurn.y }, end);
  }

  return points.filter((point, index) => index === 0 || !samePoint(point, points[index - 1]));
};
