// import 'Assert'
// import 'PriorityQueue'

/**
 * An event dispatcher that redirects events with data.
 */
class Events {
  // Attach 'handler' to be called when event of type 'eventType' is received.
  // The handler is called with this as 'owner'.
  // Handlers are called in the priority-order (lowest first), then insertion
  // order.
  static on(eventType, handler, owner, priority = 1) {
    assertParameters(arguments, String, Function, Object, [Number, undefined]);

    // Create a new priority queue from owner to handlers if the eventType is new.
    if (!(eventType in Events._events)) {
      Events._events[eventType] = new PriorityQueue();
    }

    const eventQueue = Events._events[eventType];

    // Create a new handler list for a new priority, owner.
    if (!eventQueue.has(priority, owner)) {
      eventQueue.push(priority, owner, []);
    }
    // Add the handler to the owner's handler list.
    eventQueue.get(priority, owner).push(handler);
  }

  // Detach any handlers from event of type 'eventType' for 'owner'.
  static off(eventType, owner = null) {
    assertParameters(arguments, String, [Object, undefined]);

    if (owner === null) {
      delete Events._events[eventType];
    } else {
      if (!(eventType in Events._events)) return;

      Events._events[eventType].removeKey(owner);
    }
  }

  // Dispatch an event with type 'eventType' containing data '...data'.
  static dispatch(eventType, ...data) {
    assertParameters(arguments, undefined);

    if (!(eventType in Events._events)) return;

    const ownerHandlersPQ = Events._events[eventType];
    for (let keyValue of ownerHandlersPQ) {
      const owner = keyValue.key;
      const handlers = keyValue.value;
      for (let handler of handlers) {
        handler.call(owner, ...data);
      }
    }
  }

  // Returns true if there are no events associated with 'owner'.
  static hasNoneForOwner(owner) {
    assertParameters(arguments, Object);

    for (let eventQueue of Object.values(Events._events)) {
      if (eventQueue.hasKey(owner)) return false;
    }

    return true;
  }
}

// Holds the dictionary of events.
// Key is the event type, value is the array of handlers.
Events._events = {};
