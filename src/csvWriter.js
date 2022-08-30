const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const OUTPUT_CSV_FILE_PATH = "outputs/transactions.csv";

const writeToCSVFile = async (dataToWrite) => {
    const csvWriter = createCsvWriter({
        path: OUTPUT_CSV_FILE_PATH,
        header: [
            {id: 'transactionType', title: 'transactionType'},
            {id: 'date', title: 'date'},
            {id: 'feeAssetName', title: 'feeAssetName'},
            {id: 'feeAmount', title: 'feeAmount'},
            {id: 'incomeAssetName', title: 'incomeAssetName'},
            {id: 'incomeAmount', title: 'incomeAmount'},
            {id: 'outgoingAssetName', title: 'outgoingAssetName'},
            {id: 'outgoingAmount', title: 'outgoingAmount'},
            {id: 'transactionId', title: 'transactionId'}
        ]
    });

    await csvWriter.writeRecords(dataToWrite);
    console.log('The CSV file was written successfully');
};

module.exports = {
    writeToCSVFile: writeToCSVFile
}