// app.js - interim angular app
var IronbaneApp = angular.module('Ironbane', ['ngSanitize', 'ui.bootstrap', 'ui.router', 'User', 'Friends', 'IBCommon']);

IronbaneApp
    .constant('GAME_HOST', window.ironbane_hostname) // todo: fill these in using server/grunt instead?
    .constant('GAME_PORT', window.ironbane_port)
    .run(['User', '$rootScope',
        function(User, $rootScope) {
            $rootScope.currentUser = {};
            User.getCurrentUser()
                .then(function(user) {
                    angular.copy(user, $rootScope.currentUser);
                });
        }
    ])
    .run(['$log', '$window', 'Game', 'FeatureDetection',
        function($log, $window, Game, Features) {
            if(!Features.webgl) {
                // display webgl solutions
                $log.error('no webgl support!', Features);
            } else {
                var ironbane = new Game();

                // for the global references still pending...
                $window.ironbane = ironbane;

                // here we go!
                ironbane.start();
            }
        }
    ]);