function assert(expression, errMsg) {
  if (!expression) {
    throw errMsg;
  }
}

function assertEq(val1, val2) {
  assert(val1 == val2, 'fatal error: equality failed');
}

function assertType(variable, type) {
  if (!(variable instanceof type)) {
    throw new ParameterError(Parameter);
  }
}

function assertUnimplemented() {
  assert(false, 'fatal error: unimplemented function');
}

// Checks the parameters to see if it matches the types.
// Usage example:
//  assertParameters(
//          arguments, String, Number, {a: 1, b: 2}, Array, [Number, undefined],
//          [String, undefined], undefined)
//   Checks that the first argument is a String, second is a Number, third is
//   one of the values [1, 2], etc., and that the last two checked arguments are
//   optional, but if present, should be a Number, String. The 'undefined' at
//   the end means there can be any number of optional arguments that follow.
// Note that optional parameters can only be at the end of the parameter list.
function assertParameters(params, ...types) {
  const paramGen = Array.from(params)[Symbol.iterator]();
  const typeGen = types[Symbol.iterator]();

  while (true) {
    const paramNext = paramGen.next();
    const typeNext = typeGen.next();

    // If both types and params are done, we are done.
    if (typeNext.done && paramNext.done) break;

    // If no more types, but still has more params, then we have a length
    // mismatch.
    if (typeNext.done && !paramNext.done) {
      throw ParameterErrorFactory.LengthMismatch();
    }

    const type = typeNext.value;
    let types = [type];

    if (type === undefined) break;

    if (type.constructor === Array) {
      // For optional parameters, if the type is an array and we have no more
      // parameters, we are done.
      if (paramNext.done && type.includes(undefined)) break;
      else types = type;
    } else {
      // If no more params, but still has types, then we have a length mismatch.
      if (paramNext.done && !typeNext.done) {
        throw ParameterErrorFactory.LengthMismatch();
      }
    }

    const param = paramNext.value;

    // Check type matching of each type with the param.
    let good = false;
    for (let type of types) {
      if (matches(param, type)) good = true;
    }
    if (!good) throw ParameterErrorFactory.TypeMismatch(param, types);
  }

  function matches(param, type) {
    if (type === undefined) return true;
    if (param === undefined) return false;
    if (type === null) return param === null;

    if (type.constructor === Object) {
      for (let key in type) {
        if (param === type[key]) return true;
      }
      return false;
    }

    switch (type) {
    case Object:
      return (param instanceof Object) && param.constructor !== Object;
      break;
    case Boolean:
    case Number:
    case String:
    case Array:
    case Function:
      return param.constructor === type;
      break;
    default:
      if (typeof type === 'function') {
        return param instanceof type;
      }
      return undefined;
    }

    return false;
  }
}

class ParameterError extends TypeError {
  constructor(errMsg) {
    super(errMsg);
  }
};


class ParameterErrorFactory {
  static _Info(type, info = '') {
    const errMsg = type + ': ' + info;

    return new ParameterError(errMsg);
  }

  static TypeMismatch(param, types) {
    const info = param + ' is not ' + types;

    return ParameterErrorFactory._Info(
        ParameterErrorFactory.TYPES.TYPE_MISMATCH, info);
  }

  static LengthMismatch() {
    return new ParameterError(ParameterErrorFactory.TYPES.LENGTH_MISMATCH);
  }
};

ParameterErrorFactory.TYPES = {
  LENGTH_MISMATCH: 'parameter length mismatch',
  TYPE_MISMATCH: 'parameter type mismatch'
};
