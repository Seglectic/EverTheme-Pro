// ╭──────────────────────────────╮
// │  Pixel Grid Backdrop         │
// │  Draws an angled, stepped    │
// │  infinite field of pixels.   │
// ╰──────────────────────────────╯

import { onCleanup, onMount, type Component } from "solid-js";

type GridConfig = {
  angle: number;
  color: string;
  dotSize: number;
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
    color: styles.getPropertyValue("--pixel-grid-color").trim() || "rgba(203, 229, 106, 0.07)",
    dotSize: cssNumber(styles, "--pixel-grid-dot-size", 2),
    framesPerSecond: cssNumber(styles, "--pixel-grid-fps", 10),
    spacing: cssNumber(styles, "--pixel-grid-spacing", 48),
    speed: cssNumber(styles, "--pixel-grid-speed", 12),
  };
}

const modulo = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

const PixelGridBackdrop: Component = () => {
  let canvas!: HTMLCanvasElement;

  onMount(() => {
    const context = canvas.getContext("2d");
    if (!context) return;

    const config = readConfig();
    const radians = config.angle * (Math.PI / 180);
    const frameDuration = 1000 / config.framesPerSecond;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animationFrame = 0;
    let lastStep = -1;
    let width = 0;
    let height = 0;

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = config.color;

      const distance = (time / 1000) * config.speed;
      const offsetX = Math.round(modulo(Math.cos(radians) * distance, config.spacing));
      const offsetY = Math.round(modulo(-Math.sin(radians) * distance, config.spacing));

      for (let y = offsetY - config.spacing; y < height + config.spacing; y += config.spacing) {
        for (let x = offsetX - config.spacing; x < width + config.spacing; x += config.spacing) {
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
      draw(performance.now());
    };

    const animate = (time: number) => {
      const step = Math.floor(time / frameDuration);
      if (step !== lastStep) {
        lastStep = step;
        draw(step * frameDuration);
      }
      animationFrame = requestAnimationFrame(animate);
    };

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
