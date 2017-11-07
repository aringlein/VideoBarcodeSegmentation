// import 'Angle'
// import 'Assert'
// import 'Coordinate'
// import 'PolygonModel'

/**
 * Represents the frames of the animation and keyframe information as well.
 * Stores all the polygons used.
 */
class FrameModel {
  constructor() {
    assertParameters(arguments);

    // Map from id to PolygonModel.
    this._polygons = {};
    this._currentFrame = 0;

    this._frames = (new Array(FrameModel.KEYFRAMES)).fill().map(
        (x, i) => new FrameModel.Frame(this, i));
  }

  get currentFrameIndex() {
    return this._currentFrame;
  }

  // Gets the current FrameModel.Frame.
  get currentFrame() {
    return this._frames[this._currentFrame];
  }
  set currentFrame(frameIndex) {
    assertParameters(arguments, Number);

    frameIndex = Math.max(0, Math.min(FrameModel.KEYFRAMES - 1, frameIndex));

    this._currentFrame = frameIndex;

    Events.dispatch(FrameModel.EVENT_TYPES.CHANGE_FRAME, frameIndex);
  }

  get polygons() {
    return Object.values(this._polygons);
  }

  getPolygon(polygonId) {
    assertParameters(arguments, Number);

    return this._polygons[polygonId];
  }

  getPolygonPosition(polygonId) {
    assertParameters(arguments, Number);

    // Find frame to the left.
    const frameLeft = (() => {
      for (let i = this._currentFrame; i >= 0; i --) {
        if (this._frames[i].hasPositionKeyframeFor(polygonId))
          return this._frames[i];
      }
    })();

    // Find frame to the right.
    const frameRight = (() => {
      for (let i = this._currentFrame; i < FrameModel.KEYFRAMES; i ++) {
        if (this._frames[i].hasPositionKeyframeFor(polygonId))
          return this._frames[i];
      }
    })();

    if (frameLeft === frameRight && frameLeft === undefined) {
      return PolygonModel.START_POSITION;
    }

    // Interpolate between.
    const positionLeft = frameLeft === undefined ?
        null : frameLeft.getPositionKeyframeFor(polygonId).position;
    const positionRight = frameRight === undefined ?
        null : frameRight.getPositionKeyframeFor(polygonId).position;

    if (frameLeft === undefined) return positionRight;
    if (frameRight === undefined) return positionLeft;
    if (frameRight === frameLeft) return positionLeft;

    const currentFrameRelative = this._currentFrame - frameLeft.frameIndex;
    const frameRange = frameRight.frameIndex - frameLeft.frameIndex;
    const interp = currentFrameRelative / frameRange;
    return positionRight.subtract(positionLeft)
        .scale(interp)
        .translate(positionLeft);
  }

  getPolygonRotation(polygonId) {
    assertParameters(arguments, Number);

    // Find frame to the left.
    const frameLeft = (() => {
      for (let i = this._currentFrame; i >= 0; i --) {
        if (this._frames[i].hasRotationKeyframeFor(polygonId))
          return this._frames[i];
      }
    })();

    // Find frame to the right.
    const frameRight = (() => {
      for (let i = this._currentFrame; i < FrameModel.KEYFRAMES; i ++) {
        if (this._frames[i].hasRotationKeyframeFor(polygonId))
          return this._frames[i];
      }
    })();

    if (frameLeft === frameRight && frameLeft === undefined) {
      return PolygonModel.START_ROTATION;
    }

    // Interpolate between.
    const rotationLeft = frameLeft === undefined ?
        null : frameLeft.getRotationKeyframeFor(polygonId).rotation;
    const rotationRight = frameRight === undefined ?
        null : frameRight.getRotationKeyframeFor(polygonId).rotation;

    if (frameLeft === undefined) return rotationRight;
    if (frameRight === undefined) return rotationLeft;
    if (frameRight === frameLeft) return rotationLeft;

    const currentFrameRelative = this._currentFrame - frameLeft.frameIndex;
    const frameRange = frameRight.frameIndex - frameLeft.frameIndex;
    const interp = currentFrameRelative / frameRange;
    return Angle.fromRadians(
        rotationLeft.radians +
        (rotationRight.radians - rotationLeft.radians) * interp);
  }

  getFrame(frameIndex) {
    assertParameters(arguments, Number);

    return this._frames[frameIndex];
  }

  // Adds a polygon and returns its id.
  addPolygon() {
    assertParameters(arguments);

    const id = FrameModel._nextPolygonId ++;
    const poly = new PolygonModel(
        id,
        this.getPolygonPosition.bind(this, id),
        this.getPolygonRotation.bind(this, id));

    for (let coord of FrameModel._DEFAULT_POLYGON) {
      poly.addPoint(coord);
    }

    this._polygons[id] = poly;

    Events.dispatch(FrameModel.EVENT_TYPES.ADD_POLYGON, id);

    return id;
  }

  removePolygon(polygonId) {
    assertParameters(arguments, Number);

    delete this._polygons[polygonId];

    Events.dispatch(FrameModel.EVENT_TYPES.REMOVE_POLYGON, polygonId);
  }
};

/**
 * Represents a single frame for every polygon.
 */
FrameModel.Frame = class {
  constructor(frameModel, frameIndex) {
    assertParameters(arguments, FrameModel, Number);

    this._frameModel = frameModel;
    this._frameIndex = frameIndex;

    // Map from id to FrameModel.Frame.PositionKeyFrame.
    this._positionKeyFrames = {};

    // Map from id to FrameModel.Frame.RotationKeyFrame.
    this._rotationKeyFrames = {};
  }

  get frameIndex() {
    return this._frameIndex;
  }

  hasPositionKeyframeFor(polygonId) {
    assertParameters(arguments, Number);

    return polygonId in this._positionKeyFrames;
  }

  getPositionKeyframeFor(polygonId) {
    assertParameters(arguments, Number);

    if (!this.hasPositionKeyframeFor(polygonId)) return null;

    return this._positionKeyFrames[polygonId];
  }

  hasRotationKeyframeFor(polygonId) {
    assertParameters(arguments, Number);

    return polygonId in this._rotationKeyFrames;
  }

  getRotationKeyframeFor(polygonId) {
    assertParameters(arguments, Number);

    if (!this.hasRotationKeyframeFor(polygonId)) return null;

    return this._rotationKeyFrames[polygonId];
  }

  addKeyFrame(polygonId) {
    assertParameters(arguments, Number);

    if (!(polygonId in this._positionKeyFrames))
      this.addPositionKeyFrame(polygonId);

    if (!(polygonId in this._rotationKeyFrames))
      this.addRotationKeyFrame(polygonId);
  }

  removeKeyFrame(polygonId) {
    assertParameters(arguments, Number);

    this.removePositionKeyFrame(polygonId);
    this.removeRotationKeyFrame(polygonId);
  }

  addPositionKeyFrame(polygonId, newPosition) {
    assertParameters(arguments, Number, [Coordinate, undefined]);

    if (newPosition === undefined) {
      newPosition = this._frameModel.getPolygon(polygonId).position;
    }

    this._positionKeyFrames[polygonId] =
        new FrameModel.Frame.PositionKeyFrame(this._frameIndex, newPosition);
    Events.dispatch(FrameModel.EVENT_TYPES.ADD_POSITION_KEYFRAME,
        this._frameIndex, polygonId);

    this._frameModel.currentFrame = this._frameIndex;
  }

  removePositionKeyFrame(polygonId) {
    assertParameters(arguments, Number);

    delete this._positionKeyFrames[polygonId];

    Events.dispatch(FrameModel.EVENT_TYPES.REMOVE_POSITION_KEYFRAME,
        this._frameIndex, polygonId);
  }

  addRotationKeyFrame(polygonId, newRotation) {
    assertParameters(arguments, Number, [Coordinate, undefined]);

    if (newRotation === undefined) {
      newRotation = this._frameModel.getPolygon(polygonId).rotation;
    }

    this._rotationKeyFrames[polygonId] =
        new FrameModel.Frame.RotationKeyFrame(this._frameIndex, newRotation);
    Events.dispatch(FrameModel.EVENT_TYPES.ADD_ROTATION_KEYFRAME,
        this._frameIndex, polygonId);

    this._frameModel.currentFrame = this._frameIndex;
  }

  removeRotationKeyFrame(polygonId) {
    assertParameters(arguments, Number);

    delete this._rotationKeyFrames[polygonId];

    Events.dispatch(FrameModel.EVENT_TYPES.REMOVE_ROTATION_KEYFRAME,
        this._frameIndex, polygonId);
  }
};

/**
 * Represents a single position keyframe for a polygon.
 */
FrameModel.Frame.PositionKeyFrame = class {
  constructor(frameIndex, coord) {
    assertParameters(arguments, Number, Coordinate);

    if (!coord.isWithin(
        FrameModel.Frame.PositionKeyFrame._BOUND_TOP_LEFT,
        FrameModel.Frame.PositionKeyFrame._BOUND_BOTTOM_RIGHT)) {
      coord = coord.moveWithin(
          FrameModel.Frame.PositionKeyFrame._BOUND_TOP_LEFT,
          FrameModel.Frame.PositionKeyFrame._BOUND_BOTTOM_RIGHT);
    }

    this._frameIndex = frameIndex;
    this._position = coord;
  }

  get frameIndex() {
    return this._frameIndex;
  }

  get position() {
    return this._position;
  }
};

/**
 * Represents a single rotation keyframe for a polygon.
 */
FrameModel.Frame.RotationKeyFrame = class {
  constructor(frameIndex, angle) {
    assertParameters(arguments, Number, Angle);

    this._frameIndex = frameIndex;
    this._rotation = angle;
  }

  get frameIndex() {
    return this._frameIndex;
  }

  get rotation() {
    return this._rotation;
  }
};

FrameModel.Frame.PositionKeyFrame._BOUND_TOP_LEFT = new Coordinate(-128, -128);
FrameModel.Frame.PositionKeyFrame._BOUND_BOTTOM_RIGHT =
    new Coordinate(127, 127);

FrameModel.KEYFRAMES = 64;
FrameModel.FPS = 16;
FrameModel._DEFAULT_POLYGON = [
  new Coordinate(108, 108),
  new Coordinate(148, 108),
  new Coordinate(148, 148),
  new Coordinate(108, 148)
];

FrameModel._nextPolygonId = 0;

FrameModel.EVENT_TYPES = {
  ADD_POLYGON: 'framemodel-addpolygon', // PolygonId
  REMOVE_POLYGON: 'framemodel-removepolygon', // PolygonId
  CHANGE_FRAME: 'framemodel-changeframe',
  ADD_POSITION_KEYFRAME: 'framemodel-addposkeyframe', // FrameIndex, PolygonId
  REMOVE_POSITION_KEYFRAME:
      'framemodel-removeposkeyframe', // FrameIndex, PolygonId
  ADD_ROTATION_KEYFRAME: 'framemodel-addrotkeyframe', // FrameIndex, PolygonId
  REMOVE_ROTATION_KEYFRAME:
      'framemodel-removerotkeyframe' // FrameIndex, PolygonId
};
