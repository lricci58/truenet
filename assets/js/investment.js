import * as async from './modules/async.js';
import documentChecker from './modules/document-checker.js';
import * as loadingScreen from './modules/loading-screen.js';

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('web-title').innerHTML = 'Investment';

    const investments = async.get({
        url: '/php/get/investments.php',
        method: 'POST'
    });

    // waits for document to load base promises
    documentChecker.isReady().then((loadedSuccessfully) => {
        if (!loadedSuccessfully) return;

        const fetchList = {
            'investments': investments
        }

        async.waitForAll(fetchList).then((result) => {
            const fetchToken = () => {
                return async.get({
                    url: 'https://api.invertironline.com/token',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: {
                        grant_type: 'password',
                        username: 'lucric2001@gmail.com',
                        password: 'C4r*Tu*Ch3*R4*I'
                    }
                }).then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch token');
                    }
                    return response.json();
                }).then(data => data.token);
            }

            const fetchSymbol = (market, symbol) => {
                return fetchToken().then((token) => {
                    console.log(token);
                    return async.get({
                        url: `https://api.invertironline.com/api/${market}/Titulos/${symbol}/Cotizacion`,
                        // url: `https://api.invertironline.com/api/v2/${market}/Titulos/${symbol}`,
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCJ9.eyJzdWIiOiIyODI1MTAwIiwiSUQiOiIyODI1MTAwIiwianRpIjoiYjIwMGFhNDAtYzYzZC00YzczLTk4NzItY2FkYWVkMGYxYjJhIiwiY29uc3VtZXJfdHlwZSI6IjEiLCJ0aWVuZV9jdWVudGEiOiJUcnVlIiwidGllbmVfcHJvZHVjdG9fYnVyc2F0aWwiOiJUcnVlIiwidGllbmVfcHJvZHVjdG9fYXBpIjoiVHJ1ZSIsInRpZW5lX1R5QyI6IkZhbHNlIiwibmJmIjoxNzMyOTE3MTEyLCJleHAiOjE3MzI5MTgwMTIsImlhdCI6MTczMjkxNzExMiwiaXNzIjoiSU9MT2F1dGhTZXJ2ZXIiLCJhdWQiOiJJT0xPYXV0aFNlcnZlciJ9.goAm3cXwGOi0xfnEp9ELuseyEWzjspX3SDN_GMYU6aj08koq-VMJdoICsGz-02AdQTCxhVi25ft7zlFZ-xGBpkPX3W1pcnA8V7UsETusLI9i3V_r6bfAY5RQlFrOr9uXydavrmAnaAL9PP4zQ-HAOTJ9tIlDGl0DnqeJmWYFiZQ5vooq13jH_E6PpFO6yP791c2p9_SJqG9qyGmiG0pfKTL-ceyIp5mgn6X2RfsalCEsiFdCkxP7tPkQObJikPgTV0qP9K4NWob4Q-zUeh8aFAmBZSLVBt3XTj9dJtfhvoAUh1aGEdCyZO9jP7Oylfc2icLZd2A72zVSPwyTYBSvoQ`
                        }
                    });
                }).then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch symbol');
                    }
                    return response.json(); // Return the symbol data
                });;
            }

            const symboldData = fetchSymbol('bCBA', 'YPFD');
            console.log(symboldData);

            loadInvestments(result['investments']);
            calculateTWR(result['investments'].reverse());

            loadingScreen.hide();
        });
    });
});

function loadInvestments(investments) {
    console.log(investments);
    // load to UI
}

function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
}

function getClosestQuote(investmentDate, cclQuotes) {
    const investmentDateObj = parseDate(investmentDate);

    // binary searches for the closest date
    let low = 0;
    let high = cclQuotes.length - 1;
    let closestQuote = cclQuotes[0];
    let closestDiff = Math.abs(investmentDateObj - parseDate(cclQuotes[0][0]));

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const midDate = parseDate(cclQuotes[mid][0]);
        const diff = Math.abs(investmentDateObj - midDate);

        // update the closest quote if necessary
        if (diff < closestDiff) {
            closestQuote = cclQuotes[mid];
            closestDiff = diff;
        }

        if (midDate < investmentDateObj) {
            low = mid + 1;
        } else if (midDate > investmentDateObj) {
            high = mid - 1;
        } else {
            break; // exact match
        }
    }

    return closestQuote;
}

async function calculateTWR(orderedInvestments) {
    const firstInvestmentDate = orderedInvestments[0]['date'];
    const lastInvestmentDate = orderedInvestments.slice(-1)[0]['date'];
    const cclRequest = async.get({
        url: `https://mercados.ambito.com//dolarrava/cl/grafico/${firstInvestmentDate}/${lastInvestmentDate}`,
        method: 'GET',
        contentType: false
    });
    const cclQuotesList = (await cclRequest.then(result => { return result })).sort((a, b) => parseDate(a[0]) - parseDate(b[0])).slice(1);

    let subperiodList = {};
    for (const investment of orderedInvestments) {
        const { ticker, operation, shares, cost_per_share, date } = investment;

        if (operation != 'Buy' && operation != 'Sell') continue;

        const cclQuote = getClosestQuote(date, cclQuotesList)[1];
        const sharesOperated = parseFloat(shares);
        const costPerShare = parseFloat(cost_per_share) / cclQuote;

        // creates the ticker's subperiod tracker if it doesn't exist
        if (!subperiodList[ticker]) {
            subperiodList[ticker] = {
                subperiods: [],
                currVN: 0,
                prevVN: 0,
                count: 0,
                capital: 0
            }
        }

        const tickerData = subperiodList[ticker];
        const factor = operation === 'Sell' ? -1 : 1

        const startValue = costPerShare * tickerData.prevVN;
        const cashflow = sharesOperated * costPerShare * factor;
        tickerData.capital = startValue;

        tickerData.subperiods.push({
            startValue,
            endValue: 0,
            cashflow: cashflow,
        });

        // calculates previous endValue using current startValue
        if (tickerData.count > 0) {
            tickerData.subperiods[tickerData.count - 1].endValue = startValue;
        }
        tickerData.count += 1;

        // if vn is suddenly 0, it means the investment was closed, so reset the ticker
        tickerData.currVN += (sharesOperated * factor);
        if (tickerData.currVN === 0)
            delete subperiodList[ticker];
        else
            tickerData.prevVN = tickerData.currVN;
    }

    const getInvestmentTWR = (ticker) => {
        const tickerData = subperiodList[ticker];
        if (!tickerData) return 0;

        let twr = 1;
        for (const subperiod of tickerData.subperiods) {
            const { startValue, endValue, cashflow } = subperiod;
            const ponderatedCashflow = startValue + cashflow;

            let subperiodReturn = ponderatedCashflow === 0 ? 0 : (endValue - ponderatedCashflow) / ponderatedCashflow;

            if (subperiodReturn == -1) continue; // @temp, will not be needed when we have the current stock value

            twr *= (1 + subperiodReturn)
        }
        return twr - 1;
    }

    let portfolioValue = 0;
    for (const ticker in subperiodList) {
        const tickerData = subperiodList[ticker];
        if (!tickerData) continue;
        portfolioValue += tickerData.capital;
    }

    let porfolioReturns = 0;
    for (const ticker in subperiodList) {
        const tickerData = subperiodList[ticker];
        if (!tickerData) continue;

        const investmentWeight = tickerData.capital / portfolioValue;
        const investmentTWR = getInvestmentTWR(ticker);
        porfolioReturns += (investmentTWR * investmentWeight);
    }
    console.log(`Total porfolio returns: %${(porfolioReturns * 100).toFixed(2)}`);
}