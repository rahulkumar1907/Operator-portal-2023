var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});



exports.handler = (event, context, callback) => {
    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('check_request_body', function () {
        var parameters = '/';
        var operator = new Object();
        operator.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        operator.OperatorName = event.body.hasOwnProperty('OperatorName') == true ? event.body.OperatorName.length == 0 ? event.body.OperatorName = '' : event.body.OperatorName : '';

        if (operator.OperatorId.length == 0) { parameters = parameters + 'OperatorId/' }
        if (operator.OperatorName.length == 0) { parameters = parameters + 'OperatorName/' }

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
            wf.OperatorId = operator.OperatorId
            wf.emit('get_flight_list');
        }
    })

    wf.once('get_flight_list', function () {

        var params = {
            TableName: process.env.FlightTableName,
            FilterExpression: "contains (Pilotdetails, :sendToVal) ",
            // ExpressionAttributeNames: {
            //     "#Status": "Status",
            //     "#Demo":"Demo"
            //       },
            ExpressionAttributeValues: {
                ":sendToVal": {
                    "PilotId": event.body.OperatorId,
                    "PilotName": event.body.OperatorName
                },
            }
        };
        docClient.scan(params, onScan);

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
                    // wf.TempMissionLogs = wf.TempMissionLogs.concat(data.Items);                    
                    console.log("Scanning for more...");

                    FlightList = FlightList.concat(data.Items);
                    console.log(FlightList.length);

                    params.ExclusiveStartKey = data.LastEvaluatedKey;

                    docClient.scan(params, onScan);
                }
                else {
                    // console.log(data.Items.length);
                    var mergedArray = FlightList.concat(data.Items);
                    console.log(mergedArray.length);
                    const sortedList = mergedArray
                    sortedList.sort((d1, d2) => new Date(d2.StartTime).getTime() - new Date(d1.StartTime).getTime())
                    context.done(null, {
                        "data": {
                            "MainData": sortedList

                        },
                        "error": null,
                        "statusCode": 200
                    });
                    return;
                }
            }
        }
    })

    wf.emit('check_request_body')
};
