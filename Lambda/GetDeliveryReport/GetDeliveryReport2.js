var AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWSRegion });


exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    // RAHUL KUMAR 17-APR-2023 VALIDATING REQUIRE REQUEST BODY
    wf.once('check_request_body', function () {
        var parameters = '/';
        var operator = new Object();
        operator.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';

        if (operator.FlightId.length == 0) { parameters = parameters + 'FlightId/'; }

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
            wf.operator = operator;
            wf.emit('get_delivery_detail');
        }
    });
    wf.once('get_delivery_detail', function () {
        // RAHUL KUMAR 17-APR-2023 GETTING DELIVERY REPORT DATA FOR A PARTICULAR FLIGHT
        const params = {
            TableName: process.env.DeliveryTableName,
            IndexName: "FlightId",
            KeyConditionExpression: '#FlightId = :FlightId',
            ExpressionAttributeNames: {
                "#FlightId": "FlightId",

            },
            ExpressionAttributeValues: {
                ":FlightId": event.body.FlightId,
            }
        };
        ddb.query(params, function (err, data) {
            if (err) {
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
                if (data.Items.length == 0) {
                    context.fail(JSON.stringify({
                        "data": null,
                        "error": {
                            "code": 400,
                            "message": "Delivery Report Not Created",
                            "type": "not found",
                            "should_display_error": "false"
                        },
                        "statusCode": 400
                    }));
                    return;
                }
                else {
                    context.done(null, {
                        "data": {
                            "MainData": data.Items
                        },
                        "error": null,
                        "statusCode": 200
                    });
                    return;
                }
            }
        });
    });


    wf.emit('check_request_body');
};