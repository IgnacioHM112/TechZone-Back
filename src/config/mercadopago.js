require('dotenv').config();
const { MercadoPagoConfig, Preference } = require('mercadopago');

const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
    console.error('❌ CRÍTICO: MP_ACCESS_TOKEN no definido en el .env');
} else {
    const isTestToken = accessToken.startsWith('TEST-');
    console.log(`ℹ️ Mercado Pago: Configurado en modo ${isTestToken ? 'PRUEBAS (Sandbox)' : 'PRODUCCIÓN'}`);
    if (!isTestToken) {
        console.warn('⚠️ AVISO: Estás usando credenciales de PRODUCCIÓN. Las tarjetas de prueba NO funcionarán.');
    }
}

const client = new MercadoPagoConfig({ 
    accessToken: accessToken 
});

const preference = new Preference(client);

module.exports = { preference };
