var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
const FlightTable = process.env.FlightTable;

exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    // RAHUL KUMAR 17-APR-2023 VALIDATING REQUIRE REQUEST BODY
    wf.once('check_request_body', function () {
        var parameters = '/';
        var FlightDetails = new Object();
        FlightDetails.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId == null ? event.body.OperatorId = '' : event.body.OperatorId : '';
        FlightDetails.Location = event.body.hasOwnProperty('Location') == true ? event.body.Location == null ? event.body.Location = '' : event.body.Location : '';
        FlightDetails.StartTime = event.body.hasOwnProperty('StartTime') == true ? event.body.StartTime == null ? event.body.StartTime = '' : event.body.StartTime : '';
        FlightDetails.EndTime = event.body.hasOwnProperty('EndTime') == true ? event.body.EndTime == null ? event.body.EndTime = '' : event.body.EndTime : '';
        FlightDetails.PickupDate = event.body.hasOwnProperty('PickupDate') == true ? event.body.PickupDate == null ? event.body.PickupDate = '' : event.body.PickupDate : '';
        FlightDetails.OperatorName = event.body.hasOwnProperty('OperatorName') == true ? event.body.OperatorName == null ? event.body.OperatorName = '' : event.body.OperatorName : '';
        FlightDetails.Role = event.body.hasOwnProperty('Role') == true ? event.body.Role == null ? event.body.Role = '' : event.body.Role : '';
        FlightDetails.EmailId = event.body.hasOwnProperty('EmailId') == true ? event.body.EmailId == null ? event.body.EmailId = '' : event.body.EmailId : '';


        if (event.body.Status) {
            FlightDetails.Status = event.body.Status;
            if (FlightDetails.Status.includes("Approval Pending")) {
                console.log(FlightDetails.Status.includes("Approval Pending"));
                wf.Processing = "Approval Pending";
            } else wf.Processing = "";
            if (FlightDetails.Status.includes("Scheduled")) {
                console.log(FlightDetails.Status.includes("Scheduled"));
                wf.Scheduled = "Scheduled";
            } else wf.Scheduled = "";

            if (FlightDetails.Status.includes("In Transit")) {
                wf.InTransit = "In Transit";
            } else wf.InTransit = "";

            if (FlightDetails.Status.includes("Delivered")) {
                wf.Delivered = "Delivered";
            } else wf.Delivered = "";

            if (FlightDetails.Status.includes("Cancelled")) {
                wf.Cancelled = "Cancelled";
            } else wf.Cancelled = "";

        }
        else {
            wf.Processing = "";
            wf.Scheduled = "";
            wf.InTransit = "";
            wf.Delivered = "";
            wf.Cancelled = "";
        }
        if (FlightDetails.OperatorId.length == 0) { parameters = parameters + 'OperatorId/'; }
        if (FlightDetails.OperatorName.length == 0) { parameters = parameters + 'OperatorName/'; }
        if (FlightDetails.Role.length == 0) { parameters = parameters + 'Role/'; }
        if (FlightDetails.EmailId.length == 0) { parameters = parameters + 'EmailId/'; }


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
            wf.OperatorId = FlightDetails.OperatorId;
            wf.Location = FlightDetails.Location;
            // wf.StartTime = FlightDetails.StartTime;
            // wf.EndTime = FlightDetails.EndTime;

            // RAHUL KUMAR 20-APR-2023 DATE FIELD IS MANDATORY WITH START AND END TIME
            if (event.body.StartTime != undefined && event.body.PickupDate!=undefined) {
                const datePart = event.body.PickupDate;
                const timePart = event.body.StartTime; // provided by frontend
                wf.StartTime = `${datePart}T${timePart}`;
                wf.PickupDate='';

            }
            else {
                wf.StartTime = '';
            }
            console.log("startTime", wf.StartTime);
            if (event.body.EndTime != undefined && event.body.PickupDate!=undefined ) {
                const datePart = event.body.PickupDate;
                const timePart = event.body.EndTime; // provided by frontend
                wf.EndTime = `${datePart}T${timePart}`;
                wf.PickupDate='';

            }
            else {
                wf.EndTime = '';
            }
            wf.PickupDate = FlightDetails.PickupDate;

            wf.emit('get_FlightDetails_from_Flight');
        }
    });

    wf.once('get_FlightDetails_from_Flight', function () {
        // RAHUL KUMAR 17-APR-2023  FILTERING FLIGHT BASED ON GIVEN CONDITION
        let params = {
            TableName: FlightTable,
            FilterExpression: " contains (Pilotdetails, :sendToVal) AND ( #location = :location OR #PickupDate=:PickupDate OR #StartTime=:StartTime OR #EndTime=:EndTime OR #PStatus =:Processing OR #SStatus =:Scheduled OR #IStatus =:intarnsit OR #DStatus =:Delivered OR #CStatus =:Cancelled)",

            ExpressionAttributeNames: { "#PickupDate": "PickupDate", "#location": "PickUpLocation", "#StartTime": "StartTime", "#EndTime": "EndTime", "#PStatus": "Status", "#SStatus": "Status", "#IStatus": "Status", "#DStatus": "Status", "#CStatus": "Status" },
            ExpressionAttributeValues: {
                ":sendToVal": {
                    "PilotId": event.body.OperatorId,
                    "PilotName": event.body.OperatorName,
                    "Role": event.body.Role,
                    "EmailId": event.body.EmailId
                },

                ":location": wf.Location,
                ":StartTime": wf.StartTime,
                ":EndTime": wf.EndTime,
                ":Processing": wf.Processing,
                ":Scheduled": wf.Scheduled,
                ":intarnsit": wf.InTransit,
                ":Delivered": wf.Delivered,
                ":Cancelled": wf.Cancelled,
                ":PickupDate": wf.PickupDate
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
