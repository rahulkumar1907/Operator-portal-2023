const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ region: process.env.AWSRegion });
exports.handler = async (event, context, callback) => {
    try {
        if(!(event.body.FlightId)||event.body.FlightId=="undefined"){return ({ "statusCode": 400, "error": "Missing/Invalid FlightId", "status": "false" })}
        const params = {
            TableName: process.env.TableName,
            Key: {
                FlightId: event.body.FlightId,
            }
        }
        const data = await ddb.get(params).promise()
        // if (!data.Item) { return ({ "statusCode": 400, "error": "No Flight Found" }) }
        if (data) { return ({ "statusCode": 200, "message": "successful", "data": data.Item }) }
    }
    catch (err) {
        return ({ "statusCode": 500, "error": err.message, "error_type": "Internal Server Error" })
    }
};