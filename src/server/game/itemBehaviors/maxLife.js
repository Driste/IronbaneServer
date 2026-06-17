/*
    This file is part of Ironbane MMO. (GPL - see baseItemBehavior.js)
*/

// MaxLife: equipping the item raises (or, with a leading '-', lowers) the
// unit's maximum health by an amount based on its strength. Using it as a
// consumable applies the bonus permanently.
//
// Behavior string examples: "MaxLife", "MaxLife strong", "MaxLife -weak"
var BaseItemBehavior = require('./baseItemBehavior');

var AMOUNTS = {
    weak: 0.25,
    normal: 0.5,
    strong: 1,
    epic: 1.5,
    legendary: 2
};

var MaxLifeItemBehavior = BaseItemBehavior.extend({
    init: function(args) {
        this._super(args);

        var strength = (args || 'normal').trim();

        this._modifier = 1;
        if (strength.charAt(0) === '-') {
            this._modifier = -1;
            strength = strength.substr(1);
        }

        this._amount = AMOUNTS[strength.toLowerCase()] || 0;
    },

    _delta: function() {
        return this._amount * this._modifier;
    },

    _applyBonus: function(unit, delta) {
        if (!unit) {
            return;
        }
        unit.healthBonus = (unit.healthBonus || 0) + delta;
        if (typeof unit.CalculateMaxHealth === 'function') {
            unit.CalculateMaxHealth(true);
        }
    },

    onEquip: function(item, unit) {
        this._applyBonus(unit, this._delta());
        return true;
    },

    onUnEquip: function(item, unit) {
        this._applyBonus(unit, -this._delta());
        return true;
    },

    onUse: function(item, unit) {
        // consumables grant the bonus permanently (no matching unequip)
        this._applyBonus(unit, this._delta());
        return true;
    }
});

module.exports = MaxLifeItemBehavior;
