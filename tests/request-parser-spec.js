var env = require('./test-environment'),
    fs  = require('fs');

describe('RequestParser middleware', function() {
    'use strict';

    describe('Cookie parser', function() {
        it('should parse unsigned cookies',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Cookie', 'foo=bar; biz=42; baz=j:{"name": "bob", "age": 42}')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.cookies).to.deep.equal({
                        foo: 'bar',
                        biz: '42',
                        baz: {
                            name: 'bob',
                            age: 42
                        }
                    });
                }));
            }
        );

        it('should parse signed cookies if a secret is provided',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest({cookie: {secret: 'abc123'}}));

                env.supertest(express)
                    .post('/foo')
                    .set('Cookie',
                    'foo=s:bar.CKdPoAAwvsKHtjP3qio0u5RrpawK0QNu4BEPo6Q9Xnc; ' +
                    'biz=s:42.RzYBpAY/fBc4SjokJ+OL/53liFsy5rY/Rc8TpTCYkZU; ' +
                    'baz=s:j:{"name": "bob", "age": 42}.B5BBtOd35cgISpDmk10UtZJsUYLsKQ2q0oAHzn4Ui7g')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.signedCookies).to.deep.equal({
                        foo: 'bar',
                        biz: '42',
                        baz: {
                            name: 'bob',
                            age: 42
                        }
                    });
                }));
            }
        );

        it('should not parse signed cookies if no secret is provided',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Cookie',
                    'foo=s:bar.CKdPoAAwvsKHtjP3qio0u5RrpawK0QNu4BEPo6Q9Xnc; ' +
                    'biz=s:42.RzYBpAY/fBc4SjokJ+OL/53liFsy5rY/Rc8TpTCYkZU; ' +
                    'baz=s:j:{"name": "bob", "age": 42}.B5BBtOd35cgISpDmk10UtZJsUYLsKQ2q0oAHzn4Ui7g')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.signedCookies).to.deep.equal({});
                    expect(req.cookies).to.deep.equal({
                        foo: 's:bar.CKdPoAAwvsKHtjP3qio0u5RrpawK0QNu4BEPo6Q9Xnc',
                        biz: 's:42.RzYBpAY/fBc4SjokJ+OL/53liFsy5rY/Rc8TpTCYkZU',
                        baz: 's:j:{"name": "bob", "age": 42}.B5BBtOd35cgISpDmk10UtZJsUYLsKQ2q0oAHzn4Ui7g'
                    });
                }));
            }
        );

        it('should parse signed and unsigned cookies if a secret is provided',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest({cookie: {secret: 'abc123'}}));

                env.supertest(express)
                    .post('/foo')
                    .set('Cookie',
                    'foo=s:bar.CKdPoAAwvsKHtjP3qio0u5RrpawK0QNu4BEPo6Q9Xnc; ' +
                    'biz=42; ' +
                    'bob=Dole; ' +
                    'baz=s:j:{"name": "bob", "age": 42}.B5BBtOd35cgISpDmk10UtZJsUYLsKQ2q0oAHzn4Ui7g')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.cookies).to.deep.equal({
                        biz: '42',
                        bob: 'Dole'
                    });
                    expect(req.signedCookies).to.deep.equal({
                        foo: 'bar',
                        baz: {
                            name: 'bob',
                            age: 42
                        }
                    });
                }));
            }
        );

        it('should not throw an error if the cookie header is invalid',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Cookie', 'not a valid cookie')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.cookies).to.deep.equal({});
                }));
            }
        );

        it('should not throw an error if cookie values are invalid',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Cookie', 'foo=;bar====;;=;++;;;==baz')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.cookies).to.deep.equal({
                        foo: '',
                        bar: '===',
                        '': ''
                    });
                }));
            }
        );

        it('should not throw an error if signed cookies are invalid',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest({cookie: {secret: 'abc123'}}));

                env.supertest(express)
                    .post('/foo')
                    .set('Cookie',
                    'foo=s:bar.CKdPo-INVALID-SIGNATURE-o6Q9Xnc; ' +
                    'biz=s:42.RzY-INVALID-SIGNATURE-ZU; ' +
                    'baz=s:j:{"name": "bob", "age": 42}.B5B-INVALID-SIGNATURE-4Ui7g')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.cookies).to.deep.equal({});
                    expect(req.signedCookies).to.deep.equal({
                        foo: false,
                        biz: false,
                        baz: false
                    });
                }));
            }
        );

    });

    describe('JSON parser', function() {
        it('should parse application/json',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());
                var data = {foo: 'bar', biz: 42, baz: ['A', 'b', 3]};

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'application/json')
                    .send(JSON.stringify(data))
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.deep.equal(data);
                }));
            }
        );

        it('should parse text/json',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());
                var data = {foo: 'bar', biz: 42, baz: ['A', 'b', 3]};

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'text/json')
                    .send(JSON.stringify(data))
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.deep.equal(data);
                }));
            }
        );

        it('should parse application/calendar+json',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());
                var data = {foo: 'bar', biz: 42, baz: ['A', 'b', 3]};

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'application/calendar+json')
                    .send(JSON.stringify(data))
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.deep.equal(data);
                }));
            }
        );

        it('can be modified to accept other content types',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest({
                    json: {type: 'foo/bar'}
                }));
                var data = {foo: 'bar', biz: 42, baz: ['A', 'b', 3]};

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'foo/bar')
                    .send(JSON.stringify(data))
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.deep.equal(data);
                }));
            }
        );

        it('should throw an error if the JSON is malformed',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'application/json')
                    .send('{"foo":"bar",not valid JSON')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    assert(false, 'This middleware should NOT get called');
                }));

                express.use('/foo', env.spy(function(err, req, res, next) {
                    expect(err).to.be.an.instanceOf(SyntaxError);
                    expect(err.status).to.equal(400);
                    expect(err.body).to.equal('{"foo":"bar",not valid JSON');
                }));
            }
        );
    });

    describe('Text parser', function() {
        it('should parse text/plain',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'text/plain')
                    .send('hello world')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.equal('hello world');
                }));
            }
        );

        it('should parse text/css',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'text/css')
                    .send('body: {color: blue;}')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.equal('body: {color: blue;}');
                }));
            }
        );

        it('should parse text/xml',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'text/xml')
                    .send('<root><thing id="foo">bar</thing></root>')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.equal('<root><thing id="foo">bar</thing></root>');
                }));
            }
        );

        it('can be modified to accept other content types',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest({
                    text: {type: 'foo/bar'}
                }));

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'foo/bar')
                    .send('hello world')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.equal('hello world');
                }));
            }
        );
    });

    describe('URL-encoded parser', function() {
        it('should parse encoded data',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send('foo=bar&biz=42&biz=43&biz=44&baz[5]=A&baz[0]=B&baz[2]=C&bob[name]=bob&bob[age]=42')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.deep.equal({
                        foo: 'bar',
                        biz: ['42', '43', '44'],
                        baz: ['B', 'C', 'A'],
                        bob: {
                            name: 'bob',
                            age: '42'
                        }
                    });
                }));
            }
        );

        it('can be modified to accept other content types',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest({
                    urlencoded: {type: 'foo/bar'}
                }));

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'foo/bar')
                    .send('foo=bar&biz=42&biz=43&biz=44&baz[5]=A&baz[0]=B&baz[2]=C&bob[name]=bob&bob[age]=42')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.deep.equal({
                        foo: 'bar',
                        biz: ['42', '43', '44'],
                        baz: ['B', 'C', 'A'],
                        bob: {
                            name: 'bob',
                            age: '42'
                        }
                    });
                }));
            }
        );

        it('should not throw an error if the data is malformed',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send('foo&bar===&&&=&++&&==baz')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.deep.equal({
                        '  ': '',
                        bar: '==',
                        foo: ''
                    });
                }));
            }
        );

    });

    describe('Raw parser', function() {
        it('should parse plain text as a Buffer',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'application/octet-stream')
                    .send('hello world')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.be.an.instanceOf(Buffer);
                    expect(req.body.toString()).to.equal('hello world');
                }));
            }
        );

        it('should parse binary data as a Buffer',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());
                var buffer = fs.readFileSync(env.files.oneMB);

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'application/octet-stream')
                    .set('Content-Length', buffer.length)
                    .send(buffer)
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.deep.equal(buffer);
                }));
            }
        );

        it('should parse application/xml as a Buffer',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'application/xml')
                    .send('<root><thing id="foo">bar</thing></root>')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.be.an.instanceOf(Buffer);
                    expect(req.body.toString()).to.equal('<root><thing id="foo">bar</thing></root>');
                }));
            }
        );

        it('should parse application/soap+xml as a Buffer',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'application/soap+xml')
                    .send('<envelope><message id="foo">bar</message></envelope>')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.be.an.instanceOf(Buffer);
                    expect(req.body.toString()).to.equal('<envelope><message id="foo">bar</message></envelope>');
                }));
            }
        );

        it('should support large files (up to 5MB) by default',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());
                var buffer = fs.readFileSync(env.files.fiveMB);

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'application/octet-stream')
                    .set('Content-Length', buffer.length)
                    .send(buffer)
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    var MB = 1024 * 1024;
                    expect(req.body.length).to.be.above(4 * MB).and.below(5 * MB);
                    expect(req.body).to.deep.equal(buffer);
                }));
            }
        );

        it('should not support files larger than 5MB by default',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());
                var buffer = fs.readFileSync(env.files.sixMB);

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'application/octet-stream')
                    .set('Content-Length', buffer.length)
                    .send(buffer)
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    assert(false, 'This middleware should not get called');
                }));

                express.use('/foo', env.spy(function(err, req, res, next) {
                    expect(err).to.be.an.instanceOf(Error);
                    expect(err.status).to.equal(413);
                    expect(err.message).to.equal('request entity too large');
                }));
            }
        );

        it('should support files larger than 5MB if configured to',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest({
                    raw: {limit: '6mb'}
                }));
                var buffer = fs.readFileSync(env.files.sixMB);

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'application/octet-stream')
                    .set('Content-Length', buffer.length)
                    .send(buffer)
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    var MB = 1024 * 1024;
                    expect(req.body.length).to.be.above(5 * MB).and.below(6 * MB);
                    expect(req.body).to.deep.equal(buffer);
                }));
            }
        );

        it('can be modified to accept other content types',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest({
                    raw: {type: 'foo/bar'}
                }));

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'foo/bar')
                    .send('hello world')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.be.an.instanceOf(Buffer);
                    expect(req.body.toString()).to.equal('hello world');
                }));
            }
        );
    });

    describe('Multipart form data parser', function() {
        it('should parse simple fields',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'multipart/form-data')
                    .field('foo', 'bar')
                    .field('biz', '42')
                    .field('biz', '43')
                    .field('biz', '44')
                    .field('baz[5]', 'A')
                    .field('baz[0]', 'B')
                    .field('baz[2]', 'C')
                    .field('bob[name]', 'bob')
                    .field('bob[age]', '42')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.deep.equal({
                        foo: 'bar',
                        biz: ['42', '43', '44'],
                        baz: ['B', 'C', 'A'],
                        bob: {
                            name: 'bob',
                            age: '42'
                        }
                    });
                }));
            }
        );

        it('should parse file attachments',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'multipart/form-data')
                    .attach('file1', env.files.oneMB, '1MB.jpg')
                    .attach('file2', env.files.oneMB, '1MB.xyz')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.deep.equal({});
                    expect(req.files).to.deep.equal({
                        "file1": {
                            buffer: null,
                            encoding: "7bit",
                            extension: "jpg",
                            fieldname: "file1",
                            mimetype: "image/jpeg",
                            name: req.files.file1.name,
                            originalname: "1MB.jpg",
                            path: req.files.file1.path,
                            size: 683709,
                            truncated: false
                        },
                        "file2": {
                            buffer: null,
                            encoding: "7bit",
                            extension: "jpg",
                            fieldname: "file2",
                            mimetype: "image/jpeg",
                            name: req.files.file2.name,
                            originalname: "1MB.jpg",
                            path: req.files.file2.path,
                            size: 683709,
                            truncated: false
                        }
                    });
                }));
            }
        );

        it('should parse a mix of fields and file attachments',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'multipart/form-data')
                    .attach('file1', env.files.oneMB, '1MB.jpg')
                    .field('foo', 'bar')
                    .field('biz', '42')
                    .field('biz', '43')
                    .field('biz', '44')
                    .attach('file2', env.files.oneMB, '1MB.xyz')
                    .field('baz[5]', 'A')
                    .field('baz[0]', 'B')
                    .field('baz[2]', 'C')
                    .field('bob[name]', 'bob')
                    .field('bob[age]', '42')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.deep.equal({
                        foo: 'bar',
                        biz: ['42', '43', '44'],
                        baz: ['B', 'C', 'A'],
                        bob: {
                            name: 'bob',
                            age: '42'
                        }
                    });
                    expect(req.files).to.deep.equal({
                        "file1": {
                            buffer: null,
                            encoding: "7bit",
                            extension: "jpg",
                            fieldname: "file1",
                            mimetype: "image/jpeg",
                            name: req.files.file1.name,
                            originalname: "1MB.jpg",
                            path: req.files.file1.path,
                            size: 683709,
                            truncated: false
                        },
                        "file2": {
                            buffer: null,
                            encoding: "7bit",
                            extension: "jpg",
                            fieldname: "file2",
                            mimetype: "image/jpeg",
                            name: req.files.file2.name,
                            originalname: "1MB.jpg",
                            path: req.files.file2.path,
                            size: 683709,
                            truncated: false
                        }
                    });
                }));
            }
        );

        it('should support large file attachments by default',
            function(done) {
                var middleware = env.swagger(env.parsed.petStore);
                var express = env.express(middleware.parseRequest());

                env.supertest(express)
                    .post('/foo')
                    .set('Content-Type', 'multipart/form-data')
                    .attach('file1', env.files.oneMB, '1MB.jpg')
                    .attach('file2', env.files.fiveMB, '5MB.jpg')
                    .attach('file3', env.files.sixMB, '6MB.jpg')
                    .end(env.checkSpyResults(done));

                express.post('/foo', env.spy(function(req, res, next) {
                    expect(req.body).to.deep.equal({});
                    expect(req.files).to.deep.equal({
                        "file1": {
                            buffer: null,
                            encoding: "7bit",
                            extension: "jpg",
                            fieldname: "file1",
                            mimetype: "image/jpeg",
                            name: req.files.file1.name,
                            originalname: "1MB.jpg",
                            path: req.files.file1.path,
                            size: 683709,
                            truncated: false
                        },
                        "file2": {
                            buffer: null,
                            encoding: "7bit",
                            extension: "jpg",
                            fieldname: "file2",
                            mimetype: "image/jpeg",
                            name: req.files.file2.name,
                            originalname: "5MB.jpg",
                            path: req.files.file2.path,
                            size: 4573123,
                            truncated: false
                        },
                        "file3": {
                            buffer: null,
                            encoding: "7bit",
                            extension: "jpg",
                            fieldname: "file3",
                            mimetype: "image/jpeg",
                            name: req.files.file3.name,
                            originalname: "6MB.jpg",
                            path: req.files.file3.path,
                            size: 5595095,
                            truncated: false
                        }
                    });
                }));
            }
        );
    });
});
