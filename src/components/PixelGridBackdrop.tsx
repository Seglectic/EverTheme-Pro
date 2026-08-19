// ╭──────────────────────────────╮
// │  Pixel Grid Backdrop         │
// │  Draws an angled, stepped    │
// │  infinite field of pixels.   │
// ╰──────────────────────────────╯

import { onCleanup, onMount, type Component } from "solid-js";
import { createPerlinNoise1D } from "../lib/perlin";

type GridConfig = {
  angle: number;
  angleRange: number;
  color: string;
  dotSize: number;
  dwellMaximum: number;
  dwellMinimum: number;
  framesPerSecond: number;
  spacing: number;
  speed: number;
};

const cssNumber = (styles: CSSStyleDeclaration, name: string, fallback: number) => {
  const value = Number.parseFloat(styles.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
};

function readConfig(): GridConfig {
  const styles = getComputedStyle(document.documentElement);
  return {
    angle: cssNumber(styles, "--pixel-grid-angle", 30),
    angleRange: cssNumber(styles, "--pixel-grid-angle-range", 135),
    color: styles.getPropertyValue("--pixel-grid-color").trim() || "rgba(203, 229, 106, 0.07)",
    dotSize: cssNumber(styles, "--pixel-grid-dot-size", 2),
    dwellMaximum: cssNumber(styles, "--pixel-grid-dwell-max", 9) * 1000,
    dwellMinimum: cssNumber(styles, "--pixel-grid-dwell-min", 4) * 1000,
    framesPerSecond: cssNumber(styles, "--pixel-grid-fps", 10),
    spacing: cssNumber(styles, "--pixel-grid-spacing", 48),
    speed: cssNumber(styles, "--pixel-grid-speed", 12),
  };
}

const modulo = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;
const shortestAngleDelta = (current: number, target: number) => modulo(target - current + 180, 360) - 180;

const PixelGridBackdrop: Component = () => {
  let canvas!: HTMLCanvasElement;

  onMount(() => {
    const context = canvas.getContext("2d");
    if (!context) return;

    const config = readConfig();
    const noise = createPerlinNoise1D(Math.floor(Math.random() * 0xffffffff));
    const noiseOrigin = Math.random() * 256;
    const frameDuration = 1000 / config.framesPerSecond;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    let angle = config.angle;
    let directionX = Math.cos(angle * (Math.PI / 180));
    let directionY = -Math.sin(angle * (Math.PI / 180));
    let lastStep = -1;
    let lastMovementTime = performance.now();
    let nextDirectionTime = lastMovementTime;
    let offsetX = 0;
    let offsetY = 0;
    let segment = 0;
    let width = 0;
    let height = 0;

    const randomDwell = () => config.dwellMinimum + Math.random() * (config.dwellMaximum - config.dwellMinimum);

    const setDirection = (nextAngle: number) => {
      angle = nextAngle;
      const radians = angle * (Math.PI / 180);
      directionX = Math.cos(radians);
      directionY = -Math.sin(radians);
      canvas.dataset.gridAngle = angle.toFixed(1);
      canvas.dataset.gridSegment = String(segment);
    };

    const chooseNextDirection = (time: number) => {
      segment += 1;
      const noiseValue = noise(noiseOrigin + segment * 0.42);
      const proposedAngle = config.angle + noiseValue * config.angleRange;
      const turn = shortestAngleDelta(angle, proposedAngle);
      canvas.dataset.gridTurn = Math.abs(turn).toFixed(1);
      setDirection(angle + turn);
      nextDirectionTime = time + randomDwell();
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = config.color;

      const wrappedX = Math.round(modulo(offsetX, config.spacing));
      const wrappedY = Math.round(modulo(offsetY, config.spacing));

      for (let y = wrappedY - config.spacing; y < height + config.spacing; y += config.spacing) {
        for (let x = wrappedX - config.spacing; x < width + config.spacing; x += config.spacing) {
          context.fillRect(x, y, config.dotSize, config.dotSize);
        }
      }
    };

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      draw();
    };

    const animate = (time: number) => {
      const step = Math.floor(time / frameDuration);
      if (step !== lastStep) {
        const steppedTime = step * frameDuration;
        const elapsed = Math.min(1000, Math.max(0, steppedTime - lastMovementTime));
        if (steppedTime >= nextDirectionTime) chooseNextDirection(steppedTime);
        offsetX += directionX * config.speed * (elapsed / 1000);
        offsetY += directionY * config.speed * (elapsed / 1000);
        lastMovementTime = steppedTime;
        lastStep = step;
        draw();
      }
      animationFrame = requestAnimationFrame(animate);
    };

    setDirection(config.angle);
    nextDirectionTime = lastMovementTime + randomDwell();
    resize();
    window.addEventListener("resize", resize, { passive: true });
    if (!reduceMotion) animationFrame = requestAnimationFrame(animate);

    onCleanup(() => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    });
  });

  return <canvas ref={canvas} class="pixel-grid-backdrop" aria-hidden="true" />;
};

export default PixelGridBackdrop;
