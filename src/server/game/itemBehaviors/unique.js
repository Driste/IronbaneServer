/*
    This file is part of Ironbane MMO. (GPL - see baseItemBehavior.js)
*/

// Unique: the unit may only have one equipped item of a given name at a time.
var BaseItemBehavior = require('./baseItemBehavior'),
    _ = require('underscore');

var UniqueItemBehavior = BaseItemBehavior.extend({
    onBeforeEquip: function(item, unit) {
        if (!unit || !unit.items) {
            return false;
        }

        var name = item.$template && item.$template.name;

        var conflict = _.find(unit.items, function(other) {
            return other !== item &&
                other.equipped &&
                other.$template &&
                other.$template.name === name;
        });

        // allow only if there is no other equipped item with the same name
        return !conflict;
    }
});

module.exports = UniqueItemBehavior;
