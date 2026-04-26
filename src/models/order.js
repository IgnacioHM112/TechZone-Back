const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending'
    },
    payment_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    preference_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pdf_data: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    }
}, {
    tableName: 'ordenes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Order;
