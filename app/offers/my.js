(function (angular) {
    "use strict";

    /**
     * @typedef {Object} Offer
     * @property {String} title
     * @property {String} description
     * @property {String[]} swapRequests
     */


    var app = angular.module('myApp.ownOffers', ['daos', 'firebase.auth', 'firebase', 'firebase.utils', 'ngRoute']);

    app.controller('MyOwnOffersCtrl', ['swapDao', '$scope', '$timeout', 'fbutil', 'user', '$firebaseObject', 'FBURL', '$q',
        function (swapDao, $scope, $timeout, fbutil, user, $firebaseObject, FBURL, $q) {
            var profileRef = fbutil.ref('users', user.uid);

            var profile = $firebaseObject(profileRef);
            profile.$bindTo($scope, 'profile');


            /** Offers[]*/
            $scope.offers = {};

            /**
             * @param {FirebaseObject} slave
             * @param {FirebaseObject} index
             * @param {function} childCallback
             */
            function load(slave, index, childCallback) {
                slave.$loaded().then(function (object) {
                    angular.forEach(object, function (childObject, key) {
                        var childFBO = $firebaseObject(index.child(key));

                        if (childCallback) {
                            childCallback(childFBO, key);
                        }

                    });
                });
            }

            var globalOfferRef = fbutil.ref('offers');
            var globalSwaprequestsRef = fbutil.ref('swapRequests');

            profile.$loaded().then(function () {
                //FirebaseObject
                var ownOffersSlave = $firebaseObject(fbutil.ref('barters', profile.name, 'offers'));

                load(ownOffersSlave, globalOfferRef, function (offer, key) {
                    $scope.offers[key] = offer;
                });

            });


            function logOnLoaded(firebaseObject, message) {
                if (!message) {
                    message = "";
                }
                console.log("waiting for " + message + ", key=" + firebaseObject);
                firebaseObject.$loaded().then(
                    function () {
                        console.log("loaded " + message + ", key=" + firebaseObject);
                    }
                );
            }

            /**
             *
             * @param {String} offerId
             * @param {Offer} offer
             * @returns {{visibleDialog: boolean, closeDialog: Function, showSwaps: Function}}
             */
            $scope.createSwapRequestsFacade2 = function (offerId, offer) {
                return {
                    swapRequests: null,

                    visibleDialog: false,

                    dropSwapRequest:function(swapRequest){
                        swapDao.dropSwapRequest(swapRequest);
                    },

                    closeDialog: function () {
                        this.visibleDialog = false;
                    },
                    toggleDialog: function () {
                        this.visibleDialog = !this.visibleDialog;

                        if (this.swapRequests == null) {
                            //swap requests are promisses "live conneected" to the
                            //firebase data - the dont need reload
                            // we need to do it only once this
                            this.swapRequests = swapDao.findSwapRequestsByOffer(offer);
                            // mustw iterate thour value of dictionary!!!  not this-->   logOnLoaded(this.swapRequests);
                        }
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



            /**
             * drops Offers and all references
             * @param offerId
             */
            $scope.dropOffer = function (offerId) {
                if (!confirm("soll diese Offer wirklich gelsöcht werden?")){
                    return;
                }

                swapDao.dropOffer(offerId,profile.name);


            };


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