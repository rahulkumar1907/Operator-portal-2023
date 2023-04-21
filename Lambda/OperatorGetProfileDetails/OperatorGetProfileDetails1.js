var AWS = require("aws-sdk");
 
const ddb = new AWS.DynamoDB.DocumentClient({region :process.env.AWS_Region});


exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    
    wf.once('check_request_body', function() {
        var parameters = '/';
        var operatorProfile = new Object();
        operatorProfile.OperatorId = event.body.hasOwnProperty('OperatorId')==true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' :event.body.OperatorId : '';
        
   

        if(operatorProfile.OperatorId.length == 0) { parameters = parameters+'OperatorId/' }
       

        if(parameters.length > 1){
          context.fail(JSON.stringify({
              "data":null,
              "error": {
                "code": 400,
                "message": "Missing/Invalid parameters "+parameters,
                "type": "Missing/Invalid parameters",
                "should_display_error": "false"
              },
              "statusCode": 400
          }));
          return;
        } else {
          wf.emit('operator_get__profile_detail');        }
    });

    wf.once('operator_get__profile_detail', function(){
      const params = {
        TableName :process.env.FMSPeopleTableName,
      Key:{EmployeeID:event.body.OperatorId}
    }
      ddb.get(params, function(err, data) {
        if (err) {
            console.log(err);
            context.fail(JSON.stringify({
                "data":null,
                "error": {
                  "code": 500,
                  "message": "Internal server error",
                  "type": "Server Error",
                  "should_display_error": "false"
                },
                "statusCode": 500
            }));
            return;
          }
          if(!data.Item){
             context.fail(JSON.stringify({
                "data":null,
                "error": {
                  "code": 400,
                  "message": "No Record Found",
                  "type": "Client Not Register",
                  "should_display_error": "false"
                },
                "statusCode": 400
            }));
            return;
          }
        // }
        else {
           context.done(null,{
               "data":{
                 "MainData": data.Item
               },
               "error": null,
               "statusCode": 200
           });
          return;
        }
      });
    });


    wf.emit('check_request_body');
};