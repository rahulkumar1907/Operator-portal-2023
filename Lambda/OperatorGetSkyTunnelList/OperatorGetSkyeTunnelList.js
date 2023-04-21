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

        if (SkyeTunnelDetails.OperatorId.length == 0) { parameters = parameters + 'OperatorId/' }
        

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
            FilterExpression: " #Status = :Status AND #Demo = :Demo " ,
            ExpressionAttributeNames: {
                "#Status": "Status",
                "#Demo":"Demo",
                //  "#OperatorId":"OperatorId",
                  },
            ExpressionAttributeValues : {   
                ":Status": "Active",
                ":Demo":false,
                // ":OperatorId":event.body.OperatorId,
                
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
