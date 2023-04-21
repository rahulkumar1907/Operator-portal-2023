var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
const s3 = new AWS.S3({
    region: process.env.AwsRegion
})
var ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.AwsRegionForEmail });

// const MasterTableName = process.env.MasterTableName
// var EmailTemplateName = process.env.EmailTemplateName;
var FromAddress = process.env.FromAddress;
// var ToAddresss1 = process.env.ToAddresss1;
// var ToAddresss2 = process.env.ToAddresss2;
// var BCCAddress1 = process.env.BCCAddress1;

exports.handler = (event, context, callback) => {
    // console.log(event.body, "Body");
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }

    wf.once('check_request_body', function () {
        var parameters = '/';
        var operator = new Object();
        operator.DeliveryLocation = event.body.hasOwnProperty('DeliveryLocation') == true ? event.body.DeliveryLocation.length == 0 ? event.body.DeliveryLocation = '' : event.body.DeliveryLocation : '';
        operator.DeliveryDate = event.body.hasOwnProperty('DeliveryDate') == true ? event.body.DeliveryDate.length == 0 ? event.body.DeliveryDate = '' : event.body.DeliveryDate : '';
        operator.PackageTemperature = event.body.hasOwnProperty('PackageTemperature') == true ? event.body.PackageTemperature.length == 0 ? event.body.PackageTemperature = '' : event.body.PackageTemperature : '';
        operator.RecievedBy = event.body.hasOwnProperty('RecievedBy') == true ? event.body.RecievedBy.length == 0 ? event.body.RecievedBy = '' : event.body.RecievedBy : '';
        operator.DeliveryTime = event.body.hasOwnProperty('DeliveryTime') == true ? event.body.DeliveryTime.length == 0 ? event.body.DeliveryTime = '' : event.body.DeliveryTime : '';
        operator.OperatorRemark = event.body.hasOwnProperty('OperatorRemark') == true ? event.body.OperatorRemark.length == 0 ? event.body.OperatorRemark = '' : event.body.OperatorRemark : '';
        operator.TimeTaken = event.body.hasOwnProperty('TimeTaken') == true ? event.body.TimeTaken.length == 0 ? event.body.TimeTaken = '' : event.body.TimeTaken : '';
        operator.FlightNumber = event.body.hasOwnProperty('FlightNumber') == true ? event.body.FlightNumber.length == 0 ? event.body.FlightNumber = '' : event.body.FlightNumber : '';
        operator.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';
        operator.HubDetails = event.body.hasOwnProperty('HubDetails') == true ? event.body.HubDetails.length == 0 ? event.body.HubDetails = '' : event.body.HubDetails : '';
        operator.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        // operator.UploadImage = event.body.hasOwnProperty('UploadImage') == true ? event.body.UploadImage.length == 0 ? event.body.UploadImage = '' : event.body.UploadImage : '';
        operator.ClientId = event.body.hasOwnProperty('ClientId') == true ? event.body.ClientId.length == 0 ? event.body.ClientId = '' : event.body.ClientId : '';
        operator.deliveryDetailPdf = event.body.hasOwnProperty('deliveryDetailPdf') == true ? event.body.deliveryDetailPdf.length == 0 ? event.body.deliveryDetailPdf = '' : event.body.deliveryDetailPdf : '';

        if (operator.DeliveryLocation.length == 0) { parameters = parameters + 'DeliveryLocation/' }
        if (operator.DeliveryDate.length == 0) { parameters = parameters + 'DeliveryDate/' }
        if (operator.PackageTemperature.length == 0) { parameters = parameters + 'PackageTemperature/' }
        if (operator.RecievedBy.length == 0) { parameters = parameters + 'RecievedBy/' }
        if (operator.DeliveryTime.length == 0) { parameters = parameters + 'DeliveryTime/' }
        if (operator.OperatorRemark.length == 0) { parameters = parameters + 'OperatorRemark/' }
        if (operator.TimeTaken.length == 0) { parameters = parameters + 'TimeTaken/' }
        if (operator.FlightNumber.length == 0) { parameters = parameters + 'FlightNumber/' }
        if (operator.FlightId.length == 0) { parameters = parameters + 'FlightId/' }
        if (operator.HubDetails.length == 0) { parameters = parameters + 'HubDetails/' }
        if (operator.OperatorId.length == 0) { parameters = parameters + 'OperatorId/' }
        // if (operator.UploadImage.length == 0) { parameters = parameters + 'UploadImage/' }
        if (operator.deliveryDetailPdf.length == 0) { parameters = parameters + 'deliveryDetailPdf/' }
        if (operator.ClientId.length == 0) { parameters = parameters + 'ClientId/' }

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
            wf.emit('get_flight_details_from_flight_table');
        }
    })

   

    wf.once('get_flight_details_from_flight_table', function () {
        const params = {
            TableName: process.env.FlightTableName,
            Key: {
                FlightId: event.body.FlightId

            }
        }
        docClient.get(params, function (err, data) {
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
            }
            else {
                //   console.log("data",data)
                event.body.DroneUsed = data.Item.DroneName
                event.body.FlightType = data.Item.ActivityType
                //   console.log("Body",event.body)
                wf.emit('get_pickUp_Id_from_pickup_report');

            }
        });
    });

    wf.once('get_pickUp_Id_from_pickup_report', function () {
        const params = {
            TableName: process.env.PickUpTableName,
            IndexName: "FlightId",
            KeyConditionExpression: '#FlightId = :FlightId',
            ExpressionAttributeNames: {
                "#FlightId": "FlightId",
            },
            ExpressionAttributeValues: {
                ":FlightId": event.body.FlightId,
            }
        };
        //  console.log(params)

        docClient.query(params, function (err, data) {
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
                //   console.log("data index",data.Items)
                if (data.Items) {
                    let PickupId = data.Items.map(element => element.PickupId)
                    let ClientName = data.Items.map(element => element.ClientName)
                    // let ClientId = data.Items.map(element => element.ClientId)
                    //   console.log("pickupId",PickupId[0])
                    event.body.PickupId = PickupId[0]
                    event.body.ClientName = ClientName[0]
                    // event.body.ClientId = ClientId[0]
                    // console.log("client Name",event.body.ClientName)
                    wf.emit('check_upload_image_present_or_not');

                }
            }
        })
    });
 wf.once('check_upload_image_present_or_not', function () {
       if(event.body.UploadImage!=null){
        //   console.log("image base64  coming")
             wf.emit('upload_image_to_s3_bucket');
       } 
       else{
            const params = {
            TableName: "DeliveryReport",
            Key: {
                "DeliveryId": event.body.DeliveryId,
            }
        }
       docClient.get(params,function(err,data){
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
            else{
                // console.log("deldata",data)
                event.body.DeliveryImageURL=data.Item.DeliveryImageURL
                wf.emit('store_delivery_details');
            }
       })
       }

       

       
    });
    wf.once('upload_image_to_s3_bucket', function () {
        let buffer = Buffer.from(event.body.UploadImage, 'base64');

        let Timestamp = new Date().toISOString();
        var params = {
            'Bucket': process.env.BUCKETNAME,
            'Key': Timestamp.slice(0, 10) + "-" + event.body.FlightId + "SkyeAir" + "." + "png",
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
                // console.log(data.Location)
                event.body.DeliveryImageURL = data.Location
                wf.emit('store_delivery_details');
            }
        })
    });

    wf.once('store_delivery_details', function () {
        let buffer = Buffer.from(event.body.deliveryDetailPdf, 'base64');

        let Timestamp = new Date().toISOString();
        var params = {
            'Bucket': process.env.DeliveryDetailUrlBucket,
            'Key': Timestamp.slice(0, 10) + "-" + "DeliveryDetails" + "SkyeAir" + "." + "pdf",
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
                // console.log(data.Location)
                event.body.DeliveryDetailURL = data.Location
                wf.emit('get_client_Email_Id');
            }
        })
    });

    wf.once('get_client_Email_Id', function () {
      console.log("clientid",event.body.ClientId)
        var params = {
            "TableName": process.env.ClientTable,
            IndexName: 'ClientId',
            KeyConditionExpression: 'ClientId = :clientVal',
            ExpressionAttributeValues: {
                ':clientVal': event.body.ClientId
            }
        };

        docClient.query(params, function (err, data) {
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
                event.body.EmailId = data.Items[0].EmailId
                wf.emit('send_email_to_client')
            }
        })
    })
    // wf.once("send_email", function () {
    //     var DeliveryId = event.body.DeliveryId
    //     var ClientName = event.body.ClientName
    //     var DeliveryDate = event.body.DeliveryDate
    //     var DroneUsed = event.body.DroneUsed
    //     var DeliveryLocation = event.body.DeliveryLocation
    //     var FlightType = event.body.FlightType
    //     var PackageTemperature = event.body.PackageTemperature
    //     var ReceivedBy = event.body.RecievedBy
    //     var DeliveryTime = event.body.DeliveryTime
    //     var OperatorRemark = event.body.OperatorRemark||""
    //     var TimeTaken = event.body.TimeTaken
    //     var FlightNumber = event.body.FlightNumber
    //     var DeliveryImageURL = event.body.DeliveryImageURL
    //     var HubDetails = event.body.HubDetails
    //     var FlightId = event.body.FlightId
    //     var PickupId = event.body.pickupId


    //     var TemplateData = "{ \"DeliveryId\":\"" + DeliveryId + "\", \"ClientName\":\"" + ClientName + "\",\"DeliveryDate\":\"" + DeliveryDate + "\", \"DroneUsed\":\"" + DroneUsed + "\",\"DeliveryLocation\":\"" + DeliveryLocation + "\",\"FlightType\":\"" + FlightType + "\",\"PackageTemperature\":\"" + PackageTemperature + "\",\"ReceivedBy\":\"" + ReceivedBy + "\",\"DeliveryTime\":\"" + DeliveryTime + "\",\"OperatorRemark\":\"" + OperatorRemark + "\",\"TimeTaken\":\"" + TimeTaken + "\",\"FlightNumber\":\"" + FlightNumber + "\",\"DeliveryImageURL\":\"" + DeliveryImageURL + "\",\"HubDetails\":\"" + HubDetails + "\",\"FlightId\":\"" + FlightId + "\",\"PickupId\":\"" + PickupId + "\" }";
    //     var params = {
    //         "Source": FromAddress,
    //         "Template": EmailTemplateName,
    //         "Destination": {
    //             "ToAddresses": [ToAddresss1, ToAddresss2],
    //             "CcAddresses": [],
    //             "BccAddresses": [BCCAddress1]
    //         },
    //         "TemplateData": TemplateData
    //     };

    //     //console.log(params);
    //     ses.sendTemplatedEmail(params, function (err, data) {
    //         if (err) {
    //             console.log(err);
    //         }
    //         else {
    //             //console.log(data);
    //             wf.emit('store_client_to_delivery_report_db')
    //         }
    //     });
    // });
    wf.once("send_email_to_client", function () {
        var DeliveryLink = event.body.DeliveryDetailURL



        var TemplateData = "{ \"DeliveryLink\":\"" + DeliveryLink + "\" }";
        var params = {
            "Source": FromAddress,
            "Template": process.env.EmailTemplateName1,
            "Destination": {
                "ToAddresses": [event.body.EmailId],
                "CcAddresses": [],
                "BccAddresses": [BCCAddress1]
            },
            "TemplateData": TemplateData
        };

        //console.log(params);
        ses.sendTemplatedEmail(params, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                //console.log(data);
                wf.emit('store_client_to_delivery_report_db')
            }
        });
    });
    wf.once('store_client_to_delivery_report_db', function () {
         const params = {
            TableName: process.env.DeliveryReportTableName,
            Key: {
                "DeliveryId": event.body.DeliveryId,
            },
            UpdateExpression: 'set DeliveryDate = :DeliveryDate,DeliveryLocation = :DeliveryLocation,PackageTemperature = :PackageTemperature,RecievedBy= :RecievedBy, DeliveryTime= :DeliveryTime ,OperatorRemark= :OperatorRemark, TimeTaken= :TimeTaken ,FlightNumber= :FlightNumber, HubDetails= :HubDetails, FlightId= :FlightId, OperatorId= :OperatorId ,DeliveryImageURL= :DeliveryImageURL, PickupId= :PickupId,DroneUsed= :DroneUsed,FlightType= :FlightType, ClientName= :ClientName, DeliveryDetailUrl= :DeliveryDetailUrl, TS_Created= :TS_Created',
            ExpressionAttributeValues: {
                ':DeliveryDate': event.body.DeliveryDate,
                ':DeliveryLocation': event.body.DeliveryLocation,
                ':PackageTemperature': event.body.PackageTemperature,
                ':RecievedBy': event.body.RecievedBy,
                ':DeliveryTime': event.body.DeliveryTime,
                ':OperatorRemark': event.body.OperatorRemark || "No Remark",
                ':TimeTaken': event.body.TimeTaken,
                ':FlightNumber': event.body.FlightNumber,
                ':HubDetails': event.body.HubDetails,
                ':FlightId': event.body.FlightId,
                ':OperatorId': event.body.OperatorId,
                ':DeliveryImageURL': event.body.DeliveryImageURL,
                ':PickupId': event.body.PickupId,
                ':DroneUsed': event.body.DroneUsed,
                ':FlightType': event.body.FlightType,
                ':ClientName': event.body.ClientName,
                ':DeliveryDetailUrl': event.body.DeliveryDetailURL,
                ':TS_Created': Created_Timestamp,
            },
            ReturnValues: 'ALL_NEW',
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
                        "MainData": "Successfully Updated"
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }
        })
    });




    wf.emit('check_request_body')
};
