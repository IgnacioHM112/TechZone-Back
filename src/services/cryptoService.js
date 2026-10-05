const https = require('https');

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';

let cachedRate = null;
let lastFetch = 0;
const CACHE_TTL = 60000;

const getBTCPrice = () => {
    return new Promise((resolve, reject) => {
        if (cachedRate && Date.now() - lastFetch < CACHE_TTL) {
            return resolve(cachedRate);
        }

        https.get(COINGECKO_API, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const rate = json.bitcoin?.usd;
                    if (!rate) throw new Error('No se pudo obtener el precio de BTC');
                    cachedRate = rate;
                    lastFetch = Date.now();
                    resolve(rate);
                } catch (err) {
                    if (cachedRate) {
                        resolve(cachedRate);
                    } else {
                        reject(new Error('Error al obtener precio de BTC: ' + err.message));
                    }
                }
            });
        }).on('error', (err) => {
            if (cachedRate) {
                resolve(cachedRate);
            } else {
                reject(new Error('Error de red al obtener precio de BTC: ' + err.message));
            }
        });
    });
};

module.exports = { getBTCPrice };
