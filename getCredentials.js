const fs = require('fs');
const csv = require("fast-csv");
const jsforce = require('jsforce');
const sfdc = require("./salesforce");
const prompt = require('prompt');


/**
 * Ask user whether they want to get certificates, or SSO metadata,
 *
 * @param {function} callback - Function which recives a string represnting the user selected tool.
 * @return {function} callback - Returns the callback, causing it to begin calls the the Salesforce meta-data API.
 */
function promptUser(callback) {
    // Defines what appears to the user in the terminal.
    var schema = {
        properties: {
            tool: {
                description: 'Enter your tool: Salesforce (C)ertificates or Salesforce (S)SO.',
                required: true
            },
        }
    };
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
            // Takes user input and evaluates according to tool_map
            selected_tool = tool_map[result.tool.toLowerCase()]
            if (selected_tool === undefined) {
                console.log(`Command line input ${result.tool} was unrecognized. Please try again.`)
                // Value was undefined, prompt user again for input.
                return promptUser();
            } else {
                console.log(`Recognized input, getting ${selected_tool} data.`)
                callback('secret.csv', selected_tool)
                //return selected_tool;
            }
        }

    });
}


/**
 * Read lines from a csv file and send parse user/password to the desired tool function.
 *
 * @param {string} fileName - The expected name of the csv file.
 * @param {string} tool - Evaluated in reference to tool map in order to call the respective tool function.
 * @return {null} None
 */
function getCSV(fileName, tool) {
    // Open the targetted csv as a text stream.
    tool_map = {
        'certificate': sfdc.getSalesforceCertificates,
        'sso': sfdc.getSalesforceSSO
    }
    selected_tool = tool_map[tool];
    console.log(selected_tool);
    fs.createReadStream(fileName)
        .pipe(csv())
        .on("data", function (data) {
            username = data[0]
            password = data[1]
            // Selected tool is evaluated from tool_map
            selected_tool(username, password)
        })
        .on("end", function () {
            console.log("done");
        });
}


/**
 * Ask user for tool, and execute getCSV as callback upon tool selection.
 *
 * @return {null} None
 */
function main() {
    promptUser(getCSV);
}

main();