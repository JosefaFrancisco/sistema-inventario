require('dotenv').config(); //Carga las variables que tengo guardadas en .env
const {Pool}=require('pg'); //pool:Es un conjuto de conexiones que el backend utiliza para comunicarse a la bd 
const pool=new Pool({
    connectionString:process.env.DATABASE_URL //Busca la variable de entorno que contiene la info para conectarse a la bd
    });
    module.exports=pool  //Quiero poder utilizar esta conexion desde otros archivos de mi backend
