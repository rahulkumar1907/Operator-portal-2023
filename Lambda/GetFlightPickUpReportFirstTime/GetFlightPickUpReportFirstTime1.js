var AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWSRegion });


exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    // RAHUL KUMAR 17-APR-2023 VALIDATING REQUIRE REQUEST BODY
    wf.once('check_request_body', function () {
        var parameters = '/';
        var operator = new Object();
        operator.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        operator.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';

        if (operator.OperatorId.length == 0) { parameters = parameters + 'OperatorId/'; }
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
            wf.emit('get_flight_details');

        }
    });

    wf.emit("get_flight_details", function () {
        // RAHUL KUMAR 17-APR-2023 GETTING DATA TO PRE FILLING PICK UP REPORT
        const params = {
            TableName: process.env.FlightTableName,
            Key: { "FlightId": event.body.FlightId }
        };

        ddb.get(params, function (err, data) {
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
                context.done(null, {
                    "data": {
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
