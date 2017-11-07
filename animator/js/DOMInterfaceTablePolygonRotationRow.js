// import 'Assert'
// import 'Angle'
// import 'DOMInterfaceTableKeyframeRow'
// import 'Events'
// import 'FrameModel'
// import 'jquery'

/**
 * Sets up and controls a row for a polygon.
 */
class DOMInterfaceTablePolygonRotationRow extends DOMInterfaceTableKeyframeRow {
  constructor(polygonId, rowId, active = true) {
    assertParameters(arguments, Number, String, [Boolean, undefined]);

    super(polygonId, rowId, active);

    this.activate();
  }

  changeRotation(angle) {
    assertParameters(arguments, Angle);

    this._inputAngle.val(Math.round(angle.degrees));
  }

  get _inputAngle() {
    return this._headColElem.children('input');
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
        DOMInterfaceTablePolygonRotationRow.EVENT_TYPES.ADD_KEYFRAME,
        this._polygonId,
        frameIndex);
  }

  _doubleclickFrame(frameIndex) {
    assertParameters(arguments, Number);

    Events.dispatch(
        DOMInterfaceTablePolygonRotationRow.EVENT_TYPES.REMOVE_KEYFRAME,
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

    const degrees = parseInt(this._inputAngle.val());
    const angle = Angle.fromDegrees(degrees);

    Events.dispatch(
        DOMInterfaceTablePolygonRotationRow.EVENT_TYPES.CHANGE,
        this._polygonId,
        angle);
  }

  _dispatchActivateEvent() {
    assertParameters(arguments);

    Events.dispatch(DOMInterfaceTablePolygonRotationRow.EVENT_TYPES.ACTIVATE,
        this._polygonId);
  }
};

DOMInterfaceTablePolygonRotationRow.EVENT_TYPES = {
  ACTIVATE: 'domiftblpolyrotrow-activate',
  CHANGE: 'domiftblpolyrotrow-change',
  ADD_KEYFRAME: 'domiftblpolyrotrow-addkeyframe',
  REMOVE_KEYFRAME: 'domiftblpolyrotrow-removekeyframe'
};
