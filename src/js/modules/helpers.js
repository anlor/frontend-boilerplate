var Helpers = {
    cloneObject: function(o) {
       var pds = {};
        Object.getOwnPropertyNames(o).forEach(function _eachName(name) {
            pds[name] = Object.getOwnPropertyDescriptor(o, name);
        });

        return Object.create(Object.getPrototypeOf(o), pds);
    }
};

module.exports = Helpers;
