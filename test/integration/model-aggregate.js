var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model.aggregate()", function() {
    var db = null;
    var Person = null;

    var setup = function() {
        return function() {
            Person = db.define("person", {
                name: String
            });

            helper.dropSync(Person, function() {
                Person.createSync([{
                    id: 1,
                    name: "John Doe"
                }, {
                    id: 2,
                    name: "Jane Doe"
                }, {
                    id: 3,
                    name: "John Doe"
                }]);
            });
        };
    };

    before(function() {
        db = helper.connect();
    });

    after(function() {
        return db.closeSync();
    });

    xdescribe("with multiple methods", function() {
        before(setup());

        it("should return value for everyone of them", function() {
            Person.aggregate().count('id').min('id').max('id').get(function(err, count, min, max) {
                assert.equal(err, null);

                assert.equal(count, 3);
                assert.equal(min, 1);
                assert.equal(max, 3);
            });
        });
    });

    describe("with call()", function() {
        before(setup());

        it("should accept a function", function() {
            var count = Person.aggregate().call('COUNT').getSync();
            assert.equal(count, 3);
        });

        it("should accept arguments to the funciton as an Array", function() {
            var count = Person.aggregate().call('COUNT', ['id']).getSync();
            assert.equal(count, 3);
        });

        describe("if function is DISTINCT", function() {
            it("should work as calling .distinct() directly", function() {
                var rows = Person.aggregate().call('DISTINCT', ['name']).as('name').order('name').getSync();

                assert.ok(Array.isArray(rows));
                assert.equal(rows.length, 2);

                assert.equal(rows[0], 'Jane Doe');
                assert.equal(rows[1], 'John Doe');
            });
        });
    });

    xdescribe("with as() without previous aggregates", function() {
        before(setup());

        it("should throw", function() {
            Person.aggregate().as.should.throw();
        });
    });

    xdescribe("with select() without arguments", function() {
        before(setup());

        it("should throw", function(done) {
            Person.aggregate().select.should.throw();

            return done();
        });
    });

    describe("with select() with arguments", function() {
        before(setup());

        it("should use them as properties if 1st argument is Array", function() {
            var people = Person.aggregate().select(['id']).count('id').groupBy('id').getSync();

            assert.ok(Array.isArray(people));
            assert.greaterThan(people.length, 0);

            assert.isObject(people[0]);
            assert.property(people[0], "id");
            assert.notProperty(people[0], "name");
        });

        it("should use them as properties", function() {
            var people = Person.aggregate().select('id').count().groupBy('id').getSync();
            assert.ok(Array.isArray(people));
            assert.greaterThan(people.length, 0);

            assert.isObject(people[0]);
            assert.property(people[0], "id");
            assert.notProperty(people[0], "name");
        });
    });

    xdescribe("with get() without callback", function() {
        before(setup());

        it("should throw", function(done) {
            Person.aggregate().count('id').get.should.throw();

            return done();
        });
    });

    describe("with get() without aggregates", function() {
        before(setup());

        it("should throw", function() {
            assert.throws(function() {
                Person.aggregate().get(function() {});
            });
        });
    });

    describe("with distinct()", function() {
        before(setup());

        it("should return a list of distinct properties", function() {
            var names = Person.aggregate().distinct('name').getSync();
            assert.isObject(names);
            assert.property(names, "length", 2);
        });

        describe("with limit(1)", function() {
            it("should return only one value", function() {
                var names = Person.aggregate().distinct('name').limit(1).order("name").getSync();
                assert.isObject(names);
                assert.property(names, "length", 1);
                assert.equal(names[0], "Jane Doe");
            });
        });

        describe("with limit(1, 1)", function() {
            it("should return only one value", function() {
                var names = Person.aggregate().distinct('name').limit(1, 1).order("name").getSync();
                assert.isObject(names);
                assert.property(names, "length", 1);
                assert.equal(names[0], "John Doe");
            });
        });
    });

    describe("with groupBy()", function() {
        before(setup());

        it("should return items grouped by property", function() {
            var rows = Person.aggregate().count().groupBy('name').getSync();
            assert.isObject(rows);
            assert.property(rows, "length", 2);

            assert.equal((rows[0].count + rows[1].count), 3); // 1 + 2
        });

        describe("with order()", function() {
            before(setup());

            it("should order items", function() {
                var rows = Person.aggregate().count().groupBy('name').order('-count').getSync();
                assert.isObject(rows);
                assert.property(rows, "length", 2);

                assert.equal(rows[0].count, 2);
                assert.equal(rows[1].count, 1);
            });
        });
    });

    describe("using as()", function() {
        before(setup());

        it("should use as an alias", function() {
            var people = Person.aggregate().count().as('total').groupBy('name').getSync();
            assert.ok(Array.isArray(people));
            assert.greaterThan(people.length, 0);

            assert.isObject(people[0]);
            assert.property(people[0], "total");
        });

        it("should throw if no aggregates defined", function() {
            assert.throws(function() {
                Person.aggregate().as('total');
            });
        });
    });
});
