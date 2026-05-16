const Product = require('../models/product');
const Category = require('../models/category');
const { cloudinary } = require('../config/cloudinary');
const { Op } = require('sequelize');

const productController = {
    // GET ALL - Público con filtros y paginación
    getAll: async (req, res) => {
        try {
            const { name, category_id, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
            
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitItems = parseInt(limit);

            let where = {};

            // Filtro de stock y active para usuarios normales (públicos o no admin)
            const isAdmin = req.user && req.user.role === 'admin';
            if (!isAdmin) {
                // Solo mostramos productos con stock y que estén activos
                // Usamos [Op.or] para ser más flexibles si active es NULL pero queremos que se vea (aunque por defecto es true)
                where.stock = { [Op.gt]: 0 };
                where.active = { [Op.not]: false }; // Esto incluye true y NULL si lo hubiera
            }

            if (name) where.name = { [Op.like]: `%${name}%` };
            if (category_id) where.category_id = category_id;
            if (minPrice || maxPrice) {
                where.price = {};
                if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
                if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
            }

            let order = [['created_at', 'DESC']];
            if (sort === 'price_asc') order = [['price', 'ASC']];
            if (sort === 'price_desc') order = [['price', 'DESC']];

            console.log(`🔍 Buscando productos con filtros:`, JSON.stringify(where));

            const { count, rows } = await Product.findAndCountAll({
                where,
                order,
                limit: limitItems,
                offset: offset,
                include: [{ model: Category, as: 'category', attributes: ['name'] }]
            });
            
            res.json({
                data: rows,
                meta: {
                    totalItems: count,
                    totalPages: Math.ceil(count / limitItems),
                    currentPage: parseInt(page),
                    itemsPerPage: limitItems
                }
            });
        } catch (error) {
            console.error('❌ Error en getAll productos:', error);
            res.status(500).json({ mensaje: "Error al obtener productos", error: error.message });
        }
    },

    // GET ONE
    getOne: async (req, res) => {
        try {
            const product = await Product.findByPk(req.params.id, {
                include: [{ model: Category, as: 'category', attributes: ['name'] }]
            });
            if (!product) return res.status(404).json({ mensaje: "Producto no encontrado" });
            res.json(product);
        } catch (error) {
            console.error('❌ Error en getOne producto:', error);
            res.status(500).json({ mensaje: "Error al obtener el producto", error: error.message });
        }
    },

    // CREATE - Solo Admin
    create: async (req, res) => {
        try {
            const { name, description, price, stock, category_id, active } = req.body;
            
            const category = await Category.findByPk(category_id);
            if (!category) return res.status(400).json({ mensaje: "Categoría no válida" });

            let image_url = null;
            let image_public_id = null;

            if (req.file) {
                image_url = req.file.path;
                image_public_id = req.file.filename;
            }

            const newProduct = await Product.create({
                name, description, price, stock, category_id, 
                image_url, image_public_id, active: active !== undefined ? active : true
            });
            
            console.log(`✅ Producto creado: ${name}`);
            res.status(201).json(newProduct);
        } catch (error) {
            console.error('❌ Error en create producto:', error);
            res.status(500).json({ mensaje: "Error al crear producto", error: error.message });
        }
    },

    // UPDATE - Solo Admin
    update: async (req, res) => {
        try {
            const product = await Product.findByPk(req.params.id);
            if (!product) return res.status(404).json({ mensaje: "Producto no encontrado" });
            
            let updateData = { ...req.body };

            if (req.file) {
                if (product.image_public_id) {
                    await cloudinary.uploader.destroy(product.image_public_id);
                }
                updateData.image_url = req.file.path;
                updateData.image_public_id = req.file.filename;
            }

            await product.update(updateData);
            console.log(`✅ Producto actualizado: ${product.name}`);
            res.json({ mensaje: "Producto actualizado con éxito", product });
        } catch (error) {
            console.error('❌ Error en update producto:', error);
            res.status(500).json({ mensaje: "Error al actualizar producto", error: error.message });
        }
    },

    // DELETE - Solo Admin
    delete: async (req, res) => {
        try {
            const product = await Product.findByPk(req.params.id);
            if (!product) return res.status(404).json({ mensaje: "Producto no encontrado" });
            
            if (product.image_public_id) {
                await cloudinary.uploader.destroy(product.image_public_id);
            }

            await product.destroy();
            console.log(`✅ Producto eliminado ID: ${req.params.id}`);
            res.json({ mensaje: "Producto eliminado con éxito" });
        } catch (error) {
            console.error('❌ Error en delete producto:', error);
            res.status(500).json({ mensaje: "Error al eliminar producto", error: error.message });
        }
    }
};

module.exports = productController;
