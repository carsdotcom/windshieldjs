var mocks = {};

mocks.genericContext = {};

mocks.page = {
    layout: "mock",
    attributes: {
        title: "mock page"
    },
    associations: {
        main: [
            { component: "foo" }
        ]
    }
};

mocks.assoc = {
    secondary: [
        { component: "bar" }
    ]
};

mocks.assoc2 = {
    tertiary: [
        { component: "baz" }
    ]
};

mocks.assoc3 = {
    tertiary: [
        { component: "qux" }
    ]
};


mocks.genericPromise = {
    then: function (func) {
        return func.apply(this, arguments);
    },
    catch: function () {},
    finally: function () {}
};

mocks.pagePromise = {
    then: function (func) {
        return func.call(this, mocks.page);
    },
    catch: function () {},
    finally: function () {}
};

mocks.assocPromise = {
    then: function (func) {
        return func.call(this, mocks.assoc);
    },
    catch: function () {},
    finally: function () {}
};

mocks.assocPromise2 = {
    then: function (func) {
        return func.call(this, mocks.assoc2);
    },
    catch: function () {},
    finally: function () {}
};

mocks.assocPromise3 = {
    then: function (func) {
        return func.call(this, mocks.assoc3);
    },
    catch: function () {},
    finally: function () {}
};

mocks.genericAdapter = function () {
    return mocks.genericPromise;
};

mocks.pageAdapter = function () {
    return mocks.pagePromise;
};

mocks.assocAdapter = function () {
    return mocks.assocPromise;
};

mocks.assocAdapter2 = function () {
    return mocks.assocPromise2;
};

mocks.assocAdapter3 = function () {
    return mocks.assocPromise3;
};


module.exports = mocks;
