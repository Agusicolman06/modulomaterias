// gestor-materias.js

const normalizeBaseUrl = (url = "") => String(url).replace(/\/+$/, "");

const API_BASE_URL = (() => {
  if (typeof window !== "undefined") {
    if (window.API_BASE_URL) {
      return normalizeBaseUrl(window.API_BASE_URL);
    }

    if (typeof document !== "undefined") {
      const metaTag = document.querySelector('meta[name="api-base-url"]');
      if (metaTag?.content) {
        return normalizeBaseUrl(metaTag.content);
      }
    }

    if (window.location?.origin) {
      return normalizeBaseUrl(window.location.origin);
    }
  }

  return "";
})();

const buildApiUrl = (path) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

const API_URL = buildApiUrl("/materias");
const API_PLAN = buildApiUrl("/plan-estudio");
const API_CURSOS = buildApiUrl("/cursos");
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
  const modalPlan = document.querySelector("#modalPlan");
  const btnVerPlan = document.querySelector("#btnVerPlan");
  const btnCerrarPlan = document.querySelector("#btnCerrarPlan");
  const btnGuardarPlan = document.querySelector("#btnGuardarPlan");
  const btnSeleccionarHorarios = document.querySelector("#btnSeleccionarHorarios");
  const resumenHorarios = document.querySelector("#resumenHorarios");
  const selectCursoPlan = document.querySelector("#selectCurso");
  const horarioContainer = document.querySelector("#horarioContainer");
  const filtrosContainer = document.querySelector("#filtrosMateria");
  const filtroArea = document.querySelector("#filtroArea");
  const filtroMateria = document.querySelector("#filtroMateria");
  const filtroDia = document.querySelector("#filtroDia");
  const filtroHora = document.querySelector("#filtroHora");
  const filtroBuscarBtn = document.querySelector("#btnAplicarFiltros");
  const filtroLimpiarBtn = document.querySelector("#btnLimpiarFiltros");
  const selectArea = document.querySelector("#areaId");
  const selectCatalogo = document.querySelector("#catalogoId");
  const nombreMateriaSeleccionada = document.querySelector("#nombreMateriaSeleccionada");
  const alertOverlay = document.querySelector("#alertOverlay");
  const alertTitle = document.querySelector("#alertTitle");
  const alertMessage = document.querySelector("#alertMessage");
  const alertPrimary = document.querySelector("#alertPrimary");
  const alertSecondary = document.querySelector("#alertSecondary");

  let editandoId = null;
  let seleccionBloques = new Map();
  let seleccionTemporal = new Map();
  let cursoSeleccionado = "";
  let cursoSeleccionadoOriginal = "";
  let planDatosMap = new Map();
  let celdaPlanMap = new Map();
  let contextoSeleccion = "view";
  let suspendResetSeleccion = false;
  let planCursoActual = "";
  let catalogoOpciones = [];
  let catalogoSeleccionado = null;
  let filtroMateriaTimeout = null;

  function mostrarDialogo({
    title = "Aviso",
    message = "",
    primaryText = "Aceptar",
    secondaryText = "",
    focusPrimary = true
  } = {}) {
    if (!alertOverlay || !alertTitle || !alertMessage || !alertPrimary || !alertSecondary) {
      return Promise.resolve(true);
    }

    alertTitle.textContent = title;
    alertMessage.textContent = message;
    alertPrimary.textContent = primaryText;

    if (secondaryText) {
      alertSecondary.textContent = secondaryText;
      alertSecondary.classList.remove("oculto");
    } else {
      alertSecondary.classList.add("oculto");
    }

    alertOverlay.classList.remove("oculto");
    alertOverlay.setAttribute("aria-hidden", "false");

    return new Promise(resolve => {
      const cleanup = () => {
        alertOverlay.classList.add("oculto");
        alertOverlay.setAttribute("aria-hidden", "true");
        alertPrimary.removeEventListener("click", handlePrimary);
        alertSecondary.removeEventListener("click", handleSecondary);
        alertOverlay.removeEventListener("click", handleBackdrop);
        document.removeEventListener("keydown", handleKeydown);
      };

      const handlePrimary = () => {
        cleanup();
        resolve(true);
      };

      const handleSecondary = () => {
        cleanup();
        resolve(false);
      };

      const handleBackdrop = (event) => {
        if (event.target === alertOverlay) {
          if (secondaryText) {
            handleSecondary();
          } else {
            handlePrimary();
          }
        }
      };

      const handleKeydown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (secondaryText) {
            handleSecondary();
          } else {
            handlePrimary();
          }
        } else if (event.key === "Enter") {
          event.preventDefault();
          handlePrimary();
        }
      };

      alertPrimary.addEventListener("click", handlePrimary);
      if (secondaryText) {
        alertSecondary.addEventListener("click", handleSecondary);
      }
      alertOverlay.addEventListener("click", handleBackdrop);
      document.addEventListener("keydown", handleKeydown);

      setTimeout(() => {
        (focusPrimary || !secondaryText ? alertPrimary : alertSecondary).focus();
      }, 0);
    });
  }

  function mostrarAlerta(message, options = {}) {
    if (!alertOverlay) {
      window.alert(message);
      return Promise.resolve(true);
    }
    const { title = "Aviso", primaryText = "Aceptar" } = options;
    return mostrarDialogo({ title, message, primaryText });
  }

  function mostrarConfirmacion(message, options = {}) {
    if (!alertOverlay) {
      const resultado = window.confirm(message);
      return Promise.resolve(resultado);
    }

    const {
      title = "Confirmar",
      primaryText = "Aceptar",
      secondaryText = "Cancelar",
      focusPrimary = false
    } = options;

    return mostrarDialogo({ title, message, primaryText, secondaryText, focusPrimary });
  }

  const invalidatePlanCache = (cursoId) => {
    const key = String(cursoId || "");
    if (!key) return;
    planDatosMap.delete(key);
  };

  function cargarAreas() {
    const valorFormAnterior = selectArea ? selectArea.value : "";
    const valorFiltroAnterior = filtroArea ? filtroArea.value : "";

    if (selectArea) {
      selectArea.innerHTML = `<option value="">-- Selecciona un área --</option>`;
    }

    if (filtroArea) {
      filtroArea.innerHTML = `<option value="">Todas las áreas</option>`;
    }

    return fetch(buildApiUrl("/areas"))
      .then(res => res.json())
      .then(areas => {
        areas.forEach(area => {
          const valor = String(area.id);
          const nombre = area.nombre;

          if (selectArea) {
            const opcionFormulario = document.createElement("option");
            opcionFormulario.value = valor;
            opcionFormulario.textContent = nombre;
            selectArea.appendChild(opcionFormulario);
          }

          if (filtroArea) {
            const opcionFiltro = document.createElement("option");
            opcionFiltro.value = valor;
            opcionFiltro.textContent = nombre;
            filtroArea.appendChild(opcionFiltro);
          }
        });

        if (selectArea && valorFormAnterior) {
          selectArea.value = valorFormAnterior;
          if (selectArea.value !== valorFormAnterior) {
            selectArea.selectedIndex = 0;
          }
        }

        if (filtroArea && valorFiltroAnterior) {
          filtroArea.value = valorFiltroAnterior;
          if (filtroArea.value !== valorFiltroAnterior) {
            filtroArea.selectedIndex = 0;
          }
        }
      })
      .catch(err => console.error("Error al cargar áreas:", err));
  }

  function cargarCatalogo(areaId = "") {
    if (!selectCatalogo) return Promise.resolve();

    selectCatalogo.innerHTML = "";
    selectCatalogo.disabled = true;
    nombreMateriaSeleccionada.textContent = areaId ? "Cargando materias..." : "Selecciona un área para ver las materias disponibles.";

    const params = areaId ? `?area_id=${encodeURIComponent(areaId)}` : "";

    return fetch(buildApiUrl(`/materias/catalogo${params}`))
      .then(res => res.json())
      .then(catalogo => {
        catalogoOpciones = Array.isArray(catalogo) ? catalogo : [];
        if (!catalogoOpciones.length) {
          nombreMateriaSeleccionada.textContent = "No hay materias disponibles para esta área.";
          selectCatalogo.innerHTML = `<option value="">Sin materias disponibles</option>`;
          selectCatalogo.disabled = true;
          catalogoSeleccionado = null;
          return;
        }

        selectCatalogo.innerHTML = `<option value="">-- Selecciona una materia --</option>`;
        catalogoOpciones.forEach(item => {
          const opt = document.createElement("option");
          opt.value = String(item.id);
          opt.textContent = item.nombre;
          selectCatalogo.appendChild(opt);
        });
        selectCatalogo.disabled = false;
        nombreMateriaSeleccionada.textContent = "Elige una materia del listado.";

        if (catalogoSeleccionado) {
          const existe = catalogoOpciones.find(op => String(op.id) === String(catalogoSeleccionado.id));
          if (existe) {
            selectCatalogo.value = String(existe.id);
            nombreMateriaSeleccionada.textContent = existe.nombre;
          } else {
            catalogoSeleccionado = null;
          }
        }
      })
      .catch(err => {
        console.error("Error al cargar catálogo de materias:", err);
        nombreMateriaSeleccionada.textContent = "No se pudo cargar el catálogo.";
      });
  }

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

  const keyBloque = (dia, inicio) => `${dia}__${inicio}`;

  const obtenerIndiceDia = (dia) => {
    const idx = DIAS_SEMANA.indexOf(dia);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  const obtenerIndiceBloque = (inicio) => {
    const idx = BLOQUES_PLAN.findIndex(b => b.inicio === inicio);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  const ordenarBloques = (a, b) => {
    const diaDiff = obtenerIndiceDia(a.dia_semana) - obtenerIndiceDia(b.dia_semana);
    if (diaDiff !== 0) return diaDiff;
    return obtenerIndiceBloque(a.hora_inicio) - obtenerIndiceBloque(b.hora_inicio);
  };

  const normalizarHoraCompleta = (hora = "") => {
    if (!hora) return "";
    const limpia = hora.trim();
    if (limpia.length >= 8) return limpia.slice(0, 8);
    if (limpia.length === 5) return `${limpia}:00`;
    return limpia;
  };

  const obtenerBloqueConfigPorInicio = (inicio) => BLOQUES_PLAN.find(b => b.inicio === inicio) || null;

  function limpiarSeleccion() {
    seleccionBloques.clear();
    actualizarResumenHorarios();
  }

  function obtenerBloquesSeleccionados() {
    return Array.from(seleccionBloques.values()).sort(ordenarBloques);
  }

  function setSeleccionDesdeBloques(bloques = []) {
    seleccionBloques.clear();

    bloques.forEach(bloque => {
      const dia = bloque?.dia_semana || bloque?.dia || "";
      const horaInicio = normalizarHoraCompleta(bloque?.hora_inicio || bloque?.inicio || "");
      let horaFin = normalizarHoraCompleta(bloque?.hora_fin || bloque?.fin || "");

      if (!dia || !horaInicio) return;

      if (!horaFin) {
        const config = obtenerBloqueConfigPorInicio(horaInicio);
        horaFin = config ? config.fin : "";
      }

      const key = keyBloque(dia, horaInicio);
      seleccionBloques.set(key, {
        dia_semana: dia,
        hora_inicio: horaInicio,
        hora_fin: horaFin
      });
    });

    actualizarResumenHorarios();
  }

  function actualizarResumenHorarios() {
    if (!resumenHorarios) return;

    if (!cursoSeleccionado) {
      resumenHorarios.textContent = "Selecciona un curso para elegir horarios.";
      return;
    }

    const bloques = obtenerBloquesSeleccionados();
    if (!bloques.length) {
      resumenHorarios.textContent = "No hay bloques seleccionados.";
      return;
    }

    resumenHorarios.innerHTML = "";
    bloques.forEach(bloque => {
      const span = document.createElement("span");
      const inicio = bloque.hora_inicio ? bloque.hora_inicio.slice(0, 5) : "";
      const fin = bloque.hora_fin ? bloque.hora_fin.slice(0, 5) : "";
      span.textContent = `${bloque.dia_semana} ${inicio}${fin ? ` - ${fin}` : ""}`;
      resumenHorarios.appendChild(span);
    });
  }

  // Cargar materias al iniciar
  cargarMaterias();
  cargarCursosSelects();
  cargarAreas().then(() => {
    if (selectArea && selectArea.value) {
      cargarCatalogo(selectArea.value);
    }
  });
  if (filtroDia) {
    filtroDia.innerHTML = `<option value="">Todos los días</option>`;
    DIAS_SEMANA.forEach(dia => {
      const opt = document.createElement("option");
      opt.value = dia;
      opt.textContent = dia;
      filtroDia.appendChild(opt);
    });
  }
  if (filtroHora) {
    filtroHora.innerHTML = `<option value="">Todas las horas</option>`;
    BLOQUES_PLAN.forEach(bloque => {
      const opt = document.createElement("option");
      opt.value = bloque.inicio;
      opt.textContent = `${bloque.inicio.slice(0, 5)} - ${bloque.fin.slice(0, 5)}`;
      filtroHora.appendChild(opt);
    });
  }
  actualizarResumenHorarios();
  generarEstructuraHorario();


  // FUNCIONES CRUD FRONTEND

  function construirQueryFiltros() {
    const params = new URLSearchParams();

    const areaValor = filtroArea?.value || "";
    const materiaValor = filtroMateria?.value?.trim() || "";
    const diaValor = filtroDia?.value || "";
    const horaValor = filtroHora?.value || "";

    if (areaValor) params.append("area_id", areaValor);
    if (materiaValor) params.append("materia", materiaValor);
    if (diaValor) params.append("dia", diaValor);
    if (horaValor) params.append("hora", horaValor);

    return params.toString();
  }

  function cargarMaterias() {
    const queryString = construirQueryFiltros();
    const url = queryString ? `${API_URL}?${queryString}` : API_URL;
    fetch(url)
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
            area_nombre: m.area_nombre || '-',
            dia_semana: m.dia_semana || '-',
            hora_inicio_display: m.hora_inicio_display || (Array.isArray(m.bloques) && m.bloques.length ? m.bloques[0].hora_inicio_display : ''),
            hora_fin_display: m.hora_fin_display || (Array.isArray(m.bloques) && m.bloques.length ? m.bloques[0].hora_fin_display : ''),
            bloques: Array.isArray(m.bloques) ? m.bloques : []
          };

          const horarioTexto = (() => {
            if (materia.bloques.length > 1) {
              return materia.bloques
                .map(b => `${b.dia_semana}: ${b.hora_inicio_display || ''}${b.hora_fin_display ? ` - ${b.hora_fin_display}` : ''}`.trim())
                .join('<br>');
            }

            if (materia.hora_inicio_display && materia.hora_fin_display) {
              return `${materia.hora_inicio_display} - ${materia.hora_fin_display}`;
            }

            if (materia.hora_inicio_display) {
              return materia.hora_inicio_display;
            }

            return '-';
          })();

          card.innerHTML = `
            <div class="materia-header">
              <h3>${materia.nombre}</h3>
              <small>ID ${materia.id}</small>
            </div>
            <div class="materia-info">
              <p><strong>Área:</strong> ${materia.area_nombre}</p>
              <p><strong>Profesor:</strong> ${materia.profesor}</p>
              <p><strong>Curso:</strong> ${materia.curso_nombre}</p>
              <p><strong>Día:</strong> ${materia.dia_semana}</p>
              <p><strong>Horario:</strong> ${horarioTexto}</p>
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

  if (filtroBuscarBtn) {
    filtroBuscarBtn.addEventListener("click", () => {
      cargarMaterias();
    });
  }

  if (filtroLimpiarBtn) {
    filtroLimpiarBtn.addEventListener("click", () => {
      resetFiltros();
      cargarMaterias();
    });
  }

  const aplicarFiltrosAutomaticamente = () => {
    cargarMaterias();
  };

  if (filtroArea) {
    filtroArea.addEventListener("change", aplicarFiltrosAutomaticamente);
  }

  if (filtroDia) {
    filtroDia.addEventListener("change", aplicarFiltrosAutomaticamente);
  }

  if (filtroHora) {
    filtroHora.addEventListener("change", aplicarFiltrosAutomaticamente);
  }

  if (filtroMateria) {
    filtroMateria.addEventListener("input", () => {
      if (filtroMateriaTimeout) {
        clearTimeout(filtroMateriaTimeout);
      }
      filtroMateriaTimeout = setTimeout(() => {
        cargarMaterias();
      }, 300);
    });
  }
  const resetFiltros = () => {
    if (filtroArea) filtroArea.value = "";
    if (filtroMateria) filtroMateria.value = "";
    if (filtroDia) filtroDia.value = "";
    if (filtroHora) filtroHora.value = "";
    if (filtroMateriaTimeout) {
      clearTimeout(filtroMateriaTimeout);
      filtroMateriaTimeout = null;
    }
  };

  // Abrir modal
  btnAgregar.addEventListener("click", () => {
    editandoId = null;
    modalTitulo.textContent = "Nueva Materia";
    form.reset();
    if (selectCursoForm) selectCursoForm.selectedIndex = 0;
    if (selectArea) selectArea.selectedIndex = 0;
    if (selectCatalogo) {
      selectCatalogo.innerHTML = `<option value="">Selecciona un área primero</option>`;
      selectCatalogo.disabled = true;
    }
    catalogoSeleccionado = null;
    if (nombreMateriaSeleccionada) {
      nombreMateriaSeleccionada.textContent = "Selecciona un área para ver las materias disponibles.";
    }
    cursoSeleccionado = "";
    cursoSeleccionadoOriginal = "";
    seleccionBloques = new Map();
    seleccionTemporal = new Map();
    actualizarResumenHorarios();
    modal.classList.remove("oculto");
  });

  // Cancelar
  btnCancelar.addEventListener("click", () => {
    modal.classList.add("oculto");
  });

  if (selectCursoForm) {
    selectCursoForm.addEventListener("change", () => {
      const nuevoCurso = selectCursoForm.value || "";
      if (cursoSeleccionado === nuevoCurso) return;
      cursoSeleccionado = nuevoCurso;
      if (suspendResetSeleccion) return;
      seleccionBloques.clear();
      actualizarResumenHorarios();
    });
  }

  if (selectArea) {
    selectArea.addEventListener("change", () => {
      const areaId = selectArea.value;
      catalogoSeleccionado = null;
      cargarCatalogo(areaId);
    });
  }

  if (selectCatalogo) {
    selectCatalogo.addEventListener("change", () => {
      const catalogoId = selectCatalogo.value;
      catalogoSeleccionado = catalogoOpciones.find(item => String(item.id) === catalogoId) || null;
      if (nombreMateriaSeleccionada) {
        if (catalogoSeleccionado) {
          nombreMateriaSeleccionada.textContent = catalogoSeleccionado.nombre;
        } else if (selectArea && selectArea.value) {
          nombreMateriaSeleccionada.textContent = "Elige una materia del listado.";
        } else {
          nombreMateriaSeleccionada.textContent = "Selecciona un área para ver las materias disponibles.";
        }
      }
    });
  }

  // Guardar (crear o editar)
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const cursoAnteriorEdicion = editandoId ? cursoSeleccionadoOriginal : "";
    const cursoSeleccionadoFormulario = selectCursoForm ? selectCursoForm.value : "";
    const bloquesSeleccionados = obtenerBloquesSeleccionados();

    const catalogoIdSeleccionado = selectCatalogo ? selectCatalogo.value : "";

    const materia = {
      catalogo_id: catalogoIdSeleccionado ? Number(catalogoIdSeleccionado) : null,
      profesor: form.profesor ? form.profesor.value.trim() : "",
      curso_id: cursoSeleccionadoFormulario ? Number(cursoSeleccionadoFormulario) : null,
      bloques: bloquesSeleccionados
    };

    console.log('Datos a enviar al servidor:', materia); // Para depuración

    if (!materia.catalogo_id || !materia.curso_id || materia.bloques.length === 0) {
      await mostrarAlerta(
        "Selecciona un área, una materia del catálogo, el curso y al menos un bloque en el plan de estudio.",
        { title: "Campos incompletos" }
      );
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
      .then(async (data) => {
        console.log('Respuesta del servidor:', data);
        modal.classList.add("oculto");
        cargarMaterias();
        cargarCursosSelects({ mantenerSeleccionFormulario: true, mantenerSeleccionPlan: true });
        const cursoNuevo = materia.curso_id ? String(materia.curso_id) : "";
        if (editandoId && cursoAnteriorEdicion && cursoAnteriorEdicion !== cursoNuevo) {
          invalidatePlanCache(cursoAnteriorEdicion);
          if (selectCursoPlan && selectCursoPlan.value === cursoAnteriorEdicion) {
            cargarPlanDeEstudio(cursoAnteriorEdicion);
          }
        }
        if (cursoNuevo) {
          invalidatePlanCache(cursoNuevo);
          if (selectCursoPlan && selectCursoPlan.value === cursoNuevo) {
            cargarPlanDeEstudio(cursoNuevo);
          }
        } else if (selectCursoPlan && selectCursoPlan.value) {
          selectCursoPlan.dispatchEvent(new Event("change"));
        }

        // Mostrar mensaje de éxito
        await mostrarAlerta(`Materia ${editandoId ? 'actualizada' : 'creada'} correctamente`, {
          title: "Operación exitosa",
          primaryText: "Entendido"
        });
        if (cursoNuevo) {
          cursoSeleccionado = cursoNuevo;
          cursoSeleccionadoOriginal = cursoNuevo;
        }
      })
      .catch(async err => {
        console.error("Error al guardar materia:", err);

        // Mostrar mensaje de error detallado
        const mensajeError = err.message || "Error desconocido al guardar la materia";
        await mostrarAlerta(`Error: ${mensajeError}\n\nPor favor, verifica los datos e inténtalo de nuevo.`, {
          title: "No se pudo completar la operación"
        });
      });
  });

  // Editar / Eliminar
  contenedor.addEventListener("click", async e => {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;
    if (!action || !id) return;

    if (action === "eliminar") {
      const confirmarEliminacion = await mostrarConfirmacion(
        "¿Seguro que deseas eliminar esta materia?",
        {
          title: "Eliminar materia",
          primaryText: "Eliminar",
          secondaryText: "Cancelar"
        }
      );

      if (!confirmarEliminacion) return;

      fetch(`${API_URL}/${id}`, { method: "DELETE" })
        .then(async res => {
          if (!res.ok) {
            const errorBody = await res.json().catch(() => ({ error: "Error al eliminar materia" }));
            throw new Error(errorBody.error || "Error al eliminar materia");
          }
        })
        .then(() => {
          cargarMaterias();
          const cursoIdActual = cursoSeleccionado || (selectCursoPlan ? selectCursoPlan.value : "");
          if (cursoIdActual) {
            invalidatePlanCache(cursoIdActual);
            if (selectCursoPlan && selectCursoPlan.value === cursoIdActual) {
              cargarPlanDeEstudio(cursoIdActual);
            }
          }
        })
        .catch(async err => {
          console.error("Error al eliminar materia:", err);
          await mostrarAlerta(err.message || "Error al eliminar materia", {
            title: "No se pudo eliminar"
          });
        });
    }
  });

  // PLAN DE ESTUDIO

  function generarEstructuraHorario() {
    if (!horarioContainer) return;
    horarioContainer.innerHTML = "";
    celdaPlanMap.clear();

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

      DIAS_SEMANA.forEach(dia => {
        const celda = document.createElement("div");
        celda.classList.add("celda", "disponible");
        celda.dataset.dia = dia;
        celda.dataset.inicio = bloque.inicio;
        celda.dataset.fin = bloque.fin;
        celda.textContent = "Disponible";
        horarioContainer.appendChild(celda);

        const key = keyBloque(dia, bloque.inicio);
        celdaPlanMap.set(key, celda);

        celda.addEventListener("click", () => {
          if (contextoSeleccion !== "select") return;
          const cursoPlan = selectCursoPlan ? selectCursoPlan.value : "";
          if (!cursoPlan || cursoPlan !== planCursoActual) return;

          toggleBloqueSeleccionTemporal(dia, bloque.inicio, bloque.fin, celda);
        });
      });
    });

    aplicarEstadoCeldas();
  }

  function obtenerIndexBloque(hora) {
    if (!hora) return -1;
    const normalizada = hora.slice(0, 8);
    return BLOQUES_PLAN.findIndex(bloque => bloque.inicio === normalizada);
  }

  function aplicarEstadoCeldas() {
    if (!horarioContainer) return;

    const cursoId = selectCursoPlan ? selectCursoPlan.value : "";
    const registros = planDatosMap.get(String(cursoId)) || [];

    celdaPlanMap.forEach((celda, key) => {
      celda.classList.remove("ocupada", "bloque-seleccionado");
      celda.classList.add("disponible");
      celda.dataset.disponible = "true";
      celda.innerHTML = `<span class="materia-nombre">Disponible</span>`;

      const [dia, inicio] = key.split("__");
      const ocupada = registros.some(entry =>
        entry.materia_id &&
        entry.dia_semana === dia &&
        normalizarHoraCompleta(entry.hora_inicio) === normalizarHoraCompleta(inicio)
      );

      if (ocupada) {
        celda.classList.add("ocupada");
        celda.classList.remove("disponible");
        celda.dataset.disponible = "false";

        const registro = registros.find(entry =>
          entry.dia_semana === dia &&
          normalizarHoraCompleta(entry.hora_inicio) === normalizarHoraCompleta(inicio)
        );

        if (registro && registro.materia) {
          const profesorTexto = registro.profesor ? `<span class="materia-profesor">${registro.profesor}</span>` : "";
          celda.innerHTML = `
            <span class="materia-nombre">${registro.materia}</span>
            ${profesorTexto}
          `;
        } else {
          celda.innerHTML = `<span class="materia-nombre">Ocupado</span>`;
        }
      }

      const seleccionFuente = contextoSeleccion === "select" ? seleccionTemporal : seleccionBloques;
      if (seleccionFuente && seleccionFuente.has(key)) {
        celda.classList.add("bloque-seleccionado");
        if (!ocupada) {
          celda.innerHTML = `
            <span class="materia-nombre">Seleccionado</span>
          `;
        }
      }
    });
  }

  function cargarPlanDeEstudio(cursoId) {
    const key = String(cursoId || "");
    if (!key) {
      aplicarEstadoCeldas();
      return;
    }

    if (planDatosMap.has(key)) {
      aplicarEstadoCeldas();
      return;
    }

    fetch(`${API_PLAN}/${key}`)
      .then(res => res.json())
      .then(data => {
        planDatosMap.set(key, data);
        aplicarEstadoCeldas();
      })
      .catch(err => console.error("Error al obtener plan de estudio:", err));
  }

  if (selectCursoPlan) {
    selectCursoPlan.addEventListener("change", () => {
      const cursoId = selectCursoPlan.value;
      if (!cursoId) {
        aplicarEstadoCeldas();
        return;
      }

      cargarPlanDeEstudio(cursoId);
    });
  }

  if (btnVerPlan) {
    btnVerPlan.addEventListener("click", () => {
      if (modalPlan) modalPlan.classList.remove("oculto");
      contextoSeleccion = "view";
      generarEstructuraHorario();
      cargarCursosSelects({ mantenerSeleccionPlan: true, mantenerSeleccionFormulario: true }).then(() => {
        if (selectCursoPlan && selectCursoPlan.value) {
          cargarPlanDeEstudio(selectCursoPlan.value);
        }
      });
    });
  }

  if (btnSeleccionarHorarios) {
    btnSeleccionarHorarios.addEventListener("click", async () => {
      const cursoId = selectCursoForm ? selectCursoForm.value : "";
      if (!cursoId) {
        await mostrarAlerta("Primero selecciona un curso en el formulario de materia.", {
          title: "Selecciona un curso"
        });
        return;
      }

      contextoSeleccion = "select";
      planCursoActual = cursoId;
      seleccionTemporal = new Map(seleccionBloques);
      if (modalPlan) modalPlan.classList.remove("oculto");
      generarEstructuraHorario();
      cargarCursosSelects({ mantenerSeleccionPlan: true, mantenerSeleccionFormulario: true }).then(() => {
        if (selectCursoPlan) {
          selectCursoPlan.value = cursoId;
          cargarPlanDeEstudio(cursoId);
          aplicarEstadoCeldas();
        }
      });
    });
  }

  async function toggleBloqueSeleccionTemporal(dia, inicio, fin, celda) {
    const key = keyBloque(dia, inicio);
    if (!seleccionTemporal) seleccionTemporal = new Map();

    const disponible = celda ? celda.dataset.disponible !== "false" : true;

    if (!disponible) {
      await mostrarAlerta("Ese bloque ya está ocupado por otra materia.", {
        title: "Bloque no disponible"
      });
      return;
    }

    if (seleccionTemporal.has(key)) {
      seleccionTemporal.delete(key);
      if (celda) celda.classList.remove("bloque-seleccionado");
      return;
    }

    seleccionTemporal.set(key, {
      dia_semana: dia,
      hora_inicio: normalizarHoraCompleta(inicio),
      hora_fin: normalizarHoraCompleta(fin)
    });
    if (celda) celda.classList.add("bloque-seleccionado");
  }

  if (btnGuardarPlan) {
    btnGuardarPlan.addEventListener("click", async () => {
      if (contextoSeleccion !== "select") {
        if (modalPlan) modalPlan.classList.add("oculto");
        return;
      }

      const bloquesSeleccionados = Array.from(seleccionTemporal.values());
      if (!bloquesSeleccionados.length) {
        const continuar = await mostrarConfirmacion(
          "No hay bloques seleccionados. ¿Deseas continuar sin horarios?",
          {
            title: "Sin horarios seleccionados",
            primaryText: "Continuar",
            secondaryText: "Volver"
          }
        );
        if (!continuar) {
          return;
        }
      }

      seleccionBloques = new Map(seleccionTemporal);
      cursoSeleccionado = planCursoActual;
      actualizarResumenHorarios();
      contextoSeleccion = "view";
      if (cursoSeleccionado) {
        invalidatePlanCache(cursoSeleccionado);
        if (selectCursoPlan && selectCursoPlan.value === cursoSeleccionado) {
          cargarPlanDeEstudio(cursoSeleccionado);
        }
      }
      if (modalPlan) modalPlan.classList.add("oculto");
    });
  }

  if (btnCerrarPlan) {
    btnCerrarPlan.addEventListener("click", () => {
      if (modalPlan) modalPlan.classList.add("oculto");
      contextoSeleccion = "view";
    });
  }

  generarEstructuraHorario();
});
