const requestHelper = require('./requestHelper');
const csvWriter = require('./csvWriter');
const FetchError = require("./RequestFetchError");
const responseProcessor = require('./responseProcessor');
const {processC2CData} = require("./responseProcessor");
require('dotenv').config();

const BUY_OR_DEPOSIT_TRANSACTION_TYPE = "0";
const SELL_OR_WITHDRAWL_TRANSACTION_TYPE = "1";
const BUY_C2C_TRANSACTION_TYPE = "BUY";
const SELL_C2C_TRANSACTION_TYPE = "SELL";

const startDate = Date.UTC(2000, 0o2, 16);
const endDate = Date.UTC(2021, 11, 26);
const transactionsData = [];

const fetchSwaps = async () => {
    console.log("STARTING FETCH SWAPS");

    const response = await requestHelper.getRequestFromBinance(process.env.GET_SWAP_API_URL, {
        timestamp: Date.now(),
        startTime: startDate,
        endTime: endDate,
        status: 1
    });
    await responseProcessor.processResponse(response, responseProcessor.processSwapsRowData, transactionsData);

    console.log("DONE FETCH SWAPS");
};
const fetchFiatPaymentTransactions = async (transactionType) => {
    console.log("STARTING FETCH FIAT PAYMENT TRANSACTION");

    checkTransactionTypeForRequest(transactionType);
    const response = await requestHelper.getRequestFromBinance(process.env.GET_FIAT_PAYMENTS_API_URL, {
        timestamp: Date.now(),
        beginTime: startDate,
        endTime: endDate,
        transactionType: transactionType
    });
    await responseProcessor.processResponse(
        response, responseProcessor.processFiatPaymentRowData, transactionsData);

    console.log("DONE  FETCH FIAT PAYMENT TRANSACTION");
};
const fetchFiatPaymentAndWithdrawl = async (transactionType) => {
    console.log("STARTING FETCH FIAT PAYMENT AND WITHDRAWL");

    checkTransactionTypeForRequest(transactionType);
    const response = await requestHelper.getRequestFromBinance(process.env.FIAT_DEPOSITS_AND_WITHDRAWL, {
        timestamp: Date.now(),
        startTime: startDate,
        endTime: endDate,
        transactionType: transactionType
    });
    await responseProcessor.processResponse(
        response, responseProcessor.processFiatTransactionAndWithdrawlData, transactionsData);

    console.log("DONE  FETCH FIAT PAYMENT AND WITHDRAWL");
};
const fetchC2cTradeHistory = async (tradeType) => { //FIXME
    console.log("STARTING C2C TRADE HISTORY");

    checkTradeTypeForC2cRequest(tradeType);

    let page = 1;
    const response = await requestHelper.getRequestFromBinance(process.env.C2C_TRADE_HISTORY, {
        timestamp: Date.now(),
        tradeType: tradeType,
        page: page
    });
    /*const allFetchedData = [await response.json()];

    if (response.counter > 0) {
        while (response.counter > page) {
            page++;
            const subResponse = await requestHelper.getRequestFromBinance(process.env.C2C_TRADE_HISTORY, {
                timestamp: Date.now(),
                tradeType: tradeType,
                page: page
            });
            allFetchedData.push(await subResponse.json());
        }
    }

    await responseProcessor.processListResponse(allFetchedData, processC2CData, transactionsData);*/

    await responseProcessor.processResponse(response, processC2CData, transactionsData);

    console.log("DONE C2C TRADE HISTORY ");
};
const fetchAllSymbols = async () => {
    console.log("STARTING FETCH ALL SYMBOLS");

    const response = await requestHelper.getRequestFromPublicBinance(process.env.ALL_SYMBOLS);
    const data = await response.json();

    const symbols = [];
    data.symbols.map(symbol => {
        const symbolData = {
            symbol: symbol.symbol,
            baseAsset: symbol.baseAsset,
            quoteAsset: symbol.quoteAsset
        }
        symbols.push(symbolData);
    })

    console.log("DONE FETCH ALL SYMBOLS");
    return symbols;
};
const fetchAccountInformation = async () => {
    console.log("STARTING FETCH ACCOUNT INFORMATION");

    const symbols = await fetchAllSymbols();
    const response = await requestHelper.getRequestFromBinance(process.env.ACCOUNT_INFORMATION_URL, {
        timestamp: Date.now(),
    });
    const userData = await response.json();

    const userSymbols = new Set();
    const balances = userData.balances;

    symbols.map(symbol => {
        balances.map(balance => {
            if(balance.free > 0 && balance.asset === symbol.baseAsset) userSymbols.add(symbol);
        });
    });

    console.log("DONE FETCH ACCOUNT INFORMATION");
    return userSymbols;
}

const fetchMyTrades = async () => {
    console.log("STARTING FETCH MY TRADES");

    const symbols = await fetchAccountInformation();
    for (const symbol of symbols) {
        console.log('FETCHING TRADES FOR SYMBOL ', symbol.symbol);
        const response = await requestHelper.getRequestFromBinance(process.env.MY_TRADES_URL, {
            timestamp: Date.now(),
            recvWindow: 60000,
            symbol: symbol.symbol,
            endTime: endDate
        });
        await responseProcessor.processResponse(response, responseProcessor.processAnyTrades, transactionsData, symbol);
    }

    console.log("DONE FETCH MY TRADES");
};

const checkTransactionTypeForRequest = (transactionType) => {
    if (transactionType !== BUY_OR_DEPOSIT_TRANSACTION_TYPE &&
        transactionType !== SELL_OR_WITHDRAWL_TRANSACTION_TYPE) {
        throw new Error("Transaction type not recognized");
    }
};
const checkTradeTypeForC2cRequest = (tradeType) => {
    if (tradeType !== BUY_C2C_TRANSACTION_TYPE && tradeType !== SELL_C2C_TRANSACTION_TYPE) {
        throw new Error("Trade type not recognized");
    }
}

(async () => {
    try {
        await fetchSwaps();
        await fetchFiatPaymentTransactions(BUY_OR_DEPOSIT_TRANSACTION_TYPE);
        await fetchFiatPaymentTransactions(SELL_OR_WITHDRAWL_TRANSACTION_TYPE);
        await fetchFiatPaymentAndWithdrawl(BUY_OR_DEPOSIT_TRANSACTION_TYPE);
        await fetchFiatPaymentAndWithdrawl(SELL_OR_WITHDRAWL_TRANSACTION_TYPE);
        await fetchC2cTradeHistory(BUY_C2C_TRANSACTION_TYPE);
        await fetchC2cTradeHistory(SELL_C2C_TRANSACTION_TYPE);
        await fetchMyTrades();
        await csvWriter.writeToCSVFile(transactionsData);
    } catch (error) {
        if (error instanceof FetchError) {
            console.log(error.message);
        } else {
            console.log("Unexpected error : ", error.message);
        }
    }
})();