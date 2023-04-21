
var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
var TableName = process.env.TableName;
exports.handler = (event, context, callback) => {
    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    const date = new Date();
    const ISTOffset = 330; // IST is 5:30; i.e. 60*5+30 = 330 in minutes 
    const offset = ISTOffset * 60 * 1000;
    const ISTTime = new Date(date.getTime() + offset);

    // Add 3 hours to IST time
    const IndianTime = new Date(ISTTime.getTime() + (3 * 60 * 60 * 1000)).toISOString().slice(0, 16);

    console.log("Indian Time", IndianTime);
    //   RAHUL KUMAR 17-APR-2023 VALIDATING REQUIRE REQUEST BODY
    wf.once('check_request_body', function () {
        var parameters = '/';
        var operator = new Object();
        operator.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        operator.OperatorName = event.body.hasOwnProperty('OperatorName') == true ? event.body.OperatorName.length == 0 ? event.body.OperatorName = '' : event.body.OperatorName : '';
        operator.Role = event.body.hasOwnProperty('Role') == true ? event.body.Role.length == 0 ? event.body.Role = '' : event.body.Role : '';
        operator.EmailId = event.body.hasOwnProperty('EmailId') == true ? event.body.EmailId.length == 0 ? event.body.EmailId = '' : event.body.EmailId : '';
        operator.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';


        if (operator.OperatorId.length == 0) { parameters = parameters + 'OperatorId/'; }
        if (operator.OperatorName.length == 0) { parameters = parameters + 'OperatorName/'; }
        if (operator.Role.length == 0) { parameters = parameters + 'Role/'; }
        if (operator.EmailId.length == 0) { parameters = parameters + 'EmailId/'; }
        if (operator.FlightId.length == 0) { parameters = parameters + 'FlightId/'; }

        if (parameters.length > 1) {
            console.log("error1");
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
            if (event.body.FlightId) {
                wf.emit('get_flight_list_by_FlightId');
            }
            if (event.body.PickupLocation) {
                wf.emit('get_flight_list_by_PickupLocation');
            }
            if (event.body.PackageType) {
                wf.emit('get_flight_list_by_PackageType');
            }

        }
    });

    wf.once('get_flight_list_by_FlightId', function () {
        //  RAHUL KUMAR 17-APR-2023 GETTING FLIGHT DATA BY ITS FLIGHT ID
        const params = {
            TableName: TableName,
            FilterExpression: ' contains(#FlightId, :FlightId) AND contains (Pilotdetails, :sendToVal) ',
            ExpressionAttributeValues: {
                ":sendToVal": {
                    "PilotId": event.body.OperatorId,
                    "PilotName": event.body.OperatorName,
                    "Role": event.body.Role,
                    "EmailId": event.body.EmailId
                },
                ':FlightId': event.body.FlightId,

            },
            ExpressionAttributeNames: {
                // '#OperatorId': 'OperatorId',
                '#FlightId': 'FlightId',
            }
        };
        docClient.scan(params, onScan);
        console.log(params);

        let FlightList = [];
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

                if (typeof data.LastEvaluatedKey != "undefined") {

                    console.log("Scanning for more...");

                    FlightList = FlightList.concat(data.Items);
                    console.log(FlightList.length);

                    params.ExclusiveStartKey = data.LastEvaluatedKey;

                    docClient.scan(params, onScan);
                }
                else {
                    console.log("last key ", data.LastEvaluatedKey);
                    // console.log(data.Items.length);
                    var mergedArray = FlightList.concat(data.Items);
                    // console.log(mergedArray.length);
                    context.done(null, {
                        "data": {
                            "MainData": mergedArray

                        },
                        "error": null,
                        "statusCode": 200
                    });
                    return;

                }
            }
        }
    });
    wf.once('get_flight_list_by_PickupLocation', function () {
        //  RAHUL KUMAR 17-APR-2023 GETTING FLIGHT DATA PICKUP LOCATION
        const params = {
            TableName: TableName,
            FilterExpression: ' contains(#PickUpLocation, :PickUpLocation) AND contains (Pilotdetails, :sendToVal) ',
            ExpressionAttributeValues: {
                ":sendToVal": {
                    "PilotId": event.body.OperatorId,
                    "PilotName": event.body.OperatorName,
                    "Role": event.body.Role,
                    "EmailId": event.body.EmailId
                },
                ':PickUpLocation': event.body.PickUpLocation,

            },
            ExpressionAttributeNames: {
                // '#OperatorId': 'OperatorId',
                '#PickUpLocation': 'PickUpLocation',
            }
        };
        docClient.scan(params, onScan);
        console.log(params);

        let FlightList = [];
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

                if (typeof data.LastEvaluatedKey != "undefined") {

                    console.log("Scanning for more...");

                    FlightList = FlightList.concat(data.Items);
                    console.log(FlightList.length);

                    params.ExclusiveStartKey = data.LastEvaluatedKey;

                    docClient.scan(params, onScan);
                }
                else {
                    console.log("last key ", data.LastEvaluatedKey);
                    // console.log(data.Items.length);
                    var mergedArray = FlightList.concat(data.Items);
                    // console.log(mergedArray.length);
                    context.done(null, {
                        "data": {
                            "MainData": mergedArray

                        },
                        "error": null,
                        "statusCode": 200
                    });
                    return;

                }
            }
        }
    });
    wf.once('get_flight_list_by_PackageType', function () {
        //  RAHUL KUMAR 17-APR-2023 GETTING FLIGHT DATA BY ITS PACKAGE TYPE
        const params = {
            TableName: TableName,
            FilterExpression: ' contains(#PackageType, :PackageType) AND contains (Pilotdetails, :sendToVal) ',
            ExpressionAttributeValues: {
                ":sendToVal": {
                    "PilotId": event.body.OperatorId,
                    "PilotName": event.body.OperatorName,
                    "Role": event.body.Role,
                    "EmailId": event.body.EmailId
                },
                ':PackageType': event.body.PackageType,

            },
            ExpressionAttributeNames: {
                // '#OperatorId': 'OperatorId',
                '#PackageType': 'PackageType',
            }
        };
        docClient.scan(params, onScan);
        console.log(params);

        let FlightList = [];
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

                if (typeof data.LastEvaluatedKey != "undefined") {

                    console.log("Scanning for more...");

                    FlightList = FlightList.concat(data.Items);
                    console.log(FlightList.length);

                    params.ExclusiveStartKey = data.LastEvaluatedKey;

                    docClient.scan(params, onScan);
                }
                else {
                    console.log("last key ", data.LastEvaluatedKey);
                    // console.log(data.Items.length);
                    var mergedArray = FlightList.concat(data.Items);
                    // console.log(mergedArray.length);
                    context.done(null, {
                        "data": {
                            "MainData": mergedArray

                        },
                        "error": null,
                        "statusCode": 200
                    });
                    return;

                }
            }
        }
    });



    wf.emit('check_request_body');
};
