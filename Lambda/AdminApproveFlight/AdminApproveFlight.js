var AWS = require("aws-sdk");
const region = process.env.AwsRegion;
const docClient = new AWS.DynamoDB.DocumentClient({
    region: region,
});

var sts = new AWS.STS();

const TableName = process.env.FlightTableName;
const OrganizationTable = process.env.OrganizationTable;
const LambdaInvokeFunction1 = process.env.LambdaInvokeFunction1;
const OperatorTable = process.env.OperatorTable;
const ROLE = process.env.ROLE;
const FMSDrone = process.env.FMSDrone;

exports.handler = (event, context, callback) => {
    var EventEmitter = require("events").EventEmitter;
    var wf = new EventEmitter();

    wf.once("check_request_body", function () {
        console.log("eventbody", event.body);
        wf.FlightId = event.body.FlightId;
        wf.TakeOffPilot = event.body.TakeOffPilot;
        wf.LandingPilot = event.body.LandingPilot;
        wf.DroneId = event.body.DroneId;


        console.log("wf.FlightId", wf.FlightId);
        wf.emit("get_flight_details");
    });
    wf.once("get_flight_details", function () {
        const params = {
            TableName: TableName,
            Key: {
                FlightId: wf.FlightId,
            },
        };

        docClient.get(params, function (err, data) {
            if (err) {
                console.log("error2");
                console.log("Error", err);
                context.fail(
                    JSON.stringify({
                        data: null,
                        error: {
                            code: 500,
                            message: "Internal server error",
                            type: "Server Error",
                            should_display_error: "false",
                        },
                        statusCode: 500,
                    })
                );
                return;
            } else {
                wf.ClientName = data.Item.ClientName;
                console.log("clinetName", wf.ClientName);
                const params1 = {
                    TableName: FMSDrone,
                    Key: {
                        DroneId: event.body.DroneId,
                    },
                };

                docClient.get(params1, function (err, data) {
                    if (err) {
                        console.log("err21", err);
                        context.fail(
                            JSON.stringify({
                                data: null,
                                error: {
                                    code: 500,
                                    message: "Internal server error",
                                    type: "Server Error",
                                    should_display_error: "false",
                                },
                                statusCode: 500,
                            })
                        );
                        return;
                    } else {
                        wf.DroneUIN = data.Item.UIN;
                        if (data.Item.Status == "Scheduled") {
                            console.log("Flight has been already approved");
                            context.done(null, {
                                data: {
                                    MainData: "Flight has been approved Already",
                                },
                                error: null,
                                statusCode: 200,
                            });
                            return;
                        } else {
                            console.log("Flight needs to be approved");
                            wf.emit("schedule_flight");
                        }
                    }
                });

                // console.log(data)
            }
        });
    });

    wf.once("schedule_flight", function () {
        const params = {
            TableName: TableName,
            Key: {
                FlightId: wf.FlightId,
            },
            ReturnValues: "ALL_NEW",
            UpdateExpression:
                "set #Status = :Status, #TakeOffPilot = :TakeOffPilot, #LandingPilot =:LandingPilot, #DroneId = :DroneId",
            ExpressionAttributeNames: {
                "#Status": "Status",
                "#TakeOffPilot": "TakeOffPilot",
                "#LandingPilot": "LandingPilot",
                "#DroneId": "DroneId",
            },
            ExpressionAttributeValues: {
                ":Status": "Scheduled",
                ":TakeOffPilot": wf.TakeOffPilot,
                ":LandingPilot": wf.LandingPilot,
                ":DroneId": wf.DroneId,
            },
        };
        console.log("updateparams", params);

        docClient.update(params, function (err, data) {
            if (err) {
                console.log("Error1", err);
                context.fail(
                    JSON.stringify({
                        data: null,
                        error: {
                            code: 500,
                            message: "Internal server error",
                            type: "Server Error",
                            should_display_error: "false",
                        },
                        statusCode: 500,
                    })
                );
                return;
            } else {
                // console.log(data);
                // console.log(data.Attributes);
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
                            wf.FlightId = data.Attributes.FlightId,
                                wf.DroneId = data.Attributes.DroneId,
                                wf.DroneName = data.Attributes.DroneName,
                                wf.BufferRegion = data.Attributes.BufferRegion,
                                wf.Altitude = data.Attributes.Altitude,
                                wf.ActivityType = data.Attributes.ActivityType,
                                wf.wayPointFileDetails = data.Attributes.wayPointFileDetails;
                                wf.WayPointNum = data.Attributes.WayPointNum,
                                wf.Waypoints = data.Attributes.Waypoints,
                                wf.PilotId = data.Attributes.PilotId,
                                wf.StartTime = data.Attributes.StartTime,
                                wf.EndTime = data.Attributes.EndTime,
                                wf.Lattitude = data.Attributes.Latitude,
                                wf.Longitude = data.Attributes.Longitude,

                                console.log(dataAccount);

                            AWS.config.update({
                                accessKeyId: dataAccount.Credentials.AccessKeyId,

                                secretAccessKey: dataAccount.Credentials.SecretAccessKey,

                                sessionToken: dataAccount.Credentials.SessionToken,
                            });
                            console.log("suucessfull");

                            const dClient = new AWS.DynamoDB.DocumentClient({
                                region: region,
                            });

                            const params1 = {
                                TableName: OperatorTable,
                            };

                            console.log("params1", params1);
                            dClient.scan(params1, function (err, data) {
                                if (err) {
                                    console.log("Error22", err);
                                } else {
                                    console.log("dataofpilot", data);
                                    for (let i = 0; i < data.Items.length; i++) {
                                        if (data.Items[i].EmailId == event.body.TakeOffPilot)
                                            wf.PilotId = data.Items[i].UserId;
                                    }
                                    console.log("Pilot", wf.PilotId);
                                    const params2 = {
                                        TableName: "Drone",
                                    };

                                    console.log("params2", params2);

                                    dClient.scan(params2, function (err, data) {
                                        if (err) {
                                            console.log("erroe", err);
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
                                            console.log("dataofdrone", data);
                                            for (let i = 0; i < data.Items.length; i++) {
                                                if (data.Items[i].UIN == wf.DroneUIN)
                                                    wf.DroneId = data.Items[i].DroneId;
                                                wf.DroneName = data.Items[i].DroneNum;
                                            }
                                            console.log("Drone", wf.DroneId);
                                            const lambda = new AWS.Lambda({
                                                region: process.env.AwsRegion,
                                            });

                                            let payload = {
                                                FlightId: wf.FlightId,
                                                ClientName: wf.ClientName,
                                                DroneId: wf.DroneId,
                                                DroneName: wf.DroneName,
                                                BufferRegion: wf.BufferRegion,
                                                Altitude: wf.Altitude,
                                                ActivityType: wf.ActivityType,
                                                WayPointNum: wf.WayPointNum,
                                                Waypoints: wf.Waypoints,
                                                wayPointFileDetails: wf.wayPointFileDetails,
                                                PilotId: wf.PilotId,
                                                StartTime: wf.StartTime,
                                                EndTime: wf.EndTime,
                                                Lattitude: wf.Lattitude,
                                                Longitude: wf.Longitude,
                                            };
                                            console.log("payload", payload);

                                            lambda.invoke(
                                                {
                                                    FunctionName: LambdaInvokeFunction1,
                                                    Payload: JSON.stringify(
                                                        {
                                                            body: payload,
                                                        },
                                                        null
                                                    ), // pass params
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
                                                    }
                                                }
                                            );
                                            wf.emit("get_OrgId_from_FlightTable");
                                        }
                                    });
                                }
                            });
                        }
                    }
                );
            }
        });
    });

    wf.once("get_OrgId_from_FlightTable", function () {
        const params = {
            TableName: TableName,
            Key: {
                FlightId: wf.FlightId,
            },
        };
        docClient.get(params, function (err, data) {
            // console.log("error2");
            if (err) {
                console.log("error4");
                console.log("Error", err);
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
                return;
            } else {
                wf.OrganizationId = data.Item.OrganizationId;
                console.log("Org", wf.OrganizationId);
                wf.emit("update_flightCount_in_Organization");
            }
        });
    });

    wf.once("update_flightCount_in_Organization", function () {
        docClient.update(
            {
                TableName: OrganizationTable,
                Key: {
                    OrganizationId: wf.OrganizationId,
                },
                ExpressionAttributeValues: {
                    ":a": 1,
                },
                ExpressionAttributeNames: {
                    "#v": "NumOfFlightsAvailable",
                },
                UpdateExpression: "SET #v = #v - :a",
                ReturnValues: "UPDATED_NEW",
            },
            function (err, data) {
                if (err) {
                    console.log("errorLast", err);
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
                    return;
                } else {
                    console.log("has been approved");
                    context.done(null, {
                        data: {
                            MainData: "Flight has been approved",
                        },
                        error: null,
                        statusCode: 200,
                    });
                    return;
                }
            }
        );
    });

    // wf.once('get_mission_id',function(){
    //   sts.assumeRole(
    //               {
    //                   RoleArn: process.env.ARN,

    //                   RoleSessionName: "test-session",
    //               },
    //               async function (err, dataAccount) {
    //                   if (err) {
    //                       // an error occurred
    //                       console.log("error3", err);
    //                       console.log("Cannot assume role");
    //                       console.log(err, err.stack);
    //                       context.fail(
    //                           JSON.stringify({
    //                               data: null,
    //                               error: {
    //                                   code: 500,
    //                                   message: err.message,
    //                                   type: "Server Error",
    //                                   should_display_error: "false",
    //                               },
    //                               statusCode: 500,
    //                           })
    //                       );
    //                       return;
    //                   } else {
    //                       // successful response
    //                       wf.FlightId = event.body.FlightId,


    //                           console.log(dataAccount);

    //                       AWS.config.update({
    //                           accessKeyId: dataAccount.Credentials.AccessKeyId,

    //                           secretAccessKey: dataAccount.Credentials.SecretAccessKey,

    //                           sessionToken: dataAccount.Credentials.SessionToken,
    //                       });
    //                       console.log("suucessfull");

    //                       const dClient1 = new AWS.DynamoDB.DocumentClient({
    //                           region: "ap-south-1",
    //                       });
    //                       var params = {
    //                           TableName: 'Mission',
    //                           IndexName: 'FlightId',
    //                           KeyConditionExpression: 'FlightId = :FlightId',
    //                           ExpressionAttributeValues: {
    //                               ':FlightId': event.body.FlightId
    //                           }
    //                       };
    //                       console.log("params",params)
    //                       dClient1.query(params, function (err, data) {

    //                           if (err) {
    //                             console.log("missionid error")
    //                               console.log("error2")
    //                               console.log("Error", err);
    //                               context.fail(JSON.stringify({
    //                                   "data": null,
    //                                   "error": {
    //                                       "code": 500,
    //                                       "message": "Internal server error",
    //                                       "type": "Server Error",
    //                                       "should_display_error": "false"
    //                                   },
    //                                   "statusCode": 500
    //                               }));
    //                               return;
    //                           }
    //                           else {
    //                             console.log("MissionId", data)
    //                               console.log("MissionId", data.Items[0].MissionId)
    //                               wf.MissionId = data.Items[0].MissionId
    //                               wf.emit('update_mission_id_in_flight_table')



    //                           }
    //                       })

    //                   }
    //               }
    //           );
    // })
    // wf.once('update_mission_id_in_flight_table',function(){
    //   const params = {
    //     TableName: TableName,
    //     Key: {
    //       FlightId: wf.FlightId,
    //     },
    //     ReturnValues: "ALL_NEW",
    //     UpdateExpression:
    //       "set #MissionId = :MissionId,",
    //     ExpressionAttributeNames: {
    //       "#MissionId": "MissionId",
    //     },
    //     ExpressionAttributeValues: {
    //       ":MissionId":  wf.MissionId,
    //     },
    //   };

    //   docClient.update(params,function(err,data){
    //     if (err) {
    //       console.log("Error1", err);
    //       context.fail(
    //         JSON.stringify({
    //           data: null,
    //           error: {
    //             code: 500,
    //             message: "Internal server error",
    //             type: "Server Error",
    //             should_display_error: "false",
    //           },
    //           statusCode: 500,
    //         })
    //       );
    //       return;
    //     }else{
    //       console.log("has been approved");
    //         context.done(null, {
    //           data: {
    //             MainData: "Flight has been approved",
    //           },
    //           error: null,
    //           statusCode: 200,
    //         });
    //         return;
    //     }
    //   })
    // })

    wf.emit("check_request_body");
};
