// board.js
angular.module('IronbaneApp')
.controller('PreferencesCtrl', ['User', '$scope', '$location', '$http','$log', '$rootScope', function(User, $scope, $location, $http, $log, $rootScope) {
	$scope.user = angular.copy($rootScope.currentUser);
	$scope.genderOptions = [{gender:"male"},{gender:"female"}];

	$scope.save = function(){
    	$http.post('/api/user/preferences', $scope.user)
            .success(function(response) {
                User.getCurrentUser()
                .then(function(user) {
                    angular.copy(user, $rootScope.currentUser);
                });
                $scope.message = "Update succesful!";
            })
            .error(function(response) {
                $log.warn('update error', response);
            });
    };

    $scope.send = function(){
        $http.post('/api/user/avatar', $scope.user.avatar)
            .success(function(response) {
                $log.log('update success', response);
            })
            .error(function(response) {
                $log.warn('update error', response);
            });
    };

}]);
