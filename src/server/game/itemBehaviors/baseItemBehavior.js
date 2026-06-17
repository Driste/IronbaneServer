/*
    This file is part of Ironbane MMO.

    Ironbane MMO is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Ironbane MMO is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Ironbane MMO.  If not, see <http://www.gnu.org/licenses/>.
*/

// Base class for item behaviors. A behavior is attached to an item template
// (via its `behavior` field) and reacts to lifecycle events on the item.
//
// Each hook receives (item, unit):
//   - item: the Item instance the behavior is attached to
//   - unit: the unit/player acting on the item
//
// "before" hooks are gates: returning false vetoes the action (e.g. a Cursed
// item refuses to be unequipped). The non-"before" hooks apply side effects
// (e.g. adjusting the unit's stats) and should return true unless they also
// want to signal failure.
//
// This mirrors the behavior system from the (Meteor-based) Ironbane rewrite,
// reimplemented natively in this server's Class-based architecture.
var Class = require('../../../common/class');

var BaseItemBehavior = Class.extend({
    init: function(args) {
        this.args = args || '';
    },

    onBeforeEquip: function(item, unit) { return true; },
    onEquip: function(item, unit) { return true; },

    onBeforeUnEquip: function(item, unit) { return true; },
    onUnEquip: function(item, unit) { return true; },

    onBeforeUse: function(item, unit) { return true; },
    onUse: function(item, unit) { return true; },

    onBeforePickup: function(item, unit) { return true; },
    onPickup: function(item, unit) { return true; },

    onBeforeDrop: function(item, unit) { return true; },
    onDrop: function(item, unit) { return true; },

    onBeforeAttack: function(item, unit) { return true; },
    onAttack: function(item, unit) { return true; },

    onBeforeHit: function(item, unit) { return true; },
    onHit: function(item, unit) { return true; }
});

module.exports = BaseItemBehavior;
