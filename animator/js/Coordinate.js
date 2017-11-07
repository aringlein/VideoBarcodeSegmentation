// import 'Assert'

/**
 * Represents an (x,y) coordinate.
 */
class Coordinate {
  constructor(x, y) {
    assertParameters(arguments, Number, Number);

    this._x = x;
    this._y = y;
  }

  static interpolate(coord1, coord2, scale) {
    assertParameters(arguments, Coordinate, Coordinate, Number);

    return coord1.translate(coord2.subtract(coord1).scale(scale));
  }

  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
  set x(x) {
    assertParameters(arguments, Number);

    this._x = x;
  }
  set y(y) {
    assertParameters(arguments, Number);

    this._y = y;
  }

  get magnitude() {
    return Math.sqrt(this._x * this._x + this._y * this._y);
  }
  get angle() {
    return Math.atan2(this._y, this._x);
  }

  negate() {
    return new Coordinate(-this._x, -this._y);
  }

  // Calculate distance to 'other' Coordinate.
  distanceTo(other) {
    assertParameters(arguments, Coordinate);

    const xDiff = this._x - other.x;
    const yDiff = this._y - other.y;
    return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  }

  // Calculate angle to 'other' Coordinate.
  angleTo(other) {
    assertParameters(arguments, Coordinate);

    const yDiff = this._y - other.y;
    const xDiff = other.x - this._x;
    return Math.atan2(yDiff, xDiff) + 2 * Math.PI;
  }

  // Returns copy translated by 'other'.
  translate(other) {
    assertParameters(arguments, Coordinate);

    return new Coordinate(this._x + other.x, this._y + other.y);
  }

  // Returns copy translated by vector with 'angle' and 'magnitude'.
  translateVector(angle, magnitude) {
    assertParameters(arguments, Number, Number);

    return new Coordinate(
        this._x + magnitude * Math.cos(angle),
        this._y + magnitude * Math.sin(angle));
  }

  // Returns copy subtracted by 'other'.
  subtract(other) {
    assertParameters(arguments, Coordinate);

    return new Coordinate(this._x - other.x, this._y - other.y);
  }

  // Returns copy scaled by 'magnitude'.
  scale(magnitudeX, magnitudeY = magnitudeX) {
    assertParameters(arguments, Number, [Number, undefined]);

    return new Coordinate(this._x * magnitudeX, this._y * magnitudeY);
  }

  // Returns copy rotated by 'radians' about the origin.
  rotate(radians) {
    assertParameters(arguments, Number);

    const magnitude = this.magnitude;
    const angle = this.angle + radians;

    return (new Coordinate(0, 0)).translateVector(angle, magnitude);
  }

  // Returns true if coordinate is within rectangle defined by the two
  // coordinates as corners.
  isWithin(coord1, coord2) {
    assertParameters(arguments, Coordinate, Coordinate);

    const minX = Math.min(coord1.x, coord2.x);
    const minY = Math.min(coord1.y, coord2.y);
    const maxX = Math.max(coord1.x, coord2.x);
    const maxY = Math.max(coord1.y, coord2.y);

    const isIn = this._x >= minX && this._x <= maxX && this._y >= minY &&
        this._y <= maxY;
    return isIn;
  }

  // Returns the coordinate moved to be within the rectangle.
  moveWithin(coord1, coord2) {
    assertParameters(arguments, Coordinate, Coordinate);

    const minX = Math.min(coord1.x, coord2.x);
    const minY = Math.min(coord1.y, coord2.y);
    const maxX = Math.max(coord1.x, coord2.x);
    const maxY = Math.max(coord1.y, coord2.y);

    const x = Math.min(maxX, Math.max(minX, this._x));
    const y = Math.min(maxY, Math.max(minY, this._y));

    return new Coordinate(x, y);
  }

  toArray() {
    assertParameters(arguments);

    return [this._x, this._y];
  }

  [Symbol.iterator]() {
    return this.toArray()[Symbol.iterator]();
  }
};
