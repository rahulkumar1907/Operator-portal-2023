const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ region: process.env.AWSRegion });

const lambda = new aws.Lambda({
    region: process.env.AwsRegion
});
const LambdaInvokeFunction1 = process.env.LambdaInvokeFunction1;

exports.handler = (event, context, callback) => {
    try {
        if (!(event.body.FlightId) || event.body.FlightId == "undefined") { return ({ "statusCode": 400, "error": "Missing/Invalid FlightId", "error_type": "Bad Request" }) }

        let payload = {
            "FlightId": event.body.FlightId
        }
        console.log(payload)

        lambda.invoke({
            FunctionName: LambdaInvokeFunction1,
            Payload: JSON.stringify({
                "body": payload
            }, null) // pass params
        }, function (error, data) {
            if (error) {
                console.log(error)
            } else {
                console.log(data);

            }
        });


         const params = {
            "TableName": process.env.TableName,
            Key: {
                "FlightId": event.body.FlightId,
            },
            UpdateExpression: 'set #Status = :Status,#ReasonOfCancellation = :ReasonOfCancellation',
            ExpressionAttributeNames: {
                '#Status': 'Status',
                '#ReasonOfCancellation': 'ReasonOfCancellation',
            },
            ExpressionAttributeValues: {
                ':Status': 'Cancelled',
                ':ReasonOfCancellation': event.body.cancelReason||"Cancelled By Operator"
            },
            ReturnValues: 'ALL_NEW',
        };

        ddb.update(params, function (err, data) {
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
                const params = {
                    TableName: process.env.TableName,
                    Key: {
                        "FlightId": event.body.FlightId,
                    }
                }
                ddb.get(params, function (err, data) {
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
                        let OrganizationId = data.Item.OrganizationId

                        ddb.update({
                            "TableName": process.env.OrganizationTable,
                            "Key": {
                                "OrganizationId": OrganizationId
                            },
                            "ExpressionAttributeValues": {
                                ":a": 1
                            },
                            "ExpressionAttributeNames": {
                                "#v": "NumOfFlightsAvailable"
                            },
                            "UpdateExpression": "SET #v = #v + :a",
                            "ReturnValues": "ALL_NEW"

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
                                context.done(null, {
                                    "data": {
                                        "MainData": "Flight has been Cancelled"
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
        })
        // console.log("updated data",data.Attributes)


    }
    catch (err) {
        return ({ "statusCode": 500, "error": err.message, "error_type": "Internal Server Error" })
    }
};