// access github api
module.exports = function(app) {

    var config = require('../../../../nconf'),
        ghcfg = config.get('github');

    // @octokit/rest is ESM-only, so create the client lazily via a dynamic
    // import (this module is CommonJS). The promise is cached after the first
    // request.
    var octokitPromise = null;
    function getOctokit() {
        if (!octokitPromise) {
            octokitPromise = import('@octokit/rest').then(function(mod) {
                return new mod.Octokit();
            });
        }
        return octokitPromise;
    }

    app.get('/api/github/events', function(req, res) {
        getOctokit()
            .then(function(octokit) {
                return octokit.rest.activity.listRepoEvents({
                    owner: 'ironbane',
                    repo: 'IronbaneServer'
                });
            })
            .then(function(result) {
                res.send(result.data);
            })
            .catch(function(err) {
                res.status(500).send(err);
            });
    });

};
