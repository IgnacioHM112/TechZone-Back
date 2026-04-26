const Category = require('../models/category');

const categoryController = {
    // GET ALL - Público con paginación
    getAll: async (req, res) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);
            const limitItems = parseInt(limit);

            const { count, rows } = await Category.findAndCountAll({
                limit: limitItems,
                offset: offset,
                order: [['name', 'ASC']]
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
            res.status(500).json({ mensaje: "Error al obtener categorías", error: error.message });
        }
    },

    // GET ONE - Público
    getOne: async (req, res) => {
        try {
            const category = await Category.findByPk(req.params.id);
            if (!category) return res.status(404).json({ mensaje: "Categoría no encontrada" });
            res.json(category);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener la categoría", error: error.message });
        }
    },

    // CREATE - Solo Admin
    create: async (req, res) => {
        try {
            const { name, description } = req.body;
            const newCategory = await Category.create({ name, description });
            res.status(201).json(newCategory);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al crear categoría", error: error.message });
        }
    },

    // UPDATE - Solo Admin
    update: async (req, res) => {
        try {
            const { name, description } = req.body;
            const category = await Category.findByPk(req.params.id);
            if (!category) return res.status(404).json({ mensaje: "Categoría no encontrada" });
            
            await category.update({ name, description });
            res.json({ mensaje: "Categoría actualizada con éxito", category });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al actualizar categoría", error: error.message });
        }
    },

    // DELETE - Solo Admin
    delete: async (req, res) => {
        try {
            const category = await Category.findByPk(req.params.id);
            if (!category) return res.status(404).json({ mensaje: "Categoría no encontrada" });
            
            await category.destroy();
            res.json({ mensaje: "Categoría eliminada con éxito" });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al eliminar categoría", error: error.message });
        }
    }
};

module.exports = categoryController;
