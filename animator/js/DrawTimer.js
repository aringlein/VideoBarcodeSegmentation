// import 'Assert'
// import 'Canvas'
// import 'Events'

/**
 * Periodically fires a draw event.
 */
class DrawTimer {
  constructor(canvas, fps) {
    assertParameters(arguments, Canvas, Number);

    this._canvas = canvas;
    this._interval = 1000 / fps;

    Events.on(DrawTimer.EVENT_TYPES.START, this.start, this);
    Events.on(DrawTimer.EVENT_TYPES.STOP, this.stop, this);
  }

  start() {
    assertParameters(arguments);

    if (!this._timer) {
      this._timer = setInterval(this._draw.bind(this), this._interval);
    }
  }

  stop() {
    assertParameters(arguments);

    if (this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }

  _draw() {
    assertParameters(arguments);

    this._canvas.clear();

    Events.dispatch(DrawTimer.EVENT_TYPES.DRAW, this._canvas);
    Events.dispatch(DrawTimer.EVENT_TYPES.STEP);
  }
};

DrawTimer.EVENT_TYPES = {
  STEP: 'drawtimer-step',
  DRAW: 'drawtimer-draw',
  START: 'drawtimer-start',
  STOP: 'drawtimer-stop'
};
