var AWS = require("aws-sdk");

var sts = new AWS.STS();

exports.handler = (event, context, callback) => {
    var EventEmitter = require("events").EventEmitter;
    var wf = new EventEmitter();

    wf.once('check_request_body', function () {
        console.log(event)
        var parameters = '/';
        var Mission = new Object();
        Mission.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';



        if (Mission.FlightId.length == 0) { parameters = parameters + 'FlightId/' }

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

            sts.assumeRole(
                {
                    RoleArn: process.env.ARN,

                    RoleSessionName: "test-session",
                },
                async function (err, dataAccount) {
                    if (err) {
                        // an error occurred
                        console.log("error3", err);
                        console.log("Cannot assume role");
                        console.log(err, err.stack);
                        context.fail(
                            JSON.stringify({
                                data: null,
                                error: {
                                    code: 500,
                                    message: err.message,
                                    type: "Server Error",
                                    should_display_error: "false",
                                },
                                statusCode: 500,
                            })
                        );
                        return;
                    } else {
                        // successful response
                        wf.FlightId = event.body.FlightId,


                            console.log(dataAccount);

                        AWS.config.update({
                            accessKeyId: dataAccount.Credentials.AccessKeyId,

                            secretAccessKey: dataAccount.Credentials.SecretAccessKey,

                            sessionToken: dataAccount.Credentials.SessionToken,
                        });
                        console.log("suucessfull");

                        const dClient = new AWS.DynamoDB.DocumentClient({
                            region: "ap-south-1",
                        });
                        var params = {
                            TableName: 'Mission',
                            IndexName: 'FlightId',
                            KeyConditionExpression: 'FlightId = :FlightId',
                            ExpressionAttributeValues: {
                                ':FlightId': event.body.FlightId
                            }
                        };
                        dClient.query(params, function (err, data) {
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
                                // console.log("MissionId", data.Items[0].MissionId)
                                // wf.MissionId = data.Items[0].MissionId
                                if(data){
                                context.done(null, {
                                    "data": {
                                        "MainData": data.Items[0]
                                    },
                                    "error": null,
                                    "statusCode": 200
                                });
                                return;
                                }else{
                                    context.fail(null, {
                                    "data": {
                                        "MainData": "Mission Get Rejected Due to some Reson"
                                    },
                                    "error": null,
                                    "statusCode": 500
                                });
                                return;
                                }


                            }
                        })

                    }
                }
            );
        }
    });


    wf.emit("check_request_body");
};
