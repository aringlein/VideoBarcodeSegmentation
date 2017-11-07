// import 'Assert'
// import 'FrameModel'

// Progresses the frames in the FrameModel in real-time.
class Previewer {
  constructor(frameModel) {
    assertParameters(arguments, FrameModel);

    this._frameModel = frameModel;
  }

  start() {
    assertParameters(arguments);

    if (!this._timer) {
      this._timer = setInterval(this._step.bind(this), this._interval);
    }

    return this;
  }

  stop() {
    assertParameters(arguments);

    if (this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;

      Events.dispatch(Previewer.EVENT_TYPES.STOP);
    }
  }

  get _interval() {
    return 1000 / FrameModel.FPS;
  }

  _step() {
    this._frameModel.currentFrame = this._frameModel.currentFrameIndex + 1;

    if (this._frameModel.currentFrameIndex === FrameModel.KEYFRAMES - 1) {
      this.stop();
    }
  }
};

Previewer.EVENT_TYPES = {
  STOP: 'previewer-stop'
};
