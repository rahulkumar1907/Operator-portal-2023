var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    "region": process.env.AwsRegion
});
const DataStreamTableName = process.env.DataStreamTableName;

exports.handler = (event, context, callback) => {

    var Created_Timestamp = new Date().toISOString();

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();

    function Trim(string) {
        string = string.replace(/ {1,}/g, " ");
        return string.trim();
    }

    wf.once('update_data_stream_table', function () {
        console.log(event);
        console.log(event.Records);
        console.log(event.Records[0]["dynamodb"]);
        console.log(Created_Timestamp);

        var params = {
            TableName: DataStreamTableName,
            Item: {
                "TableName":"Mission",
                "TS_Updated":Created_Timestamp
            }
        };
        docClient.put(params, function (err, data) {
            if (err) {
                console.log(err);
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
            } else {
                console.log('Stream logged success');
            }
        })

    });

    wf.emit('update_data_stream_table');
};