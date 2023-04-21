var AWS = require("aws-sdk");
 
const ddb = new AWS.DynamoDB.DocumentClient({region :process.env.AWSRegion});


exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    
    wf.once('check_request_body', function() {
        var parameters = '/';
        var operator = new Object();
        operator.OperatorId = event.body.hasOwnProperty('OperatorId')==true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' :event.body.OperatorId : '';
        operator.OperatorName = event.body.hasOwnProperty('OperatorName')==true ? event.body.OperatorName.length == 0 ? event.body.OperatorName = '' :event.body.OperatorName : '';

       
        if(operator.OperatorId.length == 0) { parameters = parameters+'OperatorId/' }
        if(operator.OperatorName.length == 0) { parameters = parameters+'OperatorName/' }
       

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
        const Params = {
            TableName: process.env.TableName,
            FilterExpression: 'contains (Pilotdetails, :sendToVal) AND (#SStatus =:Scheduled OR #IStatus =:intransit)',
            ExpressionAttributeValues: {
                ":sendToVal": {
            "PilotId" : event.body.OperatorId,
            "PilotName" : event.body.OperatorName
        },
                ":Scheduled": 'Scheduled',
                ":intransit": 'In Transit'

            },
            ExpressionAttributeNames: {
                "#SStatus": "Status", "#IStatus": "Status"
            }
        }
      // console.log("flightid",event.body.FlightId)
      ddb.scan(Params, function(err, data) {
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