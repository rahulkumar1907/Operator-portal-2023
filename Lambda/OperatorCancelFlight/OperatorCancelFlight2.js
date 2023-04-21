const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ region: process.env.AWSRegion });

const lambda = new aws.Lambda({
    region: process.env.AwsRegion
});
const LambdaInvokeFunction1 = process.env.LambdaInvokeFunction1;

exports.handler = async (event, context, callback) => {
    try {
        if (!(event.body.FlightId) || event.body.FlightId == "undefined") { return ({ "statusCode": 400, "error": "Missing/Invalid FlightId", "error_type": "Bad Request" }) }
        
        let payload = {
            "FlightId": event.body.FlightId
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


        const params = {
            "TableName": process.env.TableName,
            Key: {
                "FlightId": event.body.FlightId,
            },
            UpdateExpression: 'set #Status = :Status',
            ExpressionAttributeNames: {
                '#Status': 'Status',
            },
            ExpressionAttributeValues: {
                ':Status': 'Cancelled'
            },
            ReturnValues: 'ALL_NEW',
        };
        
        const data = await ddb.update(params).promise()
        // console.log("updated data",data.Attributes)
        return ({ "statusCode": 200, "message": "Flight Cancel Successfully", "Data": data })
    }
    catch (err) {
        return ({ "statusCode": 500, "error": err.message, "error_type": "Internal Server Error" })
    }
};