const aws = require('aws-sdk')
const ddb = new aws.DynamoDB.DocumentClient({ region: process.env.AWSRegion });
var ses = new aws.SES({ apiVersion: process.env.apiVersion, region: process.env.AWSRegion });


exports.handler = async (event, context, callback) => {
    try {
        if (!(event.body.EmailId) || event.body.EmailId == "undefined") { return ({ "statusCode": 400, "error": "Missing/Invalid EmailId", "error_type": "Bad Request" }) }
        // Checking user registered or not (if not register then sending them error message)
         const param = {
            TableName: process.env.TableName,
            Key: { EmailId: event.body.EmailId }
        }
        let OperatorDetails = await ddb.get(param).promise()
        console.log("OperatorDetails",OperatorDetails)
        if(!OperatorDetails.Item){ return ({ "statusCode": 400, "message": "User is not registered yet"})}
        // if registered then sending otp t 
        let otp = Math.random().toString(10).slice(-6)
        console.log("otp", otp)
        const params = {
            "TableName": process.env.TableName,
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

        const data = await ddb.update(params).promise()
        
        // send otp with email templates
      
        let TemplateData = "{\"OTP\":\"" + otp + "\" }";
        var params1 = {
            "Source": "akumar@skyeair.tech",
            "Template": "Client_Notify_For_Verification_Code_EmailTemplate_v1",
            "Destination": {
                "ToAddresses": [event.body.EmailId],
                "CcAddresses": [],
                "BccAddresses": []
            },
            "TemplateData": TemplateData
        };
        let data1 = await ses.sendTemplatedEmail(params1).promise()
        if (!data1) { return ({ "statusCode": 400,  "message": "template email not send  succesfully" }) }
        if (data) { return ({ "statusCode": 200, "message": "Verification code send succesfully", "data": data }) }
        // end (send otp with email templates)
        
        // console.log("updated data",data.Attributes)
        return ({ "statusCode": 200, "message": "OTP Send Successfully", "Data": data })
    }
    catch (err) {
        return ({ "statusCode": 500, "error": err.message, "error_type": "Internal Server Error" })
    }
};