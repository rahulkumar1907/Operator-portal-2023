var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
const s3 = new AWS.S3({
    region: process.env.AwsRegion
})
const MasterTableName = process.env.MasterTableName

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
        operator.UploadImage = event.body.hasOwnProperty('UploadImage') == true ? event.body.UploadImage.length == 0 ? event.body.UploadImage = '' : event.body.UploadImage : '';

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
        if (operator.UploadImage.length == 0) { parameters = parameters + 'UploadImage/' }

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
            wf.emit('set_delivery_id_for_delivery_report');
        }
    })

    wf.once('set_delivery_id_for_delivery_report', function () {
        docClient.update({
            "TableName": MasterTableName,
            "Key": {
                "Module": "DeliveryCounter"
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
                console.log(data.Attributes.CounterId);
                var str = "" + data.Attributes.CounterId;
                var pad = "00000";
                var ans = pad.substring(0, pad.length - str.length) + str;
                event.body.DeliveryId = "DELIVERY" + ans;
                wf.emit('get_flight_details_from_flight_table');
            }
        });
    });

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
                    //   console.log("pickupId",PickupId[0])
                    event.body.PickupId = PickupId[0]
                    // console.log("eventbody",event.body)
                    wf.emit('upload_image_to_s3_bucket');

                }
            }
        })
    });

    wf.once('upload_image_to_s3_bucket', function () {
        let buffer = Buffer.from(event.body.UploadImage, 'base64');

        let Timestamp = new Date().toISOString();
        var params = {
            'Bucket': process.env.BUCKETNAME,
            'Key': Timestamp.slice(0, 10)+"-"+event.body.FlightId + "SkyeAir" +"." + "png",
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
                wf.emit('store_client_to_delivery_report_db');
            }
        })
    });

    wf.once('store_client_to_delivery_report_db', function () {
        let storeField = {
            "DeliveryDate": event.body.DeliveryDate,
            "DeliveryId": event.body.DeliveryId,
            "DeliveryLocation": event.body.DeliveryLocation,
            "PackageTemperature": event.body.PackageTemperature,
            "RecievedBy": event.body.RecievedBy,
            "DeliveryTime": event.body.DeliveryTime,
            "OperatorRemark": event.body.OperatorRemark,
            "TimeTaken": event.body.TimeTaken,
            "FlightNumber": event.body.FlightNumber,
            "HubDetails": event.body.HubDetails,
            "FlightId": event.body.FlightId,
            "OperatorId": event.body.OperatorId,
            "DeliveryImageURL": event.body.DeliveryImageURL,
            "PickupId": event.body.PickupId,
            "DroneUsed": event.body.DroneUsed,
            "FlightType": event.body.FlightType,
            "TS_Created": Created_Timestamp
        }
        var params = {
            TableName: process.env.DeliveryReportTableName,
            Item: storeField
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
                        "type": "Server Error",
                        "should_display_error": "false"
                    },
                    "statusCode": 500
                }));
                return;
            } else {
                context.done(null, {
                    "data": {
                        "MainData": "Successfully Created"
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
