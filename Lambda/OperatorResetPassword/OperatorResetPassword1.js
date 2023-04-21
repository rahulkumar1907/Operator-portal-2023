var AWS = require("aws-sdk");
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
    "region": process.env.AwsRegionForPool
});
// RAHUL KUMAR 17-APR-2023 SETTING UP COGNITO MIGRATION CLIENT ID
var MigrationAdminId = process.env.MigrationClientId;

exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    // RAHUL KUMAR 17-APR-2023 VALIDATING REQUIRE REQUEST BODY
    wf.once('check_request_body', function () {
        var parameters = '/';
        var operator = new Object();
        operator.UserName = event.body.hasOwnProperty('UserName') == true ? event.body.UserName.length == 0 ? event.body.UserName = '' : event.body.UserName : '';
        operator.VerificationCode = event.body.hasOwnProperty('VerificationCode') == true ? event.body.VerificationCode.length == 0 ? event.body.VerificationCode = '' : event.body.VerificationCode : '';
        operator.Password = event.body.hasOwnProperty('Password') == true ? event.body.Password.length == 0 ? event.body.Password = '' : event.body.Password : '';

        if (operator.UserName.length == 0) { parameters = parameters + 'UserName/'; }
        if (operator.VerificationCode.length == 0) { parameters = parameters + 'VerificationCode/'; }
        if (operator.Password.length == 0) { parameters = parameters + 'Password/'; }

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
            wf.profileObject = operator;
            wf.emit('reset_password_in_cognito');
        }
    });

    wf.once('reset_password_in_cognito', function () {
        // RAHUL KUMAR 17-APR-2023 RESETING PASSWORD IN COGNITO
        var params = {
            ClientId: MigrationAdminId, /* required */
            ConfirmationCode: wf.profileObject.VerificationCode, /* required */
            Password: wf.profileObject.Password, /* required */
            Username: wf.profileObject.UserName
        };

        cognitoidentityserviceprovider.confirmForgotPassword(params, function (err, data) {
            if (err) {
                console.log(err.code); // an error occurred
                if (err.code == 'CodeMismatchException') {
                    context.fail(JSON.stringify({
                        "data": null,
                        "error": {
                            "code": 400,
                            "message": "Invalid Verification Code",
                            "type": "Authentication failure",
                            "should_display_error": "true"
                        },
                        "statusCode": 400
                    }));
                    return;
                }

                if (err.code == 'ExpiredCodeException') {
                    context.fail(JSON.stringify({
                        "data": null,
                        "error": {
                            "code": 400,
                            "message": "Verification code expired",
                            "type": "Authentication failure",
                            "should_display_error": "true"
                        },
                        "statusCode": 400
                    }));
                    return;
                }

                else {
                    console.log(err);
                    context.fail(JSON.stringify({
                        "data": null,
                        "error": {
                            "code": 500,
                            "message": err,
                            "type": "Server Error",
                            "should_display_error": "false"
                        },
                        "statusCode": 500
                    }));
                    return;
                }
            }
            else {
                console.log("sucess");
                context.done(null, {
                    "data": {
                        "MainData": "Password reset success"
                    },
                    "error": null,
                    "statusCode": 200
                });
            }
        });
    });

    wf.emit('check_request_body');
};
