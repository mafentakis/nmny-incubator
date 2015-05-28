(function (angular) {
    "use strict";

    var app = angular.module('myApp.home', ['firebase.auth', 'firebase', 'firebase.utils', 'ngRoute']);

    app.controller('MyOffersCtrl', ['$scope','$timeout', 'fbutil', 'user', '$firebaseObject', 'FBURL', function ($scope, $timeout, fbutil, user, $firebaseObject, FBURL) {

        var profileRef = fbutil.ref('users', user.uid);
        var profile = $firebaseObject(profileRef);
        profile.$bindTo($scope, 'profile');

        var offers = {};
        $scope.offers = offers;

        /*root where are offers are stored*/
        const offersRef = new Firebase(FBURL + '/offers/');

        $scope.otherOffers = {};


        function readOtherOffers() {
            profileRef.on("value", function (profileSnapshot) {
                    var profile = profileSnapshot.val();
                    offersRef.on('child_added', function (offersSnap) {
                        var key = offersSnap.key();
                        var offer = offersSnap.val();
                        if (offer.offeredBy != profile.name) {
                            $scope.otherOffers[key] = offer;
                        }
                    });
                    offersRef.on('child_changed', function (offersSnap) {
                        var key = offersSnap.key();
                        var offer = offersSnap.val();
                        if (offer.offeredBy != profile.name) {
                            $scope.otherOffers[key] = offer;
                        }
                    });
                    offersRef.on('child_removed', function (offersSnap) {
                        var key = offersSnap.key();
                        $scope.otherOffers[key] = null;
                    });

                    readOwnOffers(profile);
                }/*profileRef.on*/
                , function (errorObject) {
                    console.log("The read failed: " + errorObject.code);
                });
        }

        readOtherOffers();


        /**
         * Alien offer is an offer that the user can (re)sell, and pay with his own offer
         * @param offer
         */
        function readAlienOffers(offer) {
            angular.forEach(offer.internalTradedFor, function (tradeProperties, offerId) {
                offersRef.child(offerId).on('value', function (offerSnap) {
                    if (offerSnap.val() != null) {
                        var offer = offerSnap.val();
                        offer.alien = true;
                        $scope.offers[offerId] = offer;
                        tradeProperties.offer=offer;
                    }
                });
            });
        }//function readAlienOffers

        /**
         *
         * $scope.offers where the offers will be stored
         * @param offerId the key of the order to denormalize and work with (search dependencies)
         */
        function readOfferByOfferId(offerId) {
            /*will be triggered*/
            offersRef.child(offerId).on('value', function (offerSnap) {
                var offer = offerSnap.val();
                console.log('offer:' + offer);
                // trigger $digest/$apply so Angular syncs the DOM
                $timeout(function () {
                    if (offer === null) {
                        // the offer was deleted
                        delete $scope.offers[offerId];
                    }
                    else {
                        $scope.offers[offerId] = offer;
                        readAlienOffers(offer);
                    }
                });
            });//offersRef.child
        }

        /*readOfferByOfferId*/

        function readOwnOffers(profile) {
            const offersUrl = FBURL + '/barters/' + profile.name + '/offers';
            var offersRef = new Firebase(offersUrl);
            offersRef.on('child_added', function (offersSnap) {
                // fetch the book and put it into our list
                var offerId = offersSnap.key();
                console.log('offer:' + offerId);
                readOfferByOfferId(offerId);
            });
        }

        /**
         * readOwnOffers
         *
         **/
        profileRef.on("value", function (profileSnapshot) {
                var profile = profileSnapshot.val();
                console.log(profile.name);
                readOwnOffers(profile);
            }/*profileRef.on*/
            , function (errorObject) {
                console.log("The read failed: " + errorObject.code);
            });


        function resetNewOffer() {
            $scope.newOffer = {title: "", offeredBy: ""};
        }


        $scope.swapDialogs = {};
        $scope.toggleSwapDialog = function (otherOfferId) {
            if ($scope.swapDialogs[otherOfferId]) {
                $scope.swapDialogs[otherOfferId] = false
            }
            else {
                $scope.swapDialogs[otherOfferId] = true
            }
        }


        /**
         * gibt true wenn die offerId
         * @param offer Fremdes Produkt
         * @param offerId das eigene produkt
         * @returns {boolean}
         */
        $scope.isOfferAllreadyUsed = function (otherOffer, offerId) {

            if (otherOffer.internalTradedFor) {
                var tradeExists = otherOffer.internalTradedFor[offerId] != null;
                return !tradeExists;
            }


            return true;
        };

        $scope.swapProposalsDialogShown={};
        $scope.toogleSwpapProposalsDialog=function(offerId){
            $scope.swapProposalsDialogShown[offerId]=!$scope.swapProposalsDialogShown[offerId] ;
        }


        $scope.countSwapProposals = function (offer) {
            if (!offer.internalTradedFor) {
                return 0;
            }
            return Object.keys(offer.internalTradedFor).length;
        };

        $scope.createSwapProposal = function (targetOfferId, offerId) {
            var internalTradedFors = new Firebase(FBURL + '/offers/' + targetOfferId + "/internalTradedFor/" + offerId);
            internalTradedFors.set(
                {difference: "0", created: Firebase.ServerValue.TIMESTAMP}
                , function (error) {
                    if (error) {
                        console.log("error saving offer " + error);
                    }
                });
        };

        $scope.dropSwapProposal = function (otherOfferId, targetOfferId) {
            var internalTradedFors = new Firebase(FBURL + '/offers/' + otherOfferId + "/internalTradedFor/" + targetOfferId);
            internalTradedFors.remove(
                function (error) {
                    if (error) {
                        console.log("error removing proposal " + error);
                    }
                });
        };


        /**
         * createNewOffer
         * erstellt ein neues Angebot (im Namen des angemeldeten Benutzers)
         */
        $scope.createNewOffer = function () {
            var newOfferRef = offersRef.push();
            $scope.newOffer.created = Firebase.ServerValue.TIMESTAMP;
            var profile = $scope.profile;
            if (profile === null) {
                throw "profile not bound yet (internal error)"
            }
            $scope.newOffer.offeredBy = profile.name;

            var orderAsJson = angular.toJson($scope.newOffer);
            newOfferRef.set($scope.newOffer, function (error) {
                if (!error) {
                    var newId = newOfferRef.key();
                    const bartersUrl = FBURL + '/barters/' + profile.name + '/offers/' + newId;
                    var bartersRef = new Firebase(bartersUrl);
                    bartersRef.set("true", function (error) {
                        if (error) {
                            console.log("error saving offer " + error);
                        }
                    });
                    console.log("offer saved: " + $scope.newOffer.title)
                    resetNewOffer();
                }
                else {
                    console.log("error saving offer " + error);
                }
            });//newOffer.set
            var path = newOfferRef.toString();
            console.log("saving new offer " + orderAsJson + " in " + path);


        };


    }]);


    /**
     * Route configuration
     */
    app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/my-offers', {
            templateUrl: 'myoffers/myoffers.html',
            controller: 'MyOffersCtrl',
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