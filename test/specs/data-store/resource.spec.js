"use strict";

const { expect } = require("chai");
const { Resource } = require("../../../");
const helper = require("../../utils/helper");

describe("Resource class", () => {
  describe("constructor", () => {
    it("can be called without any params", () => {
      let resource = new Resource();

      expect(resource.collection).to.equal("");
      expect(resource.name).to.equal("/");
      expect(resource.data).to.be.undefined;
      expect(resource.createdOn).to.be.null;
      expect(resource.modifiedOn).to.be.null;
    });

    it("can be called with just a path", () => {
      let resource = new Resource("/users/jdoe/orders");

      expect(resource.collection).to.equal("/users/jdoe");
      expect(resource.name).to.equal("/orders");
      expect(resource.data).to.be.undefined;
      expect(resource.createdOn).to.be.null;
      expect(resource.modifiedOn).to.be.null;
    });

    it("can be called with a non-string path", () => {
      let resource = new Resource(12345);

      expect(resource.collection).to.equal("");
      expect(resource.name).to.equal("/12345");
      expect(resource.data).to.be.undefined;
      expect(resource.createdOn).to.be.null;
      expect(resource.modifiedOn).to.be.null;
    });

    it("can be called with just a single-depth collection path", () => {
      let resource = new Resource("/users");

      expect(resource.collection).to.equal("");
      expect(resource.name).to.equal("/users");
      expect(resource.data).to.be.undefined;
      expect(resource.createdOn).to.be.null;
      expect(resource.modifiedOn).to.be.null;
    });

    it("can be called with just a single-depth path, with no slash", () => {
      let resource = new Resource("users");

      expect(resource.collection).to.equal("");
      expect(resource.name).to.equal("/users");
      expect(resource.data).to.be.undefined;
      expect(resource.createdOn).to.be.null;
      expect(resource.modifiedOn).to.be.null;
    });

    it("can be called with just a path and data", () => {
      let data = { orderId: 12345 };
      let resource = new Resource("/users/jdoe/orders/12345", data);

      expect(resource.collection).to.equal("/users/jdoe/orders");
      expect(resource.name).to.equal("/12345");
      expect(resource.data).to.equal(data);
      expect(resource.createdOn).to.be.null;
      expect(resource.modifiedOn).to.be.null;
    });

    it("can be called with a non-string path and data", () => {
      let data = { orderId: 12345 };
      let resource = new Resource(12345, data);

      expect(resource.collection).to.equal("");
      expect(resource.name).to.equal("/12345");
      expect(resource.data).to.equal(data);
      expect(resource.createdOn).to.be.null;
      expect(resource.modifiedOn).to.be.null;
    });

    it("can be called with just a path and a Resource", () => {
      let otherResource = new Resource("/foo/bar", { orderId: 12345 });
      let resource = new Resource("/users/jdoe/orders/12345", otherResource);

      expect(resource.collection).to.equal("/users/jdoe/orders");
      expect(resource.name).to.equal("/12345");
      expect(resource.data).to.equal(otherResource.data);
      expect(resource.createdOn).to.be.null;
      expect(resource.modifiedOn).to.be.null;
    });

    it("can be called with a collection path, resource name, and data", () => {
      let data = { orderId: 12345 };
      let resource = new Resource("/users/jdoe/orders", "/12345", data);

      expect(resource.collection).to.equal("/users/jdoe/orders");
      expect(resource.name).to.equal("/12345");
      expect(resource.data).to.equal(data);
      expect(resource.createdOn).to.be.null;
      expect(resource.modifiedOn).to.be.null;
    });

    it("can be called with a non-string collection path, resource name, and data", () => {
      let data = { orderId: 12345 };
      let resource = new Resource(12345, "/67890", data);

      expect(resource.collection).to.equal("/12345");
      expect(resource.name).to.equal("/67890");
      expect(resource.data).to.equal(data);
      expect(resource.createdOn).to.be.null;
      expect(resource.modifiedOn).to.be.null;
    });

    it("can be called with a non-string collection path, non-string resource name, and data", () => {
      let data = { orderId: 12345 };
      let resource = new Resource(12345, 67890, data);

      expect(resource.collection).to.equal("/12345");
      expect(resource.name).to.equal("/67890");
      expect(resource.data).to.equal(data);
      expect(resource.createdOn).to.be.null;
      expect(resource.modifiedOn).to.be.null;
    });

    it("can be called with a collection path, resource name, and a Resource", () => {
      let otherResource = new Resource("/foo/bar", { orderId: 12345 });
      let resource = new Resource("/users/jdoe/orders", "/12345", otherResource);

      expect(resource.collection).to.equal("/users/jdoe/orders");
      expect(resource.name).to.equal("/12345");
      expect(resource.data).to.equal(otherResource.data);
      expect(resource.createdOn).to.be.null;
      expect(resource.modifiedOn).to.be.null;
    });

    it("should throw an error if the resource name contains slashes", () => {
      function throws () {
        new Resource("/users", "/jdoe/orders", "foo");
      }

      expect(throws).to.throw(Error, "Resource names cannot contain slashes");
    });
  });

  describe("merge", () => {
    it("merges data with the resource's existing data", () => {
      let resource = new Resource("/users/JDoe", {
        name: { first: "John", last: "Doe" }
      });

      resource.merge({ name: { first: "Jane", middle: "Alice" }, age: 42 });

      expect(resource.data).to.deep.equal({
        name: { first: "Jane", middle: "Alice", last: "Doe" },
        age: 42
      });
    });

    it("merges a Resource with the resource's existing data", () => {
      let res1 = new Resource("/users/JDoe", {
        name: { first: "John", last: "Doe" }
      });
      let res2 = new Resource("/people/BSmith", {
        name: { first: "Bob" },
        age: 42
      });

      res1.merge(res2);

      expect(res1.collection).to.equal("/users"); // <-- It does NOT merge the collection path
      expect(res1.name).to.equal("/JDoe");        // <-- It does NOT merge the resource name
      expect(res1.data).to.deep.equal({
        name: { first: "Bob", last: "Doe" },      // <-- It DOES merge the data
        age: 42
      });
    });

    it("does not merge objects and arrays", () => {
      let resource = new Resource("/users/JDoe", {
        name: { first: "John", last: "Doe" }
      });

      resource.merge(["a", "b", "c"]);

      expect(resource.data).to.be.an("array");
      expect(resource.data).to.have.same.members(["a", "b", "c"]);
    });

    it("does not merge strings and arrays", () => {
      let resource = new Resource("/users/JDoe", ["a", "b", "c"]);

      resource.merge("hello world");

      expect(resource.data).to.equal("hello world");
    });

    it("replaces the resource's existing data with a number", () => {
      let resource = new Resource("/users/JDoe", {
        name: { first: "John", last: "Doe" }
      });

      resource.merge(12345);

      expect(resource.data).to.be.a("number");
      expect(resource.data).to.deep.equal(12345);
    });

    it("replaces the resource's existing data with a date", () => {
      let resource = new Resource("/users/JDoe", {
        name: { first: "John", last: "Doe" }
      });

      resource.merge(new Date(2000, 1, 2, 3, 4, 5, 6));

      expect(resource.data).to.be.an.instanceOf(Date);
      expect(resource.data).to.equalTime(new Date(2000, 1, 2, 3, 4, 5, 6));
    });

    it("replaces the resource's existing data with undefined", () => {
      let resource = new Resource("/users/JDoe", {
        name: { first: "John", last: "Doe" }
      });

      resource.merge();

      expect(resource.data).to.be.undefined;
    });

    it("replaces the resource's existing data with null", () => {
      let resource = new Resource("/users/JDoe", {
        name: { first: "John", last: "Doe" }
      });

      resource.merge(null);

      expect(resource.data).to.be.null;
    });

    it("replaces undefined resource data with a value", () => {
      let resource = new Resource("/users/JDoe");

      resource.merge({
        name: { first: "John", last: "Doe" }
      });

      expect(resource.data).to.deep.equal({
        name: { first: "John", last: "Doe" }
      });
    });

    it("replaces null resource data with a value", () => {
      let resource = new Resource("/users/JDoe", null);

      resource.merge({
        name: { first: "John", last: "Doe" }
      });

      expect(resource.data).to.deep.equal({
        name: { first: "John", last: "Doe" }
      });
    });

    it("updates the modifiedOn date", () => {
      let before = new Date(Date.now() - 5);  // 5 milliseconds ago
      let resource = new Resource("/users/JDoe");
      resource.createdOn = new Date(2000, 1, 2, 3, 4, 5, 6);
      resource.modifiedOn = new Date(2006, 5, 4, 3, 2, 1, 0);

      resource.merge();

      expect(resource.createdOn).to.equalTime(new Date(2000, 1, 2, 3, 4, 5, 6));
      expect(resource.modifiedOn).not.to.equalTime(new Date(2006, 5, 4, 3, 2, 1, 0));
      expect(resource.modifiedOn).to.be.afterTime(before);
    });
  });

  describe("toString & valueOf (shared logic)", () => {
    let express = helper.express();
    express.enable("strict routing");
    express.enable("case sensitive routing");

    let router = helper.router();
    router.caseSensitive = true;
    router.strict = true;

    // The behavior should be the same for all of these configurations
    let configs = [
      { method: "toString" },
      { method: "valueOf" },
      { method: "valueOf", app: express },
      { method: "valueOf", router }
    ];

    configs.forEach((config) => {
      let signature = config.method + (config.app ? "(express)" : "") + (config.router ? "(router)" : "");
      describe(signature, () => {
        it("should return the a single slash ()", () => {
          let resource = new Resource();
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/");
        });

        it('should return the a single slash ("")', () => {
          let resource = new Resource("");
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/");
        });

        it('should return the a single slash ("", "")', () => {
          let resource = new Resource("", "", undefined);
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/");
        });

        it('should return the a single slash ("/")', () => {
          let resource = new Resource("/");
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/");
        });

        it('should return the a single slash ("/", "")', () => {
          let resource = new Resource("/", "", undefined);
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/");
        });

        it('should return the a single slash ("", "/")', () => {
          let resource = new Resource("", "/", undefined);
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/");
        });

        it('should return the a single slash ("/", "/")', () => {
          let resource = new Resource("", "/", undefined);
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/");
        });

        it('should return the a single slash ("//")', () => {
          let resource = new Resource("/");
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/");
        });

        it('should return the a single slash ("//", "")', () => {
          let resource = new Resource("//", "", undefined);
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/");
        });

        it('should return the a single slash ("", "//")', () => {
          let resource = new Resource("", "//", undefined);
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/");
        });

        it('should return the a single slash ("//", "//")', () => {
          let resource = new Resource("//", "//", undefined);
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/");
        });

        it("should add a leading slash (one param)", () => {
          let resource = new Resource("users/JDoe/orders/");
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/users/JDoe/orders/");
        });

        it("should add a leading slash (two params)", () => {
          let resource = new Resource("users/JDoe", "orders/", undefined);
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/users/JDoe/orders/");
        });

        it("should NOT add a trailing slash (one param)", () => {
          let resource = new Resource("users/JDoe/orders/12345");
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/users/JDoe/orders/12345");
        });

        it("should NOT add a trailing slash (two params)", () => {
          let resource = new Resource("users/JDoe/orders", "12345", undefined);
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/users/JDoe/orders/12345");
        });

        it("should remove redundant slashes between collection and resource name", () => {
          let resource = new Resource("/users/", "/JDoe/", undefined);
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/users/JDoe/");
        });

        it('should return "/users/", even though no resource name is given', () => {
          let resource = new Resource("/users/");
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/users/");
        });

        it('should return "/users/", even though the resource name is blank', () => {
          let resource = new Resource("/users/", "", undefined);
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/users/");
        });

        it('should return "/users/", even though the resource name is blank and the collection doesn\'t have a trailing slash', () => {
          let resource = new Resource("/users", "", undefined);
          let toString = resource[config.method](config.app || config.router);
          expect(toString).to.equal("/users/");
        });
      });
    });
  });

  describe("valueOf (case-insensitive, non-strict)", () => {
    it("should return a case-insensitive, non-strict string", () => {
      let resource = new Resource("/users", "/JDoe/", undefined);
      let express = helper.express();
      let valueOf = resource.valueOf(express);
      expect(valueOf).to.equal("/users/jdoe");    // all-lowercase, no trailing slash
    });

    it("should return a case-sensitive, non-strict string", () => {
      let resource = new Resource("/users", "/JDoe/", undefined);
      let express = helper.express();
      express.enable("case sensitive routing");
      let valueOf = resource.valueOf(express);
      expect(valueOf).to.equal("/users/JDoe");    // no trailing slash
    });

    it("should return a case-insensitive, strict string", () => {
      let resource = new Resource("/users", "/JDoe/", undefined);
      let express = helper.express();
      express.enable("strict routing");
      let valueOf = resource.valueOf(express);
      expect(valueOf).to.equal("/users/jdoe/");    // all-lowercase
    });

    it("should return an empty string", () => {
      let resource = new Resource("/", "//", undefined);
      let express = helper.express();
      let valueOf = resource.valueOf(express);
      expect(valueOf).to.equal("");               // all-lowercase, no trailing slash
    });

    it("should remove the trailing slash from the collection", () => {
      let resource = new Resource("/Users/", "", undefined);
      let express = helper.express();
      let valueOf = resource.valueOf(express);
      expect(valueOf).to.equal("/users");         // all-lowercase, no trailing slash
    });

    it("should remove the trailing slash from the resource name", () => {
      let resource = new Resource("/Users", "/", undefined);
      let express = helper.express();
      let valueOf = resource.valueOf(express);
      expect(valueOf).to.equal("/users");         // all-lowercase, no trailing slash
    });

    it("should remove the trailing slash from the collection and resource name", () => {
      let resource = new Resource("/Users/", "/", undefined);
      let express = helper.express();
      let valueOf = resource.valueOf(express);
      expect(valueOf).to.equal("/users");         // all-lowercase, no trailing slash
    });

    it("should remove the resource name and trailing slash (non-strict)", () => {
      let resource = new Resource("/Users/", "/Jdoe/", undefined);
      let express = helper.express();
      let valueOf = resource.valueOf(express, true);
      expect(valueOf).to.equal("/users");         // all-lowercase, no trailing slash
    });

    it("should remove the resource name and trailing slash (strict)", () => {
      let resource = new Resource("/Users/", "/Jdoe/", undefined);
      let express = helper.express();
      express.enable("strict routing");
      let valueOf = resource.valueOf(express, true);
      expect(valueOf).to.equal("/users");         // all-lowercase, no trailing slash
    });
  });

  describe("normalizeCollection", () => {
    it("should normalize the collection path", () => {
      let resource = new Resource("users/jdoe/orders/", "/12345", undefined);

      expect(resource.collection).to.equal("/users/jdoe/orders");    // added leading slash, removed trailing slash
      expect(resource.name).to.equal("/12345");
    });

    it("should normalize an empty collection path", () => {
      let resource = new Resource("", "/12345", undefined);

      expect(resource.collection).to.equal("");   // empty string = root
      expect(resource.name).to.equal("/12345");
    });

    it("should normalize an empty collection path (after splitting the `collection` parameter)", () => {
      let resource = new Resource("/12345");

      expect(resource.collection).to.equal("");   // empty string = root
      expect(resource.name).to.equal("/12345");
    });

    it("should normalize a single-slash collection path", () => {
      let resource = new Resource("/", "/12345", undefined);

      expect(resource.collection).to.equal("");   // empty string = root
      expect(resource.name).to.equal("/12345");
    });

    it("should normalize a double-slash collection path", () => {
      let resource = new Resource("//", "/12345", undefined);

      expect(resource.collection).to.equal("");   // empty string = root
      expect(resource.name).to.equal("/12345");
    });
  });

  describe("normalizeName", () => {
    it("should normalize the resource names", () => {
      let resource = new Resource("users/jdoe/orders", "12345/", undefined);

      expect(resource.collection).to.equal("/users/jdoe/orders");
      expect(resource.name).to.equal("/12345/");                   // Added leading slash
    });

    it("should normalize an empty resource name", () => {
      let resource = new Resource("", "", undefined);

      expect(resource.collection).to.equal("");    // empty string = root
      expect(resource.name).to.equal("/");         // Added leading slash
    });

    it("should normalize a single-slash resource name", () => {
      let resource = new Resource("/users", "/", undefined);

      expect(resource.collection).to.equal("/users");
      expect(resource.name).to.equal("/");             // good as-is
    });

    it("should normalize a double-slash resource name", () => {
      let resource = new Resource("/users", "//", undefined);

      expect(resource.collection).to.equal("/users");
      expect(resource.name).to.equal("/");             // Removed one of the slashes
    });
  });

  describe("parse", () => {
    it("should initialize all properties from a POJO", () => {
      let data = {
        collection: "/users/jdoe/orders",
        name: "/12345",
        data: { orderId: 12345 },
        createdOn: new Date(1990, 12, 15, 16, 45, 0),
        modifiedOn: new Date(1991, 4, 5, 8, 0, 25)
      };
      let resource = Resource.parse(data);

      expect(resource).to.be.an.instanceOf(Resource);
      expect(resource.collection).to.equal("/users/jdoe/orders");
      expect(resource.name).to.equal("/12345");
      expect(resource.data).to.deep.equal(data.data);         // value equality
      expect(resource.data).not.to.equal(data.data);          // not reference equality
      expect(resource.createdOn).to.equalTime(data.createdOn);
      expect(resource.modifiedOn).to.equalTime(data.modifiedOn);
    });

    it("should initialize all properties from JSON", () => {
      let data = {
        collection: "/users/jdoe/orders",
        name: "/12345",
        data: { orderId: 12345 },
        createdOn: new Date(1990, 12, 15, 16, 45, 0),
        modifiedOn: new Date(1991, 4, 5, 8, 0, 25)
      };
      let resource = Resource.parse(JSON.stringify(data));

      expect(resource).to.be.an.instanceOf(Resource);
      expect(resource.collection).to.equal("/users/jdoe/orders");
      expect(resource.name).to.equal("/12345");
      expect(resource.data).to.deep.equal(data.data);         // value equality
      expect(resource.data).not.to.equal(data.data);          // not reference equality
      expect(resource.createdOn).to.equalTime(data.createdOn);
      expect(resource.modifiedOn).to.equalTime(data.modifiedOn);
    });

    it("should initialize all properties from a POJO array", () => {
      let data = [
        {
          collection: "/users/jdoe/orders",
          name: "/12345",
          data: { orderId: 12345 },
          createdOn: new Date(1990, 12, 15, 16, 45, 0),
          modifiedOn: new Date(1991, 4, 5, 8, 0, 25)
        },
        {
          collection: "",
          name: "/",
          data: "<h1>hello world</h1>",
          createdOn: new Date(),
          modifiedOn: new Date()
        }
      ];
      let resources = Resource.parse(data);

      expect(resources[0]).to.be.an.instanceOf(Resource);
      expect(resources[0].collection).to.equal("/users/jdoe/orders");
      expect(resources[0].name).to.equal("/12345");
      expect(resources[0].data).to.deep.equal(data[0].data);         // value equality
      expect(resources[0].data).not.to.equal(data[0].data);          // not reference equality
      expect(resources[0].createdOn).to.equalTime(data[0].createdOn);
      expect(resources[0].modifiedOn).to.equalTime(data[0].modifiedOn);

      expect(resources[1]).to.be.an.instanceOf(Resource);
      expect(resources[1].collection).to.equal("");
      expect(resources[1].name).to.equal("/");
      expect(resources[1].data).to.be.a("string");                    // type equality (for intrinsic types)
      expect(resources[1].data).to.equal("<h1>hello world</h1>");     // value equality
      expect(resources[1].createdOn).to.equalTime(data[1].createdOn);
      expect(resources[1].modifiedOn).to.equalTime(data[1].modifiedOn);
    });

    it("should initialize all properties from a JSON array", () => {
      let data = [
        {
          collection: "/users/jdoe/orders",
          name: "/12345",
          data: { orderId: 12345 },
          createdOn: new Date(1990, 12, 15, 16, 45, 0),
          modifiedOn: new Date(1991, 4, 5, 8, 0, 25)
        },
        {
          collection: "",
          name: "/",
          data: "<h1>hello world</h1>",
          createdOn: new Date(),
          modifiedOn: new Date()
        }
      ];
      let resources = Resource.parse(JSON.stringify(data));

      expect(resources[0]).to.be.an.instanceOf(Resource);
      expect(resources[0].collection).to.equal("/users/jdoe/orders");
      expect(resources[0].name).to.equal("/12345");
      expect(resources[0].data).to.deep.equal(data[0].data);         // value equality
      expect(resources[0].data).not.to.equal(data[0].data);          // not reference equality
      expect(resources[0].createdOn).to.equalTime(data[0].createdOn);
      expect(resources[0].modifiedOn).to.equalTime(data[0].modifiedOn);

      expect(resources[1]).to.be.an.instanceOf(Resource);
      expect(resources[1].collection).to.equal("");
      expect(resources[1].name).to.equal("/");
      expect(resources[1].data).to.be.a("string");                    // type equality (for intrinsic types)
      expect(resources[1].data).to.equal("<h1>hello world</h1>");     // value equality
      expect(resources[1].createdOn).to.equalTime(data[1].createdOn);
      expect(resources[1].modifiedOn).to.equalTime(data[1].modifiedOn);
    });
  });
});
