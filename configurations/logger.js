/***
 * LOGGING
 *
 * Application wide logging. Store all logs on files inside "../logs" folder.
 * Additionally azure cloud based table logging also ready.
 */

'use strict';
var winston = require('winston');
var azureLogger = require('winston-azuretable').AzureLogger;
var azureConfig = require("./azure");
var fileName = __dirname + "/../logs/myLogs.log";

var options = {
    account: azureConfig.storageAccount,
    key: azureConfig.accessKey,
    tableName: azureConfig.errorLogsTable,
    partitionKey: azureConfig.partitionKey,
    nestedMeta: "true"
};

var logger = winston.createLogger({
    transports: [
        new (azureLogger)(options)
    ]
});

// If we're not in production then log to the `console` and file
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console());
    logger.add(new (winston.transports.File)({
        filename: fileName,
        maxsize: 1000 * 1000 * 10,
        maxFiles: 5
    }));
}

module.exports = logger;
