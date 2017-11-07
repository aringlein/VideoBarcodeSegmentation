// import 'Assert'
// import 'Events'
// import 'FrameModel'
// import 'jquery'

class DOMInterfaceTableKeyframeRow extends DOMInterfaceTableRow {
  constructor(polygonId, rowId, active = true) {
    assertParameters(arguments, Number, String, [Boolean, undefined]);

    super(rowId);

    this._polygonId = polygonId;
    this._active = false;

    this._currentFrame = null;

    Events.on(DOMInterfaceTableKeyframeRow.EVENT_TYPES.DEACTIVATE_ALL,
        this._deactivate, this);

    this._setupDOM(active);
  }

  get polygonId() {
    return this._polygonId;
  }

  set currentFrame(frameIndex) {
    assertParameters(arguments, Number);

    this._currentFrame = frameIndex;
    this._cells.removeClass('current')
        .filter(`[index=${frameIndex}]`).addClass('current');
  }

  hasKeyframe(frameIndex) {
    assertParameters(arguments, Number);

    return $(this._cells.get(frameIndex)).hasClass('keyframe');
  }

  addKeyframe(frameIndex) {
    assertParameters(arguments, Number);

    $(this._cells.get(frameIndex)).addClass('keyframe');
  }

  removeKeyframe(frameIndex) {
    assertParameters(arguments, Number);

    $(this._cells.get(frameIndex)).removeClass('keyframe');
  }

  remove() {
    super.remove();

    Events.off(DOMInterfaceTableKeyframeRow.EVENT_TYPES.DEACTIVATE_ALL, this);
    assertEq(true, Events.hasNoneForOwner(this));

    this._headColElem.off();
  }

  get _headColElem() {
    assertParameters(arguments);

    return $(`#${this._rowId} .headcol`);
  }

  _setupDOM(active) {
    assertParameters(arguments, Boolean);

    this._headColElem
      .addClass(`headcol-interactive`)
      .click(this._toggle.bind(this));

    if (active) this._toggle();
  }

  _toggle() {
    assertParameters(arguments, undefined);

    const active = this._active;

    Events.dispatch(DOMInterfaceTableKeyframeRow.EVENT_TYPES.DEACTIVATE_ALL);
    if (active) return;

    this._activate();
    this._dispatchActivateEvent();
  }

  // Clicking a frame changes the frame and possibly adds a keyframe.
  _clickFrame(frameIndex, dragging) {
    assertParameters(arguments, Number, Boolean);

    if (dragging) return false;

    Events.dispatch(DOMInterfaceTableRow.EVENT_TYPES.CHANGE_FRAME, frameIndex);

    return true;
  }

  _updateActive() {
    assertParameters(arguments);

    const headCol = $(`#${this._rowId} .headcol`);

    if (this._active) headCol.addClass(`active`);
    else headCol.removeClass(`active`);
  }

  _activate() {
    assertParameters(arguments);

    this._active = true;
    this._updateActive();
  }

  _deactivate() {
    assertParameters(arguments);

    this._active = false;
    this._updateActive();
  }

  // Can be overridden to dispatch different events.
  _dispatchActivateEvent() {
    assertParameters(arguments);

    Events.dispatch(DOMInterfaceTableKeyframeRow.EVENT_TYPES.ACTIVATE,
        this._polygonId);
  }
};

DOMInterfaceTableKeyframeRow.EVENT_TYPES = {
  ACTIVATE: 'domiftblrow-activate',
  DEACTIVATE_ALL: 'domiftblrow-deactivate'
};
