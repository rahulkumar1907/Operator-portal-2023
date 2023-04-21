var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

const TableName = process.env.TableName

exports.handler = (event, context, callback) => {
    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    wf.once('check_request_body', function () {
        var parameters = '/';
        var operator = new Object();

        operator.EmailId = event.body.hasOwnProperty('EmailId') == true ? event.body.EmailId.length == 0 ? event.body.EmailId = '' : event.body.EmailId : '';
        operator.PhoneNumber = event.body.hasOwnProperty('PhoneNumber') == true ? event.body.PhoneNumber.length == 0 ? event.body.PhoneNumber = '' : event.body.PhoneNumber : '';

        if (operator.EmailId.length == 0) { parameters = parameters + 'EmailId/' }
        if (operator.PhoneNumber.length == 0) { parameters = parameters + 'PhoneNumber/' }


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
            wf.emit('get_OperatorProfile_details');
        }
    })

    wf.once('get_OperatorProfile_details', function () {

        var params = {
            TableName: TableName,
            FilterExpression: '#EmailId = :EmailId OR #PhoneNumber = :PhoneNumber',
            ExpressionAttributeNames: {
                "#EmailId": "EmailId",
                "#PhoneNumber": "PhoneNumber"

            },
            ExpressionAttributeValues: {
                ":EmailId": event.body.EmailId,
                ":PhoneNumber": event.body.PhoneNumber
            }
        };
        docClient.scan(params, function (err, data) {
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
            }
            else {
                if (data.Items.length > 0) {

                    wf.dup = data.Items[0].EmailId == event.body.EmailId ? 'Email Id' : 'Phone Number';
                    console.log("error3")
                    context.fail(JSON.stringify({
                        "data": null,
                        "error": {
                            "code": 400,
                            "message": wf.dup + " already exists",
                            "type": "Duplicate Operator",
                            "should_display_error": "true"
                        },
                        "statusCode": 400
                    }));

                    return;
                } else {
                    context.done(null, {
                        "data": {
                            "MainData": "successfull"
                        },
                        "error": null,
                        "statusCode": 200
                    });
                    return;
                }
            }
        })


    })
    wf.emit('check_request_body')
};
