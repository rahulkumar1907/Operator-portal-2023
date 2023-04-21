var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
var sts = new AWS.STS()
var ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.AwsRegionForEmail });

const ClientTable = process.env.ClientTable
const MasterTableName = process.env.MasterTableName
const FlightTable = process.env.FlightTable
const SkyeTunnelTable = process.env.SkyeTunnelTable
var EmailTemplateName = process.env.EmailTemplateName;
var FromAddress = process.env.FromAddress;
var ToAddresss1 = process.env.ToAddresss1;
var ToAddresss2 = process.env.ToAddresss2;
var ToAddresss3 = process.env.ToAddresss3;
var BCCAddress1 = process.env.BCCAddress1;
const OrganizationTable = process.env.OrganizationTable;
const LambdaInvokeFunction1 = process.env.LambdaInvokeFunction1;
const lambda = new AWS.Lambda({ region: 'ap-south-1' })

exports.handler = (event, context, callback) => {
    console.log(event.body, "Body");
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }

    var OperartorEmails = []


    wf.once('check_request_body', function () {
        var parameters = '/';
        var Flight = new Object();
        Flight.SkyTunnelId = event.body.hasOwnProperty('SkyTunnelId') == true ? event.body.SkyTunnelId.length == 0 ? event.body.SkyTunnelId = '' : event.body.SkyTunnelId : '';
        Flight.PickUpLocation = event.body.hasOwnProperty('PickUpLocation') == true ? event.body.PickUpLocation.length == 0 ? event.body.PickUpLocation = '' : event.body.PickUpLocation : '';
        Flight.DeliveryLocation = event.body.hasOwnProperty('DeliveryLocation') == true ? event.body.DeliveryLocation.length == 0 ? event.body.DeliveryLocation = '' : event.body.DeliveryLocation : '';
        Flight.FlightDuration = event.body.hasOwnProperty('FlightDuration') == true ? event.body.FlightDuration.length == 0 ? event.body.FlightDuration = '' : event.body.FlightDuration : '';
        Flight.FlightDistance = event.body.hasOwnProperty('FlightDistance') == true ? event.body.FlightDistance.length == 0 ? event.body.FlightDistance = '' : event.body.FlightDistance : '';
        // Flight.ClientId = event.body.hasOwnProperty('ClientId') == true ? event.body.ClientId.length == 0 ? event.body.ClientId = '' : event.body.ClientId : '';
        Flight.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        Flight.PickupDetails = event.body.hasOwnProperty('PickupDetails') == true ? event.body.PickupDetails.length == 0 ? event.body.PickupDetails = '' : event.body.PickupDetails : '';
        Flight.PickupDate = event.body.hasOwnProperty('PickupDate') == true ? event.body.PickupDate.length == 0 ? event.body.PickupDate = '' : event.body.PickupDate : '';
        Flight.TakeOffPilot = event.body.hasOwnProperty('TakeOffPilot') == true ? event.body.TakeOffPilot.length == 0 ? event.body.TakeOffPilot = '' : event.body.TakeOffPilot : '';
        Flight.LandingPilot = event.body.hasOwnProperty('LandingPilot') == true ? event.body.LandingPilot.length == 0 ? event.body.LandingPilot = '' : event.body.LandingPilot : '';
        Flight.Role = event.body.hasOwnProperty('Role') == true ? event.body.Role.length == 0 ? event.body.Role = '' : event.body.Role : '';
        Flight.DroneId = event.body.hasOwnProperty('DroneId') == true ? event.body.DroneId.length == 0 ? event.body.DroneId = '' : event.body.DroneId : '';
        Flight.OrganizationId = event.body.hasOwnProperty('OrganizationId') == true ? event.body.OrganizationId.length == 0 ? event.body.OrganizationId = '' : event.body.OrganizationId : '';
        // Flight.NumOfPackages = event.body.hasOwnProperty('NumOfPackages') == true ? event.body.NumOfPackages.length == 0 ? event.body.NumOfPackages = '' : event.body.NumOfPackages : '';

        if (Flight.SkyTunnelId.length == 0) { parameters = parameters + 'SkyTunnelId/' }
        if (Flight.PickUpLocation.length == 0) { parameters = parameters + 'PickUpLocation/' }
        if (Flight.DeliveryLocation.length == 0) { parameters = parameters + 'DeliveryLocation/' }
        if (Flight.FlightDuration.length == 0) { parameters = parameters + 'FlightDuration/' }
        if (Flight.FlightDistance.length == 0) { parameters = parameters + 'FlightDistance/' }
        // if (Flight.ClientId.length == 0) { parameters = parameters + 'ClientId/' }
        if (Flight.OperatorId.length == 0) { parameters = parameters + 'OperatorId/' }
        if (Flight.PickupDetails.length == 0) { parameters = parameters + 'PickupDetails/' }
        if (Flight.PickupDate.length == 0) { parameters = parameters + 'PickupDate/' }
        if (Flight.TakeOffPilot.length == 0) { parameters = parameters + 'TakeOffPilot/' }
        if (Flight.LandingPilot.length == 0) { parameters = parameters + 'LandingPilot/' }
        if (Flight.Role.length == 0) { parameters = parameters + 'Role/' }
        if (Flight.DroneId.length == 0) { parameters = parameters + 'DroneId/' }
        if (Flight.OrganizationId.length == 0) { parameters = parameters + 'OrganizationId/' }
        // if (Flight.NumOfPackages.length == 0) { parameters = parameters + 'NumOfPackages/' }


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

            wf.flightDetails = {
                SkyTunnelId: event.body.SkyTunnelId,
                PickUpLocation: event.body.PickUpLocation,
                PickupDate: event.body.PickupDate,
                DeliveryLocation: event.body.DeliveryLocation,
                FlightDuration: event.body.FlightDuration,
                FlightDistance: event.body.FlightDistance,
                // ClientId: event.body.ClientId,
                ClientName: event.body.OrganizationId.split("-")[0],
                Role: event.body.Role,
                TS_Created: Created_Timestamp,
                TS_Updated: Created_Timestamp,
                PackageNumber: event.body.PackageNumber,
                TakeOffPilot: event.body.TakeOffPilot,
                LandingPilot: event.body.LandingPilot,
                NumOfPackages:event.body.NumOfPackages
            }


            wf.emit('get_waypoint_details_from_skyetunnel');

        }
    })

    wf.once('get_waypoint_details_from_skyetunnel', function () {
        console.log(wf.flightDetails.SkyTunnelId)
        var params = {
            "TableName": SkyeTunnelTable,
            Key: {
                "SkyeTunnelId": wf.flightDetails.SkyTunnelId
            }
        };

        docClient.get(params, function (err, data) {
            if (err) {
                console.log("error2")
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
                wf.flightDetails.Altitude = data.Item.Altitude;
                wf.flightDetails.BufferRegion = data.Item.BufferRegion;
                wf.flightDetails.Latitude = data.Item.Latitude;
                wf.flightDetails.Longitude = data.Item.Longitude;
                wf.flightDetails.MaximumAltitude = data.Item.MaximumAltitude;
                wf.flightDetails.wayPointFileDetails = data.Item.wayPointFileDetails;
                wf.flightDetails.WayPointNum = data.Item.WayPointNum;
                wf.flightDetails.Waypoints = data.Item.Waypoints;
                // wf.flightDetails.DroneId = data.Item.Drone[0].DroneID;
                // wf.flightDetails.DroneName = data.Item.Drone[0].DroneName;
                
                for(let i=0;i<data.Item.Drone.length;i++){
                    if(data.Item.Drone[i].DroneID==event.body.DroneId){
                        // console.log(data.Item.Drone[i])
                        wf.flightDetails.DroneId = data.Item.Drone[i].DroneID;
                        wf.flightDetails.DroneName=data.Item.Drone[i].DroneName;
                        wf.flightDetails.DronePlatform=data.Item.Drone[i].DronePlatform
                        wf.flightDetails.PayLoadCapacity=data.Item.Drone[i].PayLoadCapacity
                    }
                }
                wf.flightDetails.ActivityType = data.Item.ActivityType;
                wf.flightDetails.SkyTunnelName = data.Item.SkyTunnelName;
                wf.flightDetails.Pilotdetails = data.Item.Pilotdetails;
                // wf.flightDetails.Client=data.Item.Client
                // var PilotDetails=[]
                // for(let i=0;i<data.Item.Pilotdetails.length;i++){
                //     if(data.Item.Pilotdetails[i].EmailId==event.body.TakeOffPilot||data.Item.Pilotdetails[i].EmailId==event.body.LandingPilot||data.Item.Pilotdetails[i].Role=="Operation Manager"){
                //       PilotDetails.push(data.Item.Pilotdetails[i]) 
                //     }
                // }
                // wf.flightDetails.Pilotdetails = PilotDetails
                for(let i=0;i<data.Item.Pilotdetails.length;i++){
                    if(data.Item.Pilotdetails[i].Role=="Operation Manager"){
                      OperartorEmails.push(data.Item.Pilotdetails[i].EmailId) 
                    }
                }
                console.log(data.Item.Drone)
                console.log(wf.flightDetails.DroneId)
                 console.log(wf.flightDetails.DroneName)
                  console.log(wf.flightDetails.DronePlatform)
                  console.log(wf.flightDetails.PayLoadCapacity)
                    console.log(event.body.DroneId)
                wf.flightDetails.Demo = false;
                // console.log(wf.flightDetails)
                wf.emit('get_drone_uin')
            }
        })
    })
wf.once('get_drone_uin',function(){
     var params = {
             TableName: "FMSDrone",
            Key: {
                "DroneId" :  wf.flightDetails.DroneId
            }
        };
        
        docClient.get(params,function(err,data){
            if (err) {
                console.log("error3")
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
            }else{ 
                wf.DroneUIN=data.Item.UIN
                console.log("droneUIN",wf.DroneUIN)
                wf.emit('get_organizationID_from_ClientProfile')
            }
        })
})



wf.once('get_organizationID_from_ClientProfile', function () {

                wf.flightDetails.OrganizationId = event.body.OrganizationId
                // wf.flightDetails.CreatedByName = data.Items[0].FirstName
                wf.flightDetails.CreatedById = event.body.OperatorId
                wf.flightDetails.CreatedByRole = "Operator"

                // console.log(wf.flightDetails)
                if (event.body.Role == "Operation Manager") {
                    wf.emit('request_new_flight_with_different_time_slot_role_manager')
                }
                else {
                    wf.emit('request_new_flight_with_different_time_slot_role_not_manager')
                }
            
    })
    // wf.once('get_organizationID_from_ClientProfile', function () {
    //     console.log(wf.ClientId)
    //     var params = {
    //         "TableName": ClientTable,
    //         IndexName: 'ClientId',
    //         KeyConditionExpression: 'ClientId = :clientVal',
    //         ExpressionAttributeValues: {
    //             ':clientVal': wf.flightDetails.ClientId
    //         }
    //     };

    //     docClient.query(params, function (err, data) {
    //         if (err) {
    //             console.log("error3")
    //             console.log("Error", err);
    //             context.fail(JSON.stringify({
    //                 "data": null,
    //                 "error": {
    //                     "code": 500,
    //                     "message": "Internal server error",
    //                     "type": "Server Error",
    //                     "should_display_error": "false"
    //                 },
    //                 "statusCode": 500
    //             }));
    //             return;
    //         }
    //         else {
    //             wf.flightDetails.OrganizationId = data.Items[0].OrganizationId
    //             wf.flightDetails.CreatedByName = data.Items[0].FirstName
    //             wf.flightDetails.CreatedById = event.body.OperatorId
    //             wf.flightDetails.CreatedByRole = "Operator"

    //             // console.log(wf.flightDetails)
    //             if (event.body.Role == "Operation Manager") {
    //                 wf.emit('request_new_flight_with_different_time_slot_role_manager')
    //             }
    //             else {
    //                 wf.emit('request_new_flight_with_different_time_slot_role_not_manager')
    //             }
    //         }
    //     })
    // })

    wf.once('request_new_flight_with_different_time_slot_role_not_manager', function () {
        console.log("coming")
        let PickupDetails = event.body.PickupDetails
        let i = 0;
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
                console.log("i", i)
                // console.log("pickupdetail", PickupDetails[i])
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
                        console.log(data.Attributes.CounterId);
                        let str = "" + data.Attributes.CounterId;
                        let pad = "00000";
                        let ans = pad.substring(0, pad.length - str.length) + str;
                        wf.flightDetails.FlightId = "Flight" + ans;
                        wf.flightDetails.OrderId = wf.flightDetails.FlightId
                        wf.flightDetails.Status = "Approval Pending"
                        wf.flightDetails.PickupTime = PickupDetails[i].PickupTime
                        wf.flightDetails.PackageType = PickupDetails[i].PackageType
                        wf.flightDetails.PackageWeight = PickupDetails[i].PackageWeight
                        wf.flightDetails.VolumetricWeight = PickupDetails[i].VolumetricWeight
                        wf.flightDetails.ColdChain = PickupDetails[i].ColdChain
                        wf.flightDetails.PackageCategory = PickupDetails[i].PackageCategory
                        wf.flightDetails.PackageNumber = PickupDetails[i].PackageNumber
                        wf.flightDetails.NumOfPackages = PickupDetails[i].NumOfPackages
                        wf.flightDetails.StartTime = PickupDetails[i].StartTime
                        wf.flightDetails.EndTime = PickupDetails[i].EndTime
                        // if(! wf.flightDetails.NumOfPackages){
                        //     context.fail(JSON.stringify({
                        //             "data": null,
                        //             "error": {
                        //                 "code": 400,
                        //                 "message": "NumOfPackages Are Missing",
                        //                 "should_display_error": "false"
                        //             },
                        //             "type": "Invalid/Missing Parameter NumOfPackages ",
                        //             "statusCode": 400
                        //         }));
                        //         return; 
                        // }
                        i++

                        // console.log("Flight Data", wf.flightDetails)

                        let params = {
                            "TableName": FlightTable,
                            Item: wf.flightDetails
                        };
                        console.log("params to be put", params)
                        docClient.put(params, function (err, data) {
                            if (err) {
                                console.log("error7")
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
                                // console.log("put Data",data);
                                console.log("I Am INN")
                                // wf.loginURL = `https://admin-approve-client-test.s3.ap-south-1.amazonaws.com/AdminApproveFlight.html?flightid=${wf.flightDetails.FlightId}`
                                   wf.loginURL='https://skyeairops.tech/operator/auth/login'
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

                                // console.log(params);
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

                                        TimesSlot()
                                    }
                                });
                            }
                        })
                    }
                })
            }

        }

        TimesSlot()
    })
    wf.once('request_new_flight_with_different_time_slot_role_manager', function () {
        let PickupDetails = event.body.PickupDetails
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
                // console.log("i", i)
                // console.log("pickupdetail", PickupDetails[i])
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
                        // console.log(data.Attributes.CounterId);
                        let str = "" + data.Attributes.CounterId;
                        let pad = "00000";
                        let ans = pad.substring(0, pad.length - str.length) + str;
                        wf.flightDetails.FlightId = "Flight" + ans;
                        wf.flightDetails.OrderId = wf.flightDetails.FlightId
                        wf.flightDetails.Status = "Approval Pending"
                        wf.flightDetails.PickupTime = PickupDetails[i].PickupTime
                        wf.flightDetails.PackageType = PickupDetails[i].PackageType
                        wf.flightDetails.PackageWeight = PickupDetails[i].PackageWeight
                        wf.flightDetails.VolumetricWeight = PickupDetails[i].VolumetricWeight
                        wf.flightDetails.ColdChain = PickupDetails[i].ColdChain
                        wf.flightDetails.PackageCategory = PickupDetails[i].PackageCategory
                        wf.flightDetails.PackageNumber = PickupDetails[i].PackageNumber
                        wf.flightDetails.NumOfPackages = PickupDetails[i].NumOfPackages
                        wf.flightDetails.StartTime = PickupDetails[i].StartTime
                        wf.flightDetails.EndTime = PickupDetails[i].EndTime
                        wf.flightDetails.DroneUIN=wf.DroneUIN
                        //  if(! wf.flightDetails.NumOfPackages){
                        //     context.fail(JSON.stringify({
                        //             "data": null,
                        //             "error": {
                        //                 "code": 400,
                        //                 "message": "NumOfPackages Are Missing",
                        //                 "should_display_error": "false"
                        //             },
                        //             "type": "Invalid/Missing Parameter NumOfPackages ",
                        //             "statusCode": 400
                        //         }));
                        //         return; 
                        // }
                        i++

                        // console.log("Flight Data", wf.flightDetails)

                        let params = {
                            "TableName": FlightTable,
                            Item: wf.flightDetails
                        };
                        // console.log("params to be put 2", params)
                        docClient.put(params, function (err, data) {
                            if (err) {
                                console.log("error7")
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
                                // console.log("put Data",data);
                                console.log("I Am INN")
                                // wf.loginURL = `https://admin-approve-client-test.s3.ap-south-1.amazonaws.com/AdminApproveFlight.html?flightid=${wf.flightDetails.FlightId}`

                                  wf.loginURL='https://skyeairops.tech/operator/auth/login'
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

                                //console.log(params);
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
                                            DroneId: event.body.DroneId, TakeOffPilot: event.body.TakeOffPilot,LandingPilot:event.body.LandingPilot,FlightId:wf.flightDetails.FlightId
                                        }
                                        // const params = {
                                        //     FunctionName: 'AdminApproveFlightRequest', // Replace 'my-function' with the name of your Lambda function
                                        //     Payload: JSON.stringify({ 'body': payload, })
                                        // };
                                         const params = {
                                            FunctionName: 'AdminApproveFlightRequest', // Replace 'my-function' with the name of your Lambda function
                                            Payload: JSON.stringify({"body":payload })
                                        };
                                        console.log("payload1", params)
                                        lambda.invoke(params, function (err, data) {
                                            if (err) {
                                                console.error(err);
                                            } else {
                                                console.log(data.Payload);
                                            }
                                        });


                                        setTimeout(function () { TimesSlot() }, 2000);
                                    }
                                });
                            }
                        })
                    }
                })
            }

        }

        // let payload = wf.flightDetails.FlightId
        // const params = {
        //     FunctionName: 'AdminApproveFlightRequest', // Replace 'my-function' with the name of your Lambda function
        //     Payload: JSON.stringify({ 'body': payload, })
        // };
        // console.log("payload2", params)
        // lambda.invoke(params, function (err, data) {
        //     if (err) {
        //         console.error(err);
        //     } else {
        //         console.log(data.Payload);
        //     }
        // });








        TimesSlot()
        // wf.emit('change_in_utm')
    })



    // wf.once('change_in_utm', function () {

    //          const params = {
    //             "TableName": 'Flight',
    //             Key: {
    //                 "FlightId": wf.flightDetails.FlightId,
    //             },
    //             ReturnValues: 'ALL_NEW',
    //             UpdateExpression: 'set #Status = :Status ,',
    //             ExpressionAttributeNames: {
    //                 '#Status': 'Status',

    //             },
    //             ExpressionAttributeValues: {
    //                 ':Status': 'Scheduled',

    //             },
    //         };

    //         docClient.update(params, function (err, data) {
    //             if (err) {
    //                 console.log("Error", err);
    //                 context.fail(JSON.stringify({
    //                     "data": null,
    //                     "error": {
    //                         "code": 500,
    //                         "message": "Internal server error",
    //                         "type": "Server Error",
    //                         "should_display_error": "false"
    //                     },
    //                     "statusCode": 500
    //                 }));
    //                 return;
    //             }
    //             else {
    //                 console.log(data);
    //                 // console.log(data.Attributes);
    //                 sts.assumeRole({

    //                     RoleArn: process.env.ARN,

    //                     RoleSessionName: 'test-session'

    //                 }, function (err, dataAccount) {

    //                     if (err) { // an error occurred

    //                         console.log('Cannot assume role');
    //                         console.log(err, err.stack);
    //                         context.fail(JSON.stringify({
    //                             "data": null,
    //                             "error": {
    //                                 "code": 500,
    //                                 "message": err.message,
    //                                 "type": "Server Error",
    //                                 "should_display_error": "false"
    //                             },
    //                             "statusCode": 500
    //                         }));
    //                         return;

    //                     } else { // successful response

    //                         console.log(dataAccount);

    //                         AWS.config.update({

    //                             accessKeyId: dataAccount.Credentials.AccessKeyId,

    //                             secretAccessKey: dataAccount.Credentials.SecretAccessKey,

    //                             sessionToken: dataAccount.Credentials.SessionToken

    //                         });

    //                         const lambda = new AWS.Lambda({
    //                             region: process.env.AwsRegion
    //                         });

    //                         let payload = {
    //                             "FlightId": data.Attributes.FlightId,
    //                             "DroneId": data.Attributes.DroneId,
    //                             "DroneName": data.Attributes.DroneName,
    //                             "BufferRegion": data.Attributes.BufferRegion,
    //                             "Altitude": data.Attributes.Altitude,
    //                             "ActivityType": data.Attributes.ActivityType,
    //                             "WayPointNum": data.Attributes.WayPointNum,
    //                             "Waypoints": data.Attributes.Waypoints,
    //                             "PilotId": data.Attributes.Pilotdetails[0]["PilotId"],
    //                             "StartTime": data.Attributes.StartTime,
    //                             "EndTime": data.Attributes.EndTime,
    //                             "Lattitude": data.Attributes.Latitude,
    //                             "Longitude": data.Attributes.Longitude
    //                         }
    //                         console.log(payload);

    //                         lambda.invoke({
    //                             FunctionName: LambdaInvokeFunction1,
    //                             Payload: JSON.stringify({
    //                                 "body": payload
    //                             }, null) // pass params
    //                         }, function(error, data) {
    //                             if (error) {
    //                                 console.log(error)
    //                             } else {
    //                                 console.log(data);

    //                             }
    //                         });
    //                         wf.emit('get_OrgId_from_FlightTable')

    //                     }

    //                 });
    //             }
    //         });
    //     })

    // wf.once('get_OrgId_from_FlightTable', function () {
    //     const params = {
    //         TableName: 'Flight',
    //         Key: {
    //             "FlightId": wf.flightDetails.FlightId
    //         }
    //     }
    //     docClient.get(params, function (err, data) {
    //         console.log("error2")
    //         if (err) {
    //             console.log("error2")
    //             console.log("Error", err);
    //             context.fail(JSON.stringify({
    //                 "data": null,
    //                 "error": {
    //                     "code": 500,
    //                     "message": "Internal server error",
    //                     "type": "Server Error",
    //                     "should_display_error": "false"
    //                 },
    //                 "statusCode": 500
    //             }));
    //             return;
    //         }
    //         else {
    //             wf.OrganizationId = data.Item.OrganizationId
    //             console.log("Org",wf.OrganizationId)
    //             wf.emit('update_flightCount_in_Organization')
    //         }
    //     })
    // })

    // wf.once('update_flightCount_in_Organization', function () {
    //     docClient.update({
    //         "TableName": OrganizationTable,
    //         "Key": {
    //             "OrganizationId": wf.OrganizationId
    //         },
    //         "ExpressionAttributeValues": {
    //             ":a": 1
    //         },
    //         "ExpressionAttributeNames": {
    //             "#v": "NumOfFlightsAvailable"
    //         },
    //         "UpdateExpression": "SET #v = #v - :a",
    //         "ReturnValues": "UPDATED_NEW"

    //     }, function (err, data) {
    //         if (err) {
    //             console.log(err);
    //             context.fail(JSON.stringify({
    //                 "data": null,
    //                 "error": {
    //                     "code": 500,
    //                     "message": "Internal server error",
    //                     "type": "Server Error",
    //                     "should_display_error": "false"
    //                 },
    //                 "statusCode": 500
    //             }));
    //             return;
    //         } else {
    //             wf.TimesSlot
    //             // console.log('has been approved')
    //             // context.done(null, {
    //             //     "data": {
    //             //         "MainData": "Flight has been approved"
    //             //     },
    //             //     "error": null,
    //             //     "statusCode": 200
    //             // });
    //             // return;
    //         }
    //     });
    // })

    wf.emit('check_request_body')
};
