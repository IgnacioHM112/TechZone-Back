const Product = require('../models/product');
const Category = require('../models/category');
const { Op } = require('sequelize');

const externalController = {
    getStockCheck: async (req, res) => {
        try {
            const { q } = req.query; 
            
            const whereClause = { active: true };
            
            // Si hay búsqueda, filtramos por nombre de producto o nombre de categoría
            if (q) {
                whereClause[Op.or] = [
                    { name: { [Op.like]: `%${q}%` } },
                    { '$category.name$': { [Op.like]: `%${q}%` } }
                ];
            }

            const products = await Product.findAll({
                where: whereClause,
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['name']
                }]
            });

            // Transformación: Extraer 'marca' (primera palabra del nombre)
            const result = products.map(p => {
                const nameParts = p.name.trim().split(' ');
                return {
                    nombre: p.name,
                    marca: nameParts[0] || 'Genérica',
                    precio: parseFloat(p.price),
                    stock: p.stock,
                    categoria: p.category ? p.category.name : 'Gral'
                };
            });

            res.json({
                success: true,
                count: result.length,
                data: result
            });

        } catch (error) {
            console.error('❌ Error en getStockCheck:', error);
            res.status(500).json({
                success: false,
                mensaje: "Error interno al consultar el stock.",
                error: error.message
            });
        }
    }
};

module.exports = externalController;
