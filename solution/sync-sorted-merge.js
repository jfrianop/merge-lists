"use strict";
const { Heap } = require("heap-js");
const dateComparator = require("./date-comparator");

// Print all entries, across all of the sources, in chronological order.

module.exports = (logSources, printer) => {
  const logsBuffer = logSources.map((source) => {
    return {
      lastLog: source.pop(),
      source,
    };
  });

  const queue = new Heap(dateComparator);

  // Populate heap with sources
  queue.init(logsBuffer);

  while (queue.length > 0) {
    // Pick and print older log
    const topSource = queue.top(1)[0];
    printer.print(topSource.lastLog);

    // Grab next log from source
    topSource.lastLog = topSource.source.pop();

    // If source is drained remove buffer from heap
    if (topSource.lastLog === false) {
      queue.pop();
    } else {
      queue.replace(topSource);
    }
  }
  printer.done();
  return console.log("Sync sort complete.");
};
