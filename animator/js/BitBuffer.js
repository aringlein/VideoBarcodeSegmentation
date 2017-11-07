// import 'Assert'

class BitBuffer {
  constructor(endianness = BitBuffer.ENDIANNESS.BIG) {
    assertParameters(arguments, [Number, undefined]);

    this._endian = endianness;

    this._buffer = [];

    this._readPosition = 0;
  }

  get bits() {
    return this._buffer;
  }

  writeBits(nBits, num) {
    assertParameters(arguments, Number, Number);

    assert(Number.isInteger(num) && num >= 0);

    assert(num < 1 << nBits);

    for (let i = 0; i < nBits; i ++) {
      const bitPosition = this._getStartBit(nBits - i);
      this._buffer.push((num & (1 << bitPosition)) >> bitPosition);
    }
  }

  readBits(nBits) {
    assertParameters(arguments, Number);

    if (nBits > BitBuffer.READ_BITS_MAX) return NaN;

    let num = 0;

    for (let i = 0; i < nBits; i ++) {
      const readPosition = this._readPosition + i;

      const bitPosition = this._getStartBit(nBits - i);
      num |= this._buffer[readPosition] << bitPosition;
    }

    this._readPosition += nBits;

    return num;
  }

  toUint8Array() {
    assertParameters(arguments);

    const size = Math.ceil(this._buffer.length / 8);
    const arr = new Uint8Array(size);

    for (let i = 0; i < size; i ++) {
      arr[i] = this._getUint8(i * 8);
    }

    return arr;
  }

  rewind() {
    this._readPosition = 0;
  }

  [Symbol.iterator]() {
    return this._buffer[Symbol.iterator]();
  }

  get _readDirection() {
    return this._endian == BitBuffer.ENDIANNESS.BIG ? -1 : 1;
  }

  _getUint8(offset) {
    assertParameters(arguments, Number);

    let uint8 = 0;

    for (let i = 0; i < 8; i ++) {
      const bit = this._buffer[offset + i];

      const bitPosition = this._endian == BitBuffer.ENDIANNESS.BIG ? 7 - i : i;

      uint8 |= bit << bitPosition;
    }

    return uint8;
  }

  _getStartBit(nBits) {
    assertParameters(arguments, Number);

    if (this._endian == BitBuffer.ENDIANNESS.LITTLE) return 0;

    return nBits - 1;
  }

  _getEndBit(nBits) {
    assertParameters(arguments, Number);

    return nBits - 1 - this._getStartBit(nBits);
  }
};

BitBuffer.ENDIANNESS = {
  LITTLE: 0,
  BIG: 1
};

BitBuffer.READ_BITS_MAX = 32;
