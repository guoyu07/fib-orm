var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model.one()", function() {
    var db = null;
    var Person = null;

    var setup = function() {
        return function() {
            Person = db.define("person", {
                name: String
            });

            return helper.dropSync(Person, function() {
                Person.createSync([{
                    id: 1,
                    name: "Jeremy Doe"
                }, {
                    id: 2,
                    name: "John Doe"
                }, {
                    id: 3,
                    name: "Jane Doe"
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

    describe("without arguments", function() {
        before(setup());

        it("should return first item in model", function() {
            var person = Person.oneSync();
            assert.equal(person.name, "Jeremy Doe");
        });
    });

    describe("with order", function() {
        before(setup());

        it("should return first item in model based on order", function() {
            var person = Person.oneSync("-name");
            assert.equal(person.name, "John Doe");
        });
    });

    describe("with conditions", function() {
        before(setup());

        it("should return first item in model based on conditions", function() {
            var person = Person.oneSync({ name: "Jane Doe" });
            assert.equal(person.name, "Jane Doe");
        });

        describe("if no match", function() {
            before(setup());

            it("should return null", function() {
                var person = Person.oneSync({ name: "Jack Doe" });
                assert.equal(person, null);
            });
        });
    });
});
