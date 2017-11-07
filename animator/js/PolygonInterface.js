// import 'Assert'
// import 'Canvas'
// import 'Colors'
// import 'Coordinate'
// import 'FrameModel'
// import 'Instructions'
// import 'PolygonModel'
// import 'PolygonPointInterface'

/**
 * User interface to edit a polygon.
 */
class PolygonInterface {
  constructor(frameModel, polygonId, scaleCoordFn, inverseScaleCoordFn) {
    assertParameters(arguments, FrameModel, Number, Function, Function);

    this._frameModel = frameModel;
    this._id = polygonId;
    this._scaleCoord = scaleCoordFn;
    this._inverseScaleCoord = inverseScaleCoordFn;

    this._polygon = this._frameModel.getPolygon(polygonId);

    this._pointInterfaces = new Set();

    this._state = PolygonInterface._STATES.IDLE;

    this._dragging = false;
    this._dragLast = null;

    Events.on(InputHandler.EVENT_TYPES.CLICK_NO_DRAG, this._onClick, this);
    Events.on(InputHandler.EVENT_TYPES.DRAG_START, this._onDragStart, this);
    Events.on(InputHandler.EVENT_TYPES.DRAG, this._onDrag, this);
    Events.on(InputHandler.EVENT_TYPES.DRAG_END, this._onDragEnd, this);

    Events.on(DrawTimer.EVENT_TYPES.DRAW, this._draw, this);
    Events.on(DrawTimer.EVENT_TYPES.DRAW, this._drawInstructions, this, 200);
  }

  startEditing() {
    assertParameters(arguments);

    for (let point of this._polygon.points) {
      this._addPointInterface(point);
    }
    this._state = PolygonInterface._STATES.EDITING;
  }

  startMoving() {
    assertParameters(arguments);

    canvas.setCursorFor(this, Canvas.CURSOR_TYPE.MOVE, 100);

    this._state = PolygonInterface._STATES.MOVING;
  }

  startRotating() {
    assertParameters(arguments);

    canvas.setCursorFor(this, Canvas.CURSOR_TYPE.ROTATE, 100);

    this._state = PolygonInterface._STATES.ROTATING;
  }

  deactivate() {
    assertParameters(arguments);

    // Clear editing.
    for (let pointInterface of this._pointInterfaces) {
      pointInterface.destroy();
    }
    this._pointInterfaces.clear();

    // Clear moving.
    canvas.removeCursorFor(this);
    this._dragging = false;

    this._state = PolygonInterface._STATES.IDLE;
  }

  remove() {
    assertParameters(arguments);

    this.deactivate();

    Events.off(InputHandler.EVENT_TYPES.CLICK_NO_DRAG, this);
    Events.off(InputHandler.EVENT_TYPES.DRAG_START, this);
    Events.off(InputHandler.EVENT_TYPES.DRAG, this);
    Events.off(InputHandler.EVENT_TYPES.DRAG_END, this);

    Events.off(DrawTimer.EVENT_TYPES.DRAW, this);

    assert(Events.hasNoneForOwner(this));
  }

  get _scaledCoords() {
    assertParameters(arguments);

    let scaledCoords = [];
    for (let coord of this._polygon.coords) {
      const positionedCoord = coord.translate(this._polygon.position);

      // Add rotation.
      const distFromCenter = this._polygon.center.distanceTo(positionedCoord);
      const angleFromCenter = -this._polygon.center.angleTo(positionedCoord);
      const rotatedAngle = angleFromCenter - this._polygon.rotation.radians;
      const rotatedCoord =
          this._polygon.center.translateVector(rotatedAngle, distFromCenter);

      scaledCoords.push(this._scaleCoordCanvas(rotatedCoord, canvas));
    }
    return scaledCoords;
  }

  get _isIdle() {
    return this._state === PolygonInterface._STATES.IDLE;
  }
  get _isEditing() {
    return this._state === PolygonInterface._STATES.EDITING;
  }
  get _isMoving() {
    return this._state === PolygonInterface._STATES.MOVING;
  }
  get _isRotating() {
    return this._state === PolygonInterface._STATES.ROTATING;
  }

  _scaleCoordCanvas(coord, canvas) {
    return this._scaleCoord(coord, canvas.width, canvas.height);
  }

  _inverseScaleCoordCanvas(coord, canvas) {
    return this._inverseScaleCoord(coord, canvas.width, canvas.height);
  }

  _addPointInterface(point) {
    assertParameters(arguments, PolygonModel.Point);

    const newPoint = new PolygonPointInterface(
        this._polygon,
        point,
        this._scaleCoord,
        this._inverseScaleCoord);
    this._pointInterfaces.add(newPoint);
  }

  _onClick(mousePosition, canvas) {
    assertParameters(arguments, Coordinate, Canvas);

    if (!this._isEditing) return;

    // Add a new point.
    const inverseScaledCoord =
        this._inverseScaleCoordCanvas(mousePosition, canvas)
            .subtract(this._polygon.position);
    const newPoint = this._polygon.addPoint(inverseScaledCoord);
    this._addPointInterface(newPoint);
  }

  _onDragStart(mousePosition, canvas) {
    assertParameters(arguments, Coordinate, Canvas);

    if (!(this._isMoving || this._isRotating)) return;

    this._dragging = true;
    const inverseScaledCoord = this._inverseScaleCoordCanvas(
        mousePosition, canvas);
    this._dragLast = inverseScaledCoord;

    if (this._isRotating) {
      this._dragLastRotation = this._polygon.center.angleTo(inverseScaledCoord);
      canvas.setCursorFor(this, Canvas.CURSOR_TYPE.ROTATING, 100);
    }
  }

  _onDrag(mousePosition, canvas) {
    assertParameters(arguments, Coordinate, Canvas);

    if (!this._dragging) return;

    const inverseScaledCoord = this._inverseScaleCoordCanvas(
        mousePosition, canvas);
    const dragDelta = inverseScaledCoord.subtract(this._dragLast);
    this._dragLast = inverseScaledCoord;

    switch (this._state) {

    case PolygonInterface._STATES.MOVING:
      const newPosition = this._polygon.position.translate(dragDelta);

      Events.dispatch(PolygonInterface.EVENT_TYPES.MOVE, this._id, newPosition);
      break;

    case PolygonInterface._STATES.ROTATING:
      const curRotation = this._polygon.center.angleTo(inverseScaledCoord);
      const dragRotationDelta =
          Angle.diffRadians(curRotation, this._dragLastRotation);
      this._dragLastRotation = curRotation;

      const newRotation = this._polygon.rotation.rotate(dragRotationDelta);

      Events.dispatch(
          PolygonInterface.EVENT_TYPES.ROTATE, this._id, newRotation);
      break;
    }
  }

  _onDragEnd() {
    assertParameters(arguments, Coordinate, Canvas);

    if (!this._dragging) return;

    if (this._isRotating) {
      canvas.setCursorFor(this, Canvas.CURSOR_TYPE.ROTATE, 100);
    }

    this._dragging = false;
  }

  _draw(canvas) {
    assertParameters(arguments, Canvas);

    const color = this._isIdle ?
        COLORS.POLYGON_INTERFACE_IDLE : COLORS.POLYGON_INTERFACE_ACTIVE;
    canvas.drawPolygon(this._scaledCoords, color, true);

    canvas.drawCircle(
        this._scaleCoordCanvas(this._polygon.center, canvas), 2,
        PolygonInterface._CENTER_COLOR);
  }

  _drawInstructions(canvas) {
    assertParameters(arguments, Canvas);

    if (this._isEditing) {
      Instructions.draw(canvas, PolygonInterface._EDIT_INSTRUCTIONS);
    }
  }
};

PolygonInterface._CENTER_COLOR = COLORS.POLYGON_INTERFACE_FADED;

PolygonInterface._STATES = {
  IDLE: 0,
  EDITING: 1,
  MOVING: 2,
  ROTATING: 3
};

PolygonInterface.EVENT_TYPES = {
  MOVE: 'polyint-move',
  ROTATE: 'polyint-rotate'
};

PolygonInterface._EDIT_INSTRUCTIONS =
    'Click to add new points.\nPress D to delete a point.';
