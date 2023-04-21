const aws = require('aws-sdk');
const ddb = new aws.DynamoDB.DocumentClient({ region: process.env.AWSRegion });
var ses = new aws.SES({ apiVersion: process.env.apiVersion, region: process.env.AWSRegion });
// RAHUL KUMAR 17-APR-2023 SETTING UP ENV. VARIABLES
const TableName = process.env.TableName;
const TEMPLATE = process.env.TEMPLATE;
const FROMADDRESS = process.env.FROMADDRESS;
exports.handler = async (event, context, callback) => {
    try {
        // RAHUL KUMAR 17-APR-2023 VALIDATING REQUIRE REQUEST BODY
        if (!(event.body.EmailId) || event.body.EmailId == "undefined") { return ({ "statusCode": 400, "error": "Missing/Invalid EmailId", "error_type": "Bad Request" }); }
        //RAHUL KUMAR 17-APR-2023 CHECKING USER REGISTERED OR NOT
        const param = {
            TableName: TableName,
            Key: { EmailId: event.body.EmailId }
        };
        let OperatorDetails = await ddb.get(param).promise();
        if (!OperatorDetails.Item) { return ({ "statusCode": 400, "message": "User is not registered yet" }); }
        // RAHUL KUMAR 17-APR-2023 UPDATING OTP TO TABLE FOR VERIFICATION
        let otp = Math.random().toString(10).slice(-6);
        console.log("otp", otp);
        const params = {
            "TableName": TableName,
            Key: {
                "EmailId": event.body.EmailId,
            },
            UpdateExpression: 'set #OTP = :OTP',
            ExpressionAttributeNames: {
                '#OTP': 'OTP',
            },
            ExpressionAttributeValues: {
                ':OTP': otp
            },
            ReturnValues: 'ALL_NEW',
        };

        const data = await ddb.update(params).promise();

        // send otp with email templates

        let TemplateData = "{\"OTP\":\"" + otp + "\" }";
        var params1 = {
            "Source": FROMADDRESS,
            "Template": TEMPLATE,
            "Destination": {
                "ToAddresses": [event.body.EmailId],
                "CcAddresses": [],
                "BccAddresses": []
            },
            "TemplateData": TemplateData
        };
        let data1 = await ses.sendTemplatedEmail(params1).promise();
        if (!data1) { return ({ "statusCode": 400, "message": "template email not send  succesfully" }); }
        if (data) { return ({ "statusCode": 200, "message": "Verification code send succesfully", "data": data }); }

        return ({ "statusCode": 200, "message": "OTP Send Successfully", "Data": data });
    }
    catch (err) {
        return ({ "statusCode": 500, "error": err.message, "error_type": "Internal Server Error" });
    }
};