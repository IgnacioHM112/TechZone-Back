const fs = require('fs');
const path = require('path');
require('dotenv').config();
const sequelize = require('../config/database');
const Product = require('../models/product');
const { cloudinary } = require('../config/cloudinary');

const updateImages = async () => {
    try {
        await sequelize.authenticate();
        const products = await Product.findAll();
        const imagesPath = path.join(__dirname, '../../assets/Productos');
        const files = fs.readdirSync(imagesPath);

        const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Mapeo manual para los casos difíciles
        const manualMap = {
            'Intel Core i9-13900K': 'intel-i9-13900k.webp',
            'Intel Core i5-13400F': 'intel-i5-13400f.webp',
            'Intel Core i7-12700K': 'intel-i7-12700k.webp',
            'G.Skill RGB 32GB': 'gskill-32-gb.webp',
            'WD Blue 1TB HDD': 'wd-1tb.webp',
            'TD500 Mesh': 'malla-td500.webp',
            'Lian Li O11': 'lian-li-011.webp',
            'Hyper 212': 'hiper-212.webp',
            'Liquid Freezer II': 'congelador-liquido.webp',
            'G Pro X Superlight': 'gpro-superlight.webp',
            'HyperX Cloud II': 'hiperx-cloud.webp',
            'Mousepad QcK XXL': 'alfombrilla-raton.webp',
            'Arctic MX-6': 'artic-mx6.webp',
            'Vertical GPU Mount': 'montaje-vertical-gpu.webp',
            'Cable Extensions': 'extensiones-de-cables.webp',
            'Bluetooth Adapter': 'adaptador-bt.webp'
        };

        let actualizados = 0;

        for (const product of products) {
            let fileName = manualMap[product.name];

            if (!fileName) {
                const productNameNormalized = normalize(product.name);
                fileName = files.find(file => {
                    const fileNameNormalized = normalize(file.split('.')[0]);
                    return productNameNormalized.includes(fileNameNormalized) || fileNameNormalized.includes(productNameNormalized);
                });
            }

            if (fileName) {
                const filePath = path.join(imagesPath, fileName);
                console.log(`🚀 Procesando: "${product.name}" -> ${fileName}`);

                try {
                    const result = await cloudinary.uploader.upload(filePath, {
                        folder: 'techzone',
                        use_filename: true,
                        unique_filename: false
                    });

                    await product.update({
                        image_url: result.secure_url,
                        image_public_id: result.public_id
                    });
                    actualizados++;
                } catch (e) {
                    console.error(`❌ Error en "${product.name}":`, e.message);
                }
            } else {
                console.warn(`⚠️ No se encontró imagen para: "${product.name}"`);
            }
        }

        console.log(`\n✅ Proceso completado. Total actualizados: ${actualizados}/50`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
        process.exit();
    }
};

updateImages();
