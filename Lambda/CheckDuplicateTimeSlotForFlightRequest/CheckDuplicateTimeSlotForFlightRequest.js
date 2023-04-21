var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AWSRegion
});




const FlightTable = process.env.FlightTable


exports.handler = (event, context, callback) => {
    console.log(event.body, "Body");
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }



    wf.once('check_request_body', function () {
        var parameters = '/';
        var Flight = new Object();
        Flight.SkyTunnelId = event.body.hasOwnProperty('SkyTunnelId') == true ? event.body.SkyTunnelId.length == 0 ? event.body.SkyTunnelId = '' : event.body.SkyTunnelId : '';


        if (Flight.SkyTunnelId.length == 0) { parameters = parameters + 'SkyTunnelId/' }


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
            var params = {
                TableName: process.env.FlightTableName,
                FilterExpression: "(#Status = :Status1 OR #Status = :Status2 OR #Status = :Status3) AND #SkyTunnelId = :SkyTunnelId AND #PickupDate = :PickupDate",
                ExpressionAttributeNames: {
                    "#Status": "Status",
                    "#SkyTunnelId": "SkyTunnelId",
                    "#PickupDate": "PickupDate"
                },
                ExpressionAttributeValues: {
                    ":Status1": "Scheduled",
                    ":Status2": "In Transit",
                    ":Status3": "Approval Pending",
                    ":SkyTunnelId": event.body.SkyTunnelId,
                    ":PickupDate": event.body.PickupDate
                },
                ProjectionExpression: "FlightId, StartTime, EndTime, PickupDate, PickupTime, SkyTunnelId, #Status"
            };

            docClient.scan(params, OnScan)

            let FlightList = [];
            function OnScan(err, data) {
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
                        console.log(FlightList);

                        params.ExclusiveStartKey = data.LastEvaluatedKey;

                        docClient.scan(params, OnScan);
                    } else {
                        console.log("last key ", data.LastEvaluatedKey)
                        // console.log(data.Items.length);
                        wf.ScheduledAndInTransitFlightList = FlightList.concat(data.Items);
                        console.log(wf.ScheduledAndInTransitFlightList)
                        context.done(null, {
                            "data": {
                                "MainData": wf.ScheduledAndInTransitFlightList
                            },
                            "error": null,
                            "statusCode": 200
                        });
                        return;
                    }
                }
            }
        }




    })


    wf.emit('check_request_body')
};
