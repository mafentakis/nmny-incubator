(function (angular) {
    "use strict";

    var app = angular.module('myApp.ownOffers', ['firebase.auth', 'firebase', 'firebase.utils', 'ngRoute']);

    app.controller('MyOwnOffersCtrl', ['$scope', '$timeout', 'fbutil', 'user', '$firebaseObject', 'FBURL', function ($scope, $timeout, fbutil, user, $firebaseObject, FBURL) {
        var profileRef = fbutil.ref('users', user.uid);

        var profile = $firebaseObject(profileRef);
        profile.$bindTo($scope, 'profile');

        profileRef.on("value", function (profileSnapshot) {
                var profile = profileSnapshot.val();
                console.log("own offfer page:" + profile.name);
            }/*profileRef.on*/
            , function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });
    }
    ]);


    /**
     * Route configuration
     */
    app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/my', {
            templateUrl: 'offers/my.html',
            controller: 'MyOwnOffersCtrl',
            resolve: {
                // forces the page to wait for this promise to resolve before controller is loaded
                // the controller can then inject `user` as a dependency. This could also be done
                // in the controller, but this makes things cleaner (controller doesn't need to worry
                // about auth status or timing of accessing data or displaying elements)
                user: ['Auth', function (Auth) {
                    return Auth.$waitForAuth();
                }]
            }
        });
    }]);

})(angular);