const fs = require('fs');
const csv = require("fast-csv");
const jsforce = require('jsforce');
const sfdc = require("./salesforce");
const prompt = require('prompt');

var schema = {
    properties: {
        username: {
            description: 'Enter your username:',
            required: true
        },
        password: {
            description: 'Enter your password:',
            hidden: true,
            replace: '*',
        }
    }
};



function promptUser() {
    prompt.start();
    prompt.get(schema, function (error, result) {
        if (error) {
            console.log(error);
        }
        if (result) {
            console.log("commmand line input recieved:", result.username, result.password);
        }
    });
}

function getCSV(fileName) {
    fs.createReadStream(fileName)
        .pipe(csv())
        .on("data", function (data) {
            username = data[0]
            password = data[1]
            //sfdc.getSalesforceCertificates(username, password)
            sfdc.getSalesforceSSO(username, password)
        })
        .on("end", function () {
            console.log("done");
        });
}



function main() {
    getCSV('secret.csv')
}

main();