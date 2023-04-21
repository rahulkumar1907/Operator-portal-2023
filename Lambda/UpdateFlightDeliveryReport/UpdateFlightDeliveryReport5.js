var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
const s3 = new AWS.S3({
    region: process.env.AwsRegion
});

exports.handler = (event, context, callback) => {
    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }
    // RAHUL KUMAR 17-APR-2023 VALIDATING REQUIRE REQUEST BODY
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
        operator.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';
        operator.HubDetails = event.body.hasOwnProperty('HubDetails') == true ? event.body.HubDetails.length == 0 ? event.body.HubDetails = '' : event.body.HubDetails : '';
        operator.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        operator.UploadImage = event.body.hasOwnProperty('UploadImage') == true ? event.body.UploadImage.length == 0 ? event.body.UploadImage = '' : event.body.UploadImage : '';
        operator.deliveryDetailPdf = event.body.hasOwnProperty('deliveryDetailPdf') == true ? event.body.deliveryDetailPdf.length == 0 ? event.body.deliveryDetailPdf = '' : event.body.deliveryDetailPdf : '';
        operator.ClientName = event.body.hasOwnProperty('ClientName') == true ? event.body.ClientName.length == 0 ? event.body.ClientName = '' : event.body.ClientName : '';

        if (operator.DeliveryLocation.length == 0) { parameters = parameters + 'DeliveryLocation/'; }
        if (operator.DeliveryDate.length == 0) { parameters = parameters + 'DeliveryDate/'; }
        if (operator.PackageTemperature.length == 0) { parameters = parameters + 'PackageTemperature/'; }
        if (operator.RecievedBy.length == 0) { parameters = parameters + 'RecievedBy/'; }
        if (operator.DeliveryTime.length == 0) { parameters = parameters + 'DeliveryTime/'; }
        if (operator.OperatorRemark.length == 0) { parameters = parameters + 'OperatorRemark/'; }
        if (operator.TimeTaken.length == 0) { parameters = parameters + 'TimeTaken/'; }
        if (operator.FlightId.length == 0) { parameters = parameters + 'FlightId/'; }
        if (operator.HubDetails.length == 0) { parameters = parameters + 'HubDetails/'; }
        if (operator.OperatorId.length == 0) { parameters = parameters + 'OperatorId/'; }
        if (operator.UploadImage.length == 0) { parameters = parameters + 'UploadImage/'; }
        if (operator.deliveryDetailPdf.length == 0) { parameters = parameters + 'deliveryDetailPdf/'; }
        if (operator.ClientName.length == 0) { parameters = parameters + 'ClientName/'; }

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
            wf.emit('get_flight_details_from_flight_table');
        }
    });



    wf.once('get_flight_details_from_flight_table', function () {
        // RAHUL KUMAR 17-APR-2023 GETTING DRONE DETAILS FROM FLIGHT TABLE
        const params = {
            TableName: process.env.FlightTableName,
            Key: {
                FlightId: event.body.FlightId

            }
        };
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
                event.body.DroneUsed = data.Item.DroneName;
                event.body.FlightType = data.Item.ActivityType;
                //   console.log("Body",event.body)
                wf.emit('get_pickUp_Id_from_pickup_report');

            }
        });
    });

    wf.once('get_pickUp_Id_from_pickup_report', function () {
        // RAHUL KUMAR 17-APR-2023 GETTING PICK UP ID
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
                    let PickupId = data.Items.map(element => element.PickupId);
                    // let ClientName = data.Items.map(element => element.ClientName)
                    // let ClientId = data.Items.map(element => element.ClientId)
                    //   console.log("pickupId",PickupId[0])
                    event.body.PickupId = PickupId[0];
                    // event.body.ClientName = ClientName[0]
                    // event.body.ClientId = ClientId[0]
                    // console.log("client Name",event.body.ClientName)
                    wf.emit('upload_image_to_s3_bucket');

                }
            }
        });
    });

    wf.once('upload_image_to_s3_bucket', function () {
        // RAHUL KUMAR 17-APR-2023 STORING DELIVERY IMAGE TO S3
        let UrlArray = [];
        for (let i = 0; i < event.body.UploadImage.length; i++) {
            let buffer = Buffer.from(event.body.UploadImage[i], 'base64');

            let Timestamp = new Date().toISOString();
            var params = {
                'Bucket': process.env.BUCKETNAME,
                'Key': 'Delivery/' + event.body.FlightId + '/Report/report_' + Timestamp + '.' + "png",
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
                    UrlArray.push(data.Location);

                    if (UrlArray.length == event.body.UploadImage.length) {
                        event.body.DeliveryImageURL = UrlArray;
                        wf.emit('store_delivery_details');
                    }
                }
            });
        }
    });

    wf.once('store_delivery_details', function () {
        // RAHUL KUMAR 17-APR-2023 STORING DELIVERY REPORT TO S3
        let buffer = Buffer.from(event.body.deliveryDetailPdf, 'base64');

        let Timestamp = new Date().toISOString();
        var params = {
            'Bucket': process.env.DeliveryDetailUrlBucket,
            'Key': 'Delivery/' + event.body.FlightId + '/Detail/detail_' + Timestamp + '.' + "pdf",
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
                event.body.DeliveryDetailURL = data.Location;
                wf.emit('store_client_to_delivery_report_db');
            }
        });
    });

    wf.once('store_client_to_delivery_report_db', function () {
        // RAHUL KUMAR 17-APR-2023 STORING DELIVERY DATA TO DATABASE
        const params = {
            TableName: process.env.DeliveryReportTableName,
            Key: {
                "DeliveryId": event.body.DeliveryId,
            },
            UpdateExpression: 'set DeliveryDate = :DeliveryDate,TS_Created = :TS_Created,DeliveryLocation = :DeliveryLocation,PackageTemperature = :PackageTemperature,RecievedBy= :RecievedBy, DeliveryTime= :DeliveryTime ,OperatorRemark= :OperatorRemark, TimeTaken= :TimeTaken , HubDetails= :HubDetails, FlightId= :FlightId, OperatorId= :OperatorId ,DeliveryImageURL= :DeliveryImageURL,FlightType= :FlightType, ClientName= :ClientName, DeliveryDetailUrl= :DeliveryDetailUrl, TS_Updated= :TS_Updated',
            ExpressionAttributeValues: {
                ':DeliveryDate': event.body.DeliveryDate,
                ':DeliveryLocation': event.body.DeliveryLocation,
                ':PackageTemperature': event.body.PackageTemperature,
                ':RecievedBy': event.body.RecievedBy,
                ':DeliveryTime': event.body.DeliveryTime,
                ':OperatorRemark': event.body.OperatorRemark || "No Remark",
                ':TimeTaken': event.body.TimeTaken,
                // ':FlightNumber': event.body.FlightNumber,
                ':HubDetails': event.body.HubDetails,
                ':FlightId': event.body.FlightId,
                ':OperatorId': event.body.OperatorId,
                ':DeliveryImageURL': event.body.DeliveryImageURL,
                // ':PickupId': event.body.PickupId,
                // ':DroneUsed': event.body.DroneUsed,
                ':FlightType': event.body.FlightType,
                ':ClientName': event.body.ClientName,
                ':DeliveryDetailUrl': event.body.DeliveryDetailURL,
                ':TS_Created': event.body.TS_Created,
                ':TS_Updated': Created_Timestamp,
            },
            ReturnValues: 'ALL_NEW',
        };

        docClient.update(params, function (err, data) {
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
                context.done(null, {
                    "data": {
                        "MainData": "Successfully Updated"
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
