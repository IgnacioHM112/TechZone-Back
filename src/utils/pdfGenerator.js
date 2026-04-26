const PDFDocument = require('pdfkit');

const generateOrderPDF = async (order) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                margin: 50,
                size: 'A4'
            });
            let buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            doc.on('error', (err) => reject(err));

            // --- COLORES Y ESTILOS ---
            const primaryColor = '#1a237e'; // Azul Tech
            const secondaryColor = '#455a64'; // Gris Azulado
            const accentColor = '#f5f5f5'; // Gris claro para fondo
            const textColor = '#212121';

            // --- CABECERA ---
            // Rectángulo decorativo superior
            doc.rect(0, 0, 600, 100).fill(primaryColor);
            
            doc.fillColor('#ffffff')
               .fontSize(30)
               .font('Helvetica-Bold')
               .text('TECHZONE', 50, 35);
            
            doc.fontSize(10)
               .font('Helvetica')
               .text('Tu tienda de hardware de confianza', 50, 70);

            doc.fontSize(18)
               .text('COMPROBANTE DE COMPRA', 300, 45, { align: 'right' });

            // Volver al color de texto normal
            doc.fillColor(textColor).moveDown(4);

            // --- INFORMACIÓN DE LA ORDEN ---
            const startY = 130;
            doc.font('Helvetica-Bold').fontSize(12).text('Detalles del Pedido', 50, startY);
            doc.font('Helvetica').fontSize(10);
            
            doc.text(`Orden ID: #${order.id}`, 50, startY + 20);
            const fecha = order.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString();
            doc.text(`Fecha de Emisión: ${fecha}`, 50, startY + 35);
            doc.text(`Estado: PAGADO (Mercado Pago)`, 50, startY + 50);

            // Información del Cliente (Derecha)
            doc.font('Helvetica-Bold').text('Información del Cliente', 350, startY);
            doc.font('Helvetica');
            doc.text(`Nombre: ${order.user ? order.user.name : 'N/A'}`, 350, startY + 20);
            doc.text(`Email: ${order.user ? order.user.email : 'N/A'}`, 350, startY + 35);

            doc.moveDown(4);

            // --- TABLA DE PRODUCTOS ---
            const tableTop = 230;
            const itemX = 50;
            const qtyX = 300;
            const priceX = 380;
            const totalX = 480;

            // Encabezado de Tabla
            doc.rect(50, tableTop, 500, 20).fill(secondaryColor);
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
            doc.text('PRODUCTO', itemX + 5, tableTop + 5);
            doc.text('CANT.', qtyX, tableTop + 5);
            doc.text('PRECIO U.', priceX, tableTop + 5);
            doc.text('SUBTOTAL', totalX, tableTop + 5);

            let currentY = tableTop + 25;
            doc.fillColor(textColor).font('Helvetica');

            if (order.items && order.items.length > 0) {
                order.items.forEach((item, index) => {
                    // Fondo alternado para filas
                    if (index % 2 === 0) {
                        doc.rect(50, currentY - 2, 500, 15).fill(accentColor);
                    }
                    
                    doc.fillColor(textColor);
                    const prodNombre = item.product ? item.product.name : 'Producto no identificado';
                    const subtotal = (item.quantity * item.price).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
                    const unitPrice = parseFloat(item.price).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

                    doc.text(prodNombre.substring(0, 45), itemX + 5, currentY);
                    doc.text(item.quantity.toString(), qtyX, currentY);
                    doc.text(unitPrice, priceX, currentY);
                    doc.text(subtotal, totalX, currentY);

                    currentY += 20;
                });
            } else {
                doc.text('No hay productos registrados.', itemX + 5, currentY);
            }

            // --- TOTAL FINAL ---
            const totalY = currentY + 30;
            doc.rect(350, totalY - 10, 200, 40).fill(primaryColor);
            doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold');
            
            const totalFinal = (parseFloat(order.total) || 0).toLocaleString('es-AR', { 
                style: 'currency', 
                currency: 'ARS' 
            });
            doc.text(`TOTAL: ${totalFinal}`, 360, totalY + 5, { align: 'left' });

            // --- PIE DE PÁGINA ---
            const footerY = 750;
            doc.fillColor(secondaryColor).fontSize(10).font('Helvetica-Oblique');
            doc.text('Gracias por confiar en TechZone para potenciar tu setup.', 0, footerY, { align: 'center' });
            doc.fontSize(8).text('Este documento sirve como comprobante legal de pago.', 0, footerY + 15, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateOrderPDF };
