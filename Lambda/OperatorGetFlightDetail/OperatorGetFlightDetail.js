var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});


const TableName = process.env.TableName;

exports.handler = (event, context, callback) => {

    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }


    wf.once('check_request_body', function () {
        console.log(event.body)
        var parameters = '/';
        var operator = new Object();
        operator.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';

        if (operator.FlightId.length == 0) { parameters = parameters + 'FlightId/' }

        if (parameters.length > 1) {
            context.fail(JSON.stringify({
                "data": null,
                "error": {
                    "code": 400,
                    "message": "Missing/Invalid parameters " + parameters,
                    "type": "Missing/Invalid parameters",
                    "should_display_error": "false"
                },
                "statusCode": 400
            }));
            return;
        } else {
            wf.emit('get_flight_detail_from_db')
           

        }
    })

    wf.once('get_flight_detail_from_db', function () {
    
        var params = {
            TableName: "Flight",
            Key:{
                "FlightId":event.body.FlightId
            }
          
        }

        docClient.get(params,function(err,data){
             if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 500,
                        "message": "Internal server error",
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            }else{
                wf.FlightData=data
                wf.takeOffPilotEmail=data.Item.TakeOffPilot
                wf.LandingPilotEmail=data.Item.LandingPilot
                console.log("wf.takeOffPilotEmail",wf.takeOffPilotEmail)
                console.log("wf.LandingPilotEmail",wf.LandingPilotEmail)
                wf.emit('get_take_off_pilot_name')
                // context.done(null, {
                //         "data": {
                //             "MainData": data

                //         },
                //         "error": null,
                //         "statusCode": 200
                //     });
                //     return;
            }
        });

     
    });
    wf.once('get_take_off_pilot_name', function () {
    
        const params = {
                    TableName: 'FMSPEOPLE',
                    IndexName: 'EmailAddress-index', // optional if you have a secondary index on MissionId
                    KeyConditionExpression: 'EmailAddress = :EmailAddress',
                    ExpressionAttributeValues: {
                        ':EmailAddress': wf.takeOffPilotEmail
                    },
                };

        docClient.query(params,function(err,data){
             if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 500,
                        "message": "Internal server error",
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            }else{
               wf.FlightData.TakeOffPilotName = data.Items[0].Name
                console.log("wf.takeOffPilotEmail",wf.takeOffPilotEmail)
                wf.emit('get_landing_pilot_name')
                // context.done(null, {
                //         "data": {
                //             "MainData": data

                //         },
                //         "error": null,
                //         "statusCode": 200
                //     });
                //     return;
            }
        });

     
    });
    wf.once('get_landing_pilot_name', function () {
    
        const params = {
                    TableName: 'FMSPEOPLE',
                    IndexName: 'EmailAddress-index', // optional if you have a secondary index on MissionId
                    KeyConditionExpression: 'EmailAddress = :EmailAddress',
                    ExpressionAttributeValues: {
                        ':EmailAddress':  wf.LandingPilotEmail
                    },
                };

        docClient.query(params,function(err,data){
             if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 500,
                        "message": "Internal server error",
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            }else{
               wf.FlightData.LandingPilotName = data.Items[0].Name
                console.log("wf.takeOffPilotEmail",wf.takeOffPilotEmail)
                // wf.emit('get_landing_pilot_name')
                context.done(null, {
                        "data": {
                            "MainData":  wf.FlightData

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