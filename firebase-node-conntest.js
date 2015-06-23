/**
 * Created by ceh6yu on 03.06.2015.
 */
//npm install -g request
    //set HTTP_PROXY=http://localhost:3128
    //set HTTPS_PROXY=http://localhost:3128



var request = require('request')
    , rand = Math.floor(Math.random()*100000000).toString()
    ;
request(
    { method: 'PUT'
        , uri: 'http://mikeal.iriscouch.com/testjs/' + rand
        , multipart:
        [ { 'content-type': 'application/json'
            ,  body: JSON.stringify({foo: 'bar', _attachments: {'message.txt': {follows: true, length: 18, 'content_type': 'text/plain' }}})
        }
            , { body: 'I am an attachment' }
        ]
    }
    , function (error, response, body) {
        console.log('error: '+ error);

        if ((response)&&(response.statusCode == 201)){
            console.log('document saved as: http://mikeal.iriscouch.com/testjs/'+ rand)
        } else {
            console.log('error: '+ response.statusCode)
            console.log(body)
        }
    }
)