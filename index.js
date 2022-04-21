var aws = require("aws-sdk");
aws.config.update({region:'us-east-1'})
var ses = new aws.SES({ region: "us-east-1" });
var docClient = new aws.DynamoDB.DocumentClient();

exports.handler = async function (event) {
    let message = event.Records[0].Sns.Message
    let json = JSON.parse(message);
    let email = json.username;
    let token = json.token;
    const seconds = 5 * 60;
    const secondsInEpoch = Math.round(Date.now() / 1000);
    const expirationTime = secondsInEpoch + seconds;
    const currentTime = Math.round(Date.now() / 1000);

    var table = {
        TableName : "csye-6225",
        Item: {
            "username" : email,
            "token" : token,
            "TimeToExist" : expirationTime
        }
    }
    console.log("Adding a new item..");


    docClient.put(table, function(err, data) {
        if (err) {
            console.error("Unable to add the item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added:", JSON.stringify(data, null, 2));
        }
    });
    console.log(email + " " + token + " Parameters set!!");

    const mailbody = `
    <!DOCTYPE html>
    <html>
        <head>
        </head>
        <body>
          <p>Hi, ${email}</p>
          <p>Please verify your email</br>
          <b>Link will be valid only for 5 minutes!!</b></br>
          Find your link below:</p>
          <p><a href=http://dev.amalmathur.me/v1/user/verifyUserEmail?token=${token}&email=${email} >
            http://dev.amalmathur.me/v1/user/verifyUserEmail?token=${token}&email=${email} </a> </p>
            </body></html>
        </body>
    </html>`; 

    var params = {
        Destination: {
            ToAddresses: [email],
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: mailbody,
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Email Verification",
            },
        },
        Source: "sender@dev.amalmathur.me",
    };
    console.log("Email Sent..");
    return ses.sendEmail(params).promise()
};