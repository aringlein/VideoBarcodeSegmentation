// import 'Coordinate'

/**
 * Represents a (width, height) pair.
 */
class Size {
  constructor(width, height) {
    assertParameters(arguments, Number, Number);

    this._width = width;
    this._height = height;
  }

  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }

  // Returns copy scaled by scale.
  scale(scale) {
    assertParameters(arguments, Number);

    return new Size(this._width * scale, this._height * scale);
  }

  // Converts to Coordinate with (x=width, y=height).
  toCoordinate() {
    assertParameters(arguments);

    return new Coordinate(this._width, this._height);
  }

  toArray() {
    assertParameters(arguments);

    return [this._width, this._height];
  }

  [Symbol.iterator]() {
    return this.toArray()[Symbol.iterator]();
  }
};
