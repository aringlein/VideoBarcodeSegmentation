// import 'Assert'
// import 'DOMInterfaceTableRow'
// import 'Events'
// import 'FrameModel'
// import 'jquery'

class DOMInterfaceTableGotoRow extends DOMInterfaceTableRow {
  constructor(rowId) {
    assertParameters(arguments, String);

    super(rowId);
  }

  set currentFrame(frameIndex) {
    const cells = this._cells;
    cells.removeClass('sel');
    $(cells.get(frameIndex)).addClass('sel');
  }

  _clickFrame(frameIndex, dragging) {
    assertParameters(arguments, Number, Boolean);

    Events.dispatch(DOMInterfaceTableRow.EVENT_TYPES.CHANGE_FRAME, frameIndex);
  }
};
