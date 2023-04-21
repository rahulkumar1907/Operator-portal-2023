var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
var FlightTableName = process.env.FlightTableName;
exports.handler = (event, context, callback) => {
    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    const date = new Date();
    const ISTOffset = 330; // IST is 5:30; i.e. 60*5+30 = 330 in minutes 
    const offset = ISTOffset * 60 * 1000;
    const ISTTime = new Date(date.getTime() + offset);


    const ChangeTime = new Date(ISTTime);
    const IndianTime = new Date(ChangeTime.getTime()).toISOString().slice(0, 16);

    // console.log("Indian Time", IndianTime)

    //  RAHUL KUMAR 17-APR-2023  VALIDATING REQUIRE REQUEST BODY
    wf.once('check_request_body', function () {
        var parameters = '/';
        var operator = new Object();
        operator.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        operator.OperatorName = event.body.hasOwnProperty('OperatorName') == true ? event.body.OperatorName.length == 0 ? event.body.OperatorName = '' : event.body.OperatorName : '';
        operator.Role = event.body.hasOwnProperty('Role') == true ? event.body.Role.length == 0 ? event.body.Role = '' : event.body.Role : '';
        operator.EmailId = event.body.hasOwnProperty('EmailId') == true ? event.body.EmailId.length == 0 ? event.body.EmailId = '' : event.body.EmailId : '';


        if (operator.OperatorId.length == 0) { parameters = parameters + 'OperatorId/'; }
        if (operator.OperatorName.length == 0) { parameters = parameters + 'OperatorName/'; }
        if (operator.Role.length == 0) { parameters = parameters + 'Role/'; }
        if (operator.EmailId.length == 0) { parameters = parameters + 'EmailId/'; }

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
            wf.OperatorId = operator.OperatorId;
            wf.emit('get_flight_list');
        }
    });

    wf.once('get_flight_list', function () {
        // RAHUL KUMAR 17-APR-2023 GETTING ALL THE FLIGHT TABLE DATA
        var params = {
            TableName: FlightTableName,
            FilterExpression: "contains (Pilotdetails, :sendToVal) ",
            ExpressionAttributeValues: {
                ":sendToVal": {
                    "PilotId": event.body.OperatorId,
                    "PilotName": event.body.OperatorName,
                    "Role": event.body.Role,
                    "EmailId": event.body.EmailId

                },
            }
        };
        docClient.scan(params, onScan);
        // console.log(params)

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
                    // console.log(FlightList);

                    params.ExclusiveStartKey = data.LastEvaluatedKey;

                    docClient.scan(params, onScan);
                }
                else {
                    console.log("last key ", data.LastEvaluatedKey);
                    var mergedArray = FlightList.concat(data.Items);
                    const sortedList = mergedArray;
                    wf.SortedListArray = sortedList.sort((d1, d2) => new Date(d2.StartTime).getTime() - new Date(d1.StartTime).getTime());
                    //   code to sort by flight id which is alphanumeric
                    //   wf.SortedListArray  = sortedList.sort((a, b) => {
                    //     // Extract the numeric part of each string
                    //     const aNum = parseInt(a.match(/\d+/)[0]);
                    //     const bNum = parseInt(b.match(/\d+/)[0]);

                    //     // Compare the numeric parts
                    //     if (aNum < bNum) return -1;
                    //     if (aNum > bNum) return 1;

                    //     // If the numeric parts are equal, compare the entire string
                    //     if (a < b) return -1;
                    //     if (a > b) return 1;
                    //     return 0;
                    // });

                    wf.emit('updated_Intransit_flight_not_end_by_opearator');
                    //=======================================================   

                }
            }
        }
    });
    wf.once('updated_Intransit_flight_not_end_by_opearator', function () {
        // RAHUL KUMAR 17-APR-2023 UPDATING THE FLIGHT STATUS DELIVERED IF PILOT FORGOT TO END MISSION
        async function updateItems() {
            for (const item of wf.SortedListArray) {
                const EndDateTime = new Date(item.EndTime);
                const newDate = new Date(EndDateTime.getTime() + (0.5 * 60 * 60 * 1000));
                const newDateString = newDate.toISOString();
                let EndTimeToTest = new Date(newDateString);
                let IndianTimeToTest = new Date(IndianTime);
                if (item.Status == 'In Transit' && (EndTimeToTest < IndianTimeToTest)) {

                    console.log("FlightId", item.FlightId);

                    const params = {
                        TableName: FlightTableName,
                        Key: {
                            'FlightId': item.FlightId
                        },
                        UpdateExpression: 'set #EndTime = :EndTime,#Status = :Status',
                        ExpressionAttributeNames: {
                            '#EndTime': 'EndTime',
                            '#Status': 'Status'
                        },
                        ExpressionAttributeValues: {
                            ':EndTime': newDateString,
                            ':Status': "Delivered"
                        }
                    };
                    console.log("endtime", new Date(newDateString));
                    console.log("indiantime", new Date(IndianTime));
                    try {
                        await docClient.update(params).promise();
                        console.log(`Item with id ${item.FlightId} updated successfully.`);
                    } catch (error) {
                        console.error(`Unable to update item with id ${item.FlightId}. Error: ${error}`);
                    }
                }
            }
            wf.emit('send_response');
        }

        updateItems();
    });

    wf.once('send_response', function () {
        // function sortFlightsById(flights) {
        //     flights.sort((a, b) => (a.FlightId < b.FlightId) ? 1 : -1);
        //     return flights;
        // }
        // sortFlightsById(wf.SortedListArray)
        context.done(null, {
            "data": {
                "MainData": wf.SortedListArray

            },
            "error": null,
            "statusCode": 200
        });
        return;
    });
    wf.emit('check_request_body');
};
