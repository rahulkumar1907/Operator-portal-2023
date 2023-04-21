var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});

exports.handler = async (event, context, callback) => {
    try {
       
        var TS_Updated = event.body.TS_Updated || "";
            TS_Updated = TS_Updated.trim()

        var params = {
            TableName: process.env.TableName,
            Key: {
                "TableName":process.env.Table
            }
        };

        let data = await docClient.get(params).promise()

        
        if (TS_Updated != data.Item.TS_Updated) {
            console.log("You Can Call Api")
            return ({ "statusCode": 200, "Flight_Data_Changed": true, "TS_Updated": data.Item.TS_Updated,"Message":"CALL API" })
        }
        else {
            console.log("You Cannot Call Api")
            return ({ "statusCode": 200, "Flight_Data_Changed": false, "TS_Updated": data.Item.TS_Updated,"Message":"DONOT CALL API" })
        }
    }
    catch (err) {
        return ({"statusCode":500,"Error_Type":"Internal Server Error","Should_Display_Error":"False","Message":err.message})
    }


};