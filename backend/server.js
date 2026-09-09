const express = require('express');//Quiero utilizar express que instalamos antes
const pool= require('./db');
const app = express();//Aqui creamos la aplicacion usando express

app.use(express.json());
    
app.get('/',(req,res) => {
    res.send('Hola, mi servidor funciona');
});
//Obtener todos losproductos
app.get('/productos', async (req, res) => {
    try{
        const resultado = await pool.query ('SELECT * FROM productos');

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

      const resultado = await pool.query(
            `INSERT INTO productos (nombre, precio, cantidad, categoria_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
           [nombre, precio, cantidad, categoria_id]
        );

        res.status(201).json(resultado.rows[0]);

    } catch (error){
        console.error('Error al crear el producto:', error);
        res.status(500).json({
            error:'Error al crear el producto'
        });
     }
});

//Actualizar un producto
app.put('/productos/:id', async (req,res) => {
    try{
        const{nombre,precio,cantidad,categoria_id} = req.body;

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
                error: 'producto no encontrado'
            });
        }
        res.json(resultado.rows[0]);

    } catch (error){
        console.error('Error al actualizar el producto:', error);
        res.status(500).json ({
            error: 'Error al actualizar productos'
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
                error:'producto no encontrado'
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
