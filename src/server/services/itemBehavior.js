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

// Runs the item behaviors declared on an item's template. An item template's
// `behavior` field is either an array of strings or a string with entries
// separated by ';' or newlines, where each entry is "<BehaviorName> <args>",
// e.g. "HealthRegen strong" or "Unique".
var Class = require('../../common/class'),
    _ = require('underscore'),
    behaviors = require('../game/itemBehaviors');

var Service = Class.extend({
    init: function() {
        // behavior instances are stateless beyond their parsed args, so they
        // can be cached and shared across items/units, keyed by the raw string.
        this._cache = {};
    },

    // Parse a template `behavior` field into [{ raw, name, args }].
    parse: function(behavior) {
        if (!behavior) {
            return [];
        }

        var entries;
        if (_.isArray(behavior)) {
            entries = behavior;
        } else if (_.isString(behavior)) {
            entries = behavior.split(/[;\n]+/);
        } else {
            return [];
        }

        return _.chain(entries)
            .map(function(entry) {
                return String(entry).trim();
            })
            .filter(function(entry) {
                return entry.length > 0;
            })
            .map(function(raw) {
                var parts = raw.split(' ');
                var name = parts.shift();
                return {
                    raw: raw,
                    name: name,
                    args: parts.join(' ').trim()
                };
            })
            .value();
    },

    _instance: function(def) {
        if (this._cache[def.raw]) {
            return this._cache[def.raw];
        }

        var Behavior = behaviors[def.name];
        if (!Behavior) {
            console.log('Unknown item behavior: ' + def.name);
            return null;
        }

        var instance = new Behavior(def.args);
        this._cache[def.raw] = instance;
        return instance;
    },

    // Run a single lifecycle hook (e.g. 'onBeforeEquip') across every behavior
    // declared on the item's template. Returns true only if ALL behaviors
    // allow it (an empty/behavior-less item always passes).
    run: function(hook, item, unit) {
        var self = this,
            template = item && item.$template,
            defs = this.parse(template ? template.behavior : null);

        if (defs.length === 0) {
            return true;
        }

        var results = _.map(defs, function(def) {
            var instance = self._instance(def);
            if (!instance || typeof instance[hook] !== 'function') {
                return true;
            }
            try {
                return instance[hook](item, unit);
            } catch (e) {
                console.log('itemBehavior error in "' + def.raw + '".' + hook + ': ' + e.message);
                return true;
            }
        });

        return _.every(results, function(result) {
            return !!result;
        });
    },

    // Convenience wrappers used by the game code.
    canEquip: function(item, unit) {
        return this.run('onBeforeEquip', item, unit);
    },
    equip: function(item, unit) {
        return this.run('onEquip', item, unit);
    },
    canUnEquip: function(item, unit) {
        return this.run('onBeforeUnEquip', item, unit);
    },
    unEquip: function(item, unit) {
        return this.run('onUnEquip', item, unit);
    },
    canUse: function(item, unit) {
        return this.run('onBeforeUse', item, unit);
    },
    use: function(item, unit) {
        return this.run('onUse', item, unit);
    }
});

// singleton
module.exports = new Service();
