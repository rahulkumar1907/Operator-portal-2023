const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ region: process.env.AWSRegion });
exports.handler = async (event, context, callback) => {
    try {

        if (!(event.body.OperatorId) || event.body.OperatorId == "undefined") { return ({ "statusCode": 400, "error": "Missing/Invalid ClientId" }) }
        if (!(event.body.FlightId) && (!event.body.PickupLocation) && (!event.body.PackageType)) { return ({ "statusCode": 400, "error": "Missing/Invalid FlightId Or PickupLocation Or PackageType", "Message": "FlightId or PickupLocation or PackageType is Required" }) }
       let OperatorId=event.body.OperatorId
    
        //  ***************************************Get Flight List by FlightId Parameter ********************************************************************
        if (event.body.FlightId && OperatorId) {

            const filterParam = {
                TableName: process.env.TableName,
                FilterExpression: '#OperatorId = :OperatorId AND contains(#FlightId, :FlightId) ',
                ExpressionAttributeValues: {
                    ':OperatorId': OperatorId,
                    ':FlightId': event.body.FlightId,

                },
                ExpressionAttributeNames: {
                    '#OperatorId': 'OperatorId',
                    '#FlightId': 'FlightId',
                }
            }

            const FlightDetail = await ddb.scan(filterParam).promise()

            return ({ "statusCode": 200, "data": FlightDetail.Items })
        }
        // ******************************************Get Flight List By PickupLocation Parameter *******************************************
        if (event.body.PickupLocation && OperatorId) {

            const filterParam = {
                TableName: process.env.TableName,
                FilterExpression: '#OperatorId = :OperatorId AND contains(#PickupLocation, :PickupLocation) ',
                ExpressionAttributeValues: {
                    ':OperatorId': OperatorId,
                    ':PickupLocation': event.body.PickupLocation
                },
                ExpressionAttributeNames: {
                    '#OperatorId': 'OperatorId',
                    '#PickupLocation': 'PickupLocation'
                }
            }

            const FlightDetail = await ddb.scan(filterParam).promise()

            return ({ "statusCode": 200, "data": FlightDetail.Items })
        }
        // **********************************Get Flight List By PackageType Parameter*******************************************************
        if (event.body.PackageType && OperatorId) {

            const filterParam = {
                TableName: process.env.TableName,
                FilterExpression: '#OperatorId = :OperatorId AND contains(#PackageType, :PackageType) ',
                ExpressionAttributeValues: {
                    ':OperatorId': OperatorId,
                    ':PackageType': event.body.PackageType
                },
                ExpressionAttributeNames: {
                    '#OperatorId': 'OperatorId',
                    '#PackageType': 'PackageType'
                }
            }

            const FlightDetail = await ddb.scan(filterParam).promise()

            return ({ "statusCode": 200, "data": FlightDetail.Items })
        }


    }
    catch (err) {
        return ({ "statusCode": 500, "error": err.message, "error_type": "Internal Server Error" })
    }
};