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

// const ClientTable = process.env.ClientTable;
// const FlightTable = process.env.FlightTable
// const MasterTableName = process.env.MasterTableName
const BucketName = process.env.BucketName
const PickupDetailsPDFbucket = process.env.PickupDetailsPDFtable
const pickupTable = process.env.pickupTable
const clientTable = process.env.ClientTable

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
        Flight.PickupTime = event.body.hasOwnProperty('PickupTime') == true ? event.body.PickupTime.length == 0 ? event.body.PickupTime = '' : event.body.PickupTime : '';
        // Flight.ClientId = event.body.hasOwnProperty('ClientId') == true ? event.body.ClientId.length == 0 ? event.body.ClientId = '' : event.body.ClientId : '';
        Flight.PickupDetailsPDF = event.body.hasOwnProperty('PickupDetailsPDF') == true ? event.body.PickupDetailsPDF.length == 0 ? event.body.PickupDetailsPDF = '' : event.body.PickupDetailsPDF : '';
        Flight.PickupId = event.body.hasOwnProperty('PickupId') == true ? event.body.PickupId.length == 0 ? event.body.PickupId = '' : event.body.PickupId : '';
        Flight.PickupImage = event.body.hasOwnProperty('PickupImage') == true ? event.body.PickupImage.length == 0 ? event.body.PickupImage = '' : event.body.PickupImage : '';
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
        if (Flight.PickupTime.length == 0) { parameters = parameters + 'PickupTime/' }
        // if (Flight.ClientId.length == 0) { parameters = parameters + 'ClientId/' }
        if (Flight.ClientName.length == 0) { parameters = parameters + 'ClientName/' }
        if (Flight.PickupDetailsPDF.length == 0) { parameters = parameters + 'PickupDetailsPDF/' }
        if (Flight.PickupId.length == 0) { parameters = parameters + 'PickupId/' }
        if (Flight.PickupImage.length == 0) { parameters = parameters + 'PickupImage/' }
        
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
                ClientName:event.body.ClientName,
                PackageCategory: event.body.PackageCategory,
                PackageCondition: event.body.PackageCondition,
                PackageWeight: event.body.PackageWeight,
                PackageIdInformation: event.body.PackageIdInformation,
                PickupTime: event.body.PickupTime,
                TS_Updated: Created_Timestamp,
            }
            
            wf.emit('get_client_details_from_clientProfile', function() {
                
            })
            
        }
    })
    
    wf.once('get_client_details_from_clientProfile', function () {
        

                wf.emit("upload_image_in_s3_bucket")
                
         
    })
    
    // wf.once('get_client_details_from_clientProfile', function () {
    //     console.log(wf.ClientId)
    //     const params = {
    //         TableName: clientTable,
    //         IndexName: 'ClientId',
    //         KeyConditionExpression: 'ClientId = :cityVal',
    //         ExpressionAttributeValues: {
    //             ':cityVal': event.body.ClientId
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
    //             wf.ClientEmail = data.Items[0].EmailId
    //             console.log(wf.ClientEmail)
    //             // wf.ClientEmail = "akumar@skyeair.tech"
    //             wf.emit("upload_image_in_s3_bucket")
                
    //         }
    //     })
    // })

 wf.once('upload_image_in_s3_bucket', function () { 
    var UrlArray=[]
    
    for(let i=0;i<event.body.PickupImage.length;i++){
        let buffer = Buffer.from(event.body.PickupImage[i], 'base64');

        let Timestamp = new Date().toISOString();
        var params = {
            'Bucket': BucketName,
            'Key': 'pickup/' + event.body.FlightId + '/Report/report_' + Timestamp + '.' + "png",
            'Body': buffer,
            'ACL': "public-read",
        };

        s3.upload(params, function (err, data) {
            if (err) {
                console.log("error7")
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
                console.log(data.Location)
                UrlArray.push(data.Location)
              
                if (UrlArray.length == event.body.PickupImage.length) {
                    event.body.PickupImageURL = UrlArray
                    console.log("array", UrlArray)
                    wf.emit('upload_pickupDetailsPDF_in_s3_bucket');
                }
            }
        })
    }
});

    // wf.once('upload_image_in_s3_bucket', function () {
    //     let pickupImageArray = []
        
    //     event.body.PickupImage.forEach((image)=>{
    //     let buffer = Buffer.from(image, 'base64');

    //     let Timestamp = new Date().toISOString();
    //     var params = {
    //         'Bucket': BucketName,
    //         'Key': wf.flightDetails.FlightId+'/Updated_PickUp_report_'+wf.flightDetails.FlightId + Timestamp + '.' + "png",
    //         'Body': buffer,
    //         'ACL': "public-read",
    //     };

    //     s3.upload(params, function (err, data) {
    //         if (err) {
    //             console.log("error6")
    //             console.log(err);
    //             context.fail(JSON.stringify({
    //                 "data": null,
    //                 "error": {
    //                     "code": 500,
    //                     "message": "Internal server error",
    //                     "error":err,
    //                     "type": "Server Error",
    //                     "should_display_error": "false"
    //                 },
    //                 "statusCode": 500
    //             }));
    //             return;
    //         } else {
    //             console.log("data",data.Location)
              
    //             pickupImageArray.push(data.Location)
    //         }
    //     });            
    //     }) 
    //     wf.flightDetails.PickupImageURL = pickupImageArray;
    //     console.log("pickupImageUrl",pickupImageArray)
        
    //     wf.emit("upload_pickupDetailsPDF_in_s3_bucket");
    // });
    
    wf.once("upload_pickupDetailsPDF_in_s3_bucket",function (){
        let buffer = Buffer.from(event.body.PickupDetailsPDF, 'base64');

        let Timestamp = new Date().toISOString();
        var params = {
            'Bucket': PickupDetailsPDFbucket,
            'Key': wf.flightDetails.FlightId+'/Updated_PickUp_report_PDF'+wf.flightDetails.FlightId + Timestamp + "." + "pdf",
            'Body': buffer,
            'ACL': "public-read",
        };

        s3.upload(params, function (err, data) {
            if (err) {
                console.log("error7")
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
                wf.emit('update_in_pickup_report_db');
            }
        });
    });

    wf.once('update_in_pickup_report_db', function () {
        
        
        var params = {
            TableName: pickupTable,
            Key: {
                "PickupId": event.body.PickupId
            },
            UpdateExpression: 'set #PickupDate = :PickupDate,#ClientName = :ClientName, #ClientOrderId = :DeliveryLocation, #NoOfPackage = :NoOfPackage, #PackageType = :PackageType, #PackageCategory = :PackageCategory, #PackageCondition = :PackageCondition, #PackageWeight = :PackageWeight, #PackageIdInformation = :PackageIdInformation, #PickupTime = :PickupTime, #PickupImageURL = :PickupImageURL, #PickupDetailsPDF = :PickupDetailsPDF, #TS_Updated = :TS_Updated',
            ExpressionAttributeNames: {
                '#PickupDate': 'PickupDate',
                '#ClientOrderId':'DeliveryLocation',
                '#NoOfPackage':'NoOfPackage',
                '#PackageType':'PackageType',
                '#PackageCategory': 'PackageCategory',
                '#PackageCondition':'PackageCondition',
                '#ClientName':'ClientName',
                '#PackageWeight':'PackageWeight',
                '#PackageIdInformation':'PackageIdInformation',
                '#PickupTime':'PickupTime',
                '#PickupImageURL':'PickupImageURL',
                '#PickupDetailsPDF':'PickupDetailsPDF',
                '#TS_Updated':'TS_Updated'
            },
            ExpressionAttributeValues: {
                ':PickupDate': wf.flightDetails.PickupDate,
                ':DeliveryLocation':wf.flightDetails.DeliveryLocation,
                ':ClientName': wf.flightDetails.ClientName,
                ':NoOfPackage': wf.flightDetails.NoOfPackage,
                ':PackageType' : wf.flightDetails.PackageType,
                ':PackageCategory':wf.flightDetails.PackageCategory,
                ':PackageCondition':wf.flightDetails.PackageCondition,
                ':PackageWeight':wf.flightDetails.PackageWeight,
                ':PackageIdInformation':wf.flightDetails.PackageIdInformation,
                ':PickupTime':wf.flightDetails.PickupTime,
                ':PickupImageURL':  event.body.PickupImageURL,
                ':PickupDetailsPDF':wf.flightDetails.PickupDetailsPDF,
                ':TS_Updated': wf.flightDetails.TS_Updated
            }, 
        };
        docClient.update(params, function (err, data) {
            if (err) {
                console.log("error7")
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
                
                 context.done(null, {
                    "data": {
                        "MainData": "Pickup Report has been updated"
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
    //         }
    //         else {
    //             context.done(null, {
    //                 "data": {
    //                     "MainData": "Pickup Report has been updated"
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
 