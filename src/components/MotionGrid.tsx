// ╭──────────────────────────────╮
// │  Background Motion Grid      │
// │  Snaps a draggable vector to │
// │  the compiler's integer grid.│
// ╰──────────────────────────────╯

import { createEffect, createSignal, type Component, type JSX } from "solid-js";

type MotionGridProps = {
  x: number;
  y: number;
  onCommit: (x: number, y: number) => void;
};

const SIZE = 240;
const PADDING = 18;
const LIMIT = 8;
const CELL = (SIZE - PADDING * 2) / (LIMIT * 2);
const CENTER = SIZE / 2;
const clamp = (value: number) => Math.max(-LIMIT, Math.min(LIMIT, value));

const MotionGrid: Component<MotionGridProps> = (props) => {
  let canvas!: HTMLCanvasElement;
  let dragging = false;
  const [draftX, setDraftX] = createSignal(props.x);
  const [draftY, setDraftY] = createSignal(props.y);

  const draw = (x: number, y: number) => {
    const context = canvas?.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, SIZE, SIZE);
    context.fillStyle = "#11140f";
    context.fillRect(0, 0, SIZE, SIZE);

    context.fillStyle = "#343a30";
    for (let gridY = -LIMIT; gridY <= LIMIT; gridY += 1) {
      for (let gridX = -LIMIT; gridX <= LIMIT; gridX += 1) {
        context.fillRect(CENTER + gridX * CELL - 1, CENTER - gridY * CELL - 1, 2, 2);
      }
    }

    context.strokeStyle = "#5a6250";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(PADDING, CENTER + 0.5);
    context.lineTo(SIZE - PADDING, CENTER + 0.5);
    context.moveTo(CENTER + 0.5, PADDING);
    context.lineTo(CENTER + 0.5, SIZE - PADDING);
    context.stroke();

    const handleX = CENTER + x * CELL;
    const handleY = CENTER - y * CELL;
    context.strokeStyle = "rgba(203, 229, 106, .45)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(CENTER, CENTER);
    context.lineTo(handleX, handleY);
    context.stroke();

    context.fillStyle = "#151910";
    context.beginPath();
    context.arc(CENTER, CENTER, 3, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#cbe56a";
    context.strokeStyle = "#0d100b";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(handleX, handleY, 8, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  };

  const pointToValue = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    const canvasX = (event.clientX - bounds.left) * (SIZE / bounds.width);
    const canvasY = (event.clientY - bounds.top) * (SIZE / bounds.height);
    return {
      x: clamp(Math.round((canvasX - CENTER) / CELL)),
      y: clamp(Math.round((CENTER - canvasY) / CELL)),
    };
  };

  const setDraftFromPointer = (event: PointerEvent) => {
    const value = pointToValue(event);
    setDraftX(value.x);
    setDraftY(value.y);
  };

  const commit = (x: number, y: number) => {
    setDraftX(x);
    setDraftY(y);
    if (x !== props.x || y !== props.y) props.onCommit(x, y);
  };

  const handlePointerDown: JSX.EventHandler<HTMLCanvasElement, PointerEvent> = (event) => {
    dragging = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraftFromPointer(event);
  };

  const handlePointerMove: JSX.EventHandler<HTMLCanvasElement, PointerEvent> = (event) => {
    if (dragging) setDraftFromPointer(event);
  };

  const handlePointerUp: JSX.EventHandler<HTMLCanvasElement, PointerEvent> = (event) => {
    if (!dragging) return;
    setDraftFromPointer(event);
    dragging = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    commit(draftX(), draftY());
  };

  const handlePointerCancel = () => {
    dragging = false;
    setDraftX(props.x);
    setDraftY(props.y);
  };

  const handleKeyDown: JSX.EventHandler<HTMLCanvasElement, KeyboardEvent> = (event) => {
    const nextX = clamp(props.x + (event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0));
    const nextY = clamp(props.y + (event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0));
    if (nextX === props.x && nextY === props.y) return;
    event.preventDefault();
    commit(nextX, nextY);
  };

  createEffect(() => {
    if (!dragging) {
      setDraftX(props.x);
      setDraftY(props.y);
    }
  });

  createEffect(() => draw(draftX(), draftY()));

  return (
    <div class="motion-grid">
      <canvas
        ref={canvas}
        class="motion-grid-canvas"
        width={SIZE}
        height={SIZE}
        tabIndex={0}
        role="application"
        aria-label={`Background motion: horizontal ${draftX()}, vertical ${draftY()}. Drag or use arrow keys.`}
        data-draft-x={draftX()}
        data-draft-y={draftY()}
        data-committed-x={props.x}
        data-committed-y={props.y}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleKeyDown}
      />
      <output class="motion-grid-output">X {draftX()} <span>/</span> Y {draftY()}</output>
    </div>
  );
};

export default MotionGrid;
