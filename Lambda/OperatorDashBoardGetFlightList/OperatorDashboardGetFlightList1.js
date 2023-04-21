var AWS = require("aws-sdk");

const ddb = new AWS.DynamoDB.DocumentClient({ region: process.env.AWSRegion });


exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('check_request_body', function () {
        var parameters = '/';
        var operator = new Object();
        operator.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        operator.OperatorName = event.body.hasOwnProperty('OperatorName') == true ? event.body.OperatorName.length == 0 ? event.body.OperatorName = '' : event.body.OperatorName : '';
        operator.Role = event.body.hasOwnProperty('Role') == true ? event.body.Role.length == 0 ? event.body.Role = '' : event.body.Role : '';
        operator.EmailId = event.body.hasOwnProperty('EmailId') == true ? event.body.EmailId.length == 0 ? event.body.EmailId = '' : event.body.EmailId : '';


        if (operator.OperatorId.length == 0) { parameters = parameters + 'OperatorId/' }
        if (operator.OperatorName.length == 0) { parameters = parameters + 'OperatorName/' }
        if (operator.Role.length == 0) { parameters = parameters + 'Role/' }
        if (operator.EmailId.length == 0) { parameters = parameters + 'EmailId/' }


        if (parameters.length > 1) {
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
            wf.operator = operator;
            wf.emit('get_Flight_status');
        }
    });
    wf.once('get_Flight_status', function () {

        const params = {
            TableName: process.env.TableName,
            FilterExpression: 'contains (Pilotdetails, :sendToVal) AND (#SStatus =:Scheduled OR #IStatus =:intransit)',
            ExpressionAttributeValues: {
                ":sendToVal": {
                    "PilotId": event.body.OperatorId,
                    "PilotName": event.body.OperatorName,
                     "Role": event.body.Role,
                     "EmailId": event.body.EmailId
                },
                ":Scheduled": 'Scheduled',
                ":intransit": 'In Transit'

            },
            ExpressionAttributeNames: {
                "#SStatus": "Status", "#IStatus": "Status"
            }
        }
        ddb.scan(params, onScan);
        console.log(params)

        let FlightList = [];
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

                    FlightList = FlightList.concat(data.Items);
                    console.log(FlightList.length);

                    params.ExclusiveStartKey = data.LastEvaluatedKey;

                    ddb.scan(params, onScan);
                }
                else {
                    console.log("last key ", data.LastEvaluatedKey)
                    // console.log(data.Items.length);
                    var mergedArray = FlightList.concat(data.Items);
                    // console.log(mergedArray.length);
                    const sortedList = mergedArray
                    // console.log("sortedArray",sortedList)
                    sortedList.forEach((element) => {
                    if (element.OrganizationId) {
                        element.OrganizationId = element.OrganizationId.split("-")
                        element.OrganizationId = element.OrganizationId[0]
                    }
                })

                

                      context.done(null, {
                        "data": {
                            "MainData": sortedList

                        },
                        "error": null,
                        "statusCode": 200
                    });
                    return;
                }
            }
        }
    })
    // wf.once('get_Flight_status', function () {
    //     const Params = {
    //         TableName: process.env.TableName,
    //         FilterExpression: 'contains (Pilotdetails, :sendToVal) AND (#SStatus =:Scheduled OR #IStatus =:intransit)',
    //         ExpressionAttributeValues: {
    //             ":sendToVal": {
    //                 "PilotId": event.body.OperatorId,
    //                 "PilotName": event.body.OperatorName,
    //                  "Role": event.body.Role,
    //                  "EmailId": event.body.EmailId
    //             },
    //             ":Scheduled": 'Scheduled',
    //             ":intransit": 'In Transit'

    //         },
    //         ExpressionAttributeNames: {
    //             "#SStatus": "Status", "#IStatus": "Status"
    //         }
    //     }
    //     // console.log("flightid",event.body.FlightId)
    //     ddb.scan(Params, function (err, data) {
    //         if (err) {
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

    //         // else {
    //         //       console.log("dataitem",data.Items)

    //         //     data.Items.forEach((element) => {
    //         //         if (element.OrganizationId) {
    //         //             element.OrganizationId = element.OrganizationId.split("-")
    //         //             element.OrganizationId = element.OrganizationId[0]
    //         //         }
    //         //     })
    //         //     context.done(null, {
    //         //         "data": {
    //         //             "MainData": data.Items
    //         //         },
    //         //         "error": null,
    //         //         "statusCode": 200
    //         //     });
    //         //     return;
    //         // }
    //     });
    // });



    wf.emit('check_request_body');
};