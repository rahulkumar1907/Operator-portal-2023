var AWS = require("aws-sdk");

var sts = new AWS.STS();
const LambdaInvokeFunction1 = process.env.LambdaInvokeFunction1;

exports.handler = (event, context, callback) => {
    var Created_Timestamp = new Date().toISOString();
    var EventEmitter = require("events").EventEmitter;
    var wf = new EventEmitter();
    // RAHUL KUMAR 5-APR-2023 VALIDATING REQUIRED REQUEST BODY
    wf.once('check_request_body', function () {
        console.log(event);
        var parameters = '/';
        var Mission = new Object();
        Mission.MissionId = event.body.hasOwnProperty('MissionId') == true ? event.body.MissionId.length == 0 ? event.body.MissionId = '' : event.body.MissionId : '';
        Mission.AsOfDate = event.body.hasOwnProperty('AsOfDate') == true ? event.body.AsOfDate.length == 0 ? event.body.AsOfDate = '' : event.body.AsOfDate : '';
        Mission.StreamingStartTime = event.body.hasOwnProperty('StreamingStartTime') == true ? event.body.StreamingStartTime.length == 0 ? event.body.StreamingStartTime = '' : event.body.StreamingStartTime : '';
        Mission.motor_control = event.body.hasOwnProperty('motor_control') == true;
        Mission.rc_receiver = event.body.hasOwnProperty('rc_receiver') == true;
        Mission.gps = event.body.hasOwnProperty('gps') == true;
        Mission.logging = event.body.hasOwnProperty('logging') == true;
        Mission.prearm = event.body.hasOwnProperty('prearm') == true;
        Mission.alt = event.body.hasOwnProperty('alt') == true;
        Mission.messages = event.body.hasOwnProperty('messages') == true;
        Mission.message = event.body.hasOwnProperty('message') == true;
        Mission.messageHigh = event.body.hasOwnProperty('messageHigh') == true;
        Mission.battery_voltage = event.body.hasOwnProperty('battery_voltage') == true;
        Mission.datetime = event.body.hasOwnProperty('datetime') == true ? event.body.datetime.length == 0 ? event.body.datetime = '' : event.body.datetime : '';
        Mission.datetimeLog = event.body.hasOwnProperty('datetimeLog') == true ? event.body.datetimeLog.length == 0 ? event.body.datetimeLog = '' : event.body.datetimeLog : '';
        Mission.CreatedById = event.body.hasOwnProperty('CreatedById') == true ? event.body.CreatedById.length == 0 ? event.body.CreatedById = '' : event.body.CreatedById : '';
        Mission.CreatedByName = event.body.hasOwnProperty('CreatedByName') == true ? event.body.CreatedByName.length == 0 ? event.body.CreatedByName = '' : event.body.CreatedByName : '';


        if (Mission.MissionId.length == 0) { parameters = parameters + 'MissionId/'; }
        if (Mission.AsOfDate.length == 0) { parameters = parameters + 'AsOfDate/'; }
        if (Mission.StreamingStartTime.length == 0) { parameters = parameters + 'StreamingStartTime/'; }
        if (Mission.motor_control.length == 0) { parameters = parameters + 'motor_control/'; }
        if (Mission.rc_receiver.length == 0) { parameters = parameters + 'rc_receiver/'; }
        if (Mission.gps.length == 0) { parameters = parameters + 'gps/'; }
        if (Mission.logging.length == 0) { parameters = parameters + 'logging/'; }
        if (Mission.prearm.length == 0) { parameters = parameters + 'prearm/'; }
        if (Mission.alt.length == 0) { parameters = parameters + 'alt/'; }
        if (Mission.messages.length == 0) { parameters = parameters + 'messages/'; }
        if (Mission.message.length == 0) { parameters = parameters + 'message/'; }
        if (Mission.messageHigh.length == 0) { parameters = parameters + 'messageHigh/'; }
        if (Mission.battery_voltage.length == 0) { parameters = parameters + 'battery_voltage/'; }
        if (Mission.datetime.length == 0) { parameters = parameters + 'datetime/'; }
        if (Mission.datetimeLog.length == 0) { parameters = parameters + 'datetimeLog/'; }
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
            // // RAHUL KUMAR 5-APR-2023 SETTING CONNECTION BETWEEN TWO DIFFERENT AWS ACCOUNT
            sts.assumeRole(
                {
                    RoleArn: process.env.ARN,

                    RoleSessionName: process.env.RoleSessionName,
                },
                async function (err, dataAccount) {
                    if (err) {
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
                        console.log(dataAccount);

                        AWS.config.update({
                            accessKeyId: dataAccount.Credentials.AccessKeyId,

                            secretAccessKey: dataAccount.Credentials.SecretAccessKey,

                            sessionToken: dataAccount.Credentials.SessionToken
                        });
                        // // RAHUL KUMAR 5-APR-2023 MAKING ENVIRONMENT TO USE FOR OTHER AWS ACCOUNT
                        const lambda = new AWS.Lambda({
                            region: process.env.AwsRegion,
                        });
                        // RAHUL KUMAR 5-APR-2023 REQUEST BODY CREATE MISSION IN UTM
                        let payload = {
                            MissionId: event.body.MissionId,
                            AsOfDate: event.body.AsOfDate,
                            StreamingStartTime: event.body.StreamingStartTime,
                            motor_control: event.body.motor_control,
                            rc_receiver: event.body.rc_receiver,
                            gps: event.body.gps,
                            logging: event.body.logging,
                            prearm: event.body.prearm,
                            alt: event.body.EndTime,
                            messages: event.body.messages,
                            message: event.body.message,
                            messageHigh: event.body.messageHigh,
                            battery_voltage: event.body.battery_voltage,
                            datetime: event.body.datetime,
                            datetimeLog: event.body.datetimeLog,
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
