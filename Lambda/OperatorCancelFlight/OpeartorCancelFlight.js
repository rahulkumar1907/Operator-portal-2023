const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ region: process.env.AWSRegion });
exports.handler = async (event, context, callback) => {
    try {
        if (!(event.body.OperatorId) || event.body.OperatorId == "undefined") { return ({ "statusCode": 400, "error": "Missing/Invalid OperatorId", "error_type": "Bad Request" }) }
        if (!(event.body.FlightId) || event.body.FlightId == "undefined") { return ({ "statusCode": 400, "error": "Missing/Invalid FlightId", "error_type": "Bad Request" }) }
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