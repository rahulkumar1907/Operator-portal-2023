var AWS = require("aws-sdk");
var sts = new AWS.STS();
// RAHUL KUMAR 17-APR-2023 SETTING UP ENV. VARIABLES
const LambdaInvokeFunction1 = process.env.LambdaInvokeFunction1;
const ROLE = process.env.ROLE;
exports.handler = (event, context, callback) => {
    var EventEmitter = require("events").EventEmitter;
    var Created_Timestamp = new Date().toISOString();
    var wf = new EventEmitter();
    // RAHUL KUMAR 17-APR-2023  VALIDATING REQUIRE REQUEST BODY
    wf.once('check_request_body', function () {
        console.log(event);
        var parameters = '/';
        var Mission = new Object();
        Mission.TriggerId = event.body.hasOwnProperty('TriggerId') == true ? event.body.TriggerId.length == 0 ? event.body.TriggerId = '' : event.body.TriggerId : '';
        Mission.AsOfDate = event.body.hasOwnProperty('AsOfDate') == true ? event.body.AsOfDate.length == 0 ? event.body.AsOfDate = '' : event.body.AsOfDate : '';
        Mission.StreamingStartTime = event.body.hasOwnProperty('StreamingStartTime') == true ? event.body.StreamingStartTime.length == 0 ? event.body.StreamingStartTime = '' : event.body.StreamingStartTime : '';
        Mission.RealTimeLogs = event.body.hasOwnProperty('RealTimeLogs') == true ? event.body.RealTimeLogs.length == 0 ? event.body.RealTimeLogs = '' : event.body.RealTimeLogs : '';
        Mission.CreatedById = event.body.hasOwnProperty('CreatedById') == true ? event.body.CreatedById.length == 0 ? event.body.CreatedById = '' : event.body.CreatedById : '';
        Mission.CreatedByName = event.body.hasOwnProperty('CreatedByName') == true ? event.body.CreatedByName.length == 0 ? event.body.CreatedByName = '' : event.body.CreatedByName : '';

        if (Mission.TriggerId.length == 0) { parameters = parameters + 'TriggerId/'; }
        if (Mission.AsOfDate.length == 0) { parameters = parameters + 'AsOfDate/'; }
        if (Mission.StreamingStartTime.length == 0) { parameters = parameters + 'StreamingStartTime/'; }
        if (Mission.RealTimeLogs.length == 0) { parameters = parameters + 'RealTimeLogs/'; }
        if (Mission.CreatedById.length == 0) { parameters = parameters + 'CreatedById/'; }
        if (Mission.CreatedByName.length == 0) { parameters = parameters + 'CreatedByName/'; }

        if (parameters.length > 1) {
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

            sts.assumeRole(
                {
                    RoleArn: process.env.ARN,

                    RoleSessionName: ROLE
                },
                async function (err, dataAccount) {
                    if (err) {
                        // an error occurred
                        console.log("error3", err);
                        console.log("Cannot assume role");
                        console.log(err, err.stack);
                        context.fail(
                            JSON.stringify({
                                data: null,
                                error: {
                                    code: 500,
                                    message: err.message,
                                    type: "Server Error",
                                    should_display_error: "false",
                                },
                                statusCode: 500,
                            })
                        );
                        return;
                    } else {
                        // successful response



                        console.log(dataAccount);

                        AWS.config.update({
                            accessKeyId: dataAccount.Credentials.AccessKeyId,

                            secretAccessKey: dataAccount.Credentials.SecretAccessKey,

                            sessionToken: dataAccount.Credentials.SessionToken,
                        });
                        console.log("suucessfull");

                        // RAHUL KUMAR 17-APR-2023 INVOKING UPDATE MISSION LOGS LAMBDA TO STORE UPDATED MISSION LOGS
                        const lambda = new AWS.Lambda({
                            region: process.env.AwsRegion,
                        });

                        let payload = {
                            TriggerId: event.body.TriggerId,
                            AsOfDate: event.body.AsOfDate,
                            StreamingStartTime: event.body.StreamingStartTime,
                            RealTimeLogs: event.body.RealTimeLogs,
                            CreatedById: event.body.CreatedById,
                            CreatedByName: event.body.CreatedByName,
                            TS_Created: Created_Timestamp,
                        };

                        lambda.invoke(
                            {
                                FunctionName: LambdaInvokeFunction1,
                                Payload: JSON.stringify(
                                    {
                                        body: payload,
                                    },
                                    null
                                ),
                            },
                            function (error, data) {
                                if (error) {
                                    console.log(error);
                                    console.log("Error1", err);
                                    context.fail(
                                        JSON.stringify({
                                            data: null,
                                            error: {
                                                code: 500,
                                                message: err,
                                                type: "Server Error",
                                                should_display_error: "false",
                                            },
                                            statusCode: 500,
                                        })
                                    );
                                } else {
                                    console.log("data", data);
                                    context.done(null, {
                                        "data": {
                                            "MainData": JSON.parse(data.Payload).data,
                                        },
                                        "error": null,
                                        "statusCode": 200
                                    });
                                    return;
                                }
                            }
                        );

                    }
                }
            );
        }
    });


    wf.emit("check_request_body");
};
