const BUY_TRANSACTION_CVS_VALUE = "buy";
const SELL_TRANSACTION_CVS_VALUE = "sell";
const DEPOSIT_TRANSACTION_CVS_VALUE = "deposit";
const WITHDRAWL_TRANSACTION_CVS_VALUE = "withdrawl";
const SWAP_TRANSACTION_CVS_VALUE = "swap";
const COMPLETED_C2C_TRANSACTION_STATUS = "COMPLETED";

const BUY_TRANSACTION_TYPE = "0";
const DEPOSIT_TRANSACTION_TYPE = "0";
const SELL_TRANSACTION_TYPE = "1";
const WITHDRAWL_TRANSACTION_TYPE = "1";

const processSwapsRowData = (swap) => {
    const newRow = {};
    newRow.transactionType = SWAP_TRANSACTION_CVS_VALUE;
    newRow.date = new Date(swap.swapTime);
    newRow.feeAssetName = swap.quoteAsset;
    newRow.feeAmount = swap.quoteQty;
    newRow.incomeAssetName = swap.baseAsset;
    newRow.incomeAmount = swap.baseQty;
    newRow.outgoingAssetName = swap.quoteAsset;
    newRow.outgoingAmount = swap.quoteQty;
    newRow.transactionId = swap.swapId;

    return newRow;
};

const processFiatPaymentRowData = (fiatPayment, transactionType) => {
    const newRow = {};
    newRow.transactionType = transactionType === BUY_TRANSACTION_TYPE ?
        BUY_TRANSACTION_CVS_VALUE : SELL_TRANSACTION_CVS_VALUE;
    newRow.date = new Date(fiatPayment.createTime);
    newRow.feeAssetName = fiatPayment.fiatCurrency;
    newRow.feeAmount = fiatPayment.totalFee;
    newRow.incomeAssetName = fiatPayment.cryptoCurrency;
    newRow.incomeAmount = fiatPayment.obtainAmount;
    newRow.outgoingAssetName = fiatPayment.fiatCurrency;
    newRow.outgoingAmount = fiatPayment.sourceAmount;
    newRow.transactionId = fiatPayment.orderNo;

    return newRow;
};

const processFiatTransactionAndWithdrawlData = (fiatData, transactionType) => {
    const newRow = {};

    if (transactionType === DEPOSIT_TRANSACTION_TYPE) {
        newRow.transactionType = DEPOSIT_TRANSACTION_CVS_VALUE;
        newRow.incomeAssetName = fiatData.fiatCurrency;
        newRow.incomeAmount = fiatData.amount;
    }

    if (transactionType === WITHDRAWL_TRANSACTION_TYPE) {
        newRow.transactionType = WITHDRAWL_TRANSACTION_CVS_VALUE;
        newRow.outgoingAssetName = fiatData.fiatCurrency;
        newRow.outgoingAmount = fiatData.amount;
    }

    newRow.date = new Date(fiatData.createTime);
    newRow.feeAssetName = fiatData.fiatCurrency;
    newRow.feeAmount = fiatData.totalFee;
    newRow.transactionId = fiatData.orderNo;

    return newRow;
};

const processAnyTrades = (data, symbol) => {
    const newRow = {};
    const amount = (data.price * data.qty) - data.commission;

    if (data.isBuyer === true) {
        newRow.transactionType = BUY_TRANSACTION_CVS_VALUE;
    }

    newRow.outgoingAssetName = symbol.quoteAsset;
    newRow.outgoingAmount = amount;
    newRow.incomeAssetName = symbol.baseAsset;
    newRow.incomeAmount = amount;
    newRow.transactionId = data.id;
    newRow.feeAssetName = data.commissionAsset;
    newRow.feeAmount = data.commission;
    newRow.date = new Date(data.time);

    return newRow;
};

const processC2CData = (c2cTradeHistory) => { //FIXME
    const newRow = {};
    if (c2cTradeHistory.orderStatus === COMPLETED_C2C_TRANSACTION_STATUS) {
        newRow.tradeType = c2cTradeHistory.tradeType;
        newRow.date = new Date(c2cTradeHistory.createTime);
        newRow.feeAssetName = c2cTradeHistory.asset;
        newRow.feeAmount = c2cTradeHistory.commission;
        newRow.incomeAssetName = c2cTradeHistory.baseAsset;
        newRow.incomeAmount = c2cTradeHistory.baseQty;
        newRow.outgoingAssetName = c2cTradeHistory.quoteAsset;
        newRow.outgoingAmount = c2cTradeHistory.quoteQty;
        newRow.transactionId = c2cTradeHistory.orderNo;
    }
    return newRow;
};

const processDataIntoArray = (dataToProcess, mappingFunction, transactionsData, symbol) => {
    dataToProcess.map(data => {
        const newRow = mappingFunction(data, symbol);
        transactionsData.push(newRow);
    });
};

const processResponse = async (response, mappingFunction, transactionsData, symbol) => {
    let dataToProcess = await response.json();
    if (dataToProcess.data) dataToProcess = dataToProcess.data;

    processDataIntoArray(dataToProcess, mappingFunction, transactionsData, symbol);
};

const processListResponse = async (listeToProcess, mappingFunction, transactionsData) => {
    listeToProcess.map(swap => {
        processResponse(swap, mappingFunction, transactionsData);
    });
};

module.exports = {
    processSwapsRowData: processSwapsRowData,
    processFiatPaymentRowData: processFiatPaymentRowData,
    processFiatTransactionAndWithdrawlData: processFiatTransactionAndWithdrawlData,
    processC2CData: processC2CData,
    processResponse: processResponse,
    processListResponse: processListResponse,
    processAnyTrades: processAnyTrades
}