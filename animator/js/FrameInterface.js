// import 'Assert'
// import 'Controller'
// import 'DOMInterface'
// import 'DOMInterfaceTablePolygonPositionRow'
// import 'DOMInterfaceTablePolygonRotationRow'
// import 'DOMInterfaceTablePolygonRow'
// import 'DOMInterfaceTableRow'
// import 'FrameModel'
// import 'PolygonInterface'

/**
 * Controls the user interface to interact with the frame model.
 */
class FrameInterface {
  constructor(controller) {
    assertParameters(arguments, Controller);

    this._frameModel = new FrameModel();

    this._domInterface = new DOMInterface(this._frameModel);

    // Map from polygonId to PolygonInterface.
    this._polygonInterfaces = {};

    this._backgroundImage = null;

    // Attach event listeners.
    Events.on(DOMInterface.EVENT_TYPES.READY, this._domInterfaceReady, this);

    Events.on(FrameModel.EVENT_TYPES.ADD_POLYGON, this._addPolygon, this);
    Events.on(FrameModel.EVENT_TYPES.REMOVE_POLYGON, this._removePolygon, this);

    Events.on(DOMInterface.EVENT_TYPES.SELECT_IMAGE, this._selectImage, this);

    Events.on(DOMInterfaceTableRow.EVENT_TYPES.CHANGE_FRAME,
        this._gotoFrame, this);

    Events.on(DOMInterfaceTablePolygonRow.EVENT_TYPES.ACTIVATE,
        this._startEditingPolygon, this);
    Events.on(DOMInterfaceTablePolygonRow.EVENT_TYPES.ADD_KEYFRAME,
        this._addKeyframe, this);
    Events.on(DOMInterfaceTablePolygonRow.EVENT_TYPES.REMOVE_KEYFRAME,
        this._removeKeyframe, this);

    Events.on(DOMInterfaceTableKeyframeRow.EVENT_TYPES.DEACTIVATE_ALL,
        this._deactivatePolygons, this);

    Events.on(DOMInterfaceTablePolygonPositionRow.EVENT_TYPES.ACTIVATE,
        this._startMovingPolygon, this);
    Events.on(DOMInterfaceTablePolygonPositionRow.EVENT_TYPES.CHANGE,
        this._polygonPositionChanged, this);
    Events.on(DOMInterfaceTablePolygonPositionRow.EVENT_TYPES.ADD_KEYFRAME,
        this._addPositionKeyframe, this);
    Events.on(DOMInterfaceTablePolygonPositionRow.EVENT_TYPES.REMOVE_KEYFRAME,
        this._removePositionKeyframe, this);

    Events.on(DOMInterfaceTablePolygonRotationRow.EVENT_TYPES.ACTIVATE,
        this._startRotatingPolygon, this);
    Events.on(DOMInterfaceTablePolygonRotationRow.EVENT_TYPES.CHANGE,
        this._polygonRotationChanged, this);
    Events.on(DOMInterfaceTablePolygonRotationRow.EVENT_TYPES.ADD_KEYFRAME,
        this._addRotationKeyframe, this);
    Events.on(DOMInterfaceTablePolygonRotationRow.EVENT_TYPES.REMOVE_KEYFRAME,
        this._removeRotationKeyframe, this);

    Events.on(PolygonInterface.EVENT_TYPES.MOVE,
        this._polygonPositionChanged, this);
    Events.on(PolygonInterface.EVENT_TYPES.ROTATE,
        this._polygonRotationChanged, this);

    Events.on(DrawTimer.EVENT_TYPES.DRAW, this._draw, this);
    Events.on(DrawTimer.EVENT_TYPES.DRAW, this._drawOverlay, this, 100);
  }

  static _scaleCoord(coord, toWidth, toHeight) {
    assertParameters(arguments, Coordinate, Number, Number);

    toWidth -= FrameInterface._SCALE_PADDING * 2;
    toHeight -= FrameInterface._SCALE_PADDING * 2;

    coord = coord
        .scale(toHeight / FrameInterface._AREA_SIZE)
        .translate(new Coordinate(
            (toWidth - toHeight) / 2 + FrameInterface._SCALE_PADDING,
            FrameInterface._SCALE_PADDING));

    return coord;
  }

  static _inverseScaleCoord(toSize, coord, fromWidth, fromHeight) {
    assertParameters(arguments, Number, Coordinate, Number, Number);

    fromWidth -= FrameInterface._SCALE_PADDING * 2;
    fromHeight -= FrameInterface._SCALE_PADDING * 2;

    coord = coord
        .translate(new Coordinate(
            -(fromWidth - fromHeight) / 2 - FrameInterface._SCALE_PADDING,
            -FrameInterface._SCALE_PADDING))
        .scale(toSize / fromHeight);

    return coord;
  }

  static _getFrameTopLeft(canvas) {
    assertParameters(arguments, Canvas);

    return FrameInterface._scaleCoord(
        new Coordinate(0, 0), canvas.width, canvas.height)
  }

  static _getFrameBottomRight(canvas) {
    assertParameters(arguments, Canvas);

    return FrameInterface._scaleCoord(
        new Coordinate(
            FrameInterface._AREA_SIZE - 1, FrameInterface._AREA_SIZE - 1),
        canvas.width, canvas.height);
  }

  _domInterfaceReady() {
    assertParameters(arguments);

    Events.dispatch(FrameInterface.EVENT_TYPES.READY);
  }

  _gotoFrame(frameIndex) {
    assertParameters(arguments, Number);

    this._frameModel.currentFrame = frameIndex;
  }

  _startEditingPolygon(polygonId) {
    assertParameters(arguments, Number);

    // Don't start editing the polygon if it hasn't been added to the interfaces
    // yet.
    if (!(polygonId in this._polygonInterfaces)) return;

    this._polygonInterfaces[polygonId].startEditing();
  }

  _startMovingPolygon(polygonId) {
    assertParameters(arguments, Number);

    this._polygonInterfaces[polygonId].startMoving();
  }

  _startRotatingPolygon(polygonId) {
    assertParameters(arguments, Number);

    this._polygonInterfaces[polygonId].startRotating();
  }

  _addKeyframe(polygonId, frameIndex) {
    this._frameModel.getFrame(frameIndex).addKeyFrame(polygonId);
  }

  _removeKeyframe(polygonId, frameIndex) {
    this._frameModel.getFrame(frameIndex).removeKeyFrame(polygonId);
  }

  _addPositionKeyframe(polygonId, frameIndex) {
    this._frameModel.getFrame(frameIndex).addPositionKeyFrame(polygonId);
  }

  _removePositionKeyframe(polygonId, frameIndex) {
    this._frameModel.getFrame(frameIndex).removePositionKeyFrame(polygonId);
  }

  _addRotationKeyframe(polygonId, frameIndex) {
    this._frameModel.getFrame(frameIndex).addRotationKeyFrame(polygonId);
  }

  _removeRotationKeyframe(polygonId, frameIndex) {
    this._frameModel.getFrame(frameIndex).removeRotationKeyFrame(polygonId);
  }

  _deactivatePolygons() {
    assertParameters(arguments);

    for (let polygon of Object.values(this._polygonInterfaces)) {
      polygon.deactivate();
    }

    this._currentPolygon = null;
  }

  _addPolygon(polygonId) {
    assertParameters(arguments, Number);

    const newPolygon = new PolygonInterface(
        this._frameModel, polygonId,
        FrameInterface._scaleCoord,
        FrameInterface._inverseScaleCoord.bind(this,
            FrameInterface._AREA_SIZE));
    this._polygonInterfaces[polygonId] = newPolygon;
    this._startEditingPolygon(polygonId);
  }

  _removePolygon(polygonId) {
    assertParameters(arguments, Number);

    this._polygonInterfaces[polygonId].remove();
    delete this._polygonInterfaces[polygonId];
  }

  _polygonPositionChanged(polygonId, newPosition) {
    assertParameters(arguments, Number, Coordinate);

    // Make keyframe.
    this._frameModel.currentFrame.addPositionKeyFrame(
        polygonId, newPosition);

    // this._frameModel.getPolygon(polygonId).position = newPosition;
  }

  _polygonRotationChanged(polygonId, newRotation) {
    assertParameters(arguments, Number, Angle);

    // Make keyframe.
    this._frameModel.currentFrame.addRotationKeyFrame(
        polygonId, newRotation);

    // this._frameModel.getPolygon(polygonId).rotation = newRotation;
  }

  _selectImage(image) {
    assertParameters(arguments, HTMLImageElement);

    this._backgroundImage = image;
  }

  _draw(canvas) {
    assertParameters(arguments, Canvas);

    // Draw stage.
    const topLeft = FrameInterface._getFrameTopLeft(canvas);
    const bottomRight = FrameInterface._getFrameBottomRight(canvas);
    const stageEnvelope = Envelope.fromCoordinates(topLeft, bottomRight);
    canvas.drawWithShadow(
        FrameInterface._SHADOW_SIZE,
        FrameInterface._SHADOW_COLOR,
        FrameInterface._SHADOW_OFFSET,
        () => canvas.drawRectangle(
            Canvas.RECTANGLE_TYPE.FILL, stageEnvelope, 'white'));

    // Draw background image.
    if (this._backgroundImage) {
      const w = this._backgroundImage.width;
      const h = this._backgroundImage.height
      const minSize = Math.min(w, h);
      const srcEnvelope = new Envelope(
          new Coordinate(w / 2 - minSize / 2, h / 2 - minSize / 2),
          new Size(minSize, minSize));
      canvas.drawWithOpacity(0.3, () => {
        canvas.drawImageCropped(
            this._backgroundImage, srcEnvelope, stageEnvelope);
      });
    }
  }

  _drawOverlay(canvas) {
    assertParameters(arguments, Canvas);

    // Draw overlay.
    const stageTopLeft = FrameInterface._getFrameTopLeft(canvas);
    const stageBottomRight = FrameInterface._getFrameBottomRight(canvas);

    const top = Envelope.fromCoordinates(
        new Coordinate(0, 0), new Coordinate(canvas.width, stageTopLeft.y));
    const bottom = Envelope.fromCoordinates(
        new Coordinate(0, stageBottomRight.y),
        new Coordinate(canvas.width, canvas.height));
    const left = Envelope.fromCoordinates(
        new Coordinate(0, stageTopLeft.y),
        new Coordinate(stageTopLeft.x, stageBottomRight.y));
    const right = Envelope.fromCoordinates(
        new Coordinate(stageBottomRight.x, stageTopLeft.y),
        new Coordinate(canvas.width, stageBottomRight.y));

    canvas.drawWithOpacity(0.8, () => {
      canvas.drawRectangle(
          Canvas.RECTANGLE_TYPE.FILL, top, FrameInterface._BACKGROUND);
      canvas.drawRectangle(
          Canvas.RECTANGLE_TYPE.FILL, bottom, FrameInterface._BACKGROUND);
      canvas.drawRectangle(
          Canvas.RECTANGLE_TYPE.FILL, left, FrameInterface._BACKGROUND);
      canvas.drawRectangle(
          Canvas.RECTANGLE_TYPE.FILL, right, FrameInterface._BACKGROUND);
    });
  }
};

FrameInterface.EVENT_TYPES = {
  READY: 'frameinterface-ready'
};

FrameInterface._AREA_SIZE = 256;
FrameInterface._SCALE_PADDING = 50;
FrameInterface._BACKGROUND = '#ddd';
FrameInterface._SHADOW_COLOR = '#444';
FrameInterface._SHADOW_OFFSET = new Coordinate(4, 4);
FrameInterface._SHADOW_SIZE = 8;
