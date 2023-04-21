var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
// const OperatorTable = process.env.OperatorTable
const SkyeTunnelTable = process.env.SkyeTunnelTable

exports.handler = (event, context, callback) => {
    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    
    wf.once('check_request_body', function () {
        var parameters = '/';
        var SkyeTunnelDetails = new Object();
        SkyeTunnelDetails.OperatorId = event.body.hasOwnProperty('OperatorId') == true ? event.body.OperatorId.length == 0 ? event.body.OperatorId = '' : event.body.OperatorId : '';
        SkyeTunnelDetails.OperatorName = event.body.hasOwnProperty('OperatorName') == true ? event.body.OperatorName.length == 0 ? event.body.OperatorName = '' : event.body.OperatorName : '';
        SkyeTunnelDetails.Role = event.body.hasOwnProperty('Role') == true ? event.body.Role.length == 0 ? event.body.Role = '' : event.body.Role : '';
        SkyeTunnelDetails.EmailId = event.body.hasOwnProperty('EmailId') == true ? event.body.EmailId.length == 0 ? event.body.EmailId = '' : event.body.EmailId : '';
       
        if (SkyeTunnelDetails.OperatorId.length == 0) { parameters = parameters + 'OperatorId/' }
        if (SkyeTunnelDetails.OperatorName.length == 0) { parameters = parameters + 'OperatorName/' }
        if (SkyeTunnelDetails.Role.length == 0) { parameters = parameters + 'Role/' }
        if (SkyeTunnelDetails.EmailId.length == 0) { parameters = parameters + 'EmailId/' }
        

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
            wf.OperatorId = SkyeTunnelDetails.OperatorId
            wf.emit('get_skytunnels_list');
        }
    })
    
     wf.once('get_skytunnels_list',function (){
        var params = {
            TableName : SkyeTunnelTable,
            FilterExpression: "contains (Pilotdetails, :sendToVal) AND #Status = :Status AND #Demo = :Demo ",
            ExpressionAttributeNames: {
                "#Status": "Status",
                "#Demo":"Demo"
                  },
    ExpressionAttributeValues: {
        ":sendToVal": {
            "PilotId" : event.body.OperatorId,
            "PilotName" : event.body.OperatorName,
             "Role": event.body.Role,
             "EmailId": event.body.EmailId
        },
        ":Status": "Active",
        ":Demo": false
    }          
        };
        
        docClient.scan(params, function (err, data) {
            if (err) {
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
            else {
               context.done(null, {
                    "data": {
                        "MainData": data
                        
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }
        })        
    })
    
    wf.emit('check_request_body')
};
