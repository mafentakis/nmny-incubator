(function (angular) {
    "use strict";

    /**
     * @typedef {Object} Product
     * @property {String} id
     * @property {String} title
     * @property {String} description
     * @property {String[]} incomingSwapRequests
     * @property {String[]} outgoingSwapRequests
     * @property {String[]} images
     */

    /**
     *  @typedef {Object} ExcangeItem
     *  @property {String} productId
     * @property {String} amount
     *@property {String} unit
     */


    var app = angular.module('myApp.home', ['firebase.auth', 'firebase', 'firebase.utils', 'ngRoute', 'ngResource']);

    app.factory("Product", function ($resource) {
        return $resource("http://localhost:8080/product/:id");
    });


    app.controller('MyOffersCtrl', ['$scope', '$timeout', 'fbutil', 'user', '$firebaseObject', 'FBURL', 'Product', function ($scope, $timeout, fbutil, user, $firebaseObject, FBURL, Product) {
        function loadProducts() {
            $scope.loading = true;
            Product.query(function (data) {
                $scope.products = data;
            });
            $scope.loading = false;
        }

        loadProducts();

        /*
         "payFor" : {
         "amount" : 1,
         "productId" : "5605d1688e57f536d00d29c0"
         },
         */

        /**
         *
         * @param {Product} targetProduct
         * @returns {{
         *      visibleDialog: boolean,
         *      payFor:ExcangeItem,
         *      payWith:ExcangeItem,
         *      close:Function,
         *      save: Function}}
         */
        $scope.createSwapRequestFacade = function (targetProduct) {
            var targetProductId = targetProduct.id;
            var swapRequestFacade = {
                payFor: {
                    productId: targetProductId
                },
                payWith: {
                    productId: []
                },
                close:function(){
                    this.visibleDialog=false;
                },
                visibleDialog: true,
                save: function () {
                    console.log("saving swap request: " + angular.toJson(this));
                    this.visibleDialog=false;
                    /*
                    console.log("saving swap request: " + angular.toJson(this));

                    if (!this.item.offerId) {
                        throw "item.offerId expected";
                    }
                    this.item.unit = $scope.offers[this.item.offerId].unit;

                    //only one item for swapping supported
                    var swapRequestKey = "SR" + generatePushID();
                    var swapRequestRef = new Firebase(FBURL + '/swapRequests/' + swapRequestKey);

                    function createInKey(key, object) {
                        var result = {};
                        result[key] = object;
                        return result;
                    }

                    var newSwapRequest = {
                        created: Firebase.ServerValue.TIMESTAMP,
                        offeredBy: $scope.profile.name,
                        payWith: createInKey(this.item.offerId, this.item),
                        payFor: createInKey(targetProductId, this.his)
                    };

                    swapRequestRef.set(
                        newSwapRequest
                        , function (error) {
                            if (error) {
                                alert("error saving offer " + error);
                            }
                            console.log("swap request saved: " + swapRequestRef.key());
                        });
                    saveReference(new Firebase(FBURL + '/offers/' + targetProductId + "/swapRequests/" + swapRequestKey));
                    saveReference(new Firebase(FBURL + '/offers/' + this.item.offerId + "/swapRequests/" + swapRequestKey));
                */}
            }
            return swapRequestFacade;
        }


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