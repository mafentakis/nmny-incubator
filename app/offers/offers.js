(function (angular) {
    "use strict";

    var app = angular.module('myApp.offers', ['firebase.auth', 'firebase', 'firebase.utils', 'ngRoute']);

    app.controller('OffersCtrl', ['$scope', '$timeout', 'fbutil', 'user', '$firebaseObject', 'FBURL', function ($scope, $timeout, fbutil, user, $firebaseObject, FBURL) {

        var profileRef = fbutil.ref('users', user.uid);
        var profile = $firebaseObject(profileRef);
        profile.$bindTo($scope, 'profile');

        var offers = {};
        $scope.offers = offers;

        /*root where are offers are stored*/
        var globalOffersRef = new Firebase(FBURL + '/offers/');
        var globalSwapRequestRef = new Firebase(FBURL + '/swapRequests');


        $scope.otherOffers = {};

        function readOtherOffers() {
            function actualizeScopeOffers(offersSnap, profile) {
                var key = offersSnap.key();

                var offer = offersSnap.val();
                if (offer.offeredBy != profile.name) {
                    $scope.otherOffers[key] = offer;
                }

                /*
                 * denormalize offer.swapRequests.requestId
                 */
                angular.forEach(offer.swapRequests, function (swapRequestProperties, swapRequestId) {
                    globalSwapRequestRef.child(swapRequestId).on('value', function (swapRequestSnap) {
                        console.log("processing swap request " + swapRequestId + " for order " + key);
                        if (swapRequestSnap.val() != null) {
                            var swapRequest = swapRequestSnap.val();
                            swapRequestProperties.swapRequest = swapRequest;
                        }
                    });
                });
            }

            profileRef.on("value", function (profileSnapshot) {
                    var profile = profileSnapshot.val();
                    globalOffersRef.on('child_added', function (offersSnap) {
                        actualizeScopeOffers(offersSnap, profile);
                    });
                    globalOffersRef.on('child_changed', function (offersSnap) {
                        actualizeScopeOffers(offersSnap, profile);
                    });
                    globalOffersRef.on('child_removed', function (offersSnap) {
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
                globalOffersRef.child(offerId).on('value', function (offerSnap) {
                    if (offerSnap.val() != null) {
                        var offer = offerSnap.val();
                        offer.alien = true;
                        $scope.offers[offerId] = offer;
                        tradeProperties.offer = offer;
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
            globalOffersRef.child(offerId).on('value', function (offerSnap) {
                var offer = offerSnap.val();
                //console.log('offer:' + offer);
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
            });//globalOffersRef.child
        }

        /*readOfferByOfferId*/

        function readOwnOffers(profile) {
            var offersUrl = FBURL + '/barters/' + profile.name + '/offers';
            var offersRef = new Firebase(offersUrl);
            offersRef.on('child_added', function (offersSnap) {
                // fetch the book and put it into our list
                var offerId = offersSnap.key();
                // console.log('offer:' + offerId);
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


        $scope.empty = function (object) {
            if (object) {
                return Object.keys(object).length == 0;
            }
            return true;
        },

            $scope.keyCount = function (object) {
                if (object) {
                    return Object.keys(object).length;
                }
                return 0;
            }

        function saveReference(firebaseRef){
            firebaseRef.set({created: Firebase.ServerValue.TIMESTAMP}, function (error) {
                if (error) {
                    alert("error saving reference " +firebaseRef.toString()+" error:"+error);
                }
                console.log("saved reference " +firebaseRef.toString()+" error:"+error);
            });


        }

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


        $scope.createSwapRequestFacade = function (otherOfferId, otherOffer) {
            var swapRequestFacade = {
                his: {
                    offerId: otherOfferId,
                    unit: otherOffer.unit,
                    amount: 1
                },
                item: {
                    offerId: "null",
                    unit: "",
                    amount: 1

                },
                visibleDialog: true,
                save: function () {
                    console.log("saving swap request: " + angular.toJson(this));

                    if (!this.item.offerId) {
                        throw "item.offerId expected";
                    }
                    this.item.unit = $scope.offers[this.item.offerId].unit;

                    //only one item for swapping supported
                    var swapRequestKey = "swapReq:" + generatePushID();

                    var swapRequestRef = new Firebase(FBURL + '/swapRequests/' + swapRequestKey);

                    swapRequestRef.set(
                        {
                            created: Firebase.ServerValue.TIMESTAMP,
                            offeredBy: $scope.profile.name,
                            payWith: this.item,
                            payFor: this.his
                        }
                        , function (error) {
                            if (error) {
                                alert("error saving offer " + error);
                            }
                            console.log("swap request saved: " + swapRequestRef.key());
                        });
                    saveReference(new Firebase(FBURL + '/offers/' + otherOfferId + "/swapRequests/" + swapRequestKey));
                    saveReference(new Firebase(FBURL + '/offers/' + this.item.offerId + "/swapRequests/" + swapRequestKey));


                }
            }
            return swapRequestFacade;
        }


        /**
         * gibt true wenn die offerId
         * @param offer Fremdes Produkt
         * @param offerId das eigene produkt
         * @returns {boolean}
         */
        $scope.isOfferAllreadyUsed = function (otherOffer, offerId) {
            return true;
            //todo fixme

            if (otherOffer.internalTradedFor) {
                var tradeExists = otherOffer.internalTradedFor[offerId] != null;
                return !tradeExists;
            }


            return true;
        };

        $scope.swapProposalsDialogShown = {};
        $scope.toogleSwpapProposalsDialog = function (offerId) {
            $scope.swapProposalsDialogShown[offerId] = !$scope.swapProposalsDialogShown[offerId];
        }


        $scope.countSwapProposals = function (offer) {
            if (!offer.internalTradedFor) {
                return 0;
            }
            return Object.keys(offer.internalTradedFor).length;
        };

        function dropReference(ref, key) {
            var firebaseRef = ref.child(key);
            firebaseRef.set(null, function (error) {
                if (error) {
                    alert(error);
                }
                else {
                    console.log("droped reference to " + key + " firebaseRef, " + firebaseRef.toString());
                }
            });
        }


        $scope.dropSwapRequest = function (swapRequestId, offerId) {
            dropReference(globalSwapRequestRef, swapRequestId);
            dropReference(globalOffersRef.child(offerId).child("swapRequests"), swapRequestId);
        };


        /**
         * drops Offers and all references
         * @param offerId
         */
        $scope.dropOffer = function (offerId) {
            if (!confirm("soll diese Offer wirklich gelsöcht werden?")){
               return;
            }

            globalOffersRef.child(offerId).once("value", function (offerSnap) {
                var offer = offerSnap.val();
                if (offer != null) {
                    angular.forEach(offer.swapRequests, function (swapRequestProperties, swapRequestId) {
                        dropReference(globalSwapRequestRef, swapRequestId);

                    })
                }

            });

            dropReference(globalOffersRef, offerId);
            //TODO ist nicht so einfach: dropReference(globalSwapRequestRef,??ID);

            var offersUrl = FBURL + '/barters/' + profile.name + '/offers';
            dropReference(new Firebase(offersUrl), offerId);

            //todo better use promisses here
        };


        /**
         * createNewOffer
         * erstellt ein neues Angebot (im Namen des angemeldeten Benutzers)
         */
        $scope.createNewOffer = function (newOffer) {
            $scope.statusText = "wird gespeichert";

            var newOfferRef = globalOffersRef.push();
            newOffer.created = Firebase.ServerValue.TIMESTAMP;
            var profile = $scope.profile;
            if (profile === null) {
                throw "profile not bound yet (internal error)"
            }
            newOffer.offeredBy = profile.name;

            newOfferRef.set(newOffer, function (error) {
                if (!error) {
                    var newId = newOfferRef.key();
                    var bartersUrl = FBURL + '/barters/' + profile.name + '/offers/' + newId;
                    var bartersRef = new Firebase(bartersUrl);
                    bartersRef.set("true", function (error) {
                        if (error) {
                            console.log("error saving offer " + error);
                        }
                    });
                    console.log("offer saved: " + angular.toJson(newOffer) + " in " + newOfferRef.toString());
                    $scope.statusText = "offer saved: " + newOfferRef.toString();
                    newOffer.title = "";
                    newOffer.description = "";
                    newOffer.unit = "";
                    $timeout(function () {
                        $scope.statusText = "";

                    }, 2000);

                }
                else {
                    $scope.statusText = "error saving offer " + error;
                    console.log("error saving offer " + error);
                }
            });//newOffer.set
        };


    }]);


    /**
     * Route configuration
     */
    app.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/offers', {
            templateUrl: 'offers/offers.html',
            controller: 'OffersCtrl',
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