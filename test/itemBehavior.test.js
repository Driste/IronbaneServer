/*
    Tests for the item behavior system (src/server/services/itemBehavior.js
    and src/server/game/itemBehaviors/*). Runs without a database or the game
    server: behaviors operate on plain "unit" and "item" stand-ins.

    Run with: npm test   (or: node test/itemBehavior.test.js)
*/
var assert = require('assert');
var service = require('../src/server/services/itemBehavior');

var passed = 0;
function test(name, fn) {
    fn();
    passed++;
    console.log('  ok - ' + name);
}

// --- helpers ---------------------------------------------------------------
function makeItem(name, behavior, extra) {
    var item = { $template: { name: name, behavior: behavior }, equipped: 0 };
    if (extra) {
        Object.keys(extra).forEach(function(k) { item[k] = extra[k]; });
    }
    return item;
}

function makeUnit() {
    return {
        items: [],
        health: 20,
        healthMax: 20,
        healthBonus: 0,
        healthRegen: null,
        CalculateMaxHealth: function() {
            this.healthMax = 20 + (this.healthBonus || 0);
            if (this.healthMax < 1) { this.healthMax = 1; }
        }
    };
}

// --- parsing ---------------------------------------------------------------
test('parse: array form', function() {
    var defs = service.parse(['HealthRegen strong', 'Unique']);
    assert.strictEqual(defs.length, 2);
    assert.strictEqual(defs[0].name, 'HealthRegen');
    assert.strictEqual(defs[0].args, 'strong');
    assert.strictEqual(defs[1].name, 'Unique');
    assert.strictEqual(defs[1].args, '');
});

test('parse: string with ; and newlines, trims blanks', function() {
    var defs = service.parse('MaxLife -weak ; Cursed\n\n Unique ');
    assert.deepStrictEqual(defs.map(function(d) { return d.name; }), ['MaxLife', 'Cursed', 'Unique']);
    assert.strictEqual(defs[0].args, '-weak');
});

test('parse: empty / missing behavior', function() {
    assert.deepStrictEqual(service.parse(null), []);
    assert.deepStrictEqual(service.parse(''), []);
    assert.deepStrictEqual(service.parse(undefined), []);
});

// --- run gating ------------------------------------------------------------
test('run: item with no behavior always passes', function() {
    var item = makeItem('Plain Sword', null);
    assert.strictEqual(service.canEquip(item, makeUnit()), true);
    assert.strictEqual(service.canUnEquip(item, makeUnit()), true);
});

test('run: unknown behavior is ignored (passes)', function() {
    var item = makeItem('Weird', 'Nonexistent foo');
    assert.strictEqual(service.run('onBeforeEquip', item, makeUnit()), true);
});

// --- Unique ----------------------------------------------------------------
test('Unique: blocks equipping a second item of the same name', function() {
    var unit = makeUnit();
    var ring1 = makeItem('Ring of Power', 'Unique', { equipped: 1 });
    var ring2 = makeItem('Ring of Power', 'Unique');
    unit.items = [ring1, ring2];

    assert.strictEqual(service.canEquip(ring2, unit), false, 'second same-name should be blocked');
});

test('Unique: allows equipping when no same-name equipped', function() {
    var unit = makeUnit();
    var ring = makeItem('Ring of Power', 'Unique');
    var other = makeItem('Ring of Speed', 'Unique', { equipped: 1 });
    unit.items = [other, ring];

    assert.strictEqual(service.canEquip(ring, unit), true);
});

// --- Cursed ----------------------------------------------------------------
test('Cursed: cannot be unequipped, but can be equipped', function() {
    var unit = makeUnit();
    var item = makeItem('Cursed Helm', 'Cursed');
    unit.items = [item];

    assert.strictEqual(service.canEquip(item, unit), true);
    assert.strictEqual(service.canUnEquip(item, unit), false);
});

// --- MaxLife ---------------------------------------------------------------
test('MaxLife: equip raises max health, unequip restores it', function() {
    var unit = makeUnit();
    var item = makeItem('Heart Amulet', 'MaxLife strong'); // strong = +1
    unit.items = [item];

    service.equip(item, unit);
    assert.strictEqual(unit.healthBonus, 1);
    assert.strictEqual(unit.healthMax, 21);

    service.unEquip(item, unit);
    assert.strictEqual(unit.healthBonus, 0);
    assert.strictEqual(unit.healthMax, 20);
});

test('MaxLife: negative modifier lowers max health (floored at 1)', function() {
    var unit = makeUnit();
    var item = makeItem('Frail Band', 'MaxLife -legendary'); // -2
    unit.items = [item];

    service.equip(item, unit);
    assert.strictEqual(unit.healthBonus, -2);
    assert.strictEqual(unit.healthMax, 18);
});

test('MaxLife: consumable use applies a permanent bonus', function() {
    var unit = makeUnit();
    var potion = makeItem('Life Potion', 'MaxLife normal'); // +0.5
    service.use(potion, unit);
    assert.strictEqual(unit.healthBonus, 0.5);
    assert.strictEqual(unit.healthMax, 20.5);
});

// --- HealthRegen -----------------------------------------------------------
test('HealthRegen: equip sets regen, keeping the fastest', function() {
    var unit = makeUnit();
    var weak = makeItem('Weak Charm', 'HealthRegen weak');     // rate 10
    var strong = makeItem('Strong Charm', 'HealthRegen strong'); // rate 4
    unit.items = [weak, strong];

    service.equip(weak, unit);
    assert.strictEqual(unit.healthRegen.rate, 10);

    service.equip(strong, unit); // faster wins
    assert.strictEqual(unit.healthRegen.rate, 4);

    // equipping the slower one again should NOT downgrade
    service.equip(weak, unit);
    assert.strictEqual(unit.healthRegen.rate, 4);
});

test('HealthRegen: unequip recomputes best from remaining equipped items', function() {
    var unit = makeUnit();
    var weak = makeItem('Weak Charm', 'HealthRegen weak', { equipped: 1 });   // rate 10
    var strong = makeItem('Strong Charm', 'HealthRegen strong', { equipped: 1 }); // rate 4
    unit.items = [weak, strong];

    unit.healthRegen = { rate: 4, amount: 0.75, _permanent: false };

    // remove the strong one; should fall back to the weak one
    strong.equipped = 0;
    service.unEquip(strong, unit);
    assert.ok(unit.healthRegen, 'regen should remain from the weak charm');
    assert.strictEqual(unit.healthRegen.rate, 10);

    // remove the last one; regen clears
    weak.equipped = 0;
    service.unEquip(weak, unit);
    assert.strictEqual(unit.healthRegen, null);
});

test('HealthRegen: consumable use makes regen permanent (survives unequip)', function() {
    var unit = makeUnit();
    var potion = makeItem('Regen Potion', 'HealthRegen normal');
    service.use(potion, unit);
    assert.ok(unit.healthRegen);
    assert.strictEqual(unit.healthRegen._permanent, true);

    // an unrelated unequip with no other regen items must not clear a permanent regen
    var other = makeItem('Plain Boots', null);
    unit.items = [other];
    service.unEquip(other, unit); // Plain Boots has no behavior, but call the hook path
    assert.ok(unit.healthRegen, 'permanent regen should persist');
});

// --- combined "all must pass" ---------------------------------------------
test('run: all behaviors must pass for the action to be allowed', function() {
    var unit = makeUnit();
    // Unique passes (no same-name), Cursed has no onBeforeEquip veto -> equip allowed
    var item = makeItem('Cursed Unique Blade', ['Unique', 'Cursed']);
    unit.items = [item];
    assert.strictEqual(service.canEquip(item, unit), true);
    // but unequip is vetoed by Cursed
    assert.strictEqual(service.canUnEquip(item, unit), false);
});

console.log('\nAll ' + passed + ' item-behavior tests passed.');
