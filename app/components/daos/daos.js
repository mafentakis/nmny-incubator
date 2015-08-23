angular.module('daos', ['firebase.utils'])
    .service('swapDao', ['fbutil', '$firebaseObject', function (fbutil, $firebaseObject) {

        var globalSwapRequestRef = fbutil.ref('/swapRequests');
        var globalOffersRef = fbutil.ref('/offers');
        var  bartersGlobalref = fbutil.ref('/barters');


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
         * @property {String} $id
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
         * gets the (first) key in a structure:
         * {
         *   9387219734321431924 : {}
         * }
         * @param object
         */
        function getKey(object){
            var keys = Object.keys(object);
            if (keys && keys[0]){
                return keys[0];
            }
            else {
                return null;
            }

        }

        /**
         *
         * @param {string} swapRequestId
         *
         */
        this.findSwapRequestById = function (swapRequestId) {
            /*SwapRequest*/
            var swapRequest =$firebaseObject(globalSwapRequestRef.child(swapRequestId));

            swapRequest.$loaded().then(function () {
                var offerId = getKey(swapRequest.payFor);
                swapRequest.payFor.offer = $firebaseObject(globalOffersRef.child(offerId));
                swapRequest.payFor.swap = swapRequest.payFor[offerId];

                offerId = getKey(swapRequest.payWith);
                swapRequest.payWith.offer = $firebaseObject(globalOffersRef.child(offerId));
            });
            return swapRequest;

        };//findSwapRequestById
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
        };//findSwapRequestsByOffer
        //..

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


        /**
         *
         * @param {SwapRequest} swapRequest
         */
        this.dropSwapRequest = function (swapRequest) {
            dropReference(globalSwapRequestRef, swapRequest.$id);
            dropReference(globalOffersRef.child(swapRequest.payFor.$id).child("swapRequests"), swapRequest.$id);
            dropReference(globalOffersRef.child(swapRequest.payWith.$id).child("swapRequests"), swapRequest.$id);
        };


        /**
         *
         * @param {OfferId} offerId
         */
        this.dropOffer = function(offerId,userName){
            globalOffersRef.child(offerId).once("value", function (offerSnap) {
                var offer = offerSnap.val();
                if (offer != null) {

                    var offeredBy = offer.offeredBy;
                    angular.forEach(offer.swapRequests, function (swapRequestProperties, swapRequestId) {
                        dropReference(globalSwapRequestRef, swapRequestId);

                    })
                }

            });

            var ref = bartersGlobalref.child(userName).child("offers");
            dropReference(ref,offerId);
            dropReference(globalOffersRef, offerId);


        }



    }])
;


