var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

var sts = new AWS.STS()




exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('check_request_body', function () {

        console.log(event.body);
        if (!event.body.FlightId ) {
            context.fail(JSON.stringify({
                "data": null,
                "error": {
                    "code": 400,
                    "message": "Missing/Invalid FlightId",
                    "type": "Missing Parameters",
                    "should_display_error": "false"
                },
                "statusCode": 400
            }));
            return;
        }
        if (!event.body.OperatorId ) {
            context.fail(JSON.stringify({
                "data": null,
                "error": {
                    "code": 400,
                    "message": "Missing/Invalid OperatorId",
                    "type": "Missing Parameters",
                    "should_display_error": "false"
                },
                "statusCode": 400
            }));
            return;
        }
        if (!event.body.OperatorName ) {
            context.fail(JSON.stringify({
                "data": null,
                "error": {
                    "code": 400,
                    "message": "Missing/Invalid OperatorName",
                    "type": "Missing Parameters",
                    "should_display_error": "false"
                },
                "statusCode": 400
            }));
            return;
        }
        wf.FlightId = event.body.FlightId
        console.log("wf.FlightId", wf.FlightId);
        wf.emit('schedule_flight');
    });


    wf.once('schedule_flight', function () {
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

                AWS.config.update({

                    accessKeyId: dataAccount.Credentials.AccessKeyId,

                    secretAccessKey: dataAccount.Credentials.SecretAccessKey,

                    sessionToken: dataAccount.Credentials.SessionToken

                });
                const docClient = new AWS.DynamoDB.DocumentClient({
                    "region": process.env.AwsRegion
                });
                var params = {
                    TableName: 'Mission',
                    IndexName: 'FlightId',
                    KeyConditionExpression: 'FlightId = :FlightId',
                    ExpressionAttributeValues: {
                        ':FlightId': event.body.FlightId
                    }
                };
                // console.log(params);
                docClient.query(params, function (err, data) {
                    // console.log("error2")
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
                          console.log('DroneId',data.Items[0].DroneId)
                           var params = {
            TableName: 'Drone',
            Key:{
                "DroneId":data.Items[0].DroneId
            },
            ProjectionExpression: ['DroneNum','Model','DroneId','UAVInfoType']

        };
                  docClient.get(params,function(err,data){
            if (err){
                context.fail(JSON.stringify({
                    "error": {
                        "code": 500,
                        "message": "Internal server!!!!!!!!"+err,
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            }
            else{ 
                console.log(data)
                if(data.Item == undefined) {
                    context.done(null, {
                        "data":{
                          "MainData": {}
                        },
                        "error": null,
                        "statusCode": 200
                    });
                    return;
                } else {                    
                    wf.droneDetails = data.Item;
                    context.done(null, {
                    "data": {
                        "MainData":  wf.droneDetails,
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
                    // wf.emit('get_mission_details')
                }
            }
        });       
                        // console.log(result)
                        // context.done(null, {
                        //     "data": {
                        //         "MainData": data
                        //     },
                        //     "error": null,
                        //     "statusCode": 200
                        // });
                        // return;
                    }
                })




            }

        });
    }

    )





    wf.emit('check_request_body');
};
