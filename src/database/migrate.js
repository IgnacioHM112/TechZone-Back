const sequelize = require('../config/database');
const Role = require('../models/role');
const User = require('../models/user'); // Importar para que se cree la tabla

async function migrate() {
    try {
        console.log('🔄 Sincronizando modelos con la base de datos...');
        
        // Sincroniza todos los modelos (crea las tablas si no existen)
        // { alter: true } intenta actualizar las tablas existentes
        // { force: true } borra y recrea todo
        await sequelize.sync({ force: false, alter: true });
        console.log('✅ Tablas sincronizadas.');

        // Crear roles iniciales
        console.log('🌱 Sembrando roles...');
        await Role.bulkCreate([
            { name: 'admin', description: 'Administrador con acceso total' },
            { name: 'usuario', description: 'Usuario regular con acceso limitado' }
        ], { ignoreDuplicates: true });
        
        console.log('✅ Roles creados exitosamente.');
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        await sequelize.close();
    }
}

migrate();
