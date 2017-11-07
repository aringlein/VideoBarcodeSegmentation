// import 'Assert'
// import 'DOMInterfaceTableKeyframeRow'
// import 'Events'
// import 'FrameModel'
// import 'jquery'

/**
 * Sets up and controls a row for a polygon.
 */
class DOMInterfaceTablePolygonRow extends DOMInterfaceTableKeyframeRow {
  constructor(polygonId, rowId, active = true) {
    assertParameters(arguments, Number, String, [Boolean, undefined]);

    super(polygonId, rowId, active);

    this.activate();
  }

  _clickFrame(frameIndex, dragging) {
    assertParameters(arguments, Number, Boolean);

    if (!super._clickFrame(frameIndex, dragging)) return;

    // this.addKeyframe(frameIndex);

    Events.dispatch(
        DOMInterfaceTablePolygonRow.EVENT_TYPES.ADD_KEYFRAME,
        this._polygonId,
        frameIndex);
  }

  _doubleclickFrame(frameIndex) {
    assertParameters(arguments, Number);

    Events.dispatch(
        DOMInterfaceTablePolygonRow.EVENT_TYPES.REMOVE_KEYFRAME,
        this._polygonId,
        frameIndex);
  }

  _dispatchActivateEvent() {
    assertParameters(arguments);

    Events.dispatch(DOMInterfaceTablePolygonRow.EVENT_TYPES.ACTIVATE,
        this._polygonId);
  }
};

DOMInterfaceTablePolygonRow.EVENT_TYPES = {
  ACTIVATE: 'domiftblpolyrow-activate',
  ADD_KEYFRAME: 'domiftblpolyrow-add',
  REMOVE_KEYFRAME: 'domiftblpolyrow-remove'
};
