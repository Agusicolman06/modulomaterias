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

const normalizarValorBusqueda = (valor = "") =>
  String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseListaTexto = (valor) =>
  typeof valor === "string"
    ? valor.split(",").map(v => v.trim()).filter(Boolean)
    : [];

const parseListaNumerica = (valor) =>
  parseListaTexto(valor)
    .map(v => Number(v))
    .filter(v => Number.isFinite(v));

const normalizarHoraFiltro = (hora = "") => {
  if (!hora) return null;
  const limpia = hora.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(limpia)) return limpia;
  if (/^\d{2}:\d{2}$/.test(limpia)) return `${limpia}:00`;
  return null;
};

const normalizarHora = (hora = "") => {
  if (!hora) return null;
  return hora.length === 5 ? `${hora}:00` : hora;
};

const esBloqueValido = (dia, hora) =>
  DIAS_VALIDOS.includes(dia) && HORAS_VALIDAS.includes(hora);

const compararBloques = (a, b) => {
  const diaIndexA = DIAS_VALIDOS.indexOf(a.dia_semana);
  const diaIndexB = DIAS_VALIDOS.indexOf(b.dia_semana);
  if (diaIndexA !== diaIndexB) return diaIndexA - diaIndexB;
  return HORAS_VALIDAS.indexOf(a.hora_inicio) - HORAS_VALIDAS.indexOf(b.hora_inicio);
};

function obtenerMateriaCatalogo(catalogoId, callback) {
  if (!catalogoId) {
    const error = new Error("catalogo_id es obligatorio");
    error.status = 400;
    return callback(error);
  }

  const query = `
    SELECT mc.id, mc.nombre, mc.area_id, a.nombre AS area_nombre
    FROM materias_catalogo mc
    JOIN areas a ON a.id = mc.area_id
    WHERE mc.id = ? AND mc.activo = 1
  `;

  connection.query(query, [catalogoId], (err, rows) => {
    if (err) return callback(err);
    if (!rows.length) {
      const error = new Error("La materia seleccionada no está disponible en el catálogo");
      error.status = 404;
      return callback(error);
    }

    callback(null, rows[0]);
  });
}

function prepararBloquesDesdeSolicitud(body) {
  const bloquesEntrada = Array.isArray(body.bloques) ? body.bloques : [];
  const bloquesEvaluar = [...bloquesEntrada];

  if (!bloquesEvaluar.length && body.dia_semana && body.hora_inicio) {
    bloquesEvaluar.push({
      dia_semana: body.dia_semana,
      hora_inicio: body.hora_inicio,
      hora_fin: body.hora_fin
    });
  }

  if (!bloquesEvaluar.length) {
    return {
      error: {
        status: 400,
        message: "Debes seleccionar al menos un bloque horario válido."
      }
    };
  }

  const setDuplicados = new Set();
  const bloquesNormalizados = [];

  for (const bloque of bloquesEvaluar) {
    const dia = typeof bloque.dia_semana === "string" ? bloque.dia_semana.trim() : "";
    const horaInicioNormalizada = normalizarHora(bloque.hora_inicio);
    let horaFinNormalizada = normalizarHora(bloque.hora_fin);

    if (!dia || !horaInicioNormalizada) {
      return {
        error: {
          status: 400,
          message: "Cada bloque debe incluir día de la semana y hora de inicio."
        }
      };
    }

    if (!esBloqueValido(dia, horaInicioNormalizada)) {
      return {
        error: {
          status: 400,
          message: `El bloque ${dia} ${horaInicioNormalizada.slice(0, 5)} no es válido.`
        }
      };
    }

    const bloqueReferencia = obtenerBloquePorInicio(horaInicioNormalizada);
    if (!bloqueReferencia) {
      return {
        error: {
          status: 400,
          message: "El bloque horario seleccionado no existe en la configuración."
        }
      };
    }

    if (!horaFinNormalizada) {
      horaFinNormalizada = bloqueReferencia.fin;
    }

    if (bloqueReferencia.fin !== horaFinNormalizada) {
      return {
        error: {
          status: 400,
          message: "La hora de fin no coincide con el bloque configurado."
        }
      };
    }

    const key = `${dia}::${horaInicioNormalizada}`;
    if (setDuplicados.has(key)) {
      return {
        error: {
          status: 400,
          message: "Hay bloques duplicados en la solicitud."
        }
      };
    }

    setDuplicados.add(key);
    bloquesNormalizados.push({
      dia_semana: dia,
      hora_inicio: horaInicioNormalizada,
      hora_fin: horaFinNormalizada
    });
  }

  bloquesNormalizados.sort(compararBloques);

  return { bloques: bloquesNormalizados };
}

function verificarBloqueDisponible(cursoId, diaSemana, horaInicio, materiaIdActual, callback) {
  const horaInicioNormalizada = normalizarHora(horaInicio);

  if (!cursoId || !diaSemana || !horaInicioNormalizada) {
    const error = new Error("Faltan datos para verificar el bloque horario");
    error.status = 400;
    return callback(error);
  }

  if (!esBloqueValido(diaSemana, horaInicioNormalizada)) {
    const error = new Error("Bloque horario inválido");
    error.status = 400;
    return callback(error);
  }

  const bloqueReferencia = obtenerBloquePorInicio(horaInicioNormalizada);
  if (!bloqueReferencia) {
    const error = new Error("El bloque horario seleccionado no existe en la configuración.");
    error.status = 400;
    return callback(error);
  }

  const selectQuery = `
    SELECT id, materia_id, hora_fin
    FROM plan_estudio
    WHERE curso_id = ? AND dia_semana = ? AND hora_inicio = ?
    LIMIT 1
  `;

  connection.query(selectQuery, [cursoId, diaSemana, horaInicioNormalizada], (err, rows) => {
    if (err) return callback(err);
    if (!rows.length) {
      const insertQuery = `
        INSERT INTO plan_estudio (curso_id, dia_semana, hora_inicio, hora_fin, es_activo)
        VALUES (?, ?, ?, ?, 1)
      `;

      connection.query(
        insertQuery,
        [cursoId, diaSemana, horaInicioNormalizada, bloqueReferencia.fin],
        (insertErr, result) => {
          if (insertErr) return callback(insertErr);

          return callback(null, {
            id: result.insertId,
            materia_id: null,
            hora_fin: bloqueReferencia.fin
          });
        }
      );
      return;
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
  const horaInicioNormalizada = normalizarHora(horaInicio);

  verificarBloqueDisponible(cursoId, diaSemana, horaInicioNormalizada, materiaId, (err) => {
    if (err) return callback(err);

    const updateQuery = `
      UPDATE plan_estudio
      SET materia_id = ?, es_activo = 1
      WHERE curso_id = ? AND dia_semana = ? AND hora_inicio = ?
    `;

    connection.query(updateQuery, [materiaId, cursoId, diaSemana, horaInicioNormalizada], callback);
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

// Ruta de prueba base
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente 🚀');
});


// ==========================
// 🔹 RUTAS CRUD MATERIAS 🔹
// ==========================

// 1️⃣ Obtener todas las materias
app.get('/materias', (req, res) => {
  const baseQuery = `
    SELECT m.id,
           m.nombre,
           m.profesor,
           m.curso_id,
           c.nombre AS curso_nombre,
           m.catalogo_id,
           mc.area_id,
           a.nombre AS area_nombre,
           m.dia_semana,
           TIME_FORMAT(m.hora_inicio, '%H:%i:%s') AS hora_inicio,
           TIME_FORMAT(m.hora_fin, '%H:%i:%s') AS hora_fin,
           TIME_FORMAT(m.hora_inicio, '%H:%i') AS hora_inicio_display,
           TIME_FORMAT(m.hora_fin, '%H:%i') AS hora_fin_display
    FROM materias m
    LEFT JOIN cursos c ON c.id = m.curso_id
    LEFT JOIN materias_catalogo mc ON mc.id = m.catalogo_id
    LEFT JOIN areas a ON a.id = mc.area_id
    ORDER BY c.nombre, a.nombre, m.nombre
  `;

  connection.query(baseQuery, (err, materiasBase) => {
    if (err) {
      console.error('Error al obtener materias:', err);
      return res.status(500).json({ error: 'Error al obtener materias' });
    }

    const bloquesQuery = `
      SELECT p.materia_id,
             p.dia_semana,
             TIME_FORMAT(p.hora_inicio, '%H:%i:%s') AS hora_inicio,
             TIME_FORMAT(p.hora_fin, '%H:%i:%s') AS hora_fin,
             TIME_FORMAT(p.hora_inicio, '%H:%i') AS hora_inicio_display,
             TIME_FORMAT(p.hora_fin, '%H:%i') AS hora_fin_display
      FROM plan_estudio p
      WHERE p.materia_id IS NOT NULL
    `;

    connection.query(bloquesQuery, (bloquesErr, filasBloques) => {
      if (bloquesErr) {
        console.error('Error al obtener bloques de materias:', bloquesErr);
        return res.status(500).json({ error: 'Error al obtener materias' });
      }

      const bloquesMap = new Map();
      filasBloques.forEach(fila => {
        if (!bloquesMap.has(fila.materia_id)) {
          bloquesMap.set(fila.materia_id, []);
        }
        bloquesMap.get(fila.materia_id).push({
          dia_semana: fila.dia_semana,
          hora_inicio: fila.hora_inicio,
          hora_fin: fila.hora_fin,
          hora_inicio_display: fila.hora_inicio_display,
          hora_fin_display: fila.hora_fin_display
        });
      });

      const filtrosArea = parseListaNumerica(req.query.area_id ?? req.query.area);
      const filtrosCatalogo = parseListaNumerica(req.query.catalogo_id ?? req.query.materia_id);
      const filtrosNombre = normalizarValorBusqueda(req.query.materia ?? req.query.nombre ?? "");
      const filtrosDias = parseListaTexto(req.query.dia ?? req.query.dias).map(d => d.trim()).filter(Boolean);
      const filtrosHoras = parseListaTexto(req.query.hora ?? req.query.horas)
        .map(normalizarHoraFiltro)
        .filter(Boolean);

      const materias = materiasBase.map(row => {
        const bloques = bloquesMap.get(row.id) || [];
        return {
          id: row.id,
          nombre: row.nombre,
          profesor: row.profesor,
          curso_id: row.curso_id,
          curso_nombre: row.curso_nombre,
          catalogo_id: row.catalogo_id,
          area_id: row.area_id,
          area_nombre: row.area_nombre,
          dia_semana: row.dia_semana,
          hora_inicio: row.hora_inicio,
          hora_fin: row.hora_fin,
          hora_inicio_display: row.hora_inicio_display || (bloques[0] ? bloques[0].hora_inicio_display : null),
          hora_fin_display: row.hora_fin_display || (bloques[0] ? bloques[0].hora_fin_display : null),
          bloques
        };
      });

      const materiasFiltradas = materias.filter(materia => {
        if (filtrosArea.length && (!materia.area_id || !filtrosArea.includes(Number(materia.area_id)))) {
          return false;
        }

        if (filtrosCatalogo.length && (!materia.catalogo_id || !filtrosCatalogo.includes(Number(materia.catalogo_id)))) {
          return false;
        }

        if (filtrosNombre) {
          const nombreMateria = normalizarValorBusqueda(materia.nombre);
          if (!nombreMateria.includes(filtrosNombre)) {
            return false;
          }
        }

        const bloquesMateria = Array.isArray(materia.bloques) && materia.bloques.length
          ? materia.bloques
          : (materia.dia_semana && materia.hora_inicio
              ? [{
                  dia_semana: materia.dia_semana,
                  hora_inicio: materia.hora_inicio,
                  hora_fin: materia.hora_fin,
                  hora_inicio_display: materia.hora_inicio_display,
                  hora_fin_display: materia.hora_fin_display
                }]
              : []);

        if (filtrosDias.length) {
          const coincideDia = bloquesMateria.some(b => filtrosDias.includes(String(b.dia_semana)));
          if (!coincideDia) return false;
        }

        if (filtrosHoras.length) {
          const coincideHora = bloquesMateria.some(b => filtrosHoras.includes(normalizarHora(b.hora_inicio)));
          if (!coincideHora) return false;
        }

        return true;
      });

      res.json(materiasFiltradas);
    });
  });
});

// 2️⃣ Crear una nueva materia con múltiples bloques
app.post('/materias', (req, res) => {
  console.log('Datos recibidos en /materias:', req.body);
  
  const { catalogo_id, profesor, curso_id } = req.body;

  const camposFaltantes = [];
  if (!catalogo_id) camposFaltantes.push('catalogo_id');
  if (!curso_id) camposFaltantes.push('curso_id');

  const { bloques, error } = prepararBloquesDesdeSolicitud(req.body);

  if (camposFaltantes.length > 0 || error) {
    if (camposFaltantes.length > 0) {
      console.error('Faltan campos requeridos:', camposFaltantes);
    }
    const mensajeError = error ? error.message : 'Faltan campos obligatorios';
    const status = error ? error.status || 400 : 400;
    return res.status(status).json({
      error: mensajeError,
      camposFaltantes: camposFaltantes.length ? camposFaltantes : undefined,
      mensaje: 'Por favor complete todos los campos requeridos.'
    });
  }

  obtenerMateriaCatalogo(catalogo_id, (catalogErr, catalogo) => {
    if (catalogErr) {
      const status = catalogErr.status || 500;
      return res.status(status).json({ error: catalogErr.message });
    }

    function validarDisponibilidad(index = 0) {
      if (index >= bloques.length) {
        return crearMateria();
      }

      const bloque = bloques[index];
      verificarBloqueDisponible(curso_id, bloque.dia_semana, bloque.hora_inicio, null, (verErr, bloquePlan) => {
        if (verErr) {
          const status = verErr.status || 500;
          return res.status(status).json({ error: verErr.message });
        }

        if (bloquePlan && bloquePlan.hora_fin && normalizarHora(bloquePlan.hora_fin) !== bloque.hora_fin) {
          return res.status(400).json({ error: 'El horario final no coincide con el bloque configurado en el plan' });
        }

        validarDisponibilidad(index + 1);
      });
    }

    function crearMateria() {
      const bloqueBase = bloques[0];
      const query = `
        INSERT INTO materias (nombre, profesor, curso_id, catalogo_id, dia_semana, hora_inicio, hora_fin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      connection.query(
        query,
        [
          catalogo.nombre,
          profesor || null,
          curso_id,
          catalogo.id,
          bloqueBase ? bloqueBase.dia_semana : null,
          bloqueBase ? bloqueBase.hora_inicio : null,
          bloqueBase ? bloqueBase.hora_fin : null
        ],
        (err, result) => {
          if (err) {
            console.error('Error al crear materia:', err);
            return res.status(500).json({ error: 'Error al crear materia' });
          }

          asignarBloques(result.insertId);
        }
      );
    }

    function asignarBloques(materiaId, index = 0) {
      if (index >= bloques.length) {
        return res.json({ message: 'Materia creada correctamente', id: materiaId });
      }

      const bloque = bloques[index];
      asignarMateriaAlPlan(materiaId, curso_id, bloque.dia_semana, bloque.hora_inicio, (planErr) => {
        if (planErr) {
          const status = planErr.status || 500;
          console.error('Error al asignar materia al plan:', planErr);
          return liberarMateriaDelPlan(materiaId, () => {
            connection.query('DELETE FROM materias WHERE id = ?', [materiaId], (deleteErr) => {
              if (deleteErr) {
                console.error('Error al revertir inserción de materia:', deleteErr);
              }
              return res.status(status).json({ error: planErr.message });
            });
          });
        }

        asignarBloques(materiaId, index + 1);
      });
    }

    validarDisponibilidad();
  });
});

// 3️⃣ Actualizar una materia
app.put('/materias/:id', (req, res) => {
  const { id } = req.params;
  const { catalogo_id, profesor, curso_id } = req.body;

  if (!catalogo_id || !curso_id) {
    return res.status(400).json({ error: 'catalogo_id y curso_id son obligatorios' });
  }

  const { bloques, error } = prepararBloquesDesdeSolicitud(req.body);

  if (error) {
    const status = error.status || 400;
    return res.status(status).json({ error: error.message });
  }

  obtenerMateriaCatalogo(catalogo_id, (catalogErr, catalogo) => {
    if (catalogErr) {
      const status = catalogErr.status || 500;
      return res.status(status).json({ error: catalogErr.message });
    }

    function validarDisponibilidad(index = 0) {
      if (index >= bloques.length) {
        return actualizarMateria();
      }

      const bloque = bloques[index];
      verificarBloqueDisponible(curso_id, bloque.dia_semana, bloque.hora_inicio, id, (verErr, bloquePlan) => {
        if (verErr) {
          const status = verErr.status || 500;
          return res.status(status).json({ error: verErr.message });
        }

        if (bloquePlan && bloquePlan.hora_fin && normalizarHora(bloquePlan.hora_fin) !== bloque.hora_fin) {
          return res.status(400).json({ error: 'El horario final no coincide con el bloque configurado en el plan' });
        }

        validarDisponibilidad(index + 1);
      });
    }

    function actualizarMateria() {
      const bloqueBase = bloques[0];
      const query = `
        UPDATE materias
        SET nombre = ?, profesor = ?, curso_id = ?, catalogo_id = ?, dia_semana = ?, hora_inicio = ?, hora_fin = ?
        WHERE id = ?
      `;

      connection.query(
        query,
        [
          catalogo.nombre,
          profesor || null,
          curso_id,
          catalogo.id,
          bloqueBase ? bloqueBase.dia_semana : null,
          bloqueBase ? bloqueBase.hora_inicio : null,
          bloqueBase ? bloqueBase.hora_fin : null,
          id
        ],
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

            asignarBloques(0);
          });
        }
      );
    }

    function asignarBloques(index = 0) {
      if (index >= bloques.length) {
        return res.json({ message: 'Materia actualizada correctamente' });
      }

      const bloque = bloques[index];
      asignarMateriaAlPlan(id, curso_id, bloque.dia_semana, bloque.hora_inicio, (planErr) => {
        if (planErr) {
          const status = planErr.status || 500;
          console.error('Error al actualizar materia en el plan:', planErr);
          return res.status(status).json({ error: planErr.message });
        }

        asignarBloques(index + 1);
      });
    }

    validarDisponibilidad();
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
        return {
          inicio: bloque.inicio,
          fin: bloque.fin,
          disponible: false,
          seleccionado: false,
          materia_id: null
        };
      }

      const materiaAsignada = fila.materia_id ? Number(fila.materia_id) : null;
      const disponible = materiaAsignada === null || (materiaIdNumero !== null && materiaAsignada === materiaIdNumero);
      const seleccionado = materiaAsignada !== null;

      return {
        inicio: bloque.inicio,
        fin: bloque.fin,
        disponible,
        seleccionado,
        materia_id: materiaAsignada
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

// Obtener lista de áreas
app.get("/areas", (req, res) => {
  const query = "SELECT id, nombre FROM areas ORDER BY nombre";
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener áreas:", err);
      return res.status(500).json({ error: "Error al obtener áreas" });
    }

    const vistos = new Set();
    const areas = [];
    results.forEach(area => {
      const nombre = (area?.nombre || "").trim();
      if (!nombre) return;
      const clave = nombre.toLowerCase();
      if (!vistos.has(clave)) {
        vistos.add(clave);
        areas.push({ id: area.id, nombre });
      }
    });

    res.json(areas);
  });
});

// Obtener catálogo de materias (opcionalmente filtrado por área)
app.get("/materias/catalogo", (req, res) => {
  const { area_id } = req.query;
  let query = `
    SELECT mc.id, mc.nombre, mc.area_id, a.nombre AS area_nombre
    FROM materias_catalogo mc
    JOIN areas a ON a.id = mc.area_id
    WHERE mc.activo = 1
  `;
  const params = [];

  if (area_id) {
    query += " AND mc.area_id = ?";
    params.push(area_id);
  }

  query += " ORDER BY a.nombre, mc.nombre";

  connection.query(query, params, (err, results) => {
    if (err) {
      console.error("Error al obtener catálogo de materias:", err);
      return res.status(500).json({ error: "Error al obtener catálogo de materias" });
    }

    const vistos = new Set();
    const catalogo = [];
    results.forEach(item => {
      const nombre = (item?.nombre || "").trim();
      if (!nombre) return;
      const areaId = item?.area_id || null;
      const clave = `${areaId ?? ""}::${nombre.toLowerCase()}`;
      if (!vistos.has(clave)) {
        vistos.add(clave);
        catalogo.push({
          id: item.id,
          nombre,
          area_id: areaId,
          area_nombre: item?.area_nombre || null
        });
      }
    });

    res.json(catalogo);
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
           p.materia_id,
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

app.use(express.static('public'));

export { app };
