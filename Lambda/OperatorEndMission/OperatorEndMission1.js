var AWS = require("aws-sdk");
const docClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.AwsRegion,
});
// RAHUL KUMAR 20-APR-2023 SETTING UP ENV. VARIABLES
const ROLESESSION = process.env.ROLESESSION;
const ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.AwsRegionForEmail });
const ManagerEmail = [];
const TEMPLATE = process.env.TEMPLATE;
const FromAddress = process.env.FromAddress;
const FMSPEOPLE = process.env.FMSPEOPLE;
const TableName = process.env.FlightTableName;
var sts = new AWS.STS();
const LambdaInvokeFunction1 = process.env.LambdaInvokeFunction1;


var StartTime = new Date().toISOString();
var ISTTime = new Date(StartTime).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
console.log(ISTTime);

exports.handler = (event, context, callback) => {
    var EventEmitter = require("events").EventEmitter;
    var wf = new EventEmitter();
    // RAHUL KUMAR 7-APR-2023 VALIDATING THE REQUIRE REQUEST BODY
    wf.once('check_request_body', function () {
        console.log(event);
        var parameters = '/';
        var Mission = new Object();
        Mission.MissionId = event.body.hasOwnProperty('MissionId') == true ? event.body.MissionId.length == 0 ? event.body.MissionId = '' : event.body.MissionId : '';
        Mission.FlightId = event.body.hasOwnProperty('FlightId') == true ? event.body.FlightId.length == 0 ? event.body.FlightId = '' : event.body.FlightId : '';


        if (Mission.MissionId.length == 0) { parameters = parameters + 'MissionId/'; }
        if (Mission.FlightId.length == 0) { parameters = parameters + 'FlightId/'; }

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
            // RAHUL KUMAR 7-APR-2023 CONNECTING THE ONE ACCOUNT TO ANOTHER ACCOUNT
            sts.assumeRole(
                {
                    RoleArn: process.env.ARN,

                    RoleSessionName: ROLESESSION
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

                            sessionToken: dataAccount.Credentials.SessionToken
                        });
                        console.log("suucessfull");
                        const lambda = new AWS.Lambda({
                            region: process.env.AwsRegion,
                        });

                        let payload = {
                            MissionId: event.body.MissionId,
                        };


                        lambda.invoke(
                            {
                                FunctionName: LambdaInvokeFunction1,
                                Payload: JSON.stringify(
                                    {
                                        body: payload
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
                                    wf.emit('get_flight_detail_from_db');
                                    // context.done(null, {
                                    //     "data": {
                                    //         "MainData": "Successfully Ended"
                                    //     },
                                    //     "error": null,
                                    //     "statusCode": 200
                                    // });
                                    // return;
                                }
                            }
                        );

                    }
                }
            );
        }
    });

    wf.once('get_flight_detail_from_db', function () {
        // RAHUL KUMAR 20-APR-2023 GETTING LANDING PILOT AND MANAGER EMAIL
        var params = {
            TableName: TableName,
            Key: {
                "FlightId": event.body.FlightId
            },
            ProjectionExpression: ['ClientName', 'TakeOffPilot', 'LandingPilot', 'OrganizationId', "MissionId", "DroneName", "DroneId", "DroneUIN", "PickupDate", "PickUpLocation", "PickupTime", "SkyTunnelName", "Pilotdetails"]
        };

        docClient.get(params, function (err, data) {
            if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
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
                console.log(data);
                wf.FlightData = data;
                wf.takeOffPilotEmail = data.Item.TakeOffPilot;
                wf.LandingPilotEmail = data.Item.LandingPilot;
                // console.log(data.Item.Pilotdetails)
                for (let i = 0; i < data.Item.Pilotdetails.length; i++) {
                    if (data.Item.Pilotdetails[i].Role == "Operation Manager") {
                        ManagerEmail.push(data.Item.Pilotdetails[i].EmailId);
                    }
                }
                console.log("wf.takeOffPilotEmail", wf.takeOffPilotEmail);
                console.log("wf.LandingPilotEmail", wf.LandingPilotEmail);
                wf.emit('get_landing_pilot_name');

            }
        });


    });

    wf.once('get_landing_pilot_name', function () {
        // RAHUL KUMAR 20-APR-2023 GETTING LANDING PILOT NAME
        const params = {
            TableName: FMSPEOPLE,
            IndexName: 'EmailAddress-index',
            KeyConditionExpression: 'EmailAddress = :EmailAddress',
            ExpressionAttributeValues: {
                ':EmailAddress': wf.LandingPilotEmail
            },
        };

        docClient.query(params, function (err, data) {
            if (err) {
                console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
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
                wf.FlightData.Item.LandingPilotName = data.Items[0].Name;
                console.log("wf.takeOffPilotEmail", wf.FlightData.Item.LandingPilotName);
                wf.emit('send_email_to_manager');

            }
        });


    });

    wf.once("send_email_to_manager", function () {
        wf.LandingPilotName = wf.FlightData.Item.LandingPilotName;
        wf.FlightId = event.body.FlightId;
        wf.LandingPilot = wf.LandingPilotEmail;
        wf.StartTime = ISTTime;
        // RAHUL KUMAR 20-APR-2023 REQUIRED EMAIL TEMPLATE DATA TO SEND
        wf.TemplateData = "{ \"FlightId\":\"" + wf.FlightId + "\", \"StartTime\":\"" + wf.StartTime + "\",\"LandingPilot\":\"" + wf.LandingPilot + "\", \"LandingPilotName\":\"" + wf.LandingPilotName + "\"}";
        var params = {
            "Source": FromAddress,
            "Template": TEMPLATE,
            "Destination": {
                "ToAddresses": ManagerEmail,
                "CcAddresses": [],
                // "BccAddresses": []
            },
            "TemplateData": wf.TemplateData
        };

        console.log(params);
        // RAHUL KUMAR 20-APR-2023 SENDING EMAIL TEMPLATE
        ses.sendTemplatedEmail(params, function (err, data) {
            if (err) {
                console.log(err);
            }
            else {
                //console.log(data);
                context.done(null, {
                    "data": {
                        "MainData": "Successfully Ended"
                    },
                    "error": null,
                    "statusCode": 200
                });
                return;
            }
        });
    });
    wf.emit("check_request_body");
};
