var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

var sts = new AWS.STS()

exports.handler = (event, context, callback) => {

    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('check_request_body', function () {
        var parameters = '/';
        var Mission = new Object();
        Mission.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';

        if (Mission.FlightId.length == 0) { parameters = parameters + 'FlightId/' }


        if (parameters.length > 1) {
            console.log("error1")
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
            wf.FlightId = Mission.FlightId;
            wf.emit('update_mission_status_to_cancel_in_utm');
        }
    })

    wf.once("update_mission_status_to_cancel_in_utm", function () {
        sts.assumeRole({

            RoleArn: process.env.ARN,

            RoleSessionName: 'test-session'

        }, function (err, data) {

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

                console.log(data);

                AWS.config.update({

                    accessKeyId: data.Credentials.AccessKeyId,

                    secretAccessKey: data.Credentials.SecretAccessKey,

                    sessionToken: data.Credentials.SessionToken

                });

                const dClient = new AWS.DynamoDB.DocumentClient({
                    "region": process.env.AwsRegion
                });

                var params = {
                    TableName: "Mission",
                    FilterExpression: "FlightId = :FlightId",
                    ExpressionAttributeValues: {
                        ":FlightId": event.body.FlightId
                    }
                }
                console.log(params);

                dClient.scan(params, onScan);
                wf.MissionList = [];

                function onScan(err, data) {
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
                    } else {        
                        console.log("Scan succeeded.");
                        console.log(data);

                        // continue scanning if we have more items
                        if (typeof data.LastEvaluatedKey != "undefined") {
                            wf.MissionList = wf.MissionList.concat(data.Items);
                            console.log("Scanning for more...");
                            // console.log(wf.TempUpcomingMission);
                            params.ExclusiveStartKey = data.LastEvaluatedKey;
                            dClient.scan(params, onScan);
                        } else {
                            console.log('end');
                            wf.MissionList = wf.MissionList.concat(data.Items);  
                            console.log(wf.MissionList[0]);
                            if(!wf.MissionList[0].MissionId||wf.MissionList[0].MissionId==undefined||wf.MissionList[0].length==0){
                                context.done(null, {
                                                "data": {
                                                    "MainData": "Updation success"
                                                },
                                                "error": null,
                                                "statusCode": 200
                                            });
                                            return;
                            }
                            var params1 = {
                                TableName: "Mission",
                                Key: {
                                    "MissionId": wf.MissionList[0].MissionId
                                },
                                ReturnValues: 'ALL_NEW',
                                UpdateExpression: 'set #MissionStatus = :MissionStatus, #ApprovalMode = :ApprovalMode, #TS_Updated = :TS_Updated',
                                ExpressionAttributeNames: {
                                    '#MissionStatus': 'MissionStatus',
                                    '#ApprovalMode': 'ApprovalMode',
                                    '#TS_Updated': 'TS_Updated'
                                },
                                ExpressionAttributeValues: {
                                    ':MissionStatus': "Rejected",
                                    ':ApprovalMode': "Manual",
                                    ':TS_Updated': Created_Timestamp
                                }
                            };
                            console.log(params1);
                            dClient.update(params1, function(err, data) {
                                if (err) {
                                    console.log(err)
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
                                    console.log("Updation success in Mission table");
                                    var params2 = {
                                        TableName: "BufferRegion",
                                        Key: {
                                            "MissionId": wf.MissionList[0].MissionId
                                        },
                                        ReturnValues: 'ALL_NEW',
                                        UpdateExpression: 'set #MissionStatus = :MissionStatus, #TS_Updated = :TS_Updated',
                                        ExpressionAttributeNames: {
                                            '#MissionStatus': 'MissionStatus',
                                            '#TS_Updated': 'TS_Updated'
                                        },
                                        ExpressionAttributeValues: {
                                            ':MissionStatus': "Rejected",
                                            ':TS_Updated': Created_Timestamp
                                        }
                                    };
                                    dClient.update(params2, function(err, data) {
                                        if (err) {
                                            console.log(err)
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
                                            context.done(null, {
                                                "data": {
                                                    "MainData": "Updation success on buffer region table"
                                                },
                                                "error": null,
                                                "statusCode": 200
                                            });
                                            return;
                                        }
                                    });
                                }
                            })

                        }
                    }
                }

                
            }

        });
    })

    wf.emit('check_request_body')
};
