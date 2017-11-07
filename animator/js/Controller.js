// import 'Assert'
// import 'Canvas'
// import 'DrawTimer'
// import 'FrameInterface'
// import 'Events'

/**
 * Controls the state of the game.
 */
class Controller {
  constructor() {
    assertParameters(arguments);

    this.state = new Controller.InitializingState();

    // Attach even handlers.
    Events.on(DrawTimer.EVENT_TYPES.STEP, this._step, this, 0);
  }

  set state(newState) {
    assertParameters(arguments, Controller.State);

    if (this._state) this._state.finish();
    this._state = newState;
    newState.controller = this;
  }

  get frameModel() {
    return this._frameModel;
  }

  _step() {
    assertParameters(arguments);

    this._state.step();
  }
};

Controller.STATES = {
  INITIALIZING: 0,
  READY: 1,
  POLYGON_EDITING: 2,
};

/**
 * Represents a state of the Controller.
 * Extend this class to implement new states.
 *  step - runs every draw step.
 *  finish - runs when the state is changed.
 *  _controllerReady - runs when the state is attached to the Controller.
 */
Controller.State = class {
  constructor(type) {
    assertParameters(arguments, Controller.STATES);

    this._type = type;
  }

  get type() {
    return this._type;
  }

  set controller(controller) {
    assertParameters(arguments, Controller);

    this._controller = controller;

    this._controllerReady();
  }

  step() {
    assertParameters(arguments);

    // Do nothing by default.
  }

  finish() {
    assertParameters(arguments);

    // Do nothing by default.
  }

  _controllerReady() {
    assertParameters(arguments);

    // Do nothing by default.
  }
};

/**
 * Represents the INITIALIZING state.
 */
Controller.InitializingState = class extends Controller.State {
  constructor() {
    assertParameters(arguments);

    super(Controller.STATES.INITIALIZING);
  }

  finish() {
    assertParameters(arguments);

    Events.off(FrameInterface.EVENT_TYPES.READY, this);
  }

  _controllerReady() {
    assertParameters(arguments);

    // Create the frame interface and wait for initialization.
    new FrameInterface(this._controller);

    Events.on(FrameInterface.EVENT_TYPES.READY, this._gotoReady, this);
  }

  _gotoReady() {
    this._controller.state = new Controller.ReadyState();
  }
};

/**
 * Represents the READY state.
 */
Controller.ReadyState = class extends Controller.State {
  constructor() {
    assertParameters(arguments);

    super(Controller.STATES.READY);
  }

  finish() {
    assertParameters(arguments);

    Events.off(FrameInterface.EVENT_TYPES.ADD_POLYGON, this);
  }

  _controllerReady() {
    assertParameters(arguments);

    // Events.on(FrameInterface.EVENT_TYPES.ADD_POLYGON, this._addPolygon, this);
  }

  _addPolygon() {
    assertParameters(arguments);

    // this._controller.state = new Controller.PolygonEditingState();
  }
};

// /**
//  * Represents the POLYGON_EDITING state.
//  */
// Controller.PolygonEditingState = class extends Controller.State {
//   constructor() {
//     assertParameters(arguments);

//     super(Controller.STATES.POLYGON_EDITING);
//   }

//   finish() {
//   }

//   _controllerReady() {
//     assertParameters(arguments);
//   }
// };
