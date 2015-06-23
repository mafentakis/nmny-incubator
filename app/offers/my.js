(function (angular) {
    "use strict";

    var app = angular.module('myApp.ownOffers', ['firebase.auth', 'firebase', 'firebase.utils', 'ngRoute']);

    app.controller('MyOwnOffersCtrl', ['$scope', '$timeout', 'fbutil', 'user', '$firebaseObject', 'FBURL','$q', function ($scope, $timeout, fbutil, user, $firebaseObject, FBURL,$q) {
        var profileRef = fbutil.ref('users', user.uid);

        var profile = $firebaseObject(profileRef);
        profile.$bindTo($scope, 'profile');


        $scope.offers = {};

        function load(slaveRef,indexRef,childCallback){
            slaveRef.$loaded().then(function(object){
                angular.forEach(object, function (childObject, key) {
                    var childFBO = $firebaseObject(indexRef.child(key));

                    childCallback(childFBO,key);

                });
            });
        }

        var globalOfferRef = fbutil.ref('offers');

        profile.$loaded().then(function(){
            var ownOffersSlave = $firebaseObject(fbutil.ref('barters', profile.name,'offers'));


            load(ownOffersSlave,globalOfferRef,function(offer,key){
                $scope.offers[key] = offer;
                var swapRequestsSlave = $firebaseObject(fbutil.ref('barters', profile.name,'offers',key,'swapRequests'));
                load(swapRequestsSlave,globalOfferRef,function(offer,key){

                });
            });


            $scope.createSwapRequestsFacade2=function(offerId,offer){
                return {
                    visibleDialog:false,

                    closeDialog:function(){
                        this.visibleDialog=false;
                    },
                    showSwaps:function(){
                        this.visibleDialog=true;
                    }


                }
            };


            /*      offersO.$loaded().then(function(){
             });*/

            $scope.keyCount = function (object) {
                if (object) {
                    return Object.keys(object).length;
                }
                return 0;
            }

        });




        /*


        $q.all( [profile.$loaded(),
            offers.$loaded()] ).then(
            function(){
                console.log("loaded record", profile.$id, profile.name);
                console.log(angular.toJson(offers));
            }
        );

         // to take an action after the data loads, use $loaded() promise
         profile.$loaded().then(function() {
         console.log("loaded record", profile.$id, profile.name);
         });
         */




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