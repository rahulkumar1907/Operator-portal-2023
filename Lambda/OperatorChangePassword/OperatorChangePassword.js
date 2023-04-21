var AWS = require("aws-sdk");
 
var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
  "region":process.env.AwsRegionForPool
});


exports.handler = (event, context, callback) => {

    var EventEmitter = require('events').EventEmitter;
    var wf = new EventEmitter();
    
    wf.once('check_request_body', function() {
        var parameters = '/';
        var PasswordObj = new Object();
        PasswordObj.AccessToken = event.body.hasOwnProperty('AccessToken')==true ? event.body.AccessToken.length == 0 ? event.body.AccessToken = '' :event.body.AccessToken : '';
        PasswordObj.PreviousPassword = event.body.hasOwnProperty('PreviousPassword')==true ? event.body.PreviousPassword.length == 0 ? event.body.PreviousPassword = '' :event.body.PreviousPassword : '';
        PasswordObj.ProposedPassword = event.body.hasOwnProperty('ProposedPassword')==true ? event.body.ProposedPassword.length == 0 ? event.body.ProposedPassword = '' :event.body.ProposedPassword : '';

        if(PasswordObj.AccessToken.length == 0) { parameters = parameters+'AccessToken/' }
        if(PasswordObj.PreviousPassword.length == 0) { parameters = parameters+'PreviousPassword/' }
        if(PasswordObj.ProposedPassword.length == 0) { parameters = parameters+'ProposedPassword/' }

        if(parameters.length > 1){
          context.fail(JSON.stringify({
              "data":null,
              "error": {
                "code": 400,
                "message": "Missing/Invalid parameters "+parameters,
                "type": "Missing/Invalid parameters",
                "should_display_error": "false"
              },
              "statusCode": 400
          }));
          return;
        } else {
          wf.PasswordObject = PasswordObj;
          wf.emit('reset_ProposedPassword_in_cognito');        }
    });

    wf.once('reset_ProposedPassword_in_cognito', function(){
      var params = {
        AccessToken: wf.PasswordObject.AccessToken, /* required */
        PreviousPassword: wf.PasswordObject.PreviousPassword, /* required */
        ProposedPassword: wf.PasswordObject.ProposedPassword
      };
      cognitoidentityserviceprovider.changePassword(params, function(err, data) {
        if (err) {
          if(err.code == 'NotAuthorizedException'){
            context.fail(JSON.stringify({
                "data":null,
                "error": {
                  "code": 400,
                  "message": err.message,
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
                "data":null,
                "error": {
                  "code": 500,
                  "message": "Internal server error",
                  "type": "Server Error",
                  "should_display_error": "false"
                },
                "statusCode": 500
            }));
            return;
          }
          
        }
        else {
           context.done(null,{
               "data":{
                 "MainData": "Password Changed Sucessfully"
               },
               "error": null,
               "statusCode": 200
           });
          return;
        }
      });
    });


    wf.emit('check_request_body');
};