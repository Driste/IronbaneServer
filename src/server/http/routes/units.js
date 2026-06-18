// units.js - ajax calls for units (instances) & unit templates

module.exports = function(app, db) {
    var log = require('util').log,
        _ = require('underscore'),
        UnitTemplateSvc = require('../../services/unitTemplate'),
        UnitService = require('../../services/unit');

    app.get('/api/unit_templates', function(req, res) {
        UnitTemplateSvc.getAll().then(function(templates) {
            res.send(templates);
        }, function(error) {
            res.status(500).send(error);
        });
    });

    app.get('/api/unit_templates/:templateId', function(req, res) {
        UnitTemplateSvc.getById(req.params.templateId).then(function(template) {
            res.send(template);
        }, function(err) {
            res.status(500).send(err);
        });
    });

    app.get('/api/units/:unitId', function(req, res) {
        UnitService.getById(req.params.unitId).then(function(unit) {
            res.send(unit);
        }, function(err) {
            res.status(err.code).send(err.message);
        });
    });

};