var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

var sts = new AWS.STS()
var s3 = new AWS.S3();



exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('check_request_body', function () {

        console.log(event.body);
        if (!event.body.FlightId) {
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
        if (!event.body.OperatorId) {
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
        if (!event.body.OperatorName) {
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
        wf.emit('get_Buffer');
    });


    wf.once('get_Buffer', function () {
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
                const S3BucketURL = process.env.S3BucketURL;
                const ReplaceVariable = process.env.ReplaceVariable;
                var s3 = new AWS.S3();

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
                        console.log('data', data.Items[0].MissionId)
                         wf.MissionId=data.Items[0].MissionId
                        var params = {
                            Bucket: S3BucketURL,
                            Key: event.body.PreAndPostFlightURL.replace(ReplaceVariable, '')
                        };
                        // console.log(result)
                        console.log(params);
                        s3.getObject(params, function (err, data) {
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
                            }
                            else {
                               
                                wf.buffer = data.Body
                                wf.emit('store_buffer_details_for_pdf')

                            }
                        });
                    }
                })
            }
        });
    }

    )

    wf.once('store_buffer_details_for_pdf', function () {
        console.log("buffer", wf.buffer)
        let Timestamp = new Date().toISOString().slice(0,10);
        var params = {
            'Bucket': process.env.PreFlightPostFlightBucket,
            'Key': 'FlightReport/' + event.body.FlightId + '/Detail/detail_' + wf.MissionId+"-" +Timestamp+ '.' + "pdf",
            'Body': wf.buffer,
            'ACL': "public-read",
        };

        s3.upload(params, function (err, data) {
            if (err) {
                console.log("error7")
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
                // console.log(data.Location)
                // console.log(data);
                context.done(null, {
                    "data": {
                        "MainData": data.Location
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }
        })
    });

    wf.emit('check_request_body');
};
