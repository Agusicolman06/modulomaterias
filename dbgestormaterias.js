// db.js
import mysql from 'mysql2';

export const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // usuario por defecto de XAMPP
  password: '',      // si le pusiste clave, colócala aquí
  database: 'gestor_modulos' // la BD que creaste en phpMyAdmin
});

connection.connect((err) => {
  if (err) {
    console.error('Error al conectar con MySQL:', err.message);
    console.log('El servidor continuará pero las operaciones de BD fallarán');
    return;
  }
  console.log('Conexión a MySQL establecida correctamente');
});
