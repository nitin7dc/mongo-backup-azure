'use strict';
var dotenvObj = require('dotenv');
var azure = require('azure-storage');
var backup = require('mongodb-backup');
var fs = require('fs');

// load configuration from environment or file.
dotenvObj.config();
var logger = require('./configurations/logger');
var azureConfig = require('./configurations/azure');
var databaseConfig = require('./configurations/database');

var azureStorageAccount = azureConfig.storageAccount;
var azureAccessKey = azureConfig.accessKey;
var azureContainerName = azureConfig.container;
var retryOperations = new azure.ExponentialRetryPolicyFilter();
var blobService = azure.createBlobService(azureStorageAccount, azureAccessKey).withFilter(retryOperations);
var timeStamp = new Date().toISOString(); // backup file name
var temporaryFileLocation = __dirname + '/backups/';
var temporaryFileName = temporaryFileLocation + timeStamp + '.tar';

/**********************************************************************************************************************
 * Clear temporary file stored in 'temporaryFileLocation'.
 **********************************************************************************************************************/
function clearTempLocation() {
    fs.stat(temporaryFileName, function (err) {
        if (err) {
            logger.log('error', timeStamp + ' error running backup command.', error);
            return;
        }

        fs.unlink(temporaryFileName, function (err) {
            if (err) {
                logger.log('error', timeStamp + ' error running backup command.', error);
                return;
            }
            logger.log('info', timeStamp + ' temporary file removed');
            logger.log('info', timeStamp + ' COMPLETED SUCCESSFULLY');
        });
    });
}


/**********************************************************************************************************************
 * Once all collections are downloaded to disk as .tar file.
 * Upload .tar file to azure account.
 **********************************************************************************************************************/
function storeInAzureAccount(err) {

    if (err) {
        logger.log('error', timeStamp + ' error running backup command.', error);
        return;
    }
    logger.log('info', timeStamp + ' backup command successful. Going to push to azure account.');

    blobService.createContainerIfNotExists(
        azureContainerName,
        function (error,
                  result,
                  response) {

            if (error) {
                logger.log('error', timeStamp + ' azure container:' + azureContainerName + '. Error:', error);
                return;
            }
            logger.log('info', timeStamp + ' azure container:' + azureContainerName + '. Ready');

            blobService
                .createBlockBlobFromLocalFile(
                    azureContainerName,
                    timeStamp,
                    temporaryFileName,
                    function (error,
                              result,
                              response) {
                        if (error) {
                            logger.log('error', timeStamp + ' could not write to azure' + azureContainerName + '. Error:', error);
                            return;
                        }
                        clearTempLocation();
                    });
        });
}


/**********************************************************************************************************************
 * Initiate backup.
 **********************************************************************************************************************/

logger.log('info', timeStamp + ' INITIATING...');
backup({
    uri: `mongodb://${encodeURIComponent(databaseConfig.DB_USER)}:${encodeURIComponent(databaseConfig.DB_PASS)}@${databaseConfig.DB_HOST}:${databaseConfig.DB_PORT}/${databaseConfig.DB_NAME}`,
    root: temporaryFileLocation,
    tar: timeStamp + '.tar', // save backup into this tar file
    callback: storeInAzureAccount
});