// gestor-materias.js

const API_URL = "http://localhost:3000/materias";
const API_PLAN = "http://localhost:3000/plan-estudio";
const API_CURSOS = "http://localhost:3000/cursos";
const API_DISPONIBILIDAD = "http://localhost:3000/disponibilidad-horaria";
const BLOQUES_PLAN = [
  { inicio: "07:35:00", fin: "09:35:00" },
  { inicio: "09:55:00", fin: "11:55:00" },
  { inicio: "12:55:00", fin: "14:55:00" },
  { inicio: "15:15:00", fin: "17:15:00" }
];
const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.querySelector("#contenedorMaterias");
  const modal = document.querySelector("#modalMateria");
  const form = document.querySelector("#formMateria");
  const btnAgregar = document.querySelector("#btnAgregarMateria");
  const btnCancelar = document.querySelector("#btnCancelar");
  const modalTitulo = document.querySelector("#modalTitulo");
  const selectCursoForm = document.querySelector("#cursoId");
  const selectHoraInicio = document.querySelector("#horaInicio");
  const selectHoraFin = document.querySelector("#horaFin");
  const modalPlan = document.querySelector("#modalPlan");
  const btnVerPlan = document.querySelector("#btnVerPlan");
  const btnCerrarPlan = document.querySelector("#btnCerrarPlan");
  const selectCursoPlan = document.querySelector("#selectCurso");
  const horarioContainer = document.querySelector("#horarioContainer");

  let editandoId = null;

  function cargarCursosSelects(opciones = {}) {
    const { mantenerSeleccionFormulario = false, mantenerSeleccionPlan = false } = opciones;
    const valorFormulario = selectCursoForm ? selectCursoForm.value : "";
    const valorPlan = selectCursoPlan ? selectCursoPlan.value : "";

    const crearOpcionDefault = () => {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "-- Selecciona un curso --";
      return opt;
    };

    return fetch(API_CURSOS)
      .then(res => res.json())
      .then(cursos => {
        if (selectCursoForm) {
          const valorPrevio = mantenerSeleccionFormulario ? valorFormulario : "";
          selectCursoForm.innerHTML = "";
          selectCursoForm.appendChild(crearOpcionDefault());
          cursos.forEach(c => {
            const opt = document.createElement("option");
            opt.value = String(c.id);
            opt.textContent = c.nombre;
            selectCursoForm.appendChild(opt);
          });
          if (valorPrevio) {
            selectCursoForm.value = valorPrevio;
            if (selectCursoForm.value !== valorPrevio) {
              selectCursoForm.selectedIndex = 0;
            }
          } else {
            selectCursoForm.selectedIndex = 0;
          }
        }

        if (selectCursoPlan) {
          const valorPrevioPlan = mantenerSeleccionPlan ? valorPlan : "";
          selectCursoPlan.innerHTML = "";
          selectCursoPlan.appendChild(crearOpcionDefault());
          cursos.forEach(c => {
            const opt = document.createElement("option");
            opt.value = String(c.id);
            opt.textContent = c.nombre;
            selectCursoPlan.appendChild(opt);
          });
          if (valorPrevioPlan) {
            selectCursoPlan.value = valorPrevioPlan;
            if (selectCursoPlan.value !== valorPrevioPlan) {
              selectCursoPlan.selectedIndex = 0;
            }
          } else {
            selectCursoPlan.selectedIndex = 0;
          }
        }
      })
      .catch(err => console.error("Error al cargar cursos:", err));
  }

  function cargarHorasInicio(bloquesDisponibles = BLOQUES_PLAN, seleccion = "", opciones = {}) {
    if (!selectHoraInicio || !selectHoraFin) return;

    const { deshabilitarSelect = false } = opciones;

    const opcionDefaultInicio = document.createElement("option");
    opcionDefaultInicio.value = "";
    opcionDefaultInicio.textContent = "-- Selecciona una hora --";

    selectHoraInicio.innerHTML = "";
    selectHoraInicio.appendChild(opcionDefaultInicio);

    bloquesDisponibles.forEach(({ inicio }) => {
      const opt = document.createElement("option");
      opt.value = inicio;
      opt.textContent = inicio.slice(0, 5);
      selectHoraInicio.appendChild(opt);
    });

    const hayDisponibles = bloquesDisponibles.length > 0;
    const seleccionValida = seleccion && bloquesDisponibles.some(({ inicio }) => inicio === seleccion);
    selectHoraInicio.value = seleccionValida ? seleccion : "";
    selectHoraInicio.disabled = deshabilitarSelect || !hayDisponibles;

    const reiniciarHoraFin = () => {
      selectHoraFin.innerHTML = "";
      const opcionDefaultFin = document.createElement("option");
      opcionDefaultFin.value = "";
      opcionDefaultFin.textContent = "-- Selecciona una hora --";
      selectHoraFin.appendChild(opcionDefaultFin);
      selectHoraFin.disabled = true;
    };

    reiniciarHoraFin();

    if (selectHoraInicio.value) {
      sincronizarHoraFin(selectHoraInicio.value);
    }
  }

  function sincronizarHoraFin(horaInicioSeleccionada) {
    if (!selectHoraFin) return;
    selectHoraFin.innerHTML = "";
    const opcionDefaultFin = document.createElement("option");
    opcionDefaultFin.value = "";
    opcionDefaultFin.textContent = "-- Selecciona una hora --";
    selectHoraFin.appendChild(opcionDefaultFin);

    const bloque = BLOQUES_PLAN.find(b => b.inicio === horaInicioSeleccionada);
    if (bloque) {
      const opt = document.createElement("option");
      opt.value = bloque.fin;
      opt.textContent = bloque.fin.slice(0, 5);
      selectHoraFin.appendChild(opt);
      selectHoraFin.value = bloque.fin;
      selectHoraFin.disabled = false;
    } else {
      selectHoraFin.disabled = true;
    }
  }

  function actualizarHorasDisponibles(opciones = {}) {
    if (!selectHoraInicio || !selectHoraFin || !selectCursoForm || !form) return;

    const { mantenerSeleccion = false, materiaId = null, horaSeleccionada = null } = opciones;

    const cursoSeleccionado = selectCursoForm.value;
    const diaSeleccionado = form.diaSemana ? form.diaSemana.value : "";

    const seleccionActual = horaSeleccionada
      || (mantenerSeleccion ? selectHoraInicio.value : "");

    if (!cursoSeleccionado || !diaSeleccionado) {
      cargarHorasInicio(BLOQUES_PLAN, "", { deshabilitarSelect: true });
      return;
    }

    const params = new URLSearchParams({
      curso_id: cursoSeleccionado,
      dia_semana: diaSeleccionado
    });

    const materiaConsulta = materiaId ?? (editandoId ? editandoId : null);
    if (materiaConsulta) {
      params.append("materia_id", materiaConsulta);
    }

    fetch(`${API_DISPONIBILIDAD}?${params.toString()}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error ${res.status} al obtener disponibilidad`);
        }
        return res.json();
      })
      .then(data => {
        const bloquesDisponibles = (data.bloques || [])
          .filter(b => b.disponible)
          .map(({ inicio, fin }) => ({ inicio, fin }));

        const seleccion = (seleccionActual && bloquesDisponibles.some(b => b.inicio === seleccionActual))
          ? seleccionActual
          : "";

        const sinDisponibles = bloquesDisponibles.length === 0;
        cargarHorasInicio(bloquesDisponibles, seleccion, { deshabilitarSelect: sinDisponibles });
      })
      .catch(err => {
        console.error("Error al obtener disponibilidad horaria:", err);
        cargarHorasInicio(BLOQUES_PLAN, "", { deshabilitarSelect: false });
      });
  }

  // 🔹 Cargar materias al iniciar
  cargarMaterias();
  cargarCursosSelects();
  cargarHorasInicio(BLOQUES_PLAN, "", { deshabilitarSelect: true });

  // ===============================
  // FUNCIONES CRUD FRONTEND
  // ===============================

  function cargarMaterias() {
    fetch(API_URL)
      .then(res => res.json())
      .then(materias => {
        contenedor.innerHTML = "";

        if (!materias || materias.length === 0) {
          contenedor.innerHTML = `<p style="text-align:center; color:#64748b;">No hay materias cargadas aún.</p>`;
          return;
        }

        // Filtrar elementos nulos o indefinidos
        materias = materias.filter(m => m !== null && m !== undefined);
        
        if (materias.length === 0) {
          contenedor.innerHTML = `<p style="text-align:center; color:#64748b;">No hay datos válidos para mostrar.</p>`;
          return;
        }

        materias.forEach(m => {
          const card = document.createElement("div");
          card.classList.add("materia-card");

          // Validar y asignar valores por defecto
          const materia = {
            id: m.id || 'N/A',
            nombre: m.nombre || 'Sin nombre',
            profesor: m.profesor || 'Sin asignar',
            curso_nombre: m.curso_nombre || '-',
            dia_semana: m.dia_semana || '-',
            hora_inicio_display: m.hora_inicio_display || '',
            hora_fin_display: m.hora_fin_display || ''
          };

          card.innerHTML = `
            <div class="materia-header">
              <h3>${materia.nombre}</h3>
              <small>ID ${materia.id}</small>
            </div>
            <div class="materia-info">
              <p><strong>Profesor:</strong> ${materia.profesor}</p>
              <p><strong>Curso:</strong> ${materia.curso_nombre}</p>
              <p><strong>Día:</strong> ${materia.dia_semana}</p>
              <p><strong>Horario:</strong> ${materia.hora_inicio_display && materia.hora_fin_display
                ? `${materia.hora_inicio_display} - ${materia.hora_fin_display}`
                : (materia.hora_inicio_display || "-")}</p>
            </div>
            <div class="materia-footer">
              <button class="btn btn-secondary btn-sm btn-eliminar" data-id="${materia.id}" data-action="eliminar">Eliminar</button>
            </div>
          `;
          contenedor.appendChild(card);
        });
      })
      .catch(err => console.error("Error al cargar materias:", err));
  }

  // 🔹 Abrir modal
  btnAgregar.addEventListener("click", () => {
    editandoId = null;
    modalTitulo.textContent = "Nueva Materia";
    form.reset();
    if (selectCursoForm) selectCursoForm.selectedIndex = 0;
    if (form && form.diaSemana) form.diaSemana.value = "";
    cargarHorasInicio(BLOQUES_PLAN, "", { deshabilitarSelect: true });
    modal.classList.remove("oculto");
  });

  // 🔹 Cancelar
  btnCancelar.addEventListener("click", () => {
    modal.classList.add("oculto");
  });

  if (selectCursoForm) {
    selectCursoForm.addEventListener("change", () => {
      actualizarHorasDisponibles();
    });
  }

  if (form && form.diaSemana) {
    form.diaSemana.addEventListener("change", () => {
      actualizarHorasDisponibles();
    });
  }

  // 🔹 Guardar (crear o editar)
  form.addEventListener("submit", e => {
    e.preventDefault();

    const cursoSeleccionado = selectCursoForm ? selectCursoForm.value : "";
    const horaSeleccionada = selectHoraInicio ? selectHoraInicio.value : "";
    const horaFinSeleccionada = selectHoraFin ? selectHoraFin.value : "";

    // Formatear la hora para asegurar el formato correcto
    const formatearHora = (hora) => {
      if (!hora) return null;
      // Asegurarse de que la hora tenga segundos
      return hora.split(':').length === 2 ? `${hora}:00` : hora;
    };

    const materia = {
      nombre: form.nombre.value.trim(),
      profesor: form.profesor.value.trim(),
      curso_id: cursoSeleccionado ? Number(cursoSeleccionado) : null,
      dia_semana: form.diaSemana.value,
      hora_inicio: formatearHora(horaSeleccionada),
      hora_fin: formatearHora(horaFinSeleccionada)
    };

    console.log('Datos a enviar al servidor:', materia); // Para depuración

    if (!materia.nombre || !materia.curso_id || !materia.dia_semana || !materia.hora_inicio || !materia.hora_fin) {
      alert("Completa todos los campos obligatorios.");
      return;
    }

    const metodo = editandoId ? "PUT" : "POST";
    const url = editandoId ? `${API_URL}/${editandoId}` : API_URL;

    console.log('Enviando datos al servidor:', { url, metodo, materia });
    
    fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(materia)
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        
        if (!res.ok) {
          // Si hay un mensaje de error en la respuesta, mostrarlo
          let mensajeError = data.error || "Error al guardar la materia";
          
          // Si hay campos faltantes, mostrarlos en el mensaje de error
          if (data.camposFaltantes) {
            mensajeError += `\n\nCampos faltantes: ${data.camposFaltantes.join(', ')}`;
          }
          
          throw new Error(mensajeError);
        }
        
        return data;
      })
      .then((data) => {
        console.log('Respuesta del servidor:', data);
        modal.classList.add("oculto");
        cargarMaterias();
        cargarCursosSelects({ mantenerSeleccionFormulario: true, mantenerSeleccionPlan: true });
        if (selectCursoPlan && selectCursoPlan.value) {
          selectCursoPlan.dispatchEvent(new Event("change"));
        }
        
        // Mostrar mensaje de éxito
        alert(`Materia ${editandoId ? 'actualizada' : 'creada'} correctamente`);
      })
      .catch(err => {
        console.error("Error al guardar materia:", err);
        
        // Mostrar mensaje de error detallado
        const mensajeError = err.message || "Error desconocido al guardar la materia";
        alert(`Error: ${mensajeError}\n\nPor favor, verifica los datos e inténtalo de nuevo.`);
      });
  });

  // 🔹 Editar / Eliminar
  contenedor.addEventListener("click", e => {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;
    if (!action || !id) return;

    if (action === "editar") {
      fetch(API_URL)
        .then(res => res.json())
        .then(materias => {
          const materia = materias.find(m => m.id == id);
          if (!materia) return;

          editandoId = Number(id);
          const horaInicioMateria = materia.hora_inicio || "";
          const materiaIdNumero = Number.isNaN(editandoId) ? null : editandoId;

          form.nombre.value = materia.nombre || "";
          form.profesor.value = materia.profesor || "";
          if (form && form.diaSemana) {
            form.diaSemana.value = materia.dia_semana || "";
          }

          const actualizarHorasPrevias = () => {
            actualizarHorasDisponibles({
              materiaId: materiaIdNumero,
              horaSeleccionada: horaInicioMateria
            });
          };

          if (selectCursoForm) {
            cargarCursosSelects({ mantenerSeleccionFormulario: true, mantenerSeleccionPlan: true }).finally(() => {
              selectCursoForm.value = materia.curso_id ? String(materia.curso_id) : "";
              if (!selectCursoForm.value) selectCursoForm.selectedIndex = 0;
              actualizarHorasPrevias();
            });
          } else {
            actualizarHorasPrevias();
          }
          modalTitulo.textContent = "Editar Materia";
          modal.classList.remove("oculto");
        })
        .catch(err => console.error("Error al obtener materia para editar:", err));

      return;
    }

    if (action === "eliminar") {
      if (!confirm("¿Seguro que deseas eliminar esta materia?")) return;

      fetch(`${API_URL}/${id}`, { method: "DELETE" })
        .then(async res => {
          if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ error: "Error al eliminar materia" }));
            throw new Error(errorBody.error || "Error al eliminar materia");
          }
        })
        .then(() => {
          cargarMaterias();
          if (selectCursoPlan && selectCursoPlan.value) {
            selectCursoPlan.dispatchEvent(new Event("change"));
          }
        })
        .catch(err => {
          console.error("Error al eliminar materia:", err);
          alert(err.message || "Error al eliminar materia");
        });
    }
  });

  // ===============================
  // 🔹 PLAN DE ESTUDIO
  // ===============================

  function generarHorarioVacio() {
    if (!horarioContainer) return;
    horarioContainer.innerHTML = "";

    const encabezados = ["Hora", ...DIAS_SEMANA];
    encabezados.forEach(texto => {
      const div = document.createElement("div");
      div.classList.add("dia");
      div.textContent = texto;
      horarioContainer.appendChild(div);
    });

    BLOQUES_PLAN.forEach(bloque => {
      const divHora = document.createElement("div");
      divHora.classList.add("hora");
      divHora.textContent = `${bloque.inicio.slice(0, 5)} - ${bloque.fin.slice(0, 5)}`;
      horarioContainer.appendChild(divHora);

      DIAS_SEMANA.forEach(() => {
        const celda = document.createElement("div");
        celda.classList.add("celda", "disponible");
        celda.textContent = "Disponible";
        horarioContainer.appendChild(celda);
      });
    });
  }

  function obtenerIndexBloque(hora) {
    if (!hora) return -1;
    const normalizada = hora.slice(0, 8);
    return BLOQUES_PLAN.findIndex(bloque => bloque.inicio === normalizada);
  }

  if (selectCursoPlan) {
    selectCursoPlan.addEventListener("change", () => {
      const cursoId = selectCursoPlan.value;
      if (!cursoId) {
        generarHorarioVacio();
        return;
      }

      fetch(`${API_PLAN}/${cursoId}`)
        .then(res => res.json())
        .then(data => {
          generarHorarioVacio();

          const celdas = horarioContainer ? horarioContainer.querySelectorAll(".celda") : [];
          data.forEach(entry => {
            const diaIndex = DIAS_SEMANA.indexOf(entry.dia_semana);
            const horaIndex = obtenerIndexBloque(entry.hora_inicio);
            if (diaIndex >= 0 && horaIndex >= 0 && celdas.length) {
              const index = horaIndex * DIAS_SEMANA.length + diaIndex;
              const celda = celdas[index];
              if (celda) {
                const materia = entry.materia || "Disponible";
                const profesor = entry.profesor ? `<br><small>${entry.profesor}</small>` : "";
                celda.innerHTML = `<b>${materia}</b>${profesor}`;
                celda.classList.toggle("ocupada", Boolean(entry.materia));
                celda.classList.toggle("disponible", !entry.materia);
              }
            }
          });
        })
        .catch(err => console.error("Error al obtener plan de estudio:", err));
    });
  }

  if (btnVerPlan) {
    btnVerPlan.addEventListener("click", () => {
      if (modalPlan) modalPlan.classList.remove("oculto");
      generarHorarioVacio();
      cargarCursosSelects({ mantenerSeleccionPlan: true, mantenerSeleccionFormulario: true }).then(() => {
        if (selectCursoPlan && selectCursoPlan.value) {
          selectCursoPlan.dispatchEvent(new Event("change"));
        }
      });
    });
  }

  if (btnCerrarPlan) {
    btnCerrarPlan.addEventListener("click", () => {
      if (modalPlan) modalPlan.classList.add("oculto");
    });
  }

  generarHorarioVacio();

  if (selectHoraInicio) {
    selectHoraInicio.addEventListener("change", () => {
      sincronizarHoraFin(selectHoraInicio.value);
    });
  }
});
