"use strict";

// 0.10.x versions of Node serialize Buffers as arrays instead of objects
if (process.version.substring(0, 6) === "v0.10.") {
  Buffer.prototype.toJSON = function () {
    return {
      type: "Buffer",
      data: Array.prototype.slice.call(this, 0)
    };
  };
}
