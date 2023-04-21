var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
const SkyeTunnelTable = process.env.SkyeTunnelTable;
// RAHUL KUMAR 19-APR-2023 DEFINE FUNCTION FOR SORTING
function sortFlightsById(tunnel) {
    tunnel.sort((a, b) => (a.SkyeTunnelId < b.SkyeTunnelId) ? -1 : 1); // CHANGE THE ORDER TO SORT IN ACCENDING
    return tunnel;
}
exports.handler = (event, context, callback) => {
    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    // RAHUL KUMAR 17-APR-2023 VALIDATING REQUIRE REQUEST BODY
    wf.once('check_request_body', function () {
        var parameters = '/';
        var SkyeTunnelDetails = new Object();
        SkyeTunnelDetails.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        SkyeTunnelDetails.OperatorName = event.body.hasOwnProperty('OperatorName') == true ? event.body.OperatorName.length == 0 ? event.body.OperatorName = '' : event.body.OperatorName : '';
        SkyeTunnelDetails.Role = event.body.hasOwnProperty('Role') == true ? event.body.Role.length == 0 ? event.body.Role = '' : event.body.Role : '';
        SkyeTunnelDetails.EmailId = event.body.hasOwnProperty('EmailId') == true ? event.body.EmailId.length == 0 ? event.body.EmailId = '' : event.body.EmailId : '';

        if (SkyeTunnelDetails.OperatorId.length == 0) { parameters = parameters + 'OperatorId/'; }
        if (SkyeTunnelDetails.OperatorName.length == 0) { parameters = parameters + 'OperatorName/'; }
        if (SkyeTunnelDetails.Role.length == 0) { parameters = parameters + 'Role/'; }
        if (SkyeTunnelDetails.EmailId.length == 0) { parameters = parameters + 'EmailId/'; }


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
            wf.OperatorId = SkyeTunnelDetails.OperatorId;
            wf.emit('get_skytunnels_list');
        }
    });

    wf.once('get_skytunnels_list', function () {
        //   RAHUL KUMAR 17-APR-2023 GETTING ASSIGNED SKYTUNNEL TO PILOT
        var params = {
            TableName: SkyeTunnelTable,
            FilterExpression: "contains (Pilotdetails, :sendToVal) AND #Status = :Status AND #Demo = :Demo ",
            ExpressionAttributeNames: {
                "#Status": "Status",
                "#Demo": "Demo"
            },
            ExpressionAttributeValues: {
                ":sendToVal": {
                    "PilotId": event.body.OperatorId,
                    "PilotName": event.body.OperatorName,
                    "Role": event.body.Role,
                    "EmailId": event.body.EmailId
                },
                ":Status": "Active",
                ":Demo": false
            }
        };
        // RAHUL KUMAR 17-APR-2023 UPDATING SCAN OPERATION
        docClient.scan(params, onScan);
        let TunnelList = [];
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

                    TunnelList = TunnelList.concat(data.Items);
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    docClient.scan(params, onScan);
                }
                else {
                    console.log("last key ", data.LastEvaluatedKey);
                    wf.RequiredTunnelList = TunnelList.concat(data.Items);
                    // RAHUL KUMAR 19-APR-2023 SORTING FOR ALPHANUMERIC VALUE
                    wf.RequiredTunnelList1 = wf.RequiredTunnelList.slice().sort((a, b) => {

                        if (typeof a !== 'string' || typeof b !== 'string') {
                            return 0;
                        }

                        const aNum = parseInt(a.match(/\d+/)[0]);
                        const bNum = parseInt(b.match(/\d+/)[0]);

                        if (aNum < bNum) return -1;
                        if (aNum > bNum) return 1;

                        if (a < b) return -1;
                        if (a > b) return 1;
                        return 0;
                    });

                    // RAHUL KUMAR 19-APR-2023 CALLING SORT FUNCTION
                    sortFlightsById(wf.RequiredTunnelList1);




                    context.done(null, {
                        "data": {
                            "MainData": wf.RequiredTunnelList,
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
