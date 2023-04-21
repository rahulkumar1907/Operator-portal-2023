var AWS = require("aws-sdk");

const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AWSRegion
});
const s3 = new AWS.S3({
    region: process.env.AwsRegion
});
const TableName = process.env.TableName;
const FlightTable = process.env.FlightTable;

var ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.AWSRegion });
exports.handler = (event, context, callback) => {
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }
    var MailToBeSend = [];
    // RAHUL KUMAR 17-APR-2023 VALIDATING REQUIRE REQUEST BODY
    wf.once('check_request_body', function () {

        var parameters = '/';
        var operator = new Object();
        operator.DroneName = event.body.hasOwnProperty('DroneName') == true ? event.body.DroneName.length == 0 ? event.body.DroneName = '' : event.body.DroneName : '';
        operator.OperationNameState = event.body.hasOwnProperty('OperationNameState') == true ? event.body.OperationNameState.length == 0 ? event.body.OperationNameState = '' : event.body.OperationNameState : '';
        operator.PhysicalCheckOfAirFrame = event.body.hasOwnProperty('PhysicalCheckOfAirFrame') == true ? event.body.PhysicalCheckOfAirFrame.length == 0 ? event.body.PhysicalCheckOfAirFrame = '' : event.body.PhysicalCheckOfAirFrame : '';
        operator.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';
        operator.OperatorName = event.body.hasOwnProperty('OperatorName') == true ? event.body.OperatorName.length == 0 ? event.body.OperatorName = '' : event.body.OperatorName : '';
        operator.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        operator.AssemblyOfAirCraft = event.body.hasOwnProperty('AssemblyOfAirCraft') == true ? event.body.AssemblyOfAirCraft.length == 0 ? event.body.AssemblyOfAirCraft = '' : event.body.AssemblyOfAirCraft : '';
        operator.CheckCG = event.body.hasOwnProperty('CheckCG') == true ? event.body.CheckCG.length == 0 ? event.body.CheckCG = '' : event.body.CheckCG : '';
        operator.LogInSkyeUtmAndScheduleFlight = event.body.hasOwnProperty('LogInSkyeUtmAndScheduleFlight') == true ? event.body.LogInSkyeUtmAndScheduleFlight.length == 0 ? event.body.LogInSkyeUtmAndScheduleFlight = '' : event.body.LogInSkyeUtmAndScheduleFlight : '';
        operator.PreFlightCallibration = event.body.hasOwnProperty('PreFlightCallibration') == true ? event.body.PreFlightCallibration.length == 0 ? event.body.PreFlightCallibration = '' : event.body.PreFlightCallibration : '';
        operator.PowerTheDrone = event.body.hasOwnProperty('PowerTheDrone') == true ? event.body.PowerTheDrone.length == 0 ? event.body.PowerTheDrone = '' : event.body.PowerTheDrone : '';
        operator.ConnectToMissionPlanner = event.body.hasOwnProperty('ConnectToMissionPlanner') == true ? event.body.ConnectToMissionPlanner.length == 0 ? event.body.ConnectToMissionPlanner = '' : event.body.ConnectToMissionPlanner : '';
        operator.Callibration = event.body.hasOwnProperty('Callibration') == true ? event.body.Callibration.length == 0 ? event.body.Callibration = '' : event.body.Callibration : '';
        operator.TXModeBeforeTakeOff = event.body.hasOwnProperty('TXModeBeforeTakeOff') == true ? event.body.TXModeBeforeTakeOff.length == 0 ? event.body.TXModeBeforeTakeOff = '' : event.body.TXModeBeforeTakeOff : '';
        operator.SkyeUtmStartMission = event.body.hasOwnProperty('SkyeUtmStartMission') == true ? event.body.SkyeUtmStartMission.length == 0 ? event.body.SkyeUtmStartMission = '' : event.body.SkyeUtmStartMission : '';
        operator.ConfirmationBeforeTakeOff = event.body.hasOwnProperty('ConfirmationBeforeTakeOff') == true ? event.body.ConfirmationBeforeTakeOff.length == 0 ? event.body.ConfirmationBeforeTakeOff = '' : event.body.ConfirmationBeforeTakeOff : '';
        operator.FlightWayDetails = event.body.hasOwnProperty('FlightWayDetails') == true ? event.body.FlightWayDetails.length == 0 ? event.body.FlightWayDetails = '' : event.body.FlightWayDetails : '';
        operator.EmailId = event.body.hasOwnProperty('EmailId') == true ? event.body.EmailId.length == 0 ? event.body.EmailId = '' : event.body.EmailId : '';
        operator.Role = event.body.hasOwnProperty('Role') == true ? event.body.Role.length == 0 ? event.body.Role = '' : event.body.Role : '';
        operator.WeatherStatus = event.body.hasOwnProperty('WeatherStatus') == true ? event.body.WeatherStatus.length == 0 ? event.body.WeatherStatus = '' : event.body.WeatherStatus : '';
        operator.PowerOfUAV = event.body.hasOwnProperty('PowerOfUAV') == true ? event.body.PowerOfUAV.length == 0 ? event.body.PowerOfUAV = '' : event.body.PowerOfUAV : '';
        operator.ComponentConnectorsCheck = event.body.hasOwnProperty('ComponentConnectorsCheck') == true ? event.body.ComponentConnectorsCheck.length == 0 ? event.body.ComponentConnectorsCheck = '' : event.body.ComponentConnectorsCheck : '';
        operator.PreFlightCheckListPdf = event.body.hasOwnProperty('PreFlightCheckListPdf') == true ? event.body.PreFlightCheckListPdf.length == 0 ? event.body.PreFlightCheckListPdf = '' : event.body.PreFlightCheckListPdf : '';

        if (operator.DroneName.length == 0) { parameters = parameters + 'DroneName/'; }
        if (operator.OperationNameState.length == 0) { parameters = parameters + 'OperationNameState/'; }
        if (operator.PhysicalCheckOfAirFrame.length == 0) { parameters = parameters + 'PhysicalCheckOfAirFrame/'; }
        if (operator.FlightId.length == 0) { parameters = parameters + 'FlightId/'; }
        if (operator.OperatorName.length == 0) { parameters = parameters + 'OperatorName/'; }
        if (operator.OperatorId.length == 0) { parameters = parameters + 'OperatorId/'; }
        if (operator.AssemblyOfAirCraft.length == 0) { parameters = parameters + 'AssemblyOfAirCraft/'; }
        if (operator.CheckCG.length == 0) { parameters = parameters + 'CheckCG/'; }
        if (operator.LogInSkyeUtmAndScheduleFlight.length == 0) { parameters = parameters + 'LogInSkyeUtmAndScheduleFlight/'; }
        if (operator.PreFlightCallibration.length == 0) { parameters = parameters + 'PreFlightCallibration/'; }
        if (operator.PowerTheDrone.length == 0) { parameters = parameters + 'PowerTheDrone/'; }
        if (operator.ConnectToMissionPlanner.length == 0) { parameters = parameters + 'ConnectToMissionPlanner/'; }
        if (operator.Callibration.length == 0) { parameters = parameters + 'Callibration/'; }
        if (operator.TXModeBeforeTakeOff.length == 0) { parameters = parameters + 'TXModeBeforeTakeOff/'; }
        if (operator.SkyeUtmStartMission.length == 0) { parameters = parameters + 'SkyeUtmStartMission/'; }
        if (operator.ConfirmationBeforeTakeOff.length == 0) { parameters = parameters + 'ConfirmationBeforeTakeOff/'; }
        if (operator.FlightWayDetails.length == 0) { parameters = parameters + 'FlightWayDetails/'; }
        if (operator.EmailId.length == 0) { parameters = parameters + 'EmailId/'; }
        if (operator.Role.length == 0) { parameters = parameters + 'Role/'; }
        if (operator.WeatherStatus.length == 0) { parameters = parameters + 'WeatherStatus/'; }
        if (operator.PowerOfUAV.length == 0) { parameters = parameters + 'PowerOfUAV/'; }
        if (operator.ComponentConnectorsCheck.length == 0) { parameters = parameters + 'ComponentConnectorsCheck/'; }
        if (operator.PreFlightCheckListPdf.length == 0) { parameters = parameters + 'PreFlightCheckListPdf/'; }

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
            wf.operatorCheckListDetails = {
                DroneName: Trim(event.body.DroneName),
                OperationNameState: event.body.OperationNameState,
                ComponentConnectorsCheck: event.body.ComponentConnectorsCheck,
                PhysicalCheckAirFlame: event.body.PhysicalCheckOfAirFrame,
                FlightId: event.body.FlightId,
                OperatorName: event.body.OperatorName,
                OperatorId: event.body.OperatorId,
                AssemblyOfAirCraft: event.body.AssemblyOfAirCraft,
                CheckCG: event.body.CheckCG,
                Pilotdetails: [{
                    PilotId: event.body.OperatorId,
                    PilotName: event.body.OperatorName,
                    EmailId: event.body.EmailId,
                    Role: event.body.Role,
                }],
                LogInSkyeUtmAndScheduleFlight: event.body.LogInSkyeUtmAndScheduleFlight,
                PreFlightCallibration: event.body.PreFlightCallibration,
                PowerTheDrone: event.body.PowerTheDrone,
                ConnectToMissionPlanner: event.body.ConnectToMissionPlanner,
                Callibration: event.body.Callibration,
                TXModeBeforeTakeOff: event.body.TXModeBeforeTakeOff,
                SkyeUtmStartMission: event.body.SkyeUtmStartMission,
                ConfirmationBeforeTakeOff: event.body.ConfirmationBeforeTakeOff,
                FlightWayDetails: event.body.FlightWayDetails,
                TS_Created: Created_Timestamp,
                TS_Updated: Created_Timestamp,
                PowerOfUAV: event.body.PowerOfUAV,
                WeatherStatus: event.body.WeatherStatus
            };

            wf.emit('update_flight_table_for_preFlight_check_list');
        }

    });

    wf.once("update_flight_table_for_preFlight_check_list", function () {
        // RAHUL KUMAR 17-APR-2023 ADDING PRE FLIGHT CHECK LIST KEY TO FLIGHT TABLE
        const params = {
            TableName: FlightTable,
            Key: {
                "FlightId": event.body.FlightId,
            },
            UpdateExpression: 'set PreFlightCheckList = :PreFlightCheckList',
            ExpressionAttributeValues: {
                ':PreFlightCheckList': true,

            },
            ReturnValues: 'ALL_NEW',
        };
        docClient.update(params, function (err, data) {
            if (err) {
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 500,
                        "message": "Internal Server Error",
                        "type": "Internal Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            } else {
                wf.emit('get_Flight_details_to_send_mail_to_pilot');
            }
        });
    });
    wf.once('get_Flight_details_to_send_mail_to_pilot', function () {
        // RAHUL KUMAR 17-APR-2023 GETTING EMAIL OF PILOT AND MANAGER 
        const params = {
            TableName: FlightTable,
            Key: { FlightId: event.body.FlightId }
        };

        docClient.get(params, function (err, data) {
            if (err) {
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 500,
                        "message": "Internal Server Error",
                        "type": "Internal Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            }
            else {
                // console.log(data.Item)
                MailToBeSend.push(data.Item.LandingPilot);
                MailToBeSend.push(data.Item.TakeOffPilot);
                for (let i = 0; i < data.Item.Pilotdetails.length; i++) {
                    if (data.Item.Pilotdetails[i].Role == "Operation Manager") {
                        MailToBeSend.push(data.Item.Pilotdetails[i].EmailId);
                    }
                }
                console.log("mail", MailToBeSend);
                wf.emit('store_preFlight_check_List_to_s3');
            }
        });
    });

    wf.once('store_preFlight_check_List_to_s3', function () {
        // RAHUL KUMAR 17-APR-2023 STORING PRE FLIGHT CHECK LIST TO S3
        let buffer = Buffer.from(event.body.PreFlightCheckListPdf, 'base64');

        let Timestamp = new Date().toISOString();
        var params = {
            'Bucket': process.env.BUCKETNAME,
            'Key': 'Pre-Flight-Check-List/' + event.body.FlightId + Timestamp + "-" + event.body.DroneName + '.' + "pdf",
            'Body': buffer,
            'ACL': "public-read",
        };

        s3.upload(params, function (err, data) {
            if (err) {
                console.log("error7");
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
                wf.operatorCheckListDetails.PreFlightCheckListURL = data.Location;
                wf.emit('store_opeartor_check_list_to_db');
            }
        });
    });
    wf.once('store_opeartor_check_list_to_db', function () {
        // RAHUL KUMAR 17-APR-2023 STORING DETAILS TO DATABASE
        var params = {
            TableName: TableName,
            Item: wf.operatorCheckListDetails
        };

        docClient.put(params, function (err, data) {
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

            } else {
                wf.emit('send_email');




            }
        });
    });


    wf.once('send_email', function () {

        wf.TemplateData = JSON.stringify({
            ApproveLink: wf.operatorCheckListDetails.PreFlightCheckListURL,
            FlightId: event.body.FlightId
        });


        var params = {
            "Source": "rahulkumar@skyeair.tech",
            //  "Source": event.body.EmailId,
            // "Template": "Drone_PreFlight_Check_List_EmailTemplate_v2",
            "Template": "Pre_FlightCheck_List_EmailTemplate_v7",
            "Destination": {
                "ToAddresses": MailToBeSend,
                "CcAddresses": [],
                "BccAddresses": []
            },
            "TemplateData": wf.TemplateData
        };

        console.log(params);
        ses.sendTemplatedEmail(params, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                //console.log(data);
                context.done(null, {
                    "data": {
                        "Data": "Opeartor Check List Stored Successfully"
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
