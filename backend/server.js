const express = require('express');//Quiero utilizar express que instalamos antes
const cors=require("cors")
const pool= require('./db');
const app = express();//Aqui creamos la aplicacion usando express

app.use(cors())
app.use(express.json());
    
app.get('/',(req,res) => {
    res.send('Hola, mi servidor funciona');
});
//Obtener todos los productos
app.get('/productos', async (req, res) => {
    try{
        const { nombre, categoria} = req.query;
        let resultado;

        //Busca por nombre y categoria
        if(nombre && categoria){
            resultado = await pool.query(
                `SELECT 
                p.id, 
                p.nombre,
                p.precio,
                p.cantidad,
                p.categoria_id,
                c.nombre AS nombre_categoria,
                p.proveedor_id,
                pr.nombre AS nombre_proveedor,
                p.stock_minimo,
                p.almacen,
                p.tipo_refaccion
                FROM productos AS p
                INNER JOIN categorias AS c
                ON p.categoria_id = c.id
                INNER JOIN proveedores AS pr
                ON p.proveedor_id = pr.id
                WHERE p.nombre ILIKE $1
                AND p.categoria_id = $2`,
                [`%${nombre}%`, categoria]
            );
        //Busca por nombre
        }else if (nombre){
            resultado = await pool.query(
                `SELECT p.id,
                p.nombre,
                p.precio,
                p.cantidad,
                p.categoria_id,
                c.nombre AS nombre_categoria,
                p.proveedor_id,
                pr.nombre AS nombre_proveedor,
                p.stock_minimo,
                p.almacen,
                p.tipo_refaccion 
                FROM productos AS p
                INNER JOIN categorias As c
                ON p.categoria_id = c.id
                INNER JOIN proveedores AS pr
                ON p.proveedor_id = pr.id
                WHERE p.nombre ILIKE $1`,
                [`%${nombre}%`]
            );
        
        //Busca por categoria
        }else if (categoria){
            resultado = await pool.query(
                `SELECT p.id,
                p.nombre,
                p.precio,
                p.cantidad,
                p.categoria_id,
                c.nombre AS nombre_categoria,
                p.proveedor_id,
                pr.nombre AS nombre_proveedor,
                p.stock_minimo,
                p.almacen,
                p.tipo_refaccion
                FROM productos AS p
                INNER JOIN categorias As c
                ON p.categoria_id= c.id
                INNER JOIN proveedores AS pr
                ON p.proveedor_id=pr.id
                WHERE p.categoria_id= $1`,
                [categoria]
            );
       
        //Sin filtros
        } else {
            resultado = await pool.query(
                `SELECT p.id,
                p.nombre,
                p.precio,
                p.cantidad,
                p.categoria_id,
                c.nombre AS nombre_categoria,
                p.proveedor_id,
                pr.nombre AS nombre_proveedor,
                p.stock_minimo,
                p.almacen,
                p.tipo_refaccion
                FROM productos AS p
                INNER JOIN categorias As c
                ON p.categoria_id= c.id
                INNER JOIN proveedores AS pr
                ON p.proveedor_id=pr.id`
            );
        }

        res.json(resultado.rows);

    }catch (error){
        console.error('Error al obtener productos:', error);
        
        res.status(500).json({
            error:'Error al obtener productos'
        }); 
    }
});

//Obtener un producto específico
app.get('/productos/:id', async (req,res)=> {
    try{
        const resultado = await pool.query (
            `SELECT 
                p.id,
                p.nombre,
                p.precio,
                p.cantidad,
                p.categoria_id,
                c.nombre AS nombre_categoria,
                p.proveedor_id,
                pr.nombre AS nombre_proveedor,
                p.stock_minimo,
                p.almacen,
                p.tipo_refaccion
            FROM productos AS p
            INNER JOIN categorias AS c
                ON p.categoria_id = c.id
            INNER JOIN proveedores AS pr
                ON p.proveedor_id = pr.id
            WHERE p.id= $1`,
            [req.params.id]
        );

        if(resultado.rows.length ===0){
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }

        res.json(resultado.rows[0]);

    }catch (error){
        console.error('Error al obtener el producto:', error);
        res.status(500).json({
            error: 'Error al obtener producto'
        });
    }
});


//Crear un producto
app.post('/productos', async (req, res) => {
    try{
      const{ 
        nombre,
        precio,
        cantidad, 
        categoria_id, 
        proveedor_id, 
        stock_minimo,
        almacen, 
        tipo_refaccion}
        = req.body;

        //Valida que todos los campos existan 
      if (!nombre ||
         precio === undefined ||
         cantidad === undefined ||
          !categoria_id ||
          !proveedor_id ||
          stock_minimo === undefined ||
          !almacen ||
          !tipo_refaccion
        ){
        return res.status(400).json({
            error:'Todos los campos son obligatorios'
        });
      }

      // Valida que el precio sea válido
      if(precio <=0){
        return res.status(400).json({
            error:'El precio debe ser mayor que 0'
        });
      }

      //Valida que la cantidad sea válida
      if(cantidad <0){
        return res.status(400).json ({
            error:'La cantidad no puede ser negativa'
        });
      }
      const resultado = await pool.query(
            `INSERT INTO productos (
            nombre, 
            precio,
            cantidad, 
            categoria_id,
            proveedor_id,
            stock_minimo,
            almacen,
            tipo_refaccion
            )
            VALUES ($1, $2, $3, $4,$5,$6,$7,$8)
            RETURNING *`,
           [nombre,
            precio,
            cantidad,
            categoria_id,
            proveedor_id,
            stock_minimo,
            almacen,
            tipo_refaccion
            ]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error){
        console.error('Error al crear el producto:', error);

        if (error.code === '23505'){
            return res.status(400).json({
                error:'El producto ya existe'
            });
        }
       
        res.status(500).json({
            error:'Error al crear el producto',
        });
     }
});

//Actualizar un producto
app.put('/productos/:id', async (req,res) => {
    try{
        const{
            nombre,
            precio,
            cantidad,
            categoria_id,
            proveedor_id,
            stock_minimo,
            almacen,
            tipo_refaccion 
        } = req.body;

        // Valida que todos los campos existan 
        if(
            !nombre ||
            precio === undefined ||
            cantidad ===undefined ||
            !categoria_id ||
            !proveedor_id ||
            stock_minimo === undefined ||
            !almacen ||
            !tipo_refaccion
        ){
            return res.status(400).json({
                error:'Todos los campos son obligatorios'
            });
        }

        //Valida que el precio sea válido
        if (precio <=0){
            return res.status(400).json({
                error:'El precio debe ser mayor que 0'
            });
        }

        //Valida que la cantidad sea válida
        if (cantidad <0){
            return res.status(400).json({
                error:'La cantidad no puede ser negativa'
            });
        }

        const resultado= await pool.query(
            `UPDATE productos
            SET nombre= $1,
                precio= $2,
                cantidad = $3,
                categoria_id =$4,
                proveedor_id =$5,
                stock_minimo =$6,
                almacen =$7,
                tipo_refaccion =$8

            WHERE id= $9
            RETURNING * `,
            [
                nombre,
                precio,
                cantidad,
                categoria_id,
                proveedor_id,
                stock_minimo,
                almacen,
                tipo_refaccion,
                req.params.id
            ]
        );
       
  
        if (resultado.rows.length ===0)  {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }
        res.json(resultado.rows[0]);

    } catch (error){
        console.error('Error al actualizar el producto:', error);

        if(error.code === '23505'){
            return res.status(400).json({
                error: 'El producto ya existe'
            });
        }
        if (error.code === '23503'){
            return res.status(400).json({
                error:'La categoría o el proveedor no existe'
            });
        }
        
        res.status(500).json ({
            error: 'Error al actualizar producto'
        }); 
    }
});

//Eliminar producto
app.delete('/productos/:id', async (req, res) => {
    try{
        const resultado = await pool.query(
            'DELETE FROM productos WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if(resultado.rows.length ===0){
            return res.status(404).json({
                error:'Producto no encontrado'
            });
        }

        res.json({
            mensaje:'Producto eliminado correctamente',
            producto:resultado.rows[0]
        });

    }catch (error){
        console.error('Error al eliminar el producto:', error);

        res.status(500).json({
            error:'Error al eliminar el producto'
        });
    }
});

// Rutas de categorías
app.get('/categorias', async (req, res) => {
    try{
        const resultado = await pool.query(
            'SELECT * FROM categorias'
        );

        res.json(resultado.rows);

    }catch (error){
        console.error('Error al obtener categorías:', error);

        res.status(500).json({
            error:'Error al obtener categorías'
        });
    }
});

//Obtener una categoria especifica 
app.get('/categorias/:id', async(req, res) => {
    try{
        const resultado = await pool.query (
            'SELECT * FROM categorias WHERE id = $1',
            [req.params.id]
        );
        
        if(resultado.rows.length ===0){
            return res.status(404).json({
                error:'Categoría no encontrada'
        });
     }
     res.json(resultado.rows[0]);
    }catch (error){
        console.error('Error al obtener categoría:', error);
        res.status (500).json({
            error:'Error al obtener categoría'
        });
    }
});

//Crear categoria
app.post('/categorias', async (req, res) => {
    try{
        const{nombre}= req.body;
        //Valida que el campo exista
        if(!nombre){
            return res.status(400).json({
                error:'Todos los campos son obligatorios'
            });
        }
        const resultado =await pool.query(
            `INSERT INTO categorias (nombre)
            VALUES ($1) RETURNING *`,
            [nombre]
        );
        res.status(201).json(resultado.rows [0]);
    }catch(error){
        console.error('Error al crear categoría',error);

        if(error.code ==='23505'){
            return res.status(400).json({
                error:'La categoría ya existe'
            });
        }
        res.status(500).json ({
            error:'Error al crear categoría'
        });
    }
});

//Actualizar una categoría
app.put('/categorias/:id', async(req, res) => {
    try{
        const{nombre}= req.body;
        //Valida que todos los campos existan
        if(!nombre){
            return res.status(400).json({
                error:'Todos los campos son obligatorios'
            });
        }
        const resultado= await pool.query(
            `UPDATE categorias 
             SET nombre=$1 WHERE id =$2
             RETURNING *`,
            [nombre,req.params.id]
        );

        if(resultado.rows.length ===0) {
            return res.status(404).json({
                error:'Categoría no encontrada'
            });
        }
        res.json(resultado.rows [0]);

    }catch(error){
        console.error('Error al actualizar categoria:', error);

        if(error.code ==='23505'){
            return res.status(400).json({
                error:'La categoría ya existe'
            });
        }
        res.status (500).json({
            error:'Error al actualizar categoría'
        });
    }
});

//Eliminar categoría

app.delete('/categorias/:id',async (req, res) =>{
    try{
        const resultado = await pool.query(
            'DELETE FROM categorias WHERE id = $1 RETURNING *',
            [req.params.id]
        );
        if (resultado.rows.length ===0){
            return res.status(404).json({
                error:'Categoría no encontrada'
            });
        }
        res.json(resultado.rows[0]);
    }catch (error){
        console.error('Error al eliminar categoría:',error);

        if(error.code === '23001'){
            return res.status(400).json({
                error:'No se puede eliminar la categoría porque tiene productos asociados'
            });
        }
        res.status(500).json({
            error:'Error al eliminar categoría'
        });

    }
});

//Rutas de proveedores
app.get('/proveedores', async (req, res) =>{
    try{
        const resultado = await pool.query(
            'SELECT * FROM  proveedores '
            
        );
        res.json (resultado.rows);

    } catch (error){
        console.error ('Error al obtener proveedores:', error);

        res.status(500).json({
            error:'Error al obtener proveedores'
        });
    }
});

//Obtener  proveedor especifico
app.get('/proveedores/:id', async (req, res)=>{
    try{
        const resultado = await pool.query(
            'SELECT * FROM proveedores WHERE id=$1',
            [req.params.id]
        );
        if (resultado.rows.length ===0){
            return res.status(404).json({
                error:'Proveedor no encontrado'
            });
        }

        res.json(resultado.rows[0]);

    }catch (error){
        console.error('Error al obtener proveedor:', error);

        res.status(500).json({
            error:'Error al obtener proveedor'
        });

    }
});

//Crear proveedor
app.post('/proveedores', async (req, res) =>{
    try{
        const{nombre, telefono, correo, direccion} = req.body;

        if(!nombre || !telefono){
            return res.status(400).json({
                error:'El nombre y el telefono son obligatorios'
            });
        }
        const resultado = await pool.query(
            `INSERT INTO proveedores (nombre, telefono, correo, direccion)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [nombre, telefono, correo || null, direccion ||null]
        );

        res.status(201).json (resultado.rows[0]);

    } catch (error){
        console.error('Error al crear proveedor:',error);

        if (error.code ==='23505'){
            return res.status(400).json({
                error:'El proveedor ya existe'
            });
        }
        res.status(500).json({
            error:'Error al crear proveedor'
        });    
    }
});

//Actualizar proveedor

app.put('/proveedores/:id', async (req, res) =>{
    try{
        const{nombre, telefono, correo, direccion} = req.body;

        if (!nombre || !telefono){
            return res.status(400).json({
                error:'El nombre y el telefono son obligatorios'
            });
        }

        const resultado = await pool.query(
            `UPDATE proveedores
            SET nombre= $1,
                telefono = $2,
                correo = $3,
                direccion = $4
            WHERE id = $5
            RETURNING *`,
            [nombre, telefono, correo || null, direccion || null, req.params.id]
        );

        if (resultado.rows.length ===0){
            return res.status(404).json({
                error:'Proveedor no encontrado'
            });
        }

        res.json(resultado.rows[0]);

    }catch (error){
        console.error('Error al actualizar proveedor:', error);

        if(error.code === '23505'){
            return res.status(400).json({
                error:'El proveedor ya existe'
            });
        }

        res.status(500).json({
            error:'Error al actualizar proveedor'
        });
    }
});

//Eliminar proveedor
app.delete('/proveedores/:id', async (req, res) =>{
    try{
        const resultado = await pool.query(
            'DELETE FROM proveedores WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if(resultado.rows.length ===0){
            return res.status(404).json({
                error:'Proveedor no encontrado'
            });
        }

        res.json({
            mensaje:'Proveedor eliminado correctamente',
            proveedor: resultado.rows[0]
        });

    } catch(error){ 
        console.error('Error al eliminar proveedor:', error); 

        if (error.code === '23001') {
            return res.status(400).json({
                error: 'No se puede eliminar el proveedor porque tiene productos asociados'
        });
    }
        res.status(500).json({
            error: 'Error al eliminar proveedor'
        });
   }
});

//Rutas de movimientos 
app.get('/movimientos', async (req, res) =>{
    try{
        const resultado = await pool.query(
            `SELECT
                m.id,
                m.producto_id,
                p.nombre AS nombre_producto,
                m.tipo,
                m.cantidad,
                m.fecha
                FROM movimientos AS m
                INNER JOIN productos AS p
                ON m.producto_id = p.id
                ORDER by m.id`  
        );
        res.json(resultado.rows);
    }catch (error){
        console.error('Error al obtener movimientos:', error);

        res.status(500).json({
            error:'Error al obtener movimientos'
        });
    }
});

//ontener un movimiento especifico
app.get('/movimientos/:id', async (req, res) =>{
    try{
        const resultado = await pool.query(
            `SELECT
                m.id,
                m.producto_id,
                p.nombre AS nombre_producto,
                m.tipo,
                m.cantidad, 
                m.fecha
            FROM movimientos As m
            INNER JOIN productos AS p
            ON m.producto_id = p.id
            WHERE m.id = $1`,
            [req.params.id]     
        );
        if (resultado.rows.length ===0){
            return res.status(404).json({
                error:'Movimiento no encontrado'
            });
        }
        res.json(resultado.rows[0]);
    }catch (error){
        console.error('Error al obtener movimiento', error);

        res.status(500).json({
            error:'error al obtener movimiento'
        });
    }
});

//Crear un movimiento
app.post('/movimientos', async (req, res) =>{
    try{
        const{producto_id, tipo, cantidad} = req.body;
        
        if(!producto_id || !tipo || cantidad === undefined){
            return res.status(400).json({
                error:'Todos los campos son obligatorios'
            });
        }
        if (tipo !=='entrada' && tipo !== 'salida'){
            return res.status(400).json({
                error:'El tipo debe ser entrada o salida'
            });
        }

        if(cantidad <=0){
            return res.status(400).json({
                error:'La cantidad debe ser mayor a 0'
            });
        }
        const resultado = await pool.query(
            `INSERT INTO movimientos
                (producto_id, tipo, cantidad, fecha)
            VALUES ($1, $2, $3, now())
            RETURNING *`,
            [producto_id, tipo, cantidad]
        );

        res.status(201).json(resultado.rows[0]);

    }catch (error){
        console.error('Error al crear movimiento:', error);

        if (error.code ==='23503'){
            return res.status(400).json({
                error:'El producto no existe'
            });
        }

        res.status(500).json({
            error:'Error al crear movimiento'
        });
    }
});

//Actualizar un movimiento
app.put('/movimientos/:id', async (req, res) => {
    try{
        const{producto_id, tipo, cantidad} = req.body;

        if(!producto_id || !tipo || cantidad ===undefined){
            return res.status(400).json({
                error:'Todos los campos son obligatorios'
            });
        }

        if (tipo !=='entrada' && tipo !== 'salida'){
            return res.status(400).json({
                error:'El tipo debe ser entrada o salida'
            });
        }

        if (cantidad <=0){
            return res.status(400).json({
                error:'La cantidad debe ser mayor que 0'
            });
        }

        const resultado = await pool.query(
            `UPDATE movimientos
            SET producto_id= $1,
                tipo = $2,
                cantidad = $3
            WHERE id = $4
            RETURNING *`,
            [producto_id, tipo, cantidad, req.params.id]
        );

        if(resultado.rows.length ===0){
            return res.status(404).json({
                error:'Movimiento no encontrado'
            });
        }

        res.json(resultado.rows[0]);

    }catch(error){
        console.error('Error al actualizar movimiento:', error);

        if(error.code === '23503'){
            return res.status(400).json({
                error:'El producto no existe'
            });
        }
        res.status(500).json({
            error:'Error al actualizar movimiento'
        });
    }

});

//Eliminar un movimiento
app.delete ('/movimientos/:id',async (req, res) =>{
    try{
        const resultado = await pool.query(
            'DELETE FROM movimientos WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if(resultado.rows.length ===0){
            return res.status(404).json({
                error:'Movimiento no encontrado'
            });
        }

        res.json({
            mensaje:'Movimiento eliminado correctamente',
            movimiento: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al eliminar movimiento:', error);

        res.status (500).json({
            error:'Error al eliminar movimiento'
        });
    }
});

//Rutas de equipos
//Obtener todos los equipos
app.get('/equipos', async (req, res) =>{
    try{
        const resultado = await pool.query(
            `SELECT * FROM equipos
            ORDER BY id`
        );

        res.json(resultado.rows)
    
    }catch (error){
        console.error('Error al obtener equipos:', error);

        res.status(500).json({
            error:'Error al obtener equipos'
        });
    }
});

//Obtener un equipo específico
app.get('/equipos/:id', async (req, res) =>{
    try{
        const resultado = await pool.query(
            `SELECT *
            FROM equipos
            WHERE id = $1`,
            [req.params.id]
        );

        if( resultado.rows.length === 0){
            return res.status(404).json({
                error:'Equipo no encontrado'
            });
        }

        res.json(resultado.rows[0]);

    } catch(error){
        console.error('Error al obtener equipo', error);

        res.status(500).json({
            error:'Error al obtener equipo'
        });
    }

});

//Crear un equipo
app.post ('/equipos', async (req, res) =>{
    try{
        const {nombre, tipo, ubicacion, estado} = req.body;

        if(!nombre || !tipo || !ubicacion || !estado){
            return res.status (400).json({
                error:'Todos los campos son obligatorios'
            });
        }

        const resultado = await pool.query(
            `INSERT INTO equipos
                (nombre, tipo, ubicacion, estado, fecha_compra)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            RETURNING *`,
            [nombre, tipo, ubicacion, estado]
        );

        res.status(201).json (resultado.rows[0]);

    } catch (error){
        console.error('Error al crear equipo:', error);

        res.status(500).json({
            error:'Error al crear equipo'
        });
    }
});

//actualizar un equipo
app.put('/equipos/:id', async (req, res)=>{
    try{
        const{nombre, tipo, ubicacion, estado} = req.body;
        
        if(!nombre || !tipo ||!ubicacion || !estado){
            return res.status(400).json({
                error:'Todos los campos son obligatorios'
            });
        }

        const resultado = await pool.query( 
            `UPDATE equipos SET 
                nombre = $1,
                tipo = $2,
                ubicacion = $3,
                estado = $4
            WHERE id = $5
            RETURNING *`,
            [nombre, tipo, ubicacion, estado, req.params.id]
        );

        if(resultado.rows.length ===0){
            return res.status (404).json({
                error: 'Equipo no encontrado'
            });
        }

        res.json(resultado.rows[0]);

    } catch (error){
        console.error('Error al actualizar equipo:', error);

        res.status(500).json({
            error: 'Error al actualizar equipo'
        });
    }
});

//Eliminar un equipo
app.delete('/equipos/:id', async (req, res)=>{
    try{
        const resultado = await pool.query(
            `DELETE FROM equipos 
            WHERE id = $1
            RETURNING *`,
            [req.params.id]       
        );

        if (resultado.rows.length === 0){
            return res.status(404).json({
                error: 'Equipo no encontrado'
            });
        }

        res.json({
            mensaje:'Equipo eliminado correctamente',
            equipo: resultado.rows[0]
        });
    } catch (error){
        console.error('Error al eliminar equipo:', error);

        res.status(500).json({
            error:'Error al eliminar equipo'
        });
    }
});

//Rutas de mantenimiento
//Obtener todos los mantenimientos
app.get('/mantenimientos', async (req, res)=>{
    try{
        const resultado = await pool.query(
            `SELECT
                m.id,
                m.equipo_id,
                e.nombre AS nombre_equipo,
                m.tipo,
                m.fecha_mantenimiento,
                m.costo
            FROM mantenimientos AS m
            INNER JOIN equipos AS e
            ON m.equipo_id = e.id
            ORDER BY m.id`
        );

        res.json(resultado.rows);   

    }catch (error){
        console.error('Error al obtener mantenimientos:',error);

        res.status(500).json({
            error:'Error al obtener mantenimientos'
        });
    }

});

//Obtener un mantenimiento específico
app.get('/mantenimientos/:id', async (req, res)=>{
    try{
        const resultado = await pool.query(
            `SELECT
                m.id,
                m.equipo_id,
                e.nombre AS nombre_equipo,
                m.tipo,
                m.fecha_mantenimiento,
                m.costo
            FROM mantenimientos AS m
            INNER JOIN equipos AS e
            ON m.equipo_id = e.id
            WHERE m.id = $1`,
            [req.params.id]
        );

        if(resultado.rows.length ===0){
            return res.status(404).json({
                error: 'Mantenimiento no encontrado'
            });
        }
         res.json( resultado.rows[0]);

    }catch (error){
        console.error('Error al obtener mantenimiento:', error);

        res.status(500).json({
            error:'Error al obtener mantenimiento'
        });
    }
});

//Crear un mantenimiento
app.post('/mantenimientos', async (req, res)=>{
    try{
        const {equipo_id, tipo, costo}=req.body;

        if(!equipo_id || !tipo|| costo === undefined ){
            return res.status(400).json({
                error:'Todos los campos son obligatorios'
            });
        }

        if (costo < 0){
            return res.status(400).json({
                error:'El costo no puede ser negativo'
            });
        }

        const resultado = await pool.query(
            `INSERT INTO mantenimientos
                (equipo_id, tipo, fecha_mantenimiento, costo)
            VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
            RETURNING *`,
            [equipo_id, tipo, costo]
        );

        res.status(201).json(resultado.rows[0]);

    } catch(error){
        console.error('Error al crear mantenimiento:', error);

        if(error.code === '23503'){
            return res.status(400).json({
                error: 'El equipo no existe'
            });
        }

        res.status(500).json({
            error:'Error al crear mantenimiento'
        });
    }
});

// Actualizar un mantenimiento
app.put('/mantenimientos/:id', async (req, res) =>{
    try{
        const {equipo_id, tipo, costo} = req.body;

        if(!equipo_id || !tipo || costo === undefined){
            return res.status (400).json({
                error:'Todos los campos son obligatorios'
            });
        }

        if (costo < 0){
            return res.status(400).json({
                error: 'El costo no puede ser negativo'
            });
        }

        const resultado = await pool.query(
            `UPDATE mantenimientos
            SET equipo_id = $1, 
                tipo = $2,
                costo = $3
            WHERE id = $4
            RETURNING *`,
            [equipo_id, tipo, costo, req.params.id]
        );

        if (resultado.rows.length ===0){
            return res.status(404).json({
                error:'Mantenimiento no encontrado'
            });
        }

        res.json(resultado.rows[0]);

    }catch (error){
        console.error('Error al actualizar mantenimiento', error);

        if(error.code ==='23503'){
            return res.status(400).json({
                error:'El equipo no existe'
            });
        }

        res.status(500).json({
            error:'Error al actualizar mantenimiento'
        });
    }
});

//Eliminar un mantenimiento
app.delete('/mantenimientos/:id', async (req, res) =>{
    try{
        const resultado = await pool.query(
            `DELETE FROM mantenimientos 
            WHERE id = $1
            RETURNING *`,
            [req.params.id]
        );

        if(resultado.rows.length ===0){
            return res.status(404).json({
                error:'Mantenimiento no encontrado'
            });
        }

        res.json({
            mensaje:'Mantenimiento eliminado correctamente',
            mantenimiento:resultado.rows[0]
        });

       
        }catch (error){
            console.error('Error al eliminar mantenimiento:',error);

            res.status(500).json({
                error:'Error al eliminar mantenimiento'

            });
        }
});

//Reporte general del inventario

app.get('/reportes/inventario', async (req, res)=>{
    try{
        const resultado = await pool.query (
            `SELECT 
                COUNT (*) AS total_productos,
                COALESCE(SUM(cantidad), 0) AS cantidad_total,
                COALESCE(SUM(precio * cantidad), 0) AS valor_inventario
            FROM productos`
        );

        res.json(resultado.rows[0]);

    } catch (error){
        console.error('Error al obtener reporte de inventario:', error);

        res.status(500).json({
            error:'Error al obtener reporte de inventario'
        });
    }
});

//Reportes de productos con stock bajo
app.get('/reportes/stock-bajo', async (req, res)=>{
    try{
        const resultado = await pool.query(
            `SELECT
                p.id,
                p.nombre,
                p.cantidad,
                p.stock_minimo,
                c.nombre AS nombre_categoria,
                p.almacen
            FROM productos p
            INNER JOIN categorias c
                ON p.categoria_id = c.id
            WHERE p.cantidad <= p.stock_minimo
            ORDER BY p.cantidad ASC`
        );

        res.json(resultado.rows);

    } catch(error){
        console.error('Error al obtener reporte de stock bajo:', error);

        res.status(500).json({
            error:'Error al obtener reporte de stock bajo'
        });
    }
});

//Reportes de movimientos
app.get('/reportes/movimientos', async (req, res) =>{
    try{
        const resultado = await pool.query(
            `SELECT
                m.id,
                m.producto_id,
                p.nombre AS nombre_producto,
                m.tipo, 
                m.cantidad,
                m.fecha
            FROM movimientos m
            INNER JOIN productos p
                ON m.producto_id= p.id
            ORDER BY m.fecha DESC`
        );

        res.json(resultado.rows);

    }catch (error){
        console.error('Error al obtener reporte de movimientos:', error);

        res.status(500).json({
            error:'Error al obtener reporte de movimientos'
        });
    }
});

//Reportes de mantenimientos
app.get('/reportes/mantenimientos', async (req, res) => {
    try{
        const resultado = await pool.query (
            `SELECT
                m.id,
                m.equipo_id,
                e.nombre AS nombre_equipo,
                m.tipo,
                m.fecha_mantenimiento,
                m.costo
            FROM mantenimientos m
            INNER JOIN equipos e
                ON m.equipo_id = e.id
            ORDER BY m.fecha_mantenimiento DESC`
        );

        res.json(resultado.rows);

    } catch(error){
        console.error('Error al obtener reporte de mantenimientos;', error);

        res.status(500).json({
            error:'Error al obtener reporte de mantenimientos'
        });
    }
});

//Comprobar conexión con PostgreSQL
pool.query('SELECT NOW()', (error,resultado)=>{
    if (error){
        console.error('Error al conectar con la base de datos:',error);
    } else {
        console.log('Conexión exitosa:', resultado.rows);
    }
});


//Ponemos a nuestra app a escuchar en el puerto 3000
//iniciamos el servidor 
app.listen(3000, ()=>{  
    console.log('Servidor funcionando en el puerto 3000');   
});

