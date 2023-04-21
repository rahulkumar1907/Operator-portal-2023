var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

var sts = new AWS.STS()

const TableName = process.env.FlightTableName
const OrganizationTable = process.env.OrganizationTable;
const LambdaInvokeFunction1 = process.env.LambdaInvokeFunction1;


exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('check_request_body', function () {

        console.log(event.body);
        wf.FlightId = event.body.FlightId
        console.log("wf.FlightId", wf.FlightId);
        wf.emit('get_flight_details');
    });
    wf.once('get_flight_details',function(){
         const params = {
            "TableName": TableName,
            Key: {
                "FlightId": wf.FlightId,
            }
         }
         
          docClient.get(params, function (err, data) {
            if (err) {
                console.log("error2")
                console.log("Error", err);
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
            }
            else {
                console.log(data)
                if(data.Item.Status == 'Scheduled'){
                    // console.log("Flight has been already approved")
                    context.done(null, {
                    "data": {
                        "MainData": "Flight has been approved Already"
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
                }
                else {
                    console.log("Flight needs to be approved")
                    wf.emit('schedule_flight')
                }
            }
        })
         
    })

    wf.once('schedule_flight', function () {

        const params = {
            "TableName": TableName,
            Key: {
                "FlightId": wf.FlightId,
            },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'set #Status = :Status ,#FirstApproval = :FirstApproval',
            ExpressionAttributeNames: {
                '#Status': 'Status',
                '#FirstApproval': 'FirstApproval',
            },
            ExpressionAttributeValues: {
                ':Status': 'Scheduled',
                ':FirstApproval': true
            },
        };

        docClient.update(params, function (err, data) {
            if (err) {
                console.log("Error", err);
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
            }
            else {
                // console.log(data);
                // console.log(data.Attributes);
                sts.assumeRole({

                    RoleArn: process.env.ARN,

                    RoleSessionName: 'test-session'

                }, function (err, dataAccount) {

                    if (err) { // an error occurred

                        console.log('Cannot assume role');
                        console.log(err, err.stack);
                        context.fail(JSON.stringify({
                            "data": null,
                            "error": {
                                "code": 500,
                                "message": err.message,
                                "type": "Server Error",
                                "should_display_error": "false"
                            },
                            "statusCode": 500
                        }));
                        return;

                    } else { // successful response

                        console.log(dataAccount);

                        // AWS.config.update({

                        //     accessKeyId: dataAccount.Credentials.AccessKeyId,

                        //     secretAccessKey: dataAccount.Credentials.SecretAccessKey,

                        //     sessionToken: dataAccount.Credentials.SessionToken

                        // });

                        // const lambda = new AWS.Lambda({
                        //     region: process.env.AwsRegion
                        // });

                        // let payload = {
                        //     "FlightId": data.Attributes.FlightId,
                        //     "DroneId": data.Attributes.DroneId,
                        //     "DroneName": data.Attributes.DroneName,
                        //     "BufferRegion": data.Attributes.BufferRegion,
                        //     "Altitude": data.Attributes.Altitude,
                        //     "ActivityType": data.Attributes.ActivityType,
                        //     "WayPointNum": data.Attributes.WayPointNum,
                        //     "Waypoints": data.Attributes.Waypoints,
                        //     "PilotId": data.Attributes.Pilotdetails[0]["PilotId"],
                        //     "StartTime": data.Attributes.StartTime,
                        //     "EndTime": data.Attributes.EndTime,
                        //     "Lattitude": data.Attributes.Latitude,
                        //     "Longitude": data.Attributes.Longitude
                        // }
                        // console.log(payload);

                        // lambda.invoke({
                        //     FunctionName: LambdaInvokeFunction1,
                        //     Payload: JSON.stringify({
                        //         "body": payload
                        //     }, null) // pass params
                        // }, function(error, data) {
                        //     if (error) {
                        //         console.log(error)
                        //     } else {
                        //         console.log(data);
                                
                        //     }
                        // });
                        wf.emit('get_OrgId_from_FlightTable')

                    }

                });
            }
        });
    })

    wf.once('get_OrgId_from_FlightTable', function () {
        const params = {
            TableName: TableName,
            Key: {
                "FlightId": wf.FlightId
            }
        }
        docClient.get(params, function (err, data) {
            console.log("error2")
            if (err) {
                console.log("error2")
                console.log("Error", err);
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
            }
            else {
                wf.OrganizationId = data.Item.OrganizationId
                console.log("Org",wf.OrganizationId)
                wf.emit('update_flightCount_in_Organization')
            }
        })
    })

    wf.once('update_flightCount_in_Organization', function () {
        docClient.update({
            "TableName": OrganizationTable,
            "Key": {
                "OrganizationId": wf.OrganizationId
            },
            "ExpressionAttributeValues": {
                ":a": 1
            },
            "ExpressionAttributeNames": {
                "#v": "NumOfFlightsAvailable"
            },
            "UpdateExpression": "SET #v = #v - :a",
            "ReturnValues": "UPDATED_NEW"

        }, function (err, data) {
            if (err) {
                console.log(err);
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
            } else {
                console.log('has been approved')
                context.done(null, {
                    "data": {
                        "MainData": "Flight has been approved"
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }
        });
    })

    wf.emit('check_request_body');
};
