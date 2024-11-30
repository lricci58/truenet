import * as async from './modules/async.js';
import documentChecker from './modules/document-checker.js';
import * as loadingScreen from './modules/loading-screen.js';

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('web-title').innerHTML = 'Investment';

    const fetchList = {}

    fetchList.investments = async.get({
        url: '/php/get/investments.php',
        method: 'POST'
    });

    fetchList.currentValues = getcurrentValues();

    // waits for document to load base promises
    documentChecker.isReady().then((loadedSuccessfully) => {
        if (!loadedSuccessfully) return;

        async.waitForAll(fetchList).then((result) => {
            loadInvestments(result['investments']);
            calculateTWR(result['investments'].reverse(), result['currentValues']);

            loadingScreen.hide();
        });
    });
});

function getcurrentValues() {
    const fetchToken = () => {
        return async.get({
            url: '/php/proxy.php',
            method: 'POST',
        }).then(response => {
            if (!response.access_token) {
                throw new Error('Failed to fetch token');
            }
            return response.access_token;
        });
    }

    return fetchToken().then((token) => {
        const fetchList = {}

        fetchList.cedears = async.get({
            url: `https://api.invertironline.com/api/Cotizaciones/acciones/CEDEARs/argentina`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        fetchList.acciones = async.get({
            url: `https://api.invertironline.com/api/Cotizaciones/acciones/Merval Argentina/argentina`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        return async.waitForAll(fetchList).then((result) => {
            const jointList = [...result.cedears.titulos, ...result.acciones.titulos];
            const tickerMappedList = {};
            jointList.forEach(item => {
                const ticker = item.simbolo;
                tickerMappedList[ticker] = parseFloat(item.ultimoPrecio);
            });
            return tickerMappedList;
        });
    });
}

function loadInvestments(investments) {
    // @TODO: load to UI
    // console.log(investments);
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

async function calculateTWR(orderedInvestments, currentValues) {
    const firstInvestmentDate = orderedInvestments[0]['date'];
    const lastInvestmentDate = new Date().toISOString().split('T')[0];
    const cclRequest = async.get({
        url: `https://mercados.ambito.com//dolarrava/cl/grafico/${firstInvestmentDate}/${lastInvestmentDate}`,
        method: 'GET',
        contentType: false
    });
    const cclQuotesList = (await cclRequest.then(result => { return result })).slice(1);

    const subperiodList = {};
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
                count: 0
            }
        }

        const tickerData = subperiodList[ticker];
        const factor = operation === 'Sell' ? -1 : 1

        const startValue = costPerShare * tickerData.prevVN;
        const cashflow = sharesOperated * costPerShare * factor;

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

            const subperiodReturn = ponderatedCashflow === 0 ? 0 : (endValue - ponderatedCashflow) / ponderatedCashflow;

            twr *= (1 + subperiodReturn)
        }
        return twr - 1;
    }

    const cclQuote = getClosestQuote(lastInvestmentDate, cclQuotesList)[1];

    let portfolioValue = 0;
    for (const ticker in subperiodList) {
        const tickerData = subperiodList[ticker];
        if (!tickerData) continue;
        const lastSubperiod = tickerData.subperiods.slice(-1)[0];
        const costPerShare = currentValues[ticker] / cclQuote;
        lastSubperiod.endValue = costPerShare * tickerData.currVN;
        portfolioValue += lastSubperiod.endValue;
    }

    let porfolioReturns = 0;
    for (const ticker in subperiodList) {
        const tickerData = subperiodList[ticker];
        if (!tickerData) continue;

        const costPerShare = currentValues[ticker] / cclQuote;
        const investmentWeight = costPerShare / portfolioValue;
        const investmentTWR = getInvestmentTWR(ticker);
        porfolioReturns += (investmentTWR * investmentWeight);

        // @TODO: load each twr for each ticker
        console.log(`${ticker}: %${(investmentTWR * 100).toFixed(2)}`)
    }

    // @TODO: load total twr for the portfolio
    console.log(`Total porfolio returns: %${(porfolioReturns * 100).toFixed(2)}`);
}