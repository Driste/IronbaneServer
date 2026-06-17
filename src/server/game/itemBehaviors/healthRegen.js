/*
    This file is part of Ironbane MMO. (GPL - see baseItemBehavior.js)
*/

// HealthRegen: while equipped, the unit slowly regenerates health. Strength
// controls how often (rate, in seconds) and how much (amount) is restored.
// A lower rate means faster regen, so the "best" regen is the one with the
// smallest rate.
//
// Behavior string examples: "HealthRegen", "HealthRegen strong"
var BaseItemBehavior = require('./baseItemBehavior'),
    _ = require('underscore');

var REGEN = {
    weak:      { rate: 10.0, amount: 0.25 },
    normal:    { rate: 8.0,  amount: 0.5 },
    strong:    { rate: 4.0,  amount: 0.75 },
    epic:      { rate: 2.0,  amount: 1.0 },
    legendary: { rate: 0.25, amount: 1.0 }
};

// Pull the strongest (fastest) HealthRegen config declared on an item's
// template behavior field (string or array form), or null if it has none.
function configFromItem(item) {
    var behavior = item && item.$template && item.$template.behavior;
    if (!behavior) {
        return null;
    }

    var entries = _.isArray(behavior) ? behavior : String(behavior).split(/[;\n]+/);
    var best = null;

    _.each(entries, function(entry) {
        var parts = String(entry).trim().split(' ');
        if (parts.shift() !== 'HealthRegen') {
            return;
        }
        var cfg = REGEN[(parts.join(' ').trim() || 'normal').toLowerCase()];
        if (cfg && (!best || cfg.rate < best.rate)) {
            best = cfg;
        }
    });

    return best;
}

var HealthRegenItemBehavior = BaseItemBehavior.extend({
    init: function(args) {
        this._super(args);
        var strength = (args || 'normal').trim().toLowerCase();
        this._config = REGEN[strength] || REGEN.normal;
    },

    _set: function(unit, config) {
        var permanent = unit.healthRegen && unit.healthRegen._permanent;
        unit.healthRegen = {
            rate: config.rate,
            amount: config.amount,
            _permanent: !!permanent
        };
    },

    onEquip: function(item, unit) {
        if (!unit) {
            return true;
        }
        // keep whichever regen is faster (smaller rate)
        if (!unit.healthRegen || this._config.rate < unit.healthRegen.rate) {
            this._set(unit, this._config);
        }
        return true;
    },

    onUnEquip: function(item, unit) {
        if (!unit) {
            return true;
        }

        // recompute the best regen from any other still-equipped items
        var best = null;
        _.each(unit.items || [], function(other) {
            if (other === item || !other.equipped) {
                return;
            }
            var cfg = configFromItem(other);
            if (cfg && (!best || cfg.rate < best.rate)) {
                best = cfg;
            }
        });

        if (best) {
            this._set(unit, best);
        } else if (!(unit.healthRegen && unit.healthRegen._permanent)) {
            unit.healthRegen = null;
        }

        return true;
    },

    onUse: function(item, unit) {
        // consumables grant regen permanently
        this.onEquip(item, unit);
        if (unit.healthRegen) {
            unit.healthRegen._permanent = true;
        }
        return true;
    }
});

module.exports = HealthRegenItemBehavior;
