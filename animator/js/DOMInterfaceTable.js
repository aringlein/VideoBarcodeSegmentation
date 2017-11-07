// import 'Assert'
// import 'DOMInterfaceTableKeyframeRow'
// import 'DOMInterfaceTablePolygonRow'
// import 'DOMInterfaceTablePolygonPositionRow'
// import 'DOMInterfaceTablePolygonRotationRow'
// import 'Events'
// import 'FrameModel'
// import 'jquery'

/**
 * Sets up and controls the frame table interface.
 */
class DOMInterfaceTable {
  constructor(frameModel) {
    assertParameters(arguments, FrameModel);

    this._frameModel = frameModel;

    this._gotoRow = null;
    // Map from id to DOMInterfaceTablePolygonRow.
    this._polygonRows = {};
    // Map from id to DOMInterfaceTablePolygonPositionRow.
    this._polygonPositionRows = {};
    // Map from id to DOMInterfaceTablePolygonRotationRow.
    this._polygonRotationRows = {};

    // The currently-selected polygon.
    this._currentPolygon = null;

    this._addFrameNumbersRow();
    this._addGotoFrameRow();

    Events.on(DOMInterfaceTablePolygonRow.EVENT_TYPES.ACTIVATE,
        this._polygonSelected, this);
    Events.on(DOMInterfaceTableKeyframeRow.EVENT_TYPES.DEACTIVATE_ALL,
        this._polygonDeselected, this);

    Events.on(FrameModel.EVENT_TYPES.ADD_POLYGON, this._addPolygonRow, this);
    Events.on(FrameModel.EVENT_TYPES.ADD_POLYGON,
        this._addPolygonPositionRow, this);
    Events.on(FrameModel.EVENT_TYPES.ADD_POLYGON,
        this._addPolygonRotationRow, this);

    Events.on(FrameModel.EVENT_TYPES.REMOVE_POLYGON,
        this._removePolygonRow, this);
    Events.on(FrameModel.EVENT_TYPES.REMOVE_POLYGON,
        this._removePolygonPositionRow, this);
    Events.on(FrameModel.EVENT_TYPES.REMOVE_POLYGON,
        this._removePolygonRotationRow, this);

    Events.on(FrameModel.EVENT_TYPES.CHANGE_FRAME, this._changeFrame, this);

    Events.on(FrameModel.EVENT_TYPES.ADD_POSITION_KEYFRAME,
        this._addPositionKeyFrame, this);
    Events.on(FrameModel.EVENT_TYPES.REMOVE_POSITION_KEYFRAME,
        this._removePositionKeyFrame, this);
    Events.on(FrameModel.EVENT_TYPES.ADD_ROTATION_KEYFRAME,
        this._addRotationKeyFrame, this);
    Events.on(FrameModel.EVENT_TYPES.REMOVE_ROTATION_KEYFRAME,
        this._removeRotationKeyFrame, this);
  }

  get currentPolygon() {
    return this._currentPolygon;
  }

  activate() {
    assertParameters(arguments);

    this._gotoRow.activate();
  }

  static get _TABLE() {
    return $('#keyframes table');
  }

  static get _TABLE_SCROLLER() {
    return $('#kf-wrapper');
  }

  _polygonSelected(polygonId) {
    assertParameters(arguments, Number);

    this._currentPolygon = polygonId;
  }

  _polygonDeselected() {
    assertParameters(arguments);

    this._currentPolygon = null;
  }

  _addRow(rowId, rowClass, rowName, headcolClass, cellContentFn) {
    assertParameters(arguments, String, String, String, String, Function);

    let row = `
      <tr id="${rowId}" class="${rowClass}">
      <td class="headcol ${headcolClass}">${rowName}</td>
    `;

    for (let i = 0; i < FrameModel.KEYFRAMES; i ++) {
      const content = cellContentFn(i);
      row += `<td index=${i}>${content}</td>`;
    }

    row += `</tr>`;
    DOMInterfaceTable._TABLE.append(row);
  }

  _removeRow(rowId) {
    assertParameters(arguments, String);

    $(`#${rowId}`).remove();
  }

  _addPolygonRow(polygonId) {
    assertParameters(arguments, Number);

    const rowId = DOMInterfaceTable._POLYGON_ROW_ID(polygonId);
    const rowContent = DOMInterfaceTable._POLYGON_ROW_CONTENT(polygonId);
    this._addRow(rowId, `keyframe-row`, rowContent, `kf-poly`, (i) => ``);

    const newPolygonRow = new DOMInterfaceTablePolygonRow(polygonId, rowId);
    newPolygonRow.currentFrame = this._frameModel.currentFrameIndex;
    this._polygonRows[polygonId] = newPolygonRow;
  }

  _removePolygonRow(polygonId) {
    assertParameters(arguments, Number);

    this._polygonRows[polygonId].remove();
    delete this._polygonRows[polygonId];

    const rowId = DOMInterfaceTable._POLYGON_ROW_ID(polygonId);
    this._removeRow(rowId);
  }

  _addPolygonPositionRow(polygonId) {
    assertParameters(arguments, Number);

    const rowId = DOMInterfaceTable._POLYGON_POSITION_ROW_ID(polygonId);
    const rowContent = DOMInterfaceTable._POLYGON_POSITION_ROW_CONTENT(
        this._frameModel.getPolygonPosition(polygonId));
    this._addRow(
        rowId, `keyframe-row`, rowContent, `kf-polyposition`, (i) => ``);

    const newPolygonPositionRow =
        new DOMInterfaceTablePolygonPositionRow(polygonId, rowId, false);
    newPolygonPositionRow.currentFrame = this._frameModel.currentFrameIndex;
    this._polygonPositionRows[polygonId] = newPolygonPositionRow;
  }

  _removePolygonPositionRow(polygonId) {
    assertParameters(arguments, Number);

    this._polygonPositionRows[polygonId].remove();
    delete this._polygonPositionRows[polygonId];

    const rowId = DOMInterfaceTable._POLYGON_POSITION_ROW_ID(polygonId);
    this._removeRow(rowId);
  }

  _addPolygonRotationRow(polygonId) {
    assertParameters(arguments, Number);

    const rowId = DOMInterfaceTable._POLYGON_ROTATION_ROW_ID(polygonId);
    const rowContent = DOMInterfaceTable._POLYGON_ROTATION_ROW_CONTENT(
        this._frameModel.getPolygonRotation(polygonId));
    this._addRow(
        rowId, `keyframe-row`, rowContent, `kf-polyrotation`, (i) => ``);

    const newPolygonRotationRow =
        new DOMInterfaceTablePolygonRotationRow(polygonId, rowId, false);
    newPolygonRotationRow.currentFrame = this._frameModel.currentFrameIndex;
    this._polygonRotationRows[polygonId] = newPolygonRotationRow;
  }

  _removePolygonRotationRow(polygonId) {
    assertParameters(arguments, Number);

    this._polygonRotationRows[polygonId].remove();
    delete this._polygonRotationRows[polygonId];

    const rowId = DOMInterfaceTable._POLYGON_ROTATION_ROW_ID(polygonId);
    this._removeRow(rowId);
  }

  _addFrameNumbersRow() {
    assertParameters(arguments);

    this._addRow(`kf-num`, ``, ``, ``, (i) => i);
  }

  _addGotoFrameRow() {
    assertParameters(arguments);

    const rowId = `kf-sel`;
    this._addRow(rowId, ``, `Goto frame`, ``, (i) => ``);

    this._gotoRow = new DOMInterfaceTableGotoRow(rowId);
  }

  _changeFrame(frameIndex) {
    assertParameters(arguments, Number);

    const scrollWidth =
        DOMInterfaceTable._TABLE_SCROLLER.width() -
        DOMInterfaceTable._PREVIEW_MARGIN_RIGHT;
    const scrollLeft =
        frameIndex * DOMInterfaceTable._KEYFRAME_WIDTH - scrollWidth;
    if (DOMInterfaceTable._TABLE_SCROLLER.scrollLeft() < scrollLeft) {
      DOMInterfaceTable._TABLE_SCROLLER.scrollLeft(scrollLeft);
    }

    this._gotoRow.currentFrame = frameIndex;

    for (let polygonRow of Object.values(this._polygonRows)) {
      polygonRow.currentFrame = frameIndex;
    }

    for (let positionRow of Object.values(this._polygonPositionRows)) {
      positionRow.currentFrame = frameIndex;

      const position =
          this._frameModel.getPolygon(positionRow.polygonId).position;
      positionRow.changePosition(position);
    }

    for (let rotationRow of Object.values(this._polygonRotationRows)) {
      rotationRow.currentFrame = frameIndex;

      const rotation =
          this._frameModel.getPolygon(rotationRow.polygonId).rotation;
      rotationRow.changeRotation(rotation);
    }
  }

  _removeKeyFrameIfNone(frameIndex, polygonId) {
    const hasPositionKeyframe =
        this._polygonPositionRows[polygonId].hasKeyframe(frameIndex);
    const hasRotationKeyframe =
        this._polygonRotationRows[polygonId].hasKeyframe(frameIndex);

    if (hasPositionKeyframe || hasRotationKeyframe) return;

    this._polygonRows[polygonId].removeKeyframe(frameIndex);
  }

  _addPositionKeyFrame(frameIndex, polygonId) {
    assertParameters(arguments, Number, Number);

    this._polygonRows[polygonId].addKeyframe(frameIndex);
    this._polygonPositionRows[polygonId].addKeyframe(frameIndex);
  }

  _removePositionKeyFrame(frameIndex, polygonId) {
    assertParameters(arguments, Number, Number);

    this._polygonPositionRows[polygonId].removeKeyframe(frameIndex);
    this._removeKeyFrameIfNone(frameIndex, polygonId);
  }

  _addRotationKeyFrame(frameIndex, polygonId) {
    assertParameters(arguments, Number, Number);

    this._polygonRows[polygonId].addKeyframe(frameIndex);
    this._polygonRotationRows[polygonId].addKeyframe(frameIndex);
  }

  _removeRotationKeyFrame(frameIndex, polygonId) {
    assertParameters(arguments, Number, Number);

    this._polygonRotationRows[polygonId].removeKeyframe(frameIndex);
    this._removeKeyFrameIfNone(frameIndex, polygonId);
  }
};

DOMInterfaceTable._POLYGON_ROW_ID = function(polygonId) {
  assertParameters(arguments, Number);

  return `kf-poly${polygonId}`;
}

DOMInterfaceTable._POLYGON_POSITION_ROW_ID = function(polygonId) {
  assertParameters(arguments, Number);

  return `kf-polyposition${polygonId}`;
}

DOMInterfaceTable._POLYGON_ROTATION_ROW_ID = function(polygonId) {
  assertParameters(arguments, Number);

  return `kf-polyrotation${polygonId}`;
}

DOMInterfaceTable._POLYGON_ROW_CONTENT = function(polygonId) {
  assertParameters(arguments, Number);

  return `Polygon ${polygonId}`;
};

DOMInterfaceTable._POLYGON_POSITION_ROW_CONTENT = function(coord) {
  assertParameters(arguments, Coordinate);

  const x = coord.x;
  const y = coord.y;
  return `
    x <input type="x" value="${x}"></input> &nbsp;
    y <input type="y" value="${y}"></input>
  `;
};

DOMInterfaceTable._POLYGON_ROTATION_ROW_CONTENT = function(angle) {
  assertParameters(arguments, Angle);

  const degrees = angle.degrees;
  return `&#8635; <input value="${degrees}"></input>`;
};

DOMInterfaceTable._KEYFRAME_WIDTH = 23;
DOMInterfaceTable._PREVIEW_MARGIN_RIGHT = 100;
