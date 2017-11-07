// import 'Coordinate'
// import 'Size'

/**
 * Represents a rectangular area with a top-left Coordinate and a Size.
 */
class Envelope {
  constructor(topLeft, size) {
    assertParameters(arguments, Coordinate, Size);

    this._topLeft = topLeft;
    this._size = size;
  }

  static fromCoordinates(topLeft, bottomRight) {
    assertParameters(arguments, Coordinate, Coordinate);

    const diff = bottomRight.subtract(topLeft);
    const size = new Size(diff.x, diff.y);
    return new Envelope(topLeft, size);
  }

  get topLeft() {
    return this._topLeft;
  }
  get bottomRight() {
    return this._topLeft.translate(this._size.toCoordinate());
  }
  get topRight() {
    const coord = this._size.toCoordinate();
    coord.y = 0;
    return this._topLeft.translate(coord);
  }
  get bottomLeft() {
    const coord = this._size.toCoordinate();
    coord.x = 0;
    return this._topLeft.translate(coord);
  }
  get center() {
    return this._topLeft.translate(this._size.scale(0.5).toCoordinate());
  }

  get size() {
    return this._size;
  }

  // Returns true if the 'coordinate' is within this Envelope.
  contains(coordinate) {
    assertParameters(arguments, Coordinate);

    const diff = coordinate.subtract(this._topLeft);

    return diff.x >= 0 && diff.y >= 0 &&
        diff.x < this._size.width && diff.y < this._size.height;
  }

  toArray() {
    assertParameters(arguments);

    return [...this._topLeft, ...this._size];
  }

  [Symbol.iterator]() {
    return this.toArray()[Symbol.iterator]();
  }
};
