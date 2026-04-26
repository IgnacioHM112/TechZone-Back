const Role = require('../models/role');
const User = require('../models/user');
const Category = require('../models/category');
const Product = require('../models/product');
const bcrypt = require('bcryptjs');

const runSeeders = async () => {
    await Role.bulkCreate([
        { name: 'admin', description: 'Administrador con acceso total' },
        { name: 'usuario', description: 'Usuario regular con acceso limitado' }
    ], { ignoreDuplicates: true });

    const adminEmail = 'admin@gmail.com';
    const adminExists = await User.findOne({ where: { email: adminEmail } });
    if (!adminExists) {
        const adminRole = await Role.findOne({ where: { name: 'admin' } });
        const hashedPassword = await bcrypt.hash('Admin1234', 10);
        await User.create({
            name: 'admin',
            email: adminEmail,
            password: hashedPassword,
            rol_id: adminRole.id
        });
    }

    const categoriesData = [
        { name: 'Procesadores (CPU)', description: 'Componentes encargados de ejecutar las instrucciones del sistema.' },
        { name: 'Placas de Video (GPU)', description: 'Hardware dedicado al procesamiento gráfico.' },
        { name: 'Memoria RAM', description: 'Módulos de memoria para ejecución de aplicaciones.' },
        { name: 'Almacenamiento', description: 'Dispositivos como SSD y HDD para guardar datos.' },
        { name: 'Motherboards', description: 'Placas base que conectan todos los componentes.' },
        { name: 'Fuentes de Alimentación', description: 'Suministro de energía eléctrica estable.' },
        { name: 'Gabinetes', description: 'Estructuras físicas que alojan los componentes.' },
        { name: 'Refrigeración', description: 'Sistemas de enfriamiento para temperaturas óptimas.' },
        { name: 'Periféricos', description: 'Teclados, mouse, auriculares y monitores.' },
        { name: 'Accesorios y Componentes', description: 'Cables, adaptadores y elementos complementarios.' }
    ];
    await Category.bulkCreate(categoriesData, { ignoreDuplicates: true });
    
    const dbCategories = await Category.findAll();
    const catMap = {};
    dbCategories.forEach(c => catMap[c.name] = c.id);

    // Imágenes estables de Unsplash (CDNs optimizados para web)
    const img = {
        cpu: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1000&auto=format&fit=crop',
        gpu: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=1000&auto=format&fit=crop',
        ram: 'https://images.unsplash.com/photo-1562976540-1502c2145186?q=80&w=1000&auto=format&fit=crop',
        disk: 'https://images.unsplash.com/photo-1597852074816-d933c4d2b988?q=80&w=1000&auto=format&fit=crop',
        mobo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop',
        psu: 'https://images.unsplash.com/photo-1624701928517-44c8ac49d93c?q=80&w=1000&auto=format&fit=crop',
        case: 'https://images.unsplash.com/photo-1555617766-c94804975da3?q=80&w=1000&auto=format&fit=crop',
        cool: 'https://images.unsplash.com/photo-1614935151651-0bea6508db6b?q=80&w=1000&auto=format&fit=crop',
        peri: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1000&auto=format&fit=crop',
        acc: 'https://images.unsplash.com/photo-1542491595-3075c49de2c3?q=80&w=1000&auto=format&fit=crop'
    };

    const productsData = [
        // CPUs
        { name: 'Intel Core i9-13900K', description: '24 núcleos, hasta 5.8 GHz.', price: 650000, stock: 10, category_id: catMap['Procesadores (CPU)'], image_url: img.cpu },
        { name: 'AMD Ryzen 7 7800X3D', description: 'Tecnología 3D V-Cache.', price: 520000, stock: 15, category_id: catMap['Procesadores (CPU)'], image_url: img.cpu },
        { name: 'Intel Core i5-13400F', description: 'Gama media alta.', price: 280000, stock: 25, category_id: catMap['Procesadores (CPU)'], image_url: img.cpu },
        { name: 'AMD Ryzen 5 5600G', description: 'Gráficos Radeon integrados.', price: 180000, stock: 40, category_id: catMap['Procesadores (CPU)'], image_url: img.cpu },
        { name: 'Intel Core i7-12700K', description: 'Rendimiento híbrido.', price: 420000, stock: 12, category_id: catMap['Procesadores (CPU)'], image_url: img.cpu },

        // GPUs
        { name: 'NVIDIA RTX 4090', description: 'Pura potencia 24GB VRAM.', price: 2800000, stock: 5, category_id: catMap['Placas de Video (GPU)'], image_url: img.gpu },
        { name: 'NVIDIA RTX 4070 Ti', description: 'Gaming 1440p ultra.', price: 1100000, stock: 8, category_id: catMap['Placas de Video (GPU)'], image_url: img.gpu },
        { name: 'AMD RX 7900 XTX', description: 'RDNA 3 arquitectura.', price: 1400000, stock: 6, category_id: catMap['Placas de Video (GPU)'], image_url: img.gpu },
        { name: 'NVIDIA RTX 3060', description: 'Clásico de gama media.', price: 450000, stock: 30, category_id: catMap['Placas de Video (GPU)'], image_url: img.gpu },
        { name: 'AMD RX 6600 XT', description: '1080p competitivo.', price: 380000, stock: 20, category_id: catMap['Placas de Video (GPU)'], image_url: img.gpu },

        // RAM
        { name: 'Corsair DDR5 32GB', description: '6000MHz CL36.', price: 180000, stock: 50, category_id: catMap['Memoria RAM'], image_url: img.ram },
        { name: 'Kingston 16GB', description: 'DDR4 3200MHz.', price: 65000, stock: 100, category_id: catMap['Memoria RAM'], image_url: img.ram },
        { name: 'G.Skill RGB 32GB', description: 'DDR5 6400MHz.', price: 210000, stock: 15, category_id: catMap['Memoria RAM'], image_url: img.ram },
        { name: 'Patriot Viper 8GB', description: 'DDR4 3200MHz.', price: 35000, stock: 150, category_id: catMap['Memoria RAM'], image_url: img.ram },
        { name: 'TeamGroup 16GB', description: 'DDR4 3600MHz.', price: 78000, stock: 40, category_id: catMap['Memoria RAM'], image_url: img.ram },

        // Almacenamiento
        { name: 'Samsung 980 1TB', description: 'NVMe M.2 PCIe 4.0.', price: 145000, stock: 45, category_id: catMap['Almacenamiento'], image_url: img.disk },
        { name: 'Crucial P3 2TB', description: 'PCIe 3.0 NVMe.', price: 190000, stock: 20, category_id: catMap['Almacenamiento'], image_url: img.disk },
        { name: 'WD Blue 1TB HDD', description: 'Mecánico confiable.', price: 60000, stock: 80, category_id: catMap['Almacenamiento'], image_url: img.disk },
        { name: 'Kingston A400', description: 'SATA III SSD.', price: 42000, stock: 200, category_id: catMap['Almacenamiento'], image_url: img.disk },
        { name: 'Seagate 2TB', description: 'Barracuda 7200RPM.', price: 85000, stock: 60, category_id: catMap['Almacenamiento'], image_url: img.disk },

        // Motherboards
        { name: 'ASUS Z790 ROG', description: 'LGA1700 gama alta.', price: 850000, stock: 5, category_id: catMap['Motherboards'], image_url: img.mobo },
        { name: 'MSI B550M WiFi', description: 'Económica AM4.', price: 155000, stock: 35, category_id: catMap['Motherboards'], image_url: img.mobo },
        { name: 'Gigabyte X670', description: 'AM5 para Ryzen 7000.', price: 420000, stock: 12, category_id: catMap['Motherboards'], image_url: img.mobo },
        { name: 'ASRock H610M', description: 'Básico Intel.', price: 95000, stock: 50, category_id: catMap['Motherboards'], image_url: img.mobo },
        { name: 'ASUS B760-Plus', description: 'TUF Gaming series.', price: 280000, stock: 18, category_id: catMap['Motherboards'], image_url: img.mobo },

        // Fuentes
        { name: 'EVGA 750W', description: '80 Plus White.', price: 85000, stock: 30, category_id: catMap['Fuentes de Alimentación'], image_url: img.psu },
        { name: 'Corsair RM850x', description: '80 Plus Gold Modular.', price: 220000, stock: 20, category_id: catMap['Fuentes de Alimentación'], image_url: img.psu },
        { name: 'Cooler Master 650W', description: 'Bronze semi-modular.', price: 110000, stock: 45, category_id: catMap['Fuentes de Alimentación'], image_url: img.psu },
        { name: 'Seasonic 1000W', description: 'Focus GX Fully Modular.', price: 350000, stock: 10, category_id: catMap['Fuentes de Alimentación'], image_url: img.psu },
        { name: 'Redragon 600W', description: 'RPGS Bronze.', price: 75000, stock: 60, category_id: catMap['Fuentes de Alimentación'], image_url: img.psu },

        // Gabinetes
        { name: 'NZXT H5 Flow', description: 'Diseño minimalista.', price: 160000, stock: 15, category_id: catMap['Gabinetes'], image_url: img.case },
        { name: 'Corsair 4000D', description: 'Airflow optimizado.', price: 145000, stock: 20, category_id: catMap['Gabinetes'], image_url: img.case },
        { name: 'TD500 Mesh', description: 'ARGB incluido.', price: 180000, stock: 12, category_id: catMap['Gabinetes'], image_url: img.case },
        { name: 'Redragon Kumara', description: 'Mid tower sólido.', price: 95000, stock: 25, category_id: catMap['Gabinetes'], image_url: img.case },
        { name: 'Lian Li O11', description: 'Dual chamber design.', price: 320000, stock: 8, category_id: catMap['Gabinetes'], image_url: img.case },

        // Refrigeración
        { name: 'Hyper 212', description: 'Air cooler clásico.', price: 55000, stock: 50, category_id: catMap['Refrigeración'], image_url: img.cool },
        { name: 'iCUE H150i', description: 'AIO 360mm RGB.', price: 450000, stock: 10, category_id: catMap['Refrigeración'], image_url: img.cool },
        { name: 'Noctua NH-D15', description: 'Silencio absoluto.', price: 180000, stock: 15, category_id: catMap['Refrigeración'], image_url: img.cool },
        { name: 'DeepCool AK620', description: 'Performance superior.', price: 95000, stock: 30, category_id: catMap['Refrigeración'], image_url: img.cool },
        { name: 'Liquid Freezer II', description: '240mm AIO.', price: 165000, stock: 20, category_id: catMap['Refrigeración'], image_url: img.cool },

        // Periféricos
        { name: 'G Pro X Superlight', description: 'Ultra liviano gaming.', price: 185000, stock: 30, category_id: catMap['Periféricos'], image_url: img.peri },
        { name: 'Razer BlackWidow', description: 'Mecánico clicky.', price: 290000, stock: 15, category_id: catMap['Periféricos'], image_url: img.peri },
        { name: 'Monitor LG 27"', description: '144Hz IPS 1ms.', price: 350000, stock: 20, category_id: catMap['Periféricos'], image_url: img.peri },
        { name: 'HyperX Cloud II', description: 'Sonido surround.', price: 160000, stock: 40, category_id: catMap['Periféricos'], image_url: img.peri },
        { name: 'Mousepad QcK XXL', description: 'Control de tela.', price: 35000, stock: 100, category_id: catMap['Periféricos'], image_url: img.peri },

        // Accesorios
        { name: 'Cable HDMI 2.1', description: '4K ultra speed.', price: 15000, stock: 200, category_id: catMap['Accesorios y Componentes'], image_url: img.acc },
        { name: 'Arctic MX-6', description: 'Pasta térmica alta.', price: 12000, stock: 300, category_id: catMap['Accesorios y Componentes'], image_url: img.acc },
        { name: 'Vertical GPU Mount', description: 'Soporte estético.', price: 45000, stock: 50, category_id: catMap['Accesorios y Componentes'], image_url: img.acc },
        { name: 'Cable Extensions', description: 'Kit mallado blanco.', price: 38000, stock: 40, category_id: catMap['Accesorios y Componentes'], image_url: img.acc },
        { name: 'Bluetooth Adapter', description: 'USB 5.0.', price: 8000, stock: 500, category_id: catMap['Accesorios y Componentes'], image_url: img.acc }
    ];

    for (const prod of productsData) {
        await Product.findOrCreate({
            where: { name: prod.name },
            defaults: prod
        });
    }

    console.log('✅ Semilla de 50 productos con imágenes estables completada.');
};

module.exports = runSeeders;
