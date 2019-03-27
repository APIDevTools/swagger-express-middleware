// "use strict";

// const _ = require("lodash");
// const sinon = require("sinon");
// const createMiddleware = require("../../../../lib");
// const { expect } = require("chai");
// const fixtures = require("../../../utils/fixtures");
// const { helper } = require("../../../utils");
// const { initTest } = require("./utils");

// describe.skip("Validate Request middleware - 411 (Length Required)", () => {

//   it("should throw an HTTP 411 error if the Content-Length header is required and is missing", (done) => {
//     let api = _.cloneDeep(fixtures.data.petStore);
//     api.paths["/pets"].post.parameters.push({
//       in: "header",
//       name: "Content-Length",
//       required: true,
//       type: "integer"
//     });

//     createMiddleware(api, (err, middleware) => {
//       let express = helper.express(middleware.metadata(), middleware.parseRequest());

//       helper.supertest(express)
//         .post("/api/pets")
//         .set("content-length", "")
//         .end(helper.checkSpyResults(done));

//       express.use("/api/pets", helper.spy((err, req, res, next) => {
//         expect(err.status).to.equal(411);
//         expect(err.message).to.equal('Missing required header parameter "Content-Length"');
//       }));
//     });
//   });

// });
