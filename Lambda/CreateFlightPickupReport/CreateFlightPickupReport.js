var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

const s3 = new AWS.S3({
    region: process.env.AwsRegion
})

var ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.AwsRegionForEmail });

var EmailTemplateName   = process.env.EmailTemplateName;
var FromAddress   = process.env.FromAddress;
var ToAddresss2   = process.env.ToAddresss2;
var BCCAddress1   = process.env.BCCAddress1;

const ClientTable = process.env.ClientTable;
const FlightTable = process.env.FlightTable
const MasterTableName = process.env.MasterTableName
const BucketName = process.env.BucketName
const PickupDetailsPDFbucket = process.env.PickupDetailsPDFtable
const pickupTable = process.env.pickupTable

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

        Flight.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        Flight.PickupDate = event.body.hasOwnProperty('PickupDate') == true ? event.body.PickupDate.length == 0 ? event.body.PickupDate = '' : event.body.PickupDate : '';
        Flight.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';
        Flight.ClientOrderId = event.body.hasOwnProperty('ClientOrderId') == true ? event.body.ClientOrderId.length == 0 ? event.body.ClientOrderId = '' : event.body.ClientOrderId : '';
        Flight.DeliveryLocation = event.body.hasOwnProperty('DeliveryLocation') == true ? event.body.DeliveryLocation.length == 0 ? event.body.DeliveryLocation = '' : event.body.DeliveryLocation : '';
        Flight.NoOfPackage = event.body.hasOwnProperty('NoOfPackage') == true ? event.body.NoOfPackage.length == 0 ? event.body.NoOfPackage = '' : event.body.NoOfPackage : '';
        Flight.PackageType = event.body.hasOwnProperty('PackageType') == true ? event.body.PackageType.length == 0 ? event.body.PackageType = '' : event.body.PackageType : '';
        Flight.PackageCategory = event.body.hasOwnProperty('PackageCategory') == true ? event.body.PackageCategory.length == 0 ? event.body.PackageCategory = '' : event.body.PackageCategory : '';
        Flight.PackageCondition = event.body.hasOwnProperty('PackageCondition') == true ? event.body.PackageCondition.length == 0 ? event.body.PackageCondition = '' : event.body.PackageCondition : '';
        Flight.PackageWeight = event.body.hasOwnProperty('PackageWeight') == true ? event.body.PackageWeight.length == 0 ? event.body.PackageWeight = '' : event.body.PackageWeight : '';
        Flight.PackageIdInformation = event.body.hasOwnProperty('PackageIdInformation') == true ? event.body.PackageIdInformation.length == 0 ? event.body.PackageIdInformation = '' : event.body.PackageIdInformation : '';
        Flight.PickupImage = event.body.hasOwnProperty('PickupImage') == true ? event.body.PickupImage.length == 0 ? event.body.PickupImage = '' : event.body.PickupImage : '';
        Flight.PickupTime = event.body.hasOwnProperty('PickupTime') == true ? event.body.PickupTime.length == 0 ? event.body.PickupTime = '' : event.body.PickupTime : '';
        // Flight.ClientId = event.body.hasOwnProperty('ClientId') == true ? event.body.ClientId.length == 0 ? event.body.ClientId = '' : event.body.ClientId : '';
        Flight.PickupDetailsPDF = event.body.hasOwnProperty('PickupDetailsPDF') == true ? event.body.PickupDetailsPDF.length == 0 ? event.body.PickupDetailsPDF = '' : event.body.PickupDetailsPDF : '';
        Flight.ClientName = event.body.hasOwnProperty('ClientName') == true ? event.body.ClientName.length == 0 ? event.body.ClientName = '' : event.body.ClientName : '';




        if (Flight.OperatorId.length == 0) { parameters = parameters + 'OperatorId/' }
        if (Flight.PickupDate.length == 0) { parameters = parameters + 'PickupDate/' }
        if (Flight.FlightId.length == 0) { parameters = parameters + 'FlightId/' }
        if (Flight.ClientOrderId.length == 0) { parameters = parameters + 'ClientOrderId/' }
        if (Flight.DeliveryLocation.length == 0) { parameters = parameters + 'DeliveryLocation/' }
        if (Flight.NoOfPackage.length == 0) { parameters = parameters + 'NoOfPackage/' }
        if (Flight.PackageType.length == 0) { parameters = parameters + 'PackageType/' }
        if (Flight.PackageCategory.length == 0) { parameters = parameters + 'PackageCategory/' }
        if (Flight.PackageCondition.length == 0) { parameters = parameters + 'PackageCondition/' }
        if (Flight.PackageWeight.length == 0) { parameters = parameters + 'PackageWeight/' }
        if (Flight.PackageIdInformation.length == 0) { parameters = parameters + 'PackageIdInformation/' }
        if (Flight.PickupImage.length == 0) { parameters = parameters + 'PickupImage/' }
        if (Flight.PickupTime.length == 0) { parameters = parameters + 'PickupTime/' }
        // if (Flight.ClientId.length == 0) { parameters = parameters + 'ClientId/' }
        if (Flight.PickupDetailsPDF.length == 0) { parameters = parameters + 'PickupDetailsPDF/' }
        if (Flight.ClientName.length == 0) { parameters = parameters + 'ClientName/' }

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
                OperatorId: event.body.OperatorId,
                PickupDate: event.body.PickupDate,
                FlightId: event.body.FlightId,
                ClientOrderId: event.body.ClientOrderId,
                DeliveryLocation: event.body.DeliveryLocation,
                NoOfPackage: event.body.NoOfPackage,
                PackageType: event.body.PackageType,
                PackageCategory: event.body.PackageCategory,
                PackageCondition: event.body.PackageCondition,
                PackageWeight: event.body.PackageWeight,
                ClientName: event.body.ClientName,
                PackageIdInformation: event.body.PackageIdInformation,
                PickupTime: event.body.PickupTime,
                FileName :event.body.FileName,
                TS_Created: Created_Timestamp,
                TS_Updated: Created_Timestamp,
            }

            wf.emit('get_clientDetails_from_clientProfile');
        }
    })
     wf.once("get_clientDetails_from_clientProfile", function () {
       
 
                wf.emit('get_drone_details_from_flightId')
            
               
    })
    
    // wf.once("get_clientDetails_from_clientProfile", function () {
    //     var params = {
    //         "TableName": ClientTable,
    //         IndexName: 'ClientId',
    //         KeyConditionExpression: 'ClientId = :clientVal',
    //         ExpressionAttributeValues: {
    //             ':clientVal': event.body.ClientId
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
    //                     "Error":err,
    //                     "type": "Server Error",
    //                     "should_display_error": "false"
    //                 },
    //                 "statusCode": 500
    //             }));
    //             return;
    //         }
    //         else {
    //             wf.flightDetails.ClientName = data.Items[0].Organization
    //             wf.ClientEmail = data.Items[0].EmailId
    //             console.log(wf.flightDetails)
    //             wf.emit('get_drone_details_from_flightId')
    //         }
    //     })        
    // })

    wf.once('get_drone_details_from_flightId', function () {

        var params = {
            "TableName": FlightTable,
            Key: {
                "FlightId": wf.flightDetails.FlightId
            }
        }

        docClient.get(params, function (err, data) {
            
            if (err) {
                console.log("error3")
                console.log("Error", err);
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 500,
                        "message": "Internal server error",
                        "Error":err,
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            }
            else {
                wf.flightDetails.DroneUsed = data.Item.DroneName;
                wf.flightDetails.FlightType = data.Item.ActivityType;

                wf.emit('set_pickup_id_for_pickup_report')
            }
        })
    })

    wf.once('set_pickup_id_for_pickup_report', function () {
        docClient.update({
            "TableName": MasterTableName,
            "Key": {
                "Module": "PickUpCounter"
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
                console.log("error4")
                console.log(err);
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 500,
                        "message": "Internal server error",
                        "Error":err,
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            } else {
                console.log(data.Attributes.CounterId);
                var str = "" + data.Attributes.CounterId;
                var pad = "00000";
                var ans = pad.substring(0, pad.length - str.length) + str;
                wf.flightDetails.PickupId = "PICKUP" + ans;
                wf.emit('upload_image_in_s3_bucket');
            }
        });
    });

    wf.once('upload_image_in_s3_bucket', function () {
        let pickupImageArray = []
        
        event.body.PickupImage.forEach((image)=>{
        let buffer = Buffer.from(image, 'base64');

        let Timestamp = new Date().toISOString();
        var params = {
            'Bucket': BucketName,
            'Key': wf.flightDetails.FlightId+'/PickUp_report_'+wf.flightDetails.FlightId + Timestamp + '.' + "png",
            'Body': buffer,
            'ACL': "public-read",
        };

        s3.upload(params, function (err, data) {
            if (err) {
                console.log("error6")
                console.log(err);
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 500,
                        "message": "Internal server error",
                        "error":err,
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            } else {
                pickupImageArray.push(data.Location)
                
                  if (pickupImageArray.length == event.body.PickupImage.length) {
                     wf.flightDetails.PickupImageURL = pickupImageArray
                       wf.emit("upload_pickupDetailsPDF_in_s3_bucket");
                }
            }
        });            
        }) 
        // wf.flightDetails.PickupImageURL = pickupImageArray;
        
        // wf.emit("upload_pickupDetailsPDF_in_s3_bucket");
    });
    
    wf.once("upload_pickupDetailsPDF_in_s3_bucket",function (){
        let buffer = Buffer.from(event.body.PickupDetailsPDF, 'base64');

        let Timestamp = new Date().toISOString();
        var params = {
            'Bucket': PickupDetailsPDFbucket,
            'Key': wf.flightDetails.FlightId+'/Create_PickUp_report_PDF'+wf.flightDetails.FlightId + Timestamp+ "." + "pdf",
            'Body': buffer,
            'ACL': "public-read",
        };

        s3.upload(params, function (err, data) {
            if (err) {
                console.log("error6")
                console.log(err);
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                        "code": 500,
                        "message": "Internal server error",
                        "error":err,
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            } else {
                // console.log(data.Location)
                wf.flightDetails.PickupDetailsPDF = data.Location
                wf.emit('store_client_in_pickup_report_db');
            }
        });
    });

    wf.once('store_client_in_pickup_report_db', function () {
        console.log(wf.flightDetails);
        var params = {
            TableName: pickupTable,
            Item: wf.flightDetails
        };
        docClient.put(params, function (err, data) {
            if (err) {
                console.log("error7")
                console.log(err);
                context.fail(JSON.stringify({
                    "data": null,
                    "error": {
                       "code": 500,
                        "message": "Internal server error",
                        "Error":err,
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            } else {
                 context.done(null, {
                    "data": {
                        "MainData": "Pickup Report has been created"
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
                // wf.emit("send_pickupDetails_to_Client")
            }
        })
    })
    
    // wf.once("send_pickupDetails_to_Client", function () {
        
        
    //     var TemplateData = "{ \"PickUpLink\":\"" + wf.flightDetails.PickupDetailsPDF + "\" }";
        
    //     var params = {
    //         "Source": FromAddress,
    //         "Template": EmailTemplateName,
    //         "Destination": {
    //             "ToAddresses": [wf.ClientEmail],
    //             "CcAddresses": [process.env.ToAddresss3],
    //             "BccAddresses": [BCCAddress1]
    //         },            
    //         "TemplateData": TemplateData
    //     };
        
    //     ses.sendTemplatedEmail(params, function (err, data) {
    //         if (err) {
    //             console.log("error8")
    //             console.log(err);
    //             context.fail(JSON.stringify({
    //                 "data": null,
    //                 "error": {
    //                     "code": 500,
    //                     "message": "Internal server error",
    //                     "Error":err,
    //                     "type": "Server Error",
    //                     "should_display_error": "false"
    //                 },
    //                 "statusCode": 500
    //             }));
    //             return;
    //         }
    //         else {
    //             context.done(null, {
    //                 "data": {
    //                     "MainData": "Pickup Report has been created"
    //                 },
    //                 "error": null,
    //                 "statusCode": 200
    //             });
    //             return;
    //         }  
    //     });
    // })
    
    wf.emit('check_request_body')
};
