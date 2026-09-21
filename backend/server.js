const express = require('express');//Quiero utilizar express que instalamos antes
const pool= require('./db');
const app = express();//Aqui creamos la aplicacion usando express

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
                `SELECT p.id, 
                p.nombre,
                p.precio,
                p.cantidad,
                p.categoria_id,
                c.nombre AS nombre_categoria
                FROM productos AS p
                INNER JOIN categorias AS c
                ON p.categoria_id = c.id
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
                c.nombre AS nombre_categoria
                FROM productos AS p
                INNER JOIN categorias As c
                ON p.categoria_id= c.id
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
                c.nombre AS nombre_categoria
                FROM productos AS p
                INNER JOIN categorias As c
                ON p.categoria_id= c.id
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
                c.nombre AS nombre_categoria
                FROM productos AS p
                INNER JOIN categorias As c
                ON p.categoria_id= c.id`
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
        const resultado = await pool.query ('SELECT * FROM productos WHERE id = $1',
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
      const{ nombre, precio, cantidad, categoria_id } = req.body;

        //Valida que todos los campos existan 
      if (!nombre || precio === undefined || cantidad === undefined || !categoria_id){
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
            `INSERT INTO productos (nombre, precio, cantidad, categoria_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
           [nombre, precio, cantidad, categoria_id]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error){
        console.error('Error al crear el producto:', error);

        if (error.code ==='23503'){
            return res.status(400).json({
                error:'La categoría no existe'
            });
        }
        res.status(500).json({
            error:'Error al crear el producto'
        });
     }
});

//Actualizar un producto
app.put('/productos/:id', async (req,res) => {
    try{
        const{nombre,precio,cantidad,categoria_id} = req.body;

        // Valida que todos los campos existan 
        if(!nombre || precio === undefined || cantidad ===undefined || !categoria_id){
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
                categoria_id =$4
            WHERE id= $5
            RETURNING * `,
            [nombre,precio,cantidad,categoria_id, req.params.id]
        );
       
  
        if (resultado.rows.length ===0)  {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }
        res.json(resultado.rows[0]);

    } catch (error){
        console.error('Error al actualizar el producto:', error);

        if(error.code === '23503'){
            return res.status(400).json({
                error: 'La categoría no existe'
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

        res.json(resultado.rows[0]);

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

        if(error.code === '23503'){
            return res.status(400).json({
                error:'No se puede eliminar la categoría porque tiene productos asociados'
            });
        }
        res.status(500).json({
            error:'Error al eliminar categoría'
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
