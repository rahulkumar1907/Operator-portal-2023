var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

var ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.AwsRegionForEmail });

const lambda = new AWS.Lambda({
    region: process.env.AwsRegion
});

const MasterTableName = process.env.MasterTableName
const FlightTable = process.env.FlightTable
const SkyeTunnelTable = process.env.SkyeTunnelTable
const ClientTable = process.env.ClientTable
var EmailTemplateName = process.env.EmailTemplateName;
var FromAddress = process.env.FromAddress;
var ToAddresss1 = process.env.ToAddresss1;
var ToAddresss2 = process.env.ToAddresss2;
var ToAddresss3 = process.env.ToAddresss3;
var BCCAddress1 = process.env.BCCAddress1;
const LambdaInvokeFunction1 = process.env.LambdaInvokeFunction1;


exports.handler = (event, context, callback) => {
    console.log(event.body, "Body");
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    
    let OperatorEmails = ["akumar@skyeair.tech"]

    wf.once('check_request_body', function () {
        var parameters = '/';
        var Flight = new Object();
        Flight.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';
        Flight.SkyTunnelId = event.body.hasOwnProperty('SkyTunnelId') == true ? event.body.SkyTunnelId.length == 0 ? event.body.SkyTunnelId = '' : event.body.SkyTunnelId : '';
        Flight.PickUpLocation = event.body.hasOwnProperty('PickUpLocation') == true ? event.body.PickUpLocation.length == 0 ? event.body.PickUpLocation = '' : event.body.PickUpLocation : '';
        Flight.DeliveryLocation = event.body.hasOwnProperty('DeliveryLocation') == true ? event.body.DeliveryLocation.length == 0 ? event.body.DeliveryLocation = '' : event.body.DeliveryLocation : '';
        Flight.FlightDuration = event.body.hasOwnProperty('FlightDuration') == true ? event.body.FlightDuration.length == 0 ? event.body.FlightDuration = '' : event.body.FlightDuration : '';
        Flight.FlightDistance = event.body.hasOwnProperty('FlightDistance') == true ? event.body.FlightDistance.length == 0 ? event.body.FlightDistance = '' : event.body.FlightDistance : '';
        Flight.StartTime = event.body.hasOwnProperty('StartTime') == true ? event.body.StartTime.length == 0 ? event.body.StartTime = '' : event.body.StartTime : '';
        Flight.EndTime = event.body.hasOwnProperty('EndTime') == true ? event.body.EndTime.length == 0 ? event.body.EndTime = '' : event.body.EndTime : '';
        Flight.PackageType = event.body.hasOwnProperty('PackageType') == true ? event.body.PackageType.length == 0 ? event.body.PackageType = '' : event.body.PackageType : '';
        Flight.PackageWeight = event.body.hasOwnProperty('PackageWeight') == true ? event.body.PackageWeight.length == 0 ? event.body.PackageWeight = '' : event.body.PackageWeight : '';
        Flight.PickupTime = event.body.hasOwnProperty('PickupTime') == true ? event.body.PickupTime.length == 0 ? event.body.PickupTime = '' : event.body.PickupTime : '';
        Flight.VolumetricWeight = event.body.hasOwnProperty('VolumetricWeight') == true ? event.body.VolumetricWeight.length == 0 ? event.body.VolumetricWeight = '' : event.body.VolumetricWeight : '';
        Flight.ColdChain = event.body.hasOwnProperty('ColdChain') == true ? event.body.ColdChain.length == 0 ? event.body.ColdChain = '' : event.body.ColdChain : '';
        // Flight.ClientId = event.body.hasOwnProperty('ClientId') == true ? event.body.ClientId.length == 0 ? event.body.ClientId = '' : event.body.ClientId : '';
        Flight.PackageNumber = event.body.hasOwnProperty('PackageNumber') == true ? event.body.PackageNumber.length == 0 ? event.body.PackageNumber = '' : event.body.PackageNumber : '';
        Flight.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        Flight.PackageCategory = event.body.hasOwnProperty('PackageCategory') == true ? event.body.PackageCategory.length == 0 ? event.body.PackageCategory = '' : event.body.PackageCategory : '';
        Flight.PickupDate = event.body.hasOwnProperty('PickupDate') == true ? event.body.PickupDate.length == 0 ? event.body.PickupDate = '' : event.body.PickupDate : '';
        Flight.Role = event.body.hasOwnProperty('Role') == true ? event.body.Role.length == 0 ? event.body.Role = '' : event.body.Role : '';
        Flight.OrganizationId = event.body.hasOwnProperty('OrganizationId') == true ? event.body.OrganizationId.length == 0 ? event.body.OrganizationId = '' : event.body.OrganizationId : '';
        Flight.TakeOffPilot = event.body.hasOwnProperty('TakeOffPilot') == true ? event.body.TakeOffPilot.length == 0 ? event.body.TakeOffPilot = '' : event.body.TakeOffPilot : '';
        Flight.LandingPilot = event.body.hasOwnProperty('LandingPilot') == true ? event.body.LandingPilot.length == 0 ? event.body.LandingPilot = '' : event.body.LandingPilot : '';
        Flight.DroneId = event.body.hasOwnProperty('DroneId') == true ? event.body.DroneId.length == 0 ? event.body.DroneId = '' : event.body.DroneId : '';

        console.log("err1")

        if (Flight.FlightId.length == 0) { parameters = parameters + 'FlightId/' }
        if (Flight.SkyTunnelId.length == 0) { parameters = parameters + 'SkyTunnelId/' }
        if (Flight.PickUpLocation.length == 0) { parameters = parameters + 'PickUpLocation/' }
        if (Flight.DeliveryLocation.length == 0) { parameters = parameters + 'DeliveryLocation/' }
        if (Flight.FlightDuration.length == 0) { parameters = parameters + 'FlightDuration/' }
        if (Flight.FlightDistance.length == 0) { parameters = parameters + 'FlightDistance/' }
        if (Flight.StartTime.length == 0) { parameters = parameters + 'StartTime/' }
        if (Flight.EndTime.length == 0) { parameters = parameters + 'EndTime/' }
        if (Flight.PackageType.length == 0) { parameters = parameters + 'PackageType/' }
        if (Flight.PackageWeight.length == 0) { parameters = parameters + 'PackageWeight/' }
        if (Flight.PickupTime.length == 0) { parameters = parameters + 'PickupTime/' }
        if (Flight.VolumetricWeight.length == 0) { parameters = parameters + 'VolumetricWeight/' }
        if (Flight.ColdChain.length == 0) { parameters = parameters + 'ColdChain/' }
        // if (Flight.ClientId.length == 0) { parameters = parameters + 'ClientId/' }
        if (Flight.PackageNumber.length == 0) { parameters = parameters + 'PackageNumber/' }
        if (Flight.OperatorId.length == 0) { parameters = parameters + 'OperatorId/' }
        if (Flight.PackageCategory.length == 0) { parameters = parameters + 'PackageCategory/' }
        if (Flight.PickupDate.length == 0) { parameters = parameters + 'PickupDate/' }
        if (Flight.Role.length == 0) { parameters = parameters + 'Role/' }
        if (Flight.OrganizationId.length == 0) { parameters = parameters + 'OrganizationId/' }
        if (Flight.TakeOffPilot.length == 0) { parameters = parameters + 'TakeOffPilot/' }
        if (Flight.LandingPilot.length == 0) { parameters = parameters + 'LandingPilot/' }
        if (Flight.DroneId.length == 0) { parameters = parameters + 'DroneId/' }

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
        } 
        else {
            wf.updatedFlightDetails = {
                SkyTunnelId: event.body.SkyTunnelId,
                TakeOffPilot:event.body.TakeOffPilot,
                LandingPilot:event.body.LandingPilot,
                DroneId:event.body.DroneId,
                PickUpLocation: event.body.PickUpLocation,
                DeliveryLocation: event.body.DeliveryLocation,
                FlightDuration: event.body.FlightDuration,
                FlightDistance: event.body.FlightDistance,
                StartTime: event.body.StartTime,
                PackageType: event.body.PackageType,
                PackageWeight: event.body.PackageWeight,
                PickupTime: event.body.PickupTime,
                VolumetricWeight: event.body.VolumetricWeight,
                ColdChain: event.body.ColdChain,
                // ClientId: event.body.ClientId,
                ClientName: event.body.OrganizationId.split("-")[0],
                Role: event.body.Role,
                TS_Created: Created_Timestamp,
                TS_Updated: Created_Timestamp,
                EndTime: event.body.EndTime,
                PackageNumber : event.body.PackageNumber,
                OperatorId : event.body.OperatorId,
                PackageCategory : event.body.PackageCategory,
                PickupDate : event.body.PickupDate
            }
            
            
            wf.emit('get_waypoint_details_from_skyetunnel')
        }
    })
    
    wf.once('get_waypoint_details_from_skyetunnel', function () {
        console.log(wf.updatedFlightDetails.SkyTunnelId)
        var params = {
            "TableName": SkyeTunnelTable,
            Key : {
                "SkyeTunnelId" : wf.updatedFlightDetails.SkyTunnelId
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
                wf.updatedFlightDetails.Altitude = data.Item.Altitude;
                wf.updatedFlightDetails.BufferRegion = data.Item.BufferRegion;
                wf.updatedFlightDetails.Latitude = data.Item.Latitude;
                wf.updatedFlightDetails.Longitude = data.Item.Longitude;
                wf.updatedFlightDetails.MaximumAltitude = data.Item.MaximumAltitude;
                wf.updatedFlightDetails.wayPointFileDetails = data.Item.wayPointFileDetails;
                wf.updatedFlightDetails.WayPointNum = data.Item.WayPointNum;
                wf.updatedFlightDetails.Waypoints = data.Item.Waypoints;
                wf.updatedFlightDetails.DroneId = data.Item.DroneId;
                wf.updatedFlightDetails.DroneName = data.Item.DroneName;
                wf.updatedFlightDetails.ActivityType = data.Item.ActivityType;
                wf.updatedFlightDetails.Pilotdetails = data.Item.Pilotdetails;
                wf.updatedFlightDetails.SkyeTunnelName = data.Item.SkyeTunnelName
                // var PilotDetails=[]
                // for(let i=0;i<data.Item.Pilotdetails.length;i++){
                //     if(data.Item.Pilotdetails[i].EmailId==event.body.TakeOffPilot||data.Item.Pilotdetails[i].EmailId==event.body.LandingPilot||data.Item.Pilotdetails[i].Role=="Operation Manager"){
                //       PilotDetails.push(data.Item.Pilotdetails[i]) 
                //     }
                // }
                // wf.flightDetails.Pilotdetails = PilotDetails
                for(let i=0;i<data.Item.Pilotdetails.length;i++){
                    if(data.Item.Pilotdetails[i].Role=="Operation Manager"){
                      OperatorEmails.push(data.Item.Pilotdetails[i].EmailId) 
                    }
                }
                wf.updatedFlightDetails.Demo = false;
                console.log(wf.updatedFlightDetails)
                
                wf.emit('get_oldFlightDetails')
            }
        })
    })

    wf.once('get_oldFlightDetails', function () {
        const params = {
            TableName: FlightTable,
            Key: {
                "FlightId": event.body.FlightId
            }
        }

        docClient.get(params, function (err, data) {
            if (err) {
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 404,
                        "message": "Internal Server Error", err,
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 404
                }));
                return
            }
            else {
                wf.oldFlightId = data.Item.FlightId
                wf.emit("get_organizationID_from_ClientProfile")
            }
        })
    })
   wf.once('get_organizationID_from_ClientProfile', function () {

                wf.updatedFlightDetails.OrganizationId = event.body.OrganizationId
                // wf.flightDetails.CreatedByName = data.Items[0].FirstName
                wf.updatedFlightDetails.CreatedById = event.body.OperatorId
                wf.updatedFlightDetails.CreatedByRole = "Operator"

                // console.log(wf.flightDetails)
                if (event.body.Role == "Operation Manager") {
                    wf.emit('change_Flightstatus_in_DB')
                }
                else {
                    wf.emit('change_Flightstatus_in_DB')
                }
            
    })
    // wf.once('get_organizationID_from_ClientProfile', function () {
    //     console.log(wf.ClientId)
    //     var params = {
    //         "TableName": ClientTable,
    //         IndexName: 'ClientId',
    //         KeyConditionExpression: 'ClientId = :clientVal',
    //         ExpressionAttributeValues: {
    //             ':clientVal': wf.updatedFlightDetails.ClientId
    //         }
    //     };

    //     docClient.query(params, function (err, data) {
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
    //             wf.updatedFlightDetails.OrganizationId = data.Items[0].OrganizationId
    //             wf.updatedFlightDetails.CreatedByName = event.body.OperatorId
    //             console.log(wf.updatedFlightDetails)
    //             wf.emit('change_Flightstatus_in_DB')
    //         }
    //     })
    // })
    
    wf.once('change_Flightstatus_in_DB', function () {
        
        const params = {
            "TableName": FlightTable,
            Key: {
                "FlightId": wf.oldFlightId,
            },
            ReturnValues: 'ALL_NEW',
            UpdateExpression: 'set #Status = :Status',
            ExpressionAttributeNames: {
                '#Status': 'Status',
            },
            ExpressionAttributeValues: {
                ':Status': 'Cancelled'
            }
        };
        
        docClient.update(params,function(err,data){
            if(err){
                console.log("Error",err);
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
            else{
                console.log(data.Attributes);
                let payload = {
                    "FlightId": data.Attributes.FlightId
                }
                console.log(payload)

                lambda.invoke({
                    FunctionName: LambdaInvokeFunction1,
                    Payload: JSON.stringify({
                        "body": payload
                    }, null) // pass params
                }, function (error, data) {
                    if (error) {
                        console.log(error)
                    } else {
                        console.log(data);

                    }
                });
                wf.emit('get_counter_from_db')
            }
        });        
    })
    
    wf.once('get_counter_from_db', function () {
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
                console.log("Data", data);
                console.log(data.Attributes.CounterId);
                var str = "" + data.Attributes.CounterId;
                var pad = "00000";
                var ans = pad.substring(0, pad.length - str.length) + str;
                wf.updatedFlightDetails.FlightId = "Flight" + ans;
                wf.updatedFlightDetails.OrderId = wf.updatedFlightDetails.FlightId
                wf.updatedFlightDetails.Status = "Approval Pending"
                wf.emit('register_flightDetails_to_table');
            }
        });
    })
    
     wf.once('register_flightDetails_to_table', function () {
        var params = {
            "TableName": FlightTable,
            Item: wf.updatedFlightDetails
        };
        console.log("Flight", wf.updatedFlightDetails)
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
                wf.emit('send_email_to_admin')
            }
        })
    })
    
    wf.once("send_email_to_admin", function () {
        wf.flightDetails = wf.updatedFlightDetails
        // wf.loginURL = `https://admin-approve-client-test.s3.ap-south-1.amazonaws.com/AdminApproveFlight.html?flightid=${wf.flightDetails.FlightId}`
          wf.loginURL='https://skyeairops.tech/operator/auth/login'
        wf.TemplateData = "{ \"FlightId\":\""+wf.flightDetails.FlightId+"\", \"OrderId\":\""+wf.flightDetails.OrderId+"\",\"SkyTunnelId\":\""+wf.flightDetails.SkyTunnelId+"\", \"StartTime\":\""+wf.flightDetails.StartTime+"\", \"EndTime\":\""+wf.flightDetails.EndTime+"\",\"PackageType\":\""+wf.flightDetails.PackageType+"\",\"PackageWeight\":\""+wf.flightDetails.PackageWeight+"\",\"PackageNumber\":\""+wf.flightDetails.PackageNumber+"\",\"VolumetricWeight\":\""+wf.flightDetails.VolumetricWeight+"\",\"PickupTime\":\""+wf.flightDetails.PickupTime+"\",\"ColdChain\":\""+wf.flightDetails.ColdChain+"\",\"DroneId\":\""+wf.flightDetails.DroneId+"\",\"DroneName\":\""+wf.flightDetails.DroneName+"\",\"ClientId\":\""+wf.flightDetails.ClientId+"\",\"OrganizationId\":\""+wf.flightDetails.OrganizationId+"\",\"ApproveLink\":\""+wf.loginURL+"\"}";
        var params = {
            "Source": FromAddress,
            "Template": EmailTemplateName,
            "Destination": {
                "ToAddresses": [ToAddresss2,ToAddresss3],
                "CcAddresses": OperatorEmails,
                "BccAddresses": [BCCAddress1]
            },            
            "TemplateData": wf.TemplateData
        };

        //console.log(params);
        ses.sendTemplatedEmail(params, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                context.done(null, {
                    "data": {
                        "MainData": "Flight Details Updated successfully"
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }  
        });     
    });

    wf.emit('check_request_body')
};
