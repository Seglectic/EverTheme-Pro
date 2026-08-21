// ╭──────────────────────────────╮
// │  Connector Geometry Tests    │
// │  Keeps every callout segment │
// │  axial or exactly diagonal.  │
// ╰──────────────────────────────╯

import { describe, expect, it } from "vitest";
import { buildConnectorPoints, type ConnectorPoint, type ConnectorRect } from "./connectorGeometry";

const rect = (left: number, top: number, width: number, height: number): ConnectorRect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

const expectRestrictedAngles = (points: ConnectorPoint[]) => {
  for (let index = 1; index < points.length; index += 1) {
    const dx = Math.abs(points[index].x - points[index - 1].x);
    const dy = Math.abs(points[index].y - points[index - 1].y);
    expect(dx === 0 || dy === 0 || Math.abs(dx - dy) < 0.001).toBe(true);
  }
};

describe("buildConnectorPoints", () => {
  it("routes horizontally separated panels from their nearest edges", () => {
    const points = buildConnectorPoints(rect(20, 300, 58, 42), rect(700, 100, 120, 20));
    expect(points[0]).toEqual({ x: 78, y: 321 });
    expect(points.at(-1)).toEqual({ x: 700, y: 110 });
    expectRestrictedAngles(points);
  });

  it("routes stacked panels vertically", () => {
    const points = buildConnectorPoints(rect(140, 700, 58, 42), rect(220, 180, 120, 20));
    expect(points[0]).toEqual({ x: 169, y: 700 });
    expect(points.at(-1)).toEqual({ x: 280, y: 200 });
    expectRestrictedAngles(points);
  });
});
