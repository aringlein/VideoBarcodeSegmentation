// import 'Assert'
// import 'Coordinate'
// import 'DOMInterfaceTableKeyframeRow'
// import 'Events'
// import 'FrameModel'
// import 'jquery'

/**
 * Sets up and controls a row for a polygon.
 */
class DOMInterfaceTablePolygonPositionRow extends DOMInterfaceTableKeyframeRow {
  constructor(polygonId, rowId, active = true) {
    assertParameters(arguments, Number, String, [Boolean, undefined]);

    super(polygonId, rowId, active);

    this.activate();
  }

  changePosition(coord) {
    assertParameters(arguments, Coordinate);

    this._inputX.val(Math.round(coord.x));
    this._inputY.val(Math.round(coord.y));
  }

  get _inputX() {
    return this._headColElem.children('input[type=x]');
  }
  get _inputY() {
    return this._headColElem.children('input[type=y]');
  }

  _setupDOM(active) {
    assertParameters(arguments, Boolean);

    super._setupDOM(active);

    this._headColElem.children('input')
        .click(this._inputClicked.bind(this))
        .change(this._inputChanged.bind(this));
  }

  _clickFrame(frameIndex, dragging) {
    assertParameters(arguments, Number, Boolean);

    if (!super._clickFrame(frameIndex, dragging)) return;

    // this.addKeyframe(frameIndex);

    Events.dispatch(
        DOMInterfaceTablePolygonPositionRow.EVENT_TYPES.ADD_KEYFRAME,
        this._polygonId,
        frameIndex);
  }

  _doubleclickFrame(frameIndex) {
    assertParameters(arguments, Number);

    Events.dispatch(
        DOMInterfaceTablePolygonPositionRow.EVENT_TYPES.REMOVE_KEYFRAME,
        this._polygonId,
        frameIndex);
  }

  _inputClicked(e) {
    assertParameters(arguments, $.Event);

    if (!this._active) return;

    e.stopPropagation();
  }

  _inputChanged() {
    assertParameters(arguments, undefined);

    const x = parseInt(this._inputX.val());
    const y = parseInt(this._inputY.val());
    const coord = new Coordinate(x, y);

    Events.dispatch(
        DOMInterfaceTablePolygonPositionRow.EVENT_TYPES.CHANGE,
        this._polygonId,
        coord);
  }

  _dispatchActivateEvent() {
    assertParameters(arguments);

    Events.dispatch(DOMInterfaceTablePolygonPositionRow.EVENT_TYPES.ACTIVATE,
        this._polygonId);
  }
};

DOMInterfaceTablePolygonPositionRow.EVENT_TYPES = {
  ACTIVATE: 'domiftblpolyposrow-activate',
  CHANGE: 'domiftblpolyposrow-change',
  ADD_KEYFRAME: 'domiftblpolyposrow-addkeyframe',
  REMOVE_KEYFRAME: 'domiftblpolyposrow-removekeyframe'
};
