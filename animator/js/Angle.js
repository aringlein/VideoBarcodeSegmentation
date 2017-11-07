// import 'Assert'

/**
 * Represents an angle.
 */
class Angle {
  constructor(magic, radians) {
    assert(arguments, Symbol, Number);

    if (magic !== Angle._MAGIC) {
      assert(false, 'Constructing angle without factory method.')
    }

    // Confine to range between -2pi to 2pi.
    this._radians = Angle.mod(radians + 2 * Math.PI, 4 * Math.PI) - 2 * Math.PI;
  }

  static mod(divisor, dividend) {
    return ((divisor % dividend) + dividend) % dividend;
  }

  static fromRadians(radians) {
    assert(arguments, Number);

    return new Angle(Angle._MAGIC, radians);
  }
  static fromDegrees(degrees) {
    assert(arguments, Number);

    return new Angle(Angle._MAGIC, degrees * Math.PI / 180);
  }

  static diffRadians(target, origin) {
    assert(arguments, Number, Number);

    return Math.atan2(Math.sin(target - origin), Math.cos(target - origin));
  }

  get radians() {
    return this._radians;
  }

  get degrees() {
    return this._radians * 180 / Math.PI;
  }

  rotate(radians) {
    assert(arguments, Number);

    return Angle.fromRadians(this._radians + radians);
  }
};

Angle._MAGIC = Symbol();
