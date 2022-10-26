"use strict";

const { Heap } = require("heap-js");
const EventEmitter = require("events");
const dateComparator = require("./date-comparator");

const fetchLogsAsync = (buffer) => {
  const { source, logPool, emitter } = buffer;

  source.popAsync().then((log) => {
    if (log !== false) fetchLogsAsync(buffer);
    logPool.push(log);
    emitter.emit("ready");
  });
};

const bufferMapper = async (source) => {
  const lastLog = await source.popAsync();
  const logPool = [];

  return {
    lastLog,
    logPool,
    source,
    emitter: new EventEmitter(),
  };
};

// Print all entries, across all of the *async* sources, in chronological order.

module.exports = async (logSources, printer) => {
  const logsBuffer = await Promise.all(logSources.map(bufferMapper));
  const queue = new Heap(dateComparator);

  // Populate heap with buffers
  queue.init(logsBuffer);

  // Pull logs async into the pull, recursively
  logsBuffer.forEach(fetchLogsAsync);

  while (queue.length > 0) {
    const topBuffer = queue.top(1)[0];
    printer.print(topBuffer.lastLog);

    // If there is no log in the pool, wait for it to be pushed
    if (topBuffer.logPool.length === 0) {
      await new Promise((resolve) => topBuffer.emitter.once("ready", resolve));
    }

    topBuffer.lastLog = topBuffer.logPool.shift();

    if (topBuffer.lastLog === false) {
      // Remove buffer with empty source
      queue.pop();
    } else {
      // Update buffer and re-heeap
      queue.replace(topBuffer);
    }
  }
  printer.done();
  return console.log("Async sort complete.");
};
