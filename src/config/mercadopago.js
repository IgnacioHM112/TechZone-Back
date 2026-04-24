const { MercadoPagoConfig } = require('mercadopago');

// No hace falta el require(dotenv) acá si ya lo pusiste en app.js, 
// pero dejarlo no hace daño.

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

module.exports = client;