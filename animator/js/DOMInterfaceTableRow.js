// import 'Assert'
// import 'Events'
// import 'FrameModel'
// import 'jquery'

class DOMInterfaceTableRow {
  constructor(rowId) {
    assertParameters(arguments, String);

    this._rowId = rowId;
  }

  activate() {
    assertParameters(arguments);

    $(this._cells).mousemove(this, this._cellMouseMove);
    $(this._cells).mousedown(this, this._cellMouseDown);
    $(this._cells).click(this, this._cellClick);
    $(this._cells).dblclick(this, this._cellDoubleclick);
  }

  remove() {
    assertParameters(arguments);

    $(this._cells).off();
  }

  get _cells() {
    return $(`#${this._rowId} td:not(:first-child)`);
  }

  // @virtual
  // Called when a frame cell is clicked.
  _clickFrame(frameIndex, dragging) {
    assertParameters(arguments, Number, Boolean);

    assertUnimplemented();
  }

  // Called when a frame cell is double-clicked.
  _doubleclickFrame(frameIndex) {
    assertParameters(arguments, Number);
  }

  _cellMouseMove(e) {
    if (!(e.originalEvent.buttons & 1)) return;
    e.data._cellClicked($(this), true);
  }
  _cellMouseDown(e) {
    e.data._cellClicked($(this), true);
  }
  _cellClick(e) {
    e.data._cellClicked($(this), false);
  }
  _cellDoubleclick(e) {
    e.data._cellDoubleclicked($(this));
  }

  _cellClicked(cell, dragging) {
    const frameIndex = parseInt(cell.attr('index'));
    this._clickFrame(frameIndex, dragging);
  }
  _cellDoubleclicked(cell) {
    const frameIndex = parseInt(cell.attr('index'));
    this._doubleclickFrame(frameIndex);
  }
};

DOMInterfaceTableRow.EVENT_TYPES = {
  CHANGE_FRAME: 'domiftblgotorow-changeframe'
};
