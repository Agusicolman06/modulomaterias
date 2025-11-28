// app.js
import express from 'express';
import cors from 'cors';
import { connection } from './dbgestormaterias.js';

const app = express();

const DIAS_VALIDOS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const BLOQUES_VALIDOS = [
  { inicio: "07:35:00", fin: "09:35:00" },
  { inicio: "09:55:00", fin: "11:55:00" },
  { inicio: "12:55:00", fin: "14:55:00" },
  { inicio: "15:15:00", fin: "17:15:00" }
];

const HORAS_VALIDAS = BLOQUES_VALIDOS.map(b => b.inicio);

const obtenerBloquePorInicio = (horaInicio) =>
  BLOQUES_VALIDOS.find(b => b.inicio === horaInicio);

const normalizarHora = (hora = "") => {
  if (!hora) return null;
  return hora.length === 5 ? `${hora}:00` : hora;
};

const esBloqueValido = (dia, hora) =>
  DIAS_VALIDOS.includes(dia) && HORAS_VALIDAS.includes(hora);

function verificarBloqueDisponible(cursoId, diaSemana, horaInicio, materiaIdActual, callback) {
  if (!cursoId || !diaSemana || !horaInicio) {
    const error = new Error("Faltan datos para verificar el bloque horario");
    error.status = 400;
    return callback(error);
  }

  if (!esBloqueValido(diaSemana, horaInicio)) {
    const error = new Error("Bloque horario inválido");
    error.status = 400;
    return callback(error);
  }

  const selectQuery = `
    SELECT id, materia_id, hora_fin
    FROM plan_estudio
    WHERE curso_id = ? AND dia_semana = ? AND hora_inicio = ?
    LIMIT 1
  `;

  connection.query(selectQuery, [cursoId, diaSemana, horaInicio], (err, rows) => {
    if (err) return callback(err);
    if (!rows.length) {
      const error = new Error("No existe un bloque horario cargado para ese curso, día y hora.");
      error.status = 400;
      return callback(error);
    }

    const materiaAsignada = rows[0].materia_id ? Number(rows[0].materia_id) : null;
    const materiaActual = materiaIdActual ? Number(materiaIdActual) : 0;
    if (materiaAsignada && materiaAsignada !== materiaActual) {
      const error = new Error("Ese bloque horario ya está asignado a otra materia.");
      error.status = 409;
      return callback(error);
    }

    return callback(null, rows[0]);
  });
}

function asignarMateriaAlPlan(materiaId, cursoId, diaSemana, horaInicio, callback) {
  verificarBloqueDisponible(cursoId, diaSemana, horaInicio, materiaId, (err) => {
    if (err) return callback(err);

    const updateQuery = `
      UPDATE plan_estudio
      SET materia_id = ?, es_activo = 1
      WHERE curso_id = ? AND dia_semana = ? AND hora_inicio = ?
    `;

    connection.query(updateQuery, [materiaId, cursoId, diaSemana, horaInicio], callback);
  });
}

function liberarMateriaDelPlan(materiaId, callback) {
  const query = `UPDATE plan_estudio SET materia_id = NULL WHERE materia_id = ?`;
  connection.query(query, [materiaId], callback);
}

function liberarBloqueDelPlan(cursoId, diaSemana, horaInicio, materiaId, callback) {
  const query = `
    UPDATE plan_estudio
    SET materia_id = NULL
    WHERE curso_id = ? AND dia_semana = ? AND hora_inicio = ? AND materia_id = ?
  `;
  connection.query(query, [cursoId, diaSemana, horaInicio, materiaId], callback);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));


// ==========================
// 🔹 RUTAS CRUD MATERIAS 🔹
// ==========================

// 1️⃣ Obtener todas las materias
app.get('/materias', (req, res) => {
  const query = `
    SELECT m.id,
           m.nombre,
           m.profesor,
           m.curso_id,
           c.nombre AS curso_nombre,
           m.dia_semana,
           TIME_FORMAT(m.hora_inicio, '%H:%i:%s') AS hora_inicio,
           TIME_FORMAT(m.hora_inicio, '%H:%i') AS hora_inicio_display,
           TIME_FORMAT(m.hora_fin, '%H:%i:%s') AS hora_fin,
           TIME_FORMAT(m.hora_fin, '%H:%i') AS hora_fin_display
    FROM materias m
    LEFT JOIN cursos c ON c.id = m.curso_id
    ORDER BY c.nivel, c.division, m.nombre
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener materias:', err);
      return res.status(500).json({ error: 'Error al obtener materias' });
    }
    res.json(results);
  });
});

// 2️⃣ Crear una nueva materia
app.post('/materias', (req, res) => {
  console.log('Datos recibidos en /materias:', req.body);
  
  const { nombre, profesor, curso_id, dia_semana, hora_inicio, hora_fin } = req.body;

  // Validar campos requeridos
  const camposFaltantes = [];
  if (!nombre) camposFaltantes.push('nombre');
  if (!curso_id) camposFaltantes.push('curso_id');
  if (!dia_semana) camposFaltantes.push('dia_semana');
  if (!hora_inicio) camposFaltantes.push('hora_inicio');
  if (!hora_fin) camposFaltantes.push('hora_fin');
  
  if (camposFaltantes.length > 0) {
    console.error('Faltan campos requeridos:', camposFaltantes);
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios',
      camposFaltantes,
      mensaje: 'Por favor complete todos los campos requeridos.'
    });
  }

  // Normalizar horas
  const horaInicioNormalizada = normalizarHora(hora_inicio);
  const horaFinNormalizada = normalizarHora(hora_fin);
  
  console.log('Horas normalizadas:', { 
    hora_inicio, 
    hora_fin, 
    horaInicioNormalizada, 
    horaFinNormalizada 
  });

  const bloqueSolicitud = obtenerBloquePorInicio(horaInicioNormalizada);
  if (!bloqueSolicitud || bloqueSolicitud.fin !== horaFinNormalizada) {
    return res.status(400).json({ error: 'La combinación de hora de inicio y fin no coincide con un bloque válido' });
  }

  verificarBloqueDisponible(curso_id, dia_semana, horaInicioNormalizada, null, (verErr, bloquePlan) => {
    if (verErr) {
      const status = verErr.status || 500;
      return res.status(status).json({ error: verErr.message });
    }

    if (bloquePlan && bloquePlan.hora_fin && bloquePlan.hora_fin !== horaFinNormalizada) {
      return res.status(400).json({ error: 'El horario final no coincide con el bloque configurado en el plan' });
    }

    const query = `
      INSERT INTO materias (nombre, profesor, curso_id, dia_semana, hora_inicio, hora_fin)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      query,
      [nombre, profesor || null, curso_id, dia_semana, horaInicioNormalizada, horaFinNormalizada],
      (err, result) => {
        if (err) {
          console.error('Error al crear materia:', err);
          return res.status(500).json({ error: 'Error al crear materia' });
        }

        asignarMateriaAlPlan(result.insertId, curso_id, dia_semana, horaInicioNormalizada, (planErr) => {
          if (planErr) {
            const status = planErr.status || 500;
            console.error('Error al asignar materia al plan:', planErr);
            return connection.query('DELETE FROM materias WHERE id = ?', [result.insertId], (deleteErr) => {
              if (deleteErr) {
                console.error('Error al revertir inserción de materia:', deleteErr);
              }
              return res.status(status).json({ error: planErr.message });
            });
          }

          res.json({ message: 'Materia creada correctamente', id: result.insertId });
        });
      }
    );
  });
});

// 3️⃣ Actualizar una materia
app.put('/materias/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, profesor, curso_id, dia_semana, hora_inicio, hora_fin } = req.body;

  const horaInicioNormalizada = normalizarHora(hora_inicio);
  const horaFinNormalizada = normalizarHora(hora_fin);

  if (!nombre || !curso_id || !dia_semana || !horaInicioNormalizada || !horaFinNormalizada) {
    return res.status(400).json({ error: 'Nombre, curso, día y horarios son obligatorios' });
  }

  const bloqueSolicitud = obtenerBloquePorInicio(horaInicioNormalizada);
  if (!bloqueSolicitud || bloqueSolicitud.fin !== horaFinNormalizada) {
    return res.status(400).json({ error: 'La combinación de hora de inicio y fin no coincide con un bloque válido' });
  }

  verificarBloqueDisponible(curso_id, dia_semana, horaInicioNormalizada, id, (verErr, bloquePlan) => {
    if (verErr) {
      const status = verErr.status || 500;
      return res.status(status).json({ error: verErr.message });
    }

    if (bloquePlan && bloquePlan.hora_fin && bloquePlan.hora_fin !== horaFinNormalizada) {
      return res.status(400).json({ error: 'El horario final no coincide con el bloque configurado en el plan' });
    }

    const query = `
      UPDATE materias
      SET nombre = ?, profesor = ?, curso_id = ?, dia_semana = ?, hora_inicio = ?, hora_fin = ?
      WHERE id = ?
    `;

    connection.query(
      query,
      [nombre, profesor || null, curso_id, dia_semana, horaInicioNormalizada, horaFinNormalizada, id],
      (err) => {
        if (err) {
          console.error('Error al actualizar materia:', err);
          return res.status(500).json({ error: 'Error al actualizar materia' });
        }

        liberarMateriaDelPlan(id, (libErr) => {
          if (libErr) {
            console.error('Error al liberar materia del plan:', libErr);
            return res.status(500).json({ error: 'Error al actualizar asignación en el plan' });
          }

          asignarMateriaAlPlan(id, curso_id, dia_semana, horaInicioNormalizada, (planErr) => {
            if (planErr) {
              const status = planErr.status || 500;
              console.error('Error al actualizar materia en el plan:', planErr);
              return res.status(status).json({ error: planErr.message });
            }

            res.json({ message: 'Materia actualizada correctamente' });
          });
        });
      }
    );
  });
});

// 4️⃣ Eliminar una materia
app.delete('/materias/:id', (req, res) => {
  const { id } = req.params;

  liberarMateriaDelPlan(id, (libErr) => {
    if (libErr) {
      console.error('Error al liberar materia del plan:', libErr);
    }

    const query = 'DELETE FROM materias WHERE id = ?';
    connection.query(query, [id], (err) => {
      if (err) {
        console.error('Error al eliminar materia:', err);
        return res.status(500).json({ error: 'Error al eliminar materia' });
      }
      res.json({ message: 'Materia eliminada correctamente' });
    });
  });
});


// 🔹 Disponibilidad horaria para un curso y día
app.get('/disponibilidad-horaria', (req, res) => {
  const { curso_id, dia_semana, materia_id } = req.query;

  if (!curso_id || !dia_semana) {
    return res.status(400).json({ error: 'Los parámetros curso_id y dia_semana son obligatorios' });
  }

  if (!DIAS_VALIDOS.includes(dia_semana)) {
    return res.status(400).json({ error: 'El día de la semana no es válido' });
  }

  const cursoIdNumero = Number(curso_id);
  if (Number.isNaN(cursoIdNumero)) {
    return res.status(400).json({ error: 'curso_id debe ser numérico' });
  }

  const materiaIdNumero = materia_id ? Number(materia_id) : null;
  if (materia_id && Number.isNaN(materiaIdNumero)) {
    return res.status(400).json({ error: 'materia_id debe ser numérico' });
  }

  const query = `
    SELECT hora_inicio, hora_fin, materia_id
    FROM plan_estudio
    WHERE curso_id = ? AND dia_semana = ?
  `;

  connection.query(query, [cursoIdNumero, dia_semana], (err, rows) => {
    if (err) {
      console.error('Error al obtener disponibilidad horaria:', err);
      return res.status(500).json({ error: 'Error al obtener disponibilidad horaria' });
    }

    const bloques = BLOQUES_VALIDOS.map((bloque) => {
      const fila = rows.find((row) => normalizarHora(`${row.hora_inicio}`) === bloque.inicio);
      if (!fila) {
        return { inicio: bloque.inicio, fin: bloque.fin, disponible: false };
      }

      const materiaAsignada = fila.materia_id ? Number(fila.materia_id) : null;
      const disponible = materiaAsignada === null || (materiaIdNumero !== null && materiaAsignada === materiaIdNumero);

      return {
        inicio: bloque.inicio,
        fin: bloque.fin,
        disponible
      };
    });

    res.json({
      curso_id: cursoIdNumero,
      dia_semana,
      bloques
    });
  });
});


// ======================================
// 📗 CURSOS
// ======================================

// Obtener lista de cursos
app.get("/cursos", (req, res) => {
  const query = "SELECT id, nombre FROM cursos ORDER BY nivel, division";
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener cursos:", err);
      return res.status(500).json({ error: "Error al obtener cursos" });
    }
    res.json(results);
  });
});

// ======================================
// 📘 PLAN DE ESTUDIO
// ======================================

// 🔹 Obtener plan de estudio por curso
app.get("/plan-estudio/:curso_id", (req, res) => {
  const { curso_id } = req.params;

  const query = `
    SELECT p.id,
           p.dia_semana,
           p.hora_inicio,
           p.hora_fin,
           m.nombre AS materia,
           m.profesor,
           c.nombre AS curso
    FROM plan_estudio p
    LEFT JOIN materias m ON m.id = p.materia_id
    JOIN cursos c ON c.id = p.curso_id
    WHERE p.curso_id = ?
    ORDER BY FIELD(p.dia_semana, 'Lunes','Martes','Miércoles','Jueves','Viernes'),
             p.hora_inicio;
  `;

  connection.query(query, [curso_id], (err, results) => {
    if (err) {
      console.error("Error al obtener plan de estudio:", err);
      return res.status(500).json({ error: "Error al obtener plan de estudio" });
    }
    res.json(results);
  });
});

// 🔹 Crear una asignación en el plan de estudio
app.post("/plan-estudio", (req, res) => {
  const { curso_id, materia_id, dia_semana, hora_inicio, hora_fin } = req.body;

  if (!curso_id || !materia_id || !dia_semana || !hora_inicio || !hora_fin) {
    return res.status(400).json({ error: "Faltan datos para registrar en el plan de estudio" });
  }

  const query = `
    INSERT INTO plan_estudio (curso_id, materia_id, dia_semana, hora_inicio, hora_fin)
    VALUES (?, ?, ?, ?, ?);
  `;

  connection.query(query, [curso_id, materia_id, dia_semana, hora_inicio, hora_fin], (err, result) => {
    if (err) {
      console.error("Error al crear entrada en plan de estudio:", err);
      return res.status(500).json({ error: "Error al crear entrada en plan de estudio" });
    }
    res.json({ message: "Materia agregada al plan de estudio", id: result.insertId });
  });
});

// 🔹 Eliminar asignación del plan de estudio
app.delete("/plan-estudio/:id", (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM plan_estudio WHERE id = ?`;

  connection.query(query, [id], (err) => {
    if (err) {
      console.error("Error al eliminar del plan de estudio:", err);
      return res.status(500).json({ error: "Error al eliminar asignación" });
    }
    res.json({ message: "Asignación eliminada correctamente" });
  });
});

export { app };
