import {useEffect, useState} from "react"  
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import "./App.css"
function  App (){
  const [productos, setProductos]=useState([])

  useEffect (() => {
    fetch("https://cuddly-space-trout-69vwv5q6jgrwh5j5g-3000.app.github.dev/productos")
    .then((respuesta) => respuesta.json())
    .then((datos) => {
      console.log("Datos  recibidos:",datos)
      setProductos(datos)
    })
    .catch((error)=>{
      console.error("Error al obtener productos:", error)
    })
  }, [])
  return(
    <>
      <Sidebar/>
      <main className= "main-content">
        <Header/>
        <h2>Productos</h2>
        <table>
          <thead>
        <tr>
          <th>ID</th>
          <th>Producto</th>
          <th>Precio</th>
          <th>Cantidad</th>
        </tr>
      </thead>
    
     <tbody>
      {productos.map((producto) => ( 
        <tr key={producto.id}>
          <td>{producto.id}</td>
          <td>{producto.nombre}</td>
          <td>{producto.precio}</td>
          <td>{producto.cantidad}</td>
        </tr>
      ))}
     </tbody>
        </table>
      </main>
   
    </>
)
}
export default App