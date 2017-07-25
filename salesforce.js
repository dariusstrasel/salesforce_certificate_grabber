const jsforce = require('jsforce');
const fs = require('fs');
const os = require('os');
const mkdirp = require('mkdirp');

// Here is the process:
// 1. Log into the org.
// 2. List the desired metadata as objects.
// 3. Query metadata fields for each returned object.
// 4. Return result to STDOUT
// 5. STDOUT is captured via a filestream.

/**
 * Gets Certificate metadata (and .crt files) from Salesforce with provided username and password.
 *
 * @param {string} username - String representing a Salesforce's username.
 * @param {string} password - String representing a Salesforce's password
 * @return {null} None
 */
function getSalesforceCertificates(username, password) {

  var conn = new jsforce.Connection();

  conn.login(username, password, function (err, res) {
    if (err) {
      console.log("Error raised for:", username)
      console.error('err', err);
    }

    console.log("Logging in...")

    var types = [{ type: 'Certificate', folder: null }];
    conn.metadata.list(types, '39.0', function (err, metadata) {
      if (err) {
        console.log("Error raised for:", username)
        console.error('err', err);
      }
      if (metadata) {
        console.log("Found", metadata.length, "certificates:");
        var fullNames = [];
        metadata.forEach(function (meta) {
          //console.log(meta);
          fullNames.push(meta.fullName)
        })
      }
      if (fullNames) {
        conn.metadata.read('Certificate', fullNames, function (err, metadata) {
          if (err) {
            console.log("Error raised for:", username)
            console.error('err', err);
          }
          //console.log("Getting metadata...")
          var logger = fs.createWriteStream('log.txt', {
            flags: 'a' // 'a' means appending (old data will be preserved)
          })
          for (var i = 0; i < metadata.length; i++) {
            var meta = metadata[i];
            console.log({ 'fullName': meta.fullName, 'caSigned': meta.caSigned, 'expirationDate': meta.expirationDate });
            writeCert(meta.fullName, meta.content)
            logger.write(`${username}, ${meta.fullName}, ${meta.caSigned}, ${meta.expirationDate}` + os.EOL)
          }
        });
      }
    });
  });
}

/**
 * Gets SamlSSOConfig metadata from Salesforce with provided username and password.
 *
 * @param {string} username - String representing a Salesforce's user instance.
 * @param { type: 'TypeConfig', folder: null } types - The content which should be written to file.
 * @return {null} None
 */
function getSalesforceSSO(username, password) {

  // create new connection object for jsforce library
  var conn = new jsforce.Connection();

  conn.login(username, password, function (err, res) {
    if (err) {
      return handleError(err, username);
    }

    console.log(`Successfully logged in as ${username}.`)

    var types = [{ type: 'SamlSsoConfig', folder: null }];
    return getMetadataObjects(conn, types, username);
  });
}

/**
 * Gets all the objects from Salesforce which match the passed in 'types' object.
 *
 * @param {jsforce.Connection()} connection - Connection object from JSForce for Salesforce session. Should be pre-authenticated thru connection.login.
 * @param { type: 'TypeConfig', folder: null } types.type - The meta-data type to pull.
 * @return {null} None
 */
function getMetadataObjects(connection, types, username) {
  connection.metadata.list(types, '39.0', function (err, metadata) {
    if (err) {
      return handleError(err, username);
    }
    if (metadata) {
      // Collect identifying names from metadata objects to be parsed later.
      // fullName == identifying field name on a Metadata object.
      var fullNames = [];

      // Salesforce returns a single object if one result, or an array if more than one.
      var logString = function (count, username, metaDataObject) {
        return `Found ${count} SSOconfig(s) for ${username}: ${metaDataObject}`
      }

      if (metadata.constructor === Array) {
        metadata.forEach(function (meta) {
          // Grab the identifying field name aka "fullName"
          fullNames.push(meta.fullName)
        })
        console.log(logString(metadata.length, username, fullNames));
      } else {
        fullNames.push(metadata.fullName)
        console.log(logString("one", username, fullNames));
      }
    }
    if (fullNames) {
      readMetaDataFields(connection, 'SamlSsoConfig', fullNames, username);
    }
  });
}


/**
 * Writes a SSO config to json from SFDC SSO metadata.
 *
 * @param {string} fileName - The expected name of the output certificate. Is typically the metadata.fullName property.
 * @param {string} data - The content which should be written to file.
 * @return {null} None
 */
function readMetaDataFields(connection, type, fullNames, username) {
  connection.metadata.read(type, fullNames, function (err, metadata) {
    console.log(username, fullNames)
    if (err) {
      return handleError(err, username);
    }
    //console.log("Getting metadata...")

    for (var i = 0; i < metadata.length; i++) {
      var meta = metadata[i];
      writeSSO(`${meta.fullName}_${username.split("@")[0]}`, meta)
    }
  });
}

/**
 * Handle errors raised from async functions
 *
 * @param {error~object} error - The error message object
 * @param {string} username - The username from the function context which was scoped during error raise.
 * @return {null} None
 */
function handleError(error, username) {
  console.log("Error raised for:", username)
  console.error('err', err);
}

/**
 * Writes a certificate to file from SFDC certificate metadata.
 *
 * @param {string} fileName - The expected name of the output certificate. Is typically the metadata.fullName property.
 * @param {string} data - The content which should be written to file.
 * @return {null} None
 */
function writeCert(fileName, data) {
  data = decodeBase64(data);

  if (fs.existsSync('certs/') !== true) {
    handleFolder('certs/')
  }
  outputFile = `certs/${fileName}.crt`

  fs.writeFile(outputFile, data, function (err) {
    if (err) { console.log(err); }
  });
}

/**
 * Writes a SSO config to json from SFDC SSO metadata.
 *
 * @param {string} fileName - The expected name of the output certificate. Is typically the metadata.fullName property.
 * @param {string} data - The content which should be written to file.
 * @return {null} None
 */
function writeSSO(fileName, data) {
  data = JSON.stringify(data) // Convert input to string.

  if (fs.existsSync('sso') !== true) {
    handleFolder('sso')
  }
  outputFile = `sso/${fileName}.json`

  fs.writeFile(outputFile, data, function (err) {
    if (err) { console.error(err); }
  });

}

/**
 * Creates a folder if it does not already exist in the file system.
 *
 * @param {string} fileName - The expected name of the output certificate. Is typically the metadata.fullName property.
 * @param {string} data - The content which should be written to file.
 * @return {null} None
 */
function handleFolder(folderPath) {
  mkdirp(folderPath, function (err) {
    if (err) { console.error(err); }
  });
}

/**
 * Decodes Base64 text into its ASCII equivalent.
 *
 * @param {string} base64string - The string which should be converted to ASCII.
 * @return {string} The ASCII equivalent of base64string
 */
function decodeBase64(base64string) {
  var newString = new Buffer(base64string, 'base64').toString("ascii")
  return newString
}

module.exports = {
  getSalesforceCertificates: getSalesforceCertificates,
  getSalesforceSSO: getSalesforceSSO
}