// Velvet Vault: keyboard and mouse input.
// One job: track which keys are held and where the mouse is, and queue
// clicks, so the game loop reads one clean snapshot per frame.

/** Keyboard + mouse state, updated by listeners, read by the game loop. */
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    /** Clicks since the last consume, as {x, y} in canvas pixels. */
    this.clicks = [];
    this.pressed = new Set();
    this.canvas = canvas;
    this._onKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      this.keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      this.pressed.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    };
    this._onKeyUp = (e) => {
      this.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    };
    this._onMouseMove = (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
      this.mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
    };
    this._onClick = (e) => {
      const r = canvas.getBoundingClientRect();
      this.clicks.push({
        x: ((e.clientX - r.left) / r.width) * canvas.width,
        y: ((e.clientY - r.top) / r.height) * canvas.height,
      });
    };
    this._onBlur = () => {
      this.keys.clear();
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('click', this._onClick);
  }

  held(...names) {
    return names.some((n) => this.keys.has(n));
  }

  /** True only on the frame the key went down (consumed by the caller). */
  wasPressed(name) {
    if (this.pressed.has(name)) {
      this.pressed.delete(name);
      return true;
    }
    return false;
  }

  /** Movement vector from WASD / arrows, normalized. */
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.held('a', 'ArrowLeft')) x -= 1;
    if (this.held('d', 'ArrowRight')) x += 1;
    if (this.held('w', 'ArrowUp')) y -= 1;
    if (this.held('s', 'ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    return { x, y };
  }

  takeClicks() {
    const out = this.clicks;
    this.clicks = [];
    return out;
  }

  endFrame() {
    this.pressed.clear();
  }
}
