const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const Cart = sequelize.define('Cart', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }
}, {
    tableName: 'carritos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Relación: Un usuario tiene un carrito
User.hasOne(Cart, { foreignKey: 'user_id', as: 'cart' });
Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Cart;
