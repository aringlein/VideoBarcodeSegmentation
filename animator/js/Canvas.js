// import 'Assert'
// import 'Coordinate'
// import 'Envelope'

/**
 * Works with the HTML Canvas DOM element.
 */
class Canvas {
  // 'canvasId' is the HTML DOM element id of the canvas.
  constructor(canvasId) {
    assertParameters(arguments, String);

    this._canvas = document.getElementById(canvasId);
    this._context = this._canvas.getContext('2d');

    // Maps from owners to priority-type tuples.
    this._cursorMap = new Map();
  }

  get width() {
    return this._canvas.width;
  }
  get height() {
    return this._canvas.height;
  }

  get element() {
    return this._canvas;
  }

  // Alias for DOM addEventListener.
  listen() {
    assertParameters(arguments, undefined);
    this._canvas.addEventListener(...Array.from(arguments));
  }

  // Clears the context.
  clear() {
    assertParameters(arguments);

    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  // Draw line from 'startCoord' to 'endCoord'.
  drawLine(startCoord, endCoord) {
    assertParameters(arguments, Coordinate, Coordinate);

    this._context.beginPath();
    this._context.moveTo(...startCoord);
    this._context.lineTo(...endCoord);
    this._context.stroke();
  }

  // Draw a stroke rectangle with coord = top left corner.
  drawRectangle(type, envelope, color = undefined) {
    assertParameters(arguments, Number, Envelope, [String, undefined]);

    switch (type) {
      case Canvas.RECTANGLE_TYPE.STROKE:
        this._context.strokeRect(
            ...envelope.topLeft, ...envelope.size);
        break;
      case Canvas.RECTANGLE_TYPE.FILL:
        if (color) this._context.fillStyle = color;
        this._context.fillRect(
            ...envelope.topLeft, ...envelope.size);
        break;
      default:
        return;
    }
  }

  // Draw a circle.
  drawCircle(center, radius, color = undefined, stroke = false) {
    assertParameters(arguments,
        Coordinate, Number, [String, undefined], [Boolean, undefined]);

    this._context.beginPath();
    this._context.arc(...center, radius, 0, 2 * Math.PI, false);
    if (stroke) {
      this._context.strokeStyle = color;
      this._context.stroke();
    } else {
      this._context.fillStyle = color;
      this._context.fill();
    }
  }

  // Draw polygon shape (will apply color and stroke).
  drawPolygon(coords, color, stroke = false) {
    assertParameters(arguments, Array, String, [Boolean, undefined]);

    this._context.beginPath();
    this._context.moveTo(...coords[0].toArray());
    for (let coord of coords) {
      this._context.lineTo(...coord.toArray());
    }
    this._context.lineTo(...coords[0].toArray()); // To close the shape.
    this._context.closePath();
    if (stroke) {
      this._context.strokeStyle = color;
      this._context.stroke();
    } else {
      this._context.fillStyle = color;
      this._context.fill();
    }
  }

  //Draw segment surrounding polygon
  drawSegment(coords, color, stroke=false, segmentation) {
    assertParameters(arguments, Array, String, [Boolean, undefined], Array);
    //console.log(segmentation);
    var imageData = this._context.getImageData(0, 0, this._canvas.width, this._canvas.height);
    var data = imageData.data;
    //very rudimentary version follows TODO: make faster with preprocessing
    var segments = new Set();
    //console.log(coords);
    for (let coord1 of coords) {
      for (let coord2 of coords) {
        for (var i = 0; i <=1; i+= .25) {
           segments.add(segmentation[Math.floor(coord1.y*i + coord2.y*(1-i))][Math.floor(coord1.x*i+coord2.x*(1-i))]);
        }
      }  
    }
    //console.log(segments);
    for (var i = 0; i < canvas.height; i++) {
      for (var j = 0; j < canvas.width; j++) {
        var index = (i * canvas.width + j) * 4;
        if (segments.has(segmentation[i][j])) {
          //highlight segmented area
          data[index] = 0;
        }
      }
    }
    this._context.putImageData(imageData, 0, 0);
  }

  // Draw text centered at coord.
  drawText(coord, text, textAlign, font, color = 'black') {
    assertParameters(
        arguments, Coordinate, String, String, String, [String, undefined]);

    this._context.font = font;
    this._context.fillStyle = color;
    this._context.textAlign = textAlign;
    this._context.textBaseline = 'middle';
    this._context.fillText(text, ...coord);
  }

  // Draw 'img' at 'destCoord', rotated by 'angle', scaled by 'scaleX' and
  // 'scaleY', with origin at 'originCoord'.
  drawImage(img, destCoord, scaleX = 1, scaleY = 1,
      originCoord = new Coordinate(0, 0), angle = 0) {
    assertParameters(
        arguments, HTMLImageElement, Coordinate, [Number, undefined],
        [Number, undefined], [Coordinate, undefined], [Number, undefined]);

    this._context.save();
    this._context.translate(...destCoord);
    this._context.translate(...originCoord);
    this._context.rotate(-angle);
    this._context.drawImage(
        img, ...originCoord.negate(), scaleX * img.width, scaleY * img.height);
    this._context.restore();
  }

  drawImageCropped(img, srcEnvelope, destEnvelope) {
    assertParameters(arguments, HTMLImageElement, Envelope, Envelope);

    this._context.drawImage(img, ...srcEnvelope, ...destEnvelope);
  }

  drawWithOpacity(opacity, drawFn) {
    assertParameters(arguments, Number, Function);

    this._context.globalAlpha = opacity;
    drawFn();
    this._context.globalAlpha = 1.0;
  }

  drawWithShadow(size, color, offset, drawFn) {
    assertParameters(arguments, Number, String, Coordinate, Function);

    this._context.save();
    this._context.shadowBlur = size;
    this._context.shadowColor = color;
    this._context.shadowOffsetX = offset.x;
    this._context.shadowOffsetY = offset.y;
    drawFn();
    this._context.restore();
  }

  getMousePosition(e) {
    assertParameters(arguments, MouseEvent);

    const canvasRect = this._canvas.getBoundingClientRect();
    const x =
        (e.clientX - canvasRect.left) / canvasRect.width *
        this._canvas.width;
    const y =
        (e.clientY - canvasRect.top) / canvasRect.height *
        this._canvas.height;
    return new Coordinate(x, y);
  }

  // Adds to the cursor map a cursor type.
  setCursorFor(owner, cursorType, priority) {
    assertParameters(arguments, Object, String, Number);

    this._cursorMap.set(owner, { priority, cursorType });
    this._updateCursor();
  }

  removeCursorFor(owner) {
    assertParameters(arguments, Object);

    this._cursorMap.delete(owner);
    this._updateCursor();
  }

  // Updates the cursor with the highest priority from the cursor map.
  _updateCursor() {
    let topPriority = 0;
    let topCursorType = Canvas.CURSOR_TYPE.DEFAULT;

    for (let [owner, value] of this._cursorMap) {
      const priority = value.priority;

      if (priority >= topPriority) {
        topPriority = priority;
        topCursorType = value.cursorType;
      }
    }

    this._cursor = topCursorType;
  }

  set _cursor(cursorType) {
    assertParameters(arguments, String);

    this._canvas.style.cursor = cursorType;
  }
}

Canvas.RECTANGLE_TYPE = {
  STROKE: 0,
  FILL: 1
};

Canvas.CURSOR_TYPE = {
  DEFAULT: 'default',
  MOVE: 'move',
  ROTATE: '-webkit-grab',
  ROTATING: '-webkit-grabbing'
};
