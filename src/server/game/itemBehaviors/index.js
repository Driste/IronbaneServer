/*
    This file is part of Ironbane MMO. (GPL - see baseItemBehavior.js)
*/

// Registry of available item behaviors, keyed by the name used in an item
// template's `behavior` field (e.g. "HealthRegen strong" -> HealthRegen).
module.exports = {
    HealthRegen: require('./healthRegen'),
    MaxLife: require('./maxLife'),
    Unique: require('./unique'),
    Cursed: require('./cursed')
};
