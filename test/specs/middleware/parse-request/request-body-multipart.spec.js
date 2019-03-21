"use strict";

const createMiddleware = require("../../../../lib");
const { expect } = require("chai");
const fixtures = require("../../../utils/fixtures");
const { helper } = require("../../../utils");

describe("Parse Request middleware - request body (multipart/form-data)", () => {
  it("should parse simple fields", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "multipart/form-data")
        .field("foo", "bar")
        .field("biz", "42")
        .field("biz", "43")
        .field("biz", "44")
        .field("baz[5]", "A")
        .field("baz[0]", "B")
        .field("baz[2]", "C")
        .field("bob[name]", "bob")
        .field("bob[age]", "42")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({
          foo: "bar",
          biz: ["42", "43", "44"],
          baz: ["B", undefined, "C", undefined, undefined, "A"],
          bob: {
            name: "bob",
            age: "42"
          }
        });
      }));
    });
  });

  it("should parse file attachments", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "multipart/form-data")
        .attach("file1", fixtures.paths.oneMB, "1MB.jpg")
        .attach("file2", fixtures.paths.oneMB, "MyFile.foobar")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({});
        expect(req.files).to.deep.equal({
          file1: [{
            encoding: "7bit",
            fieldname: "file1",
            mimetype: "image/jpeg",
            filename: req.files.file1[0].filename,
            originalname: "1MB.jpg",
            path: req.files.file1[0].path,
            destination: req.files.file1[0].destination,
            size: 683709,
          }],
          file2: [{
            encoding: "7bit",
            fieldname: "file2",
            mimetype: "image/jpeg",
            filename: req.files.file2[0].filename,
            originalname: "MyFile.foobar",
            path: req.files.file2[0].path,
            destination: req.files.file2[0].destination,
            size: 683709,
          }]
        });
      }));
    });
  });

  it("should parse a mix of fields and file attachments", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "multipart/form-data")
        .attach("file1", fixtures.paths.oneMB, "1MB.jpg")
        .field("foo", "bar")
        .attach("file2", fixtures.paths.oneMB, "MyFile.foobar")
        .field("biz", "42")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({
          foo: "bar",
          biz: "42"
        });
        expect(req.files).to.deep.equal({
          file1: [{
            encoding: "7bit",
            fieldname: "file1",
            mimetype: "image/jpeg",
            filename: req.files.file1[0].filename,
            originalname: "1MB.jpg",
            path: req.files.file1[0].path,
            destination: req.files.file1[0].destination,
            size: 683709,
          }],
          file2: [{
            encoding: "7bit",
            fieldname: "file2",
            mimetype: "image/jpeg",
            filename: req.files.file2[0].filename,
            originalname: "MyFile.foobar",
            path: req.files.file2[0].path,
            destination: req.files.file2[0].destination,
            size: 683709,
          }]
        });
      }));
    });
  });

  it("should support large file attachments by default", (done) => {
    createMiddleware(fixtures.data.petStore, (err, middleware) => {
      let express = helper.express(middleware.parseRequest());

      helper.supertest(express)
        .post("/foo")
        .set("Content-Type", "multipart/form-data")
        .attach("file1", fixtures.paths.oneMB, "1MB.jpg")
        .attach("file2", fixtures.paths.fiveMB, "5MB.jpg")
        .attach("file3", fixtures.paths.sixMB, "6MB.jpg")
        .end(helper.checkSpyResults(done));

      express.post("/foo", helper.spy((req, res, next) => {
        expect(req.body).to.deep.equal({});
        expect(req.files).to.deep.equal({
          file1: [{
            encoding: "7bit",
            fieldname: "file1",
            mimetype: "image/jpeg",
            filename: req.files.file1[0].filename,
            originalname: "1MB.jpg",
            path: req.files.file1[0].path,
            destination: req.files.file1[0].destination,
            size: 683709,
          }],
          file2: [{
            encoding: "7bit",
            fieldname: "file2",
            mimetype: "image/jpeg",
            filename: req.files.file2[0].filename,
            originalname: "5MB.jpg",
            path: req.files.file2[0].path,
            destination: req.files.file2[0].destination,
            size: 4573123,
          }],
          file3: [{
            encoding: "7bit",
            fieldname: "file3",
            mimetype: "image/jpeg",
            filename: req.files.file3[0].filename,
            originalname: "6MB.jpg",
            path: req.files.file3[0].path,
            destination: req.files.file3[0].destination,
            size: 5595095,
          }]
        });
      }));
    });
  });
});
