(function (angular) {
    "use strict";

    var app = angular.module('myApp.ownOffers', ['firebase.auth', 'firebase', 'firebase.utils', 'ngRoute']);

    app.controller('MyOwnOffersCtrl', ['$scope', '$timeout', 'fbutil', 'user', '$firebaseObject', 'FBURL','$q', function ($scope, $timeout, fbutil, user, $firebaseObject, FBURL,$q) {
        var profileRef = fbutil.ref('users', user.uid);

        var profile = $firebaseObject(profileRef);
        profile.$bindTo($scope, 'profile');




        var offersUrl = FBURL + '/offers';
        var offers = $firebaseObject(new Firebase(offersUrl));

        offers.$bindTo($scope,'profile.offers');

        function load(firebasePromisse,indexRef){
             firebasePromisse.then(function(object){
                angular.forEach(object, function (childObject, key) {
                    var childFBO = $firebaseObject(indexRef.child(key));
                    childFBO.$bindTo($scope,'profile.offers["'+key+'"]');

                });
            });
        }


        profile.$loaded().then(function(){
            var offersO = $firebaseObject(fbutil.ref('barters', profile.name,'offers'));

            var indexRef = fbutil.ref('offers');
            load(offersO.$loaded(), indexRef);



      /*      offersO.$loaded().then(function(){
            });*/

        });







        $q.all( [profile.$loaded(),
            offers.$loaded()] ).then(
            function(){
                console.log("loaded record", profile.$id, profile.name);
                console.log(angular.toJson(offers));
            }
        );
/*
        // to take an action after the data loads, use $loaded() promise
        profile.$loaded().then(function() {
            console.log("loaded record", profile.$id, profile.name);
        });
*/

        $scope.offers = {};

        profileRef.on("value", function (profileSnapshot) {
                var profile = profileSnapshot.val();
                console.log("own offfer page:" + profile.name);

                $scope.offers = {};

                var baseRef = new Firebase(FBURL);

                var ref = new Firebase.util.NormalizedCollection(
                    [baseRef.child("barters").child(profile.name).child("offers"), "b"],
                    [baseRef.child("/offers"), "c"]
                ).select(
                    {"key":"c.$value","alias":"offer"}
                ).ref();

                ref.on('value', function(snap) {
                    var collection = snap.val();

                    angular.forEach(collection, function (offerProperties, offerId) {
                        $scope.offers[offerId] = offerProperties.offer;
                    });

                    $scope.$apply();

                    console.log("done");
                });




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