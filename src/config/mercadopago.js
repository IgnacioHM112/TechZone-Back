require('dotenv').config();
const { MercadoPagoConfig, Preference } = require('mercadopago');

if (!process.env.MP_ACCESS_TOKEN) {
    console.error('❌ CRÍTICO: MP_ACCESS_TOKEN no definido en el .env');
}

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

const preference = new Preference(client);

module.exports = { preference };
