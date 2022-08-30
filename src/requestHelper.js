const fetch = require("node-fetch");
const crypto = require("crypto");
const FetchError = require("./RequestFetchError");
require('dotenv').config();

const defaultHeader = {
    "X-MBX-APIKEY": process.env.API_KEY,
};

const getHmac = (data) => {
    return crypto.createHmac("sha256", process.env.API_SECRET).update(data).digest("hex");
};

const checkResponseForError = async (response) => {
    if(response.status !== 200) {
        const responseBody = await response.json();
        const errorMessage = `ERROR STATUS ${response.status} : ${responseBody.msg}`;
        throw new FetchError(errorMessage);
    }
};

const getRequestFromPublicBinance = async (api_url, queryParams) => {
    const url = process.env.BASE_BINANCE_API_URL + api_url;

    const response = await fetch(url, {
        method: "get",
        headers: defaultHeader,
    });

    await checkResponseForError(response);

    return response;
};

const getRequestFromBinance = async (api_url, queryParams = {}) => {
    const url = process.env.BASE_BINANCE_API_URL + api_url;

    queryParams.signature = getHmac(new URLSearchParams(queryParams).toString());

    const response = await fetch(url + new URLSearchParams(queryParams), {
        method: "get",
        headers: defaultHeader,
    });

    await checkResponseForError(response);

    return response;
};

module.exports = {
    getRequestFromBinance: getRequestFromBinance,
    getRequestFromPublicBinance: getRequestFromPublicBinance
}