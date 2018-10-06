/**
 * Test environment config
 */

// Chai plugins
var chai = require('chai');
chai.use(require('chai-datetime'));

// Disable warnings, which clutter the test output
process.env.WARN = 'off';

// Increase test timeouts.
beforeEach(function() {
  // Some of our tests simulate uploading several large files, which takes time.
  // A lot of this time is garbage-collection between requests
  this.currentTest.timeout(15000);

  // Almost all of our tests take ~200 ms, since they're simulating full round-trips
  this.currentTest.slow(2000);
});
