/*
    This file is part of Ironbane MMO. (GPL - see baseItemBehavior.js)
*/

// Cursed: once equipped, the item cannot be removed.
var BaseItemBehavior = require('./baseItemBehavior');

var CursedItemBehavior = BaseItemBehavior.extend({
    onBeforeUnEquip: function(item, unit) {
        // veto the unequip; callers should surface a "you can't seem to put
        // this down!" style message to the player.
        return false;
    }
});

module.exports = CursedItemBehavior;
