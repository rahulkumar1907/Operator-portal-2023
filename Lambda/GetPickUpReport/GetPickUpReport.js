var AWS = require("aws-sdk");
 
const ddb = new AWS.DynamoDB.DocumentClient({region :process.env.AWSRegion});


exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    
    wf.once('check_request_body', function() {
        var parameters = '/';
        var operator = new Object();
        operator.OperatorId = event.body.hasOwnProperty('OperatorId')==true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' :event.body.OperatorId : '';
        operator.FlightId = event.body.hasOwnProperty('FlightId')==true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' :event.body.FlightId : '';
       
        if(operator.OperatorId.length == 0) { parameters = parameters+'OperatorId/' }
        if(operator.FlightId.length == 0) { parameters = parameters+'FlightId/' }

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
          wf.operator = operator;
          wf.emit('get_Flight_status');        }
    });
    wf.once('get_Flight_status', function(){
       const params = {
            TableName: process.env.FlightTableName,
            Key:{"FlightId":event.body.FlightId}
       }
      // console.log("flightid",event.body.FlightId)
      ddb.get(params, function(err, data) {
        if (err) {
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
        
        else {
          // console.log(data)
          if(data.Item.Status=="In Transit" || data.Item.Status=="Scheduled" || data.Item.Status=="Delivered" ){
              wf.emit('get_pick_up_detail')
          }
          else{
            context.fail(JSON.stringify({
                "data":null,
                "error": {
                  "code": 400,
                  "message": "No PickUp Details Found Yet",
                  "should_display_error": "false"
                },
                "statusCode": 400
            }));
            return;  
          }
        }
      });
    });
    wf.once('get_pick_up_detail', function(){
       const params = {
            TableName: process.env.PickupTableName,
            IndexName: "FlightId",
            KeyConditionExpression: '#FlightId = :FlightId',
            ExpressionAttributeNames: {
                "#FlightId": "FlightId",
                
            },
            ExpressionAttributeValues: {
                ":FlightId": event.body.FlightId,
            }
        };
      ddb.query(params, function(err, data) {
        if (err) {
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
        
        else {
           context.done(null,{
               "data":{
                 "MainData": data.Items
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