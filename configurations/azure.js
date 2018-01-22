module.exports = {
    accessKey: process.env.AZURE_STORAGE_ACCESSKEY,
    storageAccount: process.env.AZURE_STORAGE_ACCOUNT,
    container: process.env.AZURE_STORAGE_CONTAINER,
    errorLogsTable: process.env.AZURE_ERROR_LOGS_TABLE,
    partitionKey: process.env.AZURE_STORAGE_PARTITION_KEY
};
