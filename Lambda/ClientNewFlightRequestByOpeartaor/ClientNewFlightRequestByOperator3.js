var AWS = require("aws-sdk");
const Region = process.env.AwsRegion;
const apiVersion = process.env.ApiVersion;
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": Region
});

var ses = new AWS.SES({ apiVersion: apiVersion, region: Region });


const MasterTableName = process.env.MasterTableName;
const FlightTable = process.env.FlightTable;
const SkyeTunnelTable = process.env.SkyeTunnelTable;
var EmailTemplateName = process.env.EmailTemplateName;
var FromAddress = process.env.FromAddress;
var LogInURL = process.env.LogInUrl;
var LambdaInvokeFunction2 = process.env.AdminApproveFlightRequestLambda;
const lambda = new AWS.Lambda({ region: Region });

exports.handler = (event, context, callback) => {
    console.log(event.body, "Body");
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }
    // RK 29-MAR-2023 STORING EMAIL OF OPERATION MANAGER
    var OperartorEmails = [];

    // RK 2-DEC-2022 VALIDATING ALL REQUIRE FIELD
    wf.once('check_request_body', function () {
        var parameters = '/';
        var Flight = new Object();
        Flight.SkyTunnelId = event.body.hasOwnProperty('SkyTunnelId') == true ? event.body.SkyTunnelId.length == 0 ? event.body.SkyTunnelId = '' : event.body.SkyTunnelId : '';
        Flight.PickUpLocation = event.body.hasOwnProperty('PickUpLocation') == true ? event.body.PickUpLocation.length == 0 ? event.body.PickUpLocation = '' : event.body.PickUpLocation : '';
        Flight.DeliveryLocation = event.body.hasOwnProperty('DeliveryLocation') == true ? event.body.DeliveryLocation.length == 0 ? event.body.DeliveryLocation = '' : event.body.DeliveryLocation : '';
        Flight.FlightDuration = event.body.hasOwnProperty('FlightDuration') == true ? event.body.FlightDuration.length == 0 ? event.body.FlightDuration = '' : event.body.FlightDuration : '';
        Flight.FlightDistance = event.body.hasOwnProperty('FlightDistance') == true ? event.body.FlightDistance.length == 0 ? event.body.FlightDistance = '' : event.body.FlightDistance : '';
        Flight.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        Flight.PickupDetails = event.body.hasOwnProperty('PickupDetails') == true ? event.body.PickupDetails.length == 0 ? event.body.PickupDetails = '' : event.body.PickupDetails : '';
        Flight.PickupDate = event.body.hasOwnProperty('PickupDate') == true ? event.body.PickupDate.length == 0 ? event.body.PickupDate = '' : event.body.PickupDate : '';
        Flight.TakeOffPilot = event.body.hasOwnProperty('TakeOffPilot') == true ? event.body.TakeOffPilot.length == 0 ? event.body.TakeOffPilot = '' : event.body.TakeOffPilot : '';
        Flight.LandingPilot = event.body.hasOwnProperty('LandingPilot') == true ? event.body.LandingPilot.length == 0 ? event.body.LandingPilot = '' : event.body.LandingPilot : '';
        Flight.Role = event.body.hasOwnProperty('Role') == true ? event.body.Role.length == 0 ? event.body.Role = '' : event.body.Role : '';
        Flight.DroneId = event.body.hasOwnProperty('DroneId') == true ? event.body.DroneId.length == 0 ? event.body.DroneId = '' : event.body.DroneId : '';
        Flight.OrganizationId = event.body.hasOwnProperty('OrganizationId') == true ? event.body.OrganizationId.length == 0 ? event.body.OrganizationId = '' : event.body.OrganizationId : '';

        if (Flight.SkyTunnelId.length == 0) { parameters = parameters + 'SkyTunnelId/'; }
        if (Flight.PickUpLocation.length == 0) { parameters = parameters + 'PickUpLocation/'; }
        if (Flight.DeliveryLocation.length == 0) { parameters = parameters + 'DeliveryLocation/'; }
        if (Flight.FlightDuration.length == 0) { parameters = parameters + 'FlightDuration/'; }
        if (Flight.FlightDistance.length == 0) { parameters = parameters + 'FlightDistance/'; }
        if (Flight.OperatorId.length == 0) { parameters = parameters + 'OperatorId/'; }
        if (Flight.PickupDetails.length == 0) { parameters = parameters + 'PickupDetails/'; }
        if (Flight.PickupDate.length == 0) { parameters = parameters + 'PickupDate/'; }
        if (Flight.TakeOffPilot.length == 0) { parameters = parameters + 'TakeOffPilot/'; }
        if (Flight.LandingPilot.length == 0) { parameters = parameters + 'LandingPilot/'; }
        if (Flight.Role.length == 0) { parameters = parameters + 'Role/'; }
        if (Flight.DroneId.length == 0) { parameters = parameters + 'DroneId/'; }
        if (Flight.OrganizationId.length == 0) { parameters = parameters + 'OrganizationId/'; }


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

            wf.flightDetails = {
                SkyTunnelId: event.body.SkyTunnelId,
                PickUpLocation: event.body.PickUpLocation,
                PickupDate: event.body.PickupDate,
                DeliveryLocation: event.body.DeliveryLocation,
                FlightDuration: event.body.FlightDuration,
                FlightDistance: event.body.FlightDistance,
                // SETTING CLIENT NAME FROM ORGANISATION ID
                ClientName: event.body.OrganizationId.split("-")[0],
                Role: event.body.Role,
                TS_Created: Created_Timestamp,
                TS_Updated: Created_Timestamp,
                PackageNumber: event.body.PackageNumber,
                TakeOffPilot: event.body.TakeOffPilot,
                LandingPilot: event.body.LandingPilot,
                NumOfPackages: event.body.NumOfPackages
            };


            wf.emit('get_waypoint_details_from_skyetunnel');

        }
    });

    wf.once('get_waypoint_details_from_skyetunnel', function () {
        // RK 2-DEC-2023 GETTING SKYTUNNEL DETAILS BY SKYTUNNEL ID TO STORE IN FLIGHT TABLE
        console.log(wf.flightDetails.SkyTunnelId);
        var params = {
            "TableName": SkyeTunnelTable,
            Key: {
                "SkyeTunnelId": wf.flightDetails.SkyTunnelId
            }
        };

        docClient.get(params, function (err, data) {
            if (err) {
                console.log("error2");
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
                // DATA NEEDED TO STORE IN FLIGHT TABLE
                wf.flightDetails.Altitude = data.Item.Altitude;
                wf.flightDetails.BufferRegion = data.Item.BufferRegion;
                wf.flightDetails.Latitude = data.Item.Latitude;
                wf.flightDetails.Longitude = data.Item.Longitude;
                wf.flightDetails.MaximumAltitude = data.Item.MaximumAltitude;
                wf.flightDetails.wayPointFileDetails = data.Item.wayPointFileDetails;
                wf.flightDetails.WayPointNum = data.Item.WayPointNum;
                wf.flightDetails.Waypoints = data.Item.Waypoints;
                // MAPPING REQUIRED DRONE DETAILS FROM SKYTUNNEL
                for (let i = 0; i < data.Item.Drone.length; i++) {
                    if (data.Item.Drone[i].DroneID == event.body.DroneId) {
                        wf.flightDetails.DroneId = data.Item.Drone[i].DroneID;
                        wf.flightDetails.DroneName = data.Item.Drone[i].DroneName;
                        wf.flightDetails.DronePlatform = data.Item.Drone[i].DronePlatform;
                        wf.flightDetails.PayLoadCapacity = data.Item.Drone[i].PayLoadCapacity;
                    }
                }
                wf.flightDetails.ActivityType = data.Item.ActivityType;
                wf.flightDetails.SkyTunnelName = data.Item.SkyTunnelName;
                wf.flightDetails.Pilotdetails = data.Item.Pilotdetails;
                // GETTING OPERATION MANAGER EMAIL FROM SKYTUNNEL
                for (let i = 0; i < data.Item.Pilotdetails.length; i++) {
                    if (data.Item.Pilotdetails[i].Role == "Operation Manager") {
                        OperartorEmails.push(data.Item.Pilotdetails[i].EmailId);
                    }
                }

                wf.flightDetails.Demo = false;
                wf.emit('get_drone_uin');
            }
        });
    });
    wf.once('get_drone_uin', function () {
        // RK 15-MAR-2023 GETTING DRONE UIN FROM FMS DRONE TABLE
        var params = {
            TableName: "FMSDrone",
            Key: {
                "DroneId": wf.flightDetails.DroneId
            }
        };

        docClient.get(params, function (err, data) {
            if (err) {
                console.log("error3");
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
            } else {
                wf.DroneUIN = data.Item.UIN;
                console.log("droneUIN", wf.DroneUIN);
                wf.emit('get_organizationID');
            }
        });
    });



    wf.once('get_organizationID', function () {

        wf.flightDetails.OrganizationId = event.body.OrganizationId;
        wf.flightDetails.CreatedById = event.body.OperatorId;
        wf.flightDetails.CreatedByRole = "Operator";

        if (event.body.Role == "Operation Manager") {
            wf.emit('request_new_flight_with_different_time_slot_role_manager');
        }
        else {
            wf.emit('request_new_flight_with_different_time_slot_role_not_manager');
        }

    });


    wf.once('request_new_flight_with_different_time_slot_role_not_manager', function () {
        //  RK 15-MAR-2023 REQUESTING NEW FLIGHT FOR WITH APPROVAL GOES TO MANAGER 
        let PickupDetails = event.body.PickupDetails;
        let i = 0;
        // RECURSIVELY BOOKING FLIGHT FOR MULTIPLE TIME SLOT
        function TimesSlot() {
            if (i >= PickupDetails.length) {
                context.done(null, {
                    "data": {
                        "MainData": "Flight Details Inserted successfully"
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }
            else {
                // UPDATING FLIGHT COUNT IN MASTER TABLE
                docClient.update({
                    "TableName": MasterTableName,
                    "Key": {
                        "Module": "FlightCounter"
                    },
                    "ExpressionAttributeValues": {
                        ":a": 1
                    },
                    "ExpressionAttributeNames": {
                        "#v": "CounterId"
                    },
                    "UpdateExpression": "SET #v = #v + :a",
                    "ReturnValues": "UPDATED_NEW"

                }, function (err, data) {
                    if (err) {
                        console.log(err);
                        console.log("error4");
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
                        // DATA NEEDE TO ADD IN FLIGHT TABLE 
                        console.log(data.Attributes.CounterId);
                        var CounterId = data.Attributes.CounterId + "";
                        var ans = CounterId.padStart(5, '0');

                        wf.flightDetails.FlightId = "Flight" + ans;
                        wf.flightDetails.OrderId = wf.flightDetails.FlightId;
                        wf.flightDetails.Status = "Approval Pending";
                        wf.flightDetails.PickupTime = PickupDetails[i].PickupTime;
                        wf.flightDetails.PackageType = PickupDetails[i].PackageType;
                        wf.flightDetails.PackageWeight = PickupDetails[i].PackageWeight;
                        wf.flightDetails.VolumetricWeight = PickupDetails[i].VolumetricWeight;
                        wf.flightDetails.ColdChain = PickupDetails[i].ColdChain;
                        wf.flightDetails.PackageCategory = PickupDetails[i].PackageCategory;
                        wf.flightDetails.PackageNumber = PickupDetails[i].PackageNumber;
                        wf.flightDetails.NumOfPackages = PickupDetails[i].NumOfPackages;
                        wf.flightDetails.StartTime = PickupDetails[i].StartTime;
                        wf.flightDetails.EndTime = PickupDetails[i].EndTime;
                        i++;
                        let params = {
                            "TableName": FlightTable,
                            Item: wf.flightDetails
                        };

                        docClient.put(params, function (err, data) {
                            if (err) {
                                console.log("error7");
                                console.log(err);
                                context.fail(JSON.stringify({
                                    "data": null,
                                    "error": {
                                        "code": 500,
                                        "message": "Internal server error",
                                        "should_display_error": "false"
                                    },
                                    "type": "Server Error",
                                    "statusCode": 500
                                }));
                                return;
                            } else {


                                // RK 16-MAR-2023 SENDING EMAIL TEMPLATE TO MANAGER TO APPROVE FLIGHT
                                wf.loginURL = LogInURL;
                                wf.TemplateData = "{ \"FlightId\":\"" + wf.flightDetails.FlightId + "\", \"OrderId\":\"" + wf.flightDetails.OrderId + "\",\"SkyTunnelId\":\"" + wf.flightDetails.SkyTunnelId + "\", \"StartTime\":\"" + wf.flightDetails.StartTime + "\", \"EndTime\":\"" + wf.flightDetails.EndTime + "\",\"PackageType\":\"" + wf.flightDetails.PackageType + "\",\"PackageWeight\":\"" + wf.flightDetails.PackageWeight + "\",\"PackageNumber\":\"" + wf.flightDetails.PackageNumber + "\",\"VolumetricWeight\":\"" + wf.flightDetails.VolumetricWeight + "\",\"PickupTime\":\"" + wf.flightDetails.PickupTime + "\",\"ColdChain\":\"" + wf.flightDetails.ColdChain + "\",\"DroneId\":\"" + wf.flightDetails.DroneId + "\",\"DroneName\":\"" + wf.flightDetails.DroneName + "\",\"ClientId\":\"" + wf.flightDetails.ClientId + "\",\"OrganizationId\":\"" + wf.flightDetails.OrganizationId + "\",\"ApproveLink\":\"" + wf.loginURL + "\"}";
                                let params = {
                                    "Source": FromAddress,
                                    "Template": EmailTemplateName,
                                    "Destination": {
                                        "ToAddresses": OperartorEmails,
                                        "CcAddresses": [],
                                        "BccAddresses": []
                                    },
                                    "TemplateData": wf.TemplateData
                                };
                                ses.sendTemplatedEmail(params, function (err, data) {
                                    if (err) {
                                        console.log(err);
                                        context.fail(JSON.stringify({
                                            "data": null,
                                            "error": {
                                                "code": 500,
                                                "message": "Internal server error",
                                                "should_display_error": "false"
                                            },
                                            "type": "Server Error",
                                            "statusCode": 500
                                        }));
                                    }
                                    else {

                                        TimesSlot();
                                    }
                                });
                            }
                        });
                    }
                });
            }

        }

        TimesSlot();
    });
    wf.once('request_new_flight_with_different_time_slot_role_manager', function () {
        // REQUESTING NEW FLIGHT WHICH AUTO APPROVE AS ROLE IS MANAGER
        let PickupDetails = event.body.PickupDetails;
        let i = 0;
        async function TimesSlot() {
            if (i >= PickupDetails.length) {
                context.done(null, {
                    "data": {
                        "MainData": "Flight Details Inserted successfully by Operation Manager "
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }
            else {
                // UPDATING FLIGHT COUNT IN MASTER TABLE
                docClient.update({
                    "TableName": MasterTableName,
                    "Key": {
                        "Module": "FlightCounter"
                    },
                    "ExpressionAttributeValues": {
                        ":a": 1
                    },
                    "ExpressionAttributeNames": {
                        "#v": "CounterId"
                    },
                    "UpdateExpression": "SET #v = #v + :a",
                    "ReturnValues": "UPDATED_NEW"

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
                        // RAHUL KUMAR 17-APR-2023 CREATING FLIGHT ID
                        var CounterId = data.Attributes.CounterId + "";
                        var ans = CounterId.padStart(5, '0');

                        wf.flightDetails.FlightId = "Flight" + ans;
                        wf.flightDetails.OrderId = wf.flightDetails.FlightId;
                        wf.flightDetails.Status = "Approval Pending";
                        wf.flightDetails.PickupTime = PickupDetails[i].PickupTime;
                        wf.flightDetails.PackageType = PickupDetails[i].PackageType;
                        wf.flightDetails.PackageWeight = PickupDetails[i].PackageWeight;
                        wf.flightDetails.VolumetricWeight = PickupDetails[i].VolumetricWeight;
                        wf.flightDetails.ColdChain = PickupDetails[i].ColdChain;
                        wf.flightDetails.PackageCategory = PickupDetails[i].PackageCategory;
                        wf.flightDetails.PackageNumber = PickupDetails[i].PackageNumber;
                        wf.flightDetails.NumOfPackages = PickupDetails[i].NumOfPackages;
                        wf.flightDetails.StartTime = PickupDetails[i].StartTime;
                        wf.flightDetails.EndTime = PickupDetails[i].EndTime;
                        wf.flightDetails.DroneUIN = wf.DroneUIN;

                        i++;
                        let params = {
                            "TableName": FlightTable,
                            Item: wf.flightDetails
                        };

                        docClient.put(params, function (err, data) {
                            if (err) {
                                console.log("error7");
                                console.log(err);
                                context.fail(JSON.stringify({
                                    "data": null,
                                    "error": {
                                        "code": 500,
                                        "message": "Internal server error",
                                        "should_display_error": "false"
                                    },
                                    "type": "Server Error",
                                    "statusCode": 500
                                }));
                                return;
                            } else {
                                // SENDING EMAIL TEMPLATE TO MANAGER TO CHECK FLIGHT DATA
                                wf.loginURL = LogInURL;
                                wf.TemplateData = "{ \"FlightId\":\"" + wf.flightDetails.FlightId + "\", \"OrderId\":\"" + wf.flightDetails.OrderId + "\",\"SkyTunnelId\":\"" + wf.flightDetails.SkyTunnelId + "\", \"StartTime\":\"" + wf.flightDetails.StartTime + "\", \"EndTime\":\"" + wf.flightDetails.EndTime + "\",\"PackageType\":\"" + wf.flightDetails.PackageType + "\",\"PackageWeight\":\"" + wf.flightDetails.PackageWeight + "\",\"PackageNumber\":\"" + wf.flightDetails.PackageNumber + "\",\"VolumetricWeight\":\"" + wf.flightDetails.VolumetricWeight + "\",\"PickupTime\":\"" + wf.flightDetails.PickupTime + "\",\"ColdChain\":\"" + wf.flightDetails.ColdChain + "\",\"DroneId\":\"" + wf.flightDetails.DroneId + "\",\"DroneName\":\"" + wf.flightDetails.DroneName + "\",\"ClientId\":\"" + wf.flightDetails.ClientId + "\",\"OrganizationId\":\"" + wf.flightDetails.OrganizationId + "\",\"ApproveLink\":\"" + wf.loginURL + "\"}";
                                let params = {
                                    "Source": FromAddress,
                                    "Template": EmailTemplateName,
                                    "Destination": {
                                        "ToAddresses": OperartorEmails,
                                        "CcAddresses": [],
                                        "BccAddresses": []
                                    },
                                    "TemplateData": wf.TemplateData
                                };


                                ses.sendTemplatedEmail(params, function (err, data) {
                                    if (err) {
                                        console.log(err);
                                        context.fail(JSON.stringify({
                                            "data": null,
                                            "error": {
                                                "code": 500,
                                                "message": "Internal server error",
                                                "should_display_error": "false"
                                            },
                                            "type": "Server Error",
                                            "statusCode": 500
                                        }));
                                    }
                                    else {
                                        let payload = {
                                            DroneId: event.body.DroneId, TakeOffPilot: event.body.TakeOffPilot, LandingPilot: event.body.LandingPilot, FlightId: wf.flightDetails.FlightId, ClientName: wf.flightDetails.ClientName

                                        };
                                        // INVOKING LAMBDA TO AUTO APPROVE FLIGHT
                                        const params = {
                                            FunctionName: LambdaInvokeFunction2, // Replace 'my-function' with the name of your Lambda function
                                            Payload: JSON.stringify({ "body": payload })
                                        };
                                        console.log("payload1", params);
                                        lambda.invoke(params, function (err, data) {
                                            if (err) {
                                                console.error(err);
                                            } else {
                                                console.log(data.Payload);
                                            }
                                        });


                                        setTimeout(function () { TimesSlot(); }, 2000);
                                    }
                                });
                            }
                        });
                    }
                });
            }

        }

        TimesSlot();

    });





    wf.emit('check_request_body');
};
