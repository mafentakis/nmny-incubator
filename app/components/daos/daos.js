angular.module('daos', ['firebase.utils'])
    .service('swapDao', ['fbutil', '$firebaseObject', function (fbutil, $firebaseObject) {

        var globalSwapRequestRef = fbutil.ref('/swapRequests');
        var globalOffersRef = fbutil.ref('/offers');

        /**
         * @typedef {String} OfferId
         *
         * @typedef {Offer} SwapOffer
         * @property {number} amount
         * @property {string} unit
         * @property {OfferId} $id
         *
         *
         * @typedef {Object} SwapRequest
         * @property {number} created
         * @property {string} offeredBy
         * @property {SwapOffer} payFor
         * @property {SwapOffer} payWith



         * @typedef {Object} Offer
         * @property {String} title
         * @property {String} description
         * @property {String[]} swapRequests

         */
        /**
         *
         * @param {FirebaseObject} slave
         * @param {FirebaseObject} index
         * @param {function} childCallback
         */

        /**
         *
         * @param {string} swapRequestId
         *
         */
        this.findSwapRequestById = function (swapRequestId) {
            /*SwapRequest*/
            var swapRequest = $firebaseObject(globalSwapRequestRef.child(swapRequestId));
            swapRequest.$loaded().then(function () {
                var offerId = swapRequest.payFor.offerId;
                swapRequest.payFor.offer = $firebaseObject(globalOffersRef.child(offerId));
                var offerId = swapRequest.payWith.offerId;
                swapRequest.payWith.offer = $firebaseObject(globalOffersRef.child(offerId));
            });
            return swapRequest;

        }//findSwapRequestById
        var findSwapRequestById = this.findSwapRequestById;


        /**
         * @param {Offer} offer
         */
        this.findSwapRequestsByOffer = function (offer) {
            var result = {};
            angular.forEach(offer.swapRequests, function (swapRequestProperties, swapRequestId) {
                var swapRequest = findSwapRequestById(swapRequestId);
                result[swapRequest.$id] = swapRequest;

            });
            return result;
        }//findSwapRequestsByOffer
        //..


    }])
;


