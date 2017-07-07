const fs = require('fs');
const csv = require("fast-csv");
const jsforce = require('jsforce');
const sfdc = require("./salesforce");
const prompt = require('prompt');

var schema = {
    properties: {
        tool: {
            description: 'Enter your tool: Salesforce (C)ertificates or Salesforce (S)SO.',
            required: true
        },
    }
};



function promptUser() {
    prompt.start();
    prompt.get(schema, function (error, result) {
        if (error) {
            console.log(error);
        }
        if (result) {
            tool_map = {
                'c': 'certificate',
                's': 'sso'
            }
            selected_tool = tool_map[result.tool.toLowerCase()]
            if (selected_tool === undefined) {
                console.log(`Command line input ${result.tool} was unrecognized. Please try again.`)
                return promptUser();
            } else {
                console.log(`Recognized input, getting ${selected_tool} data.`)
                return selected_tool;
            }
        }
    });
}

function getCSV(fileName, tool) {
    tool_map = {
        'certificate': sfdc.getSalesforceCertificates,
        'sso': sfdc.getSalesforceSSO
    }
    selected_tool = tool_map[tool];
    fs.createReadStream(fileName)
        .pipe(csv())
        .on("data", function (data) {
            username = data[0]
            password = data[1]
            selected_tool(username, password)
        })
        .on("end", function () {
            console.log("done");
        });
}



function main() {
    tool = promptUser();
    return getCSV('secret.csv', tool)
}

main();