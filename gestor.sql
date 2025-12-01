-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-11-2025 a las 16:25:19
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Base de datos: `modulo_alumno`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alumno`
--

CREATE TABLE IF NOT EXISTS `alumno` (
  `id_alumno` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `dni` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `id_curso` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `alumno`
--

INSERT INTO `alumno` (`id_alumno`, `nombre`, `apellido`, `dni`, `email`, `telefono`, `fecha_nacimiento`, `direccion`, `id_curso`) VALUES
(1, 'Juan', 'Pérez', '12345678', 'juan.perez@email.com', '111-234567', '2005-03-15', 'Calle123', 1),
(2, 'María', 'Gómez', '87654321', 'maria.gomez@email.com', '111-987654', '2006-07-22', 'Av. Siempre Viva 456', 2),
(3, 'Lucas', 'Fernández', '11223344', 'lucas.fernandez@email.com', '111-112233', '2005-11-30', 'Calle Luna 789', 3),
(4, 'Sofía', 'Ramírez', '44332211', 'sofia.ramirez@email.com', '111-334455', '2006-01-05', 'Av. Sol 101', 4),
(7, 'Tomas', 'Arquibola', '3242355', 'tomas.arquibola.t1vl@gmail.com', '01165023456', '2006-10-16', 'Dirección A 2040', 2),
(8, 'Pedro', 'Gonzalez', '1231234', 'pedro@gmail.com', '11423346', '2007-06-06', 'direccion av siempre viva', 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asistencia`
--

CREATE TABLE IF NOT EXISTS `asistencia` (
  `id_asistencia` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `estado` enum('Presente','Ausente','Tarde','Justificado') NOT NULL,
  `id_curso` int(11) DEFAULT NULL,
  `id_alumno` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `asistencia`
--

INSERT INTO `asistencia` (`id_asistencia`, `fecha`, `estado`, `id_curso`, `id_alumno`) VALUES
(7, '2025-11-14', 'Presente', 2, 7),
(8, '2025-11-05', 'Ausente', 4, 2),
(9, '2025-11-05', 'Justificado', 1, 3),
(12, '2025-11-11', 'Ausente', 3, 3),
(13, '2025-11-11', 'Presente', 4, 1),
(14, '2025-11-19', 'Tarde', 1, 8),
(15, '2025-11-13', 'Presente', 2, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calificacion`
--

CREATE TABLE IF NOT EXISTS `calificacion` (
  `id_calificacion` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `nota` decimal(4,2) NOT NULL,
  `materia` varchar(100) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `id_alumno` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `calificacion`
--

INSERT INTO `calificacion` (`id_calificacion`, `fecha`, `nota`, `materia`, `observaciones`, `id_alumno`) VALUES
(1, '2025-10-30', 8.50, 'Matemática', 'Muy buen rendimiento', 1),
(2, '2025-10-30', 7.00, 'Física', 'Puede mejorar', 2),
(3, '2025-10-30', 9.20, 'Química', 'Excelente', 3),
(4, '2025-10-30', 6.50, 'Literatura', 'Necesita repasar', 4),
(5, '2025-11-12', 9.00, 'Web Dinamicos', 'Es muy buen compañero y hace bien sus trabajos.', 7),
(6, '2025-11-13', 7.50, 'Sisito Web Estaticos', 'Es muy buen alumno pero se distrae facilmente', 8);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `curso`
--

CREATE TABLE IF NOT EXISTS `curso` (
  `id_curso` int(11) NOT NULL,
  `nombre_curso` varchar(100) NOT NULL,
  `anio` int(11) NOT NULL,
  `turno` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `curso`
--

INSERT INTO `curso` (`id_curso`, `nombre_curso`, `anio`, `turno`) VALUES
(1, 'Matemática Avanzada', 2025, 'Mañana'),
(2, 'Física Aplicada', 2025, 'Tarde'),
(3, 'Química General', 2025, 'Mañana'),
(4, 'Literatura', 2025, 'Tarde');

CREATE TABLE IF NOT EXISTS profesor (
    id_profesor INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(30),
    id_curso INT NOT NULL,
    CONSTRAINT fk_profesor_curso FOREIGN KEY (id_curso) REFERENCES curso(id_curso)
);


--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alumno`
--
ALTER TABLE `alumno`
  ADD PRIMARY KEY (`id_alumno`),
  ADD UNIQUE KEY `dni` (`dni`),
  ADD KEY `id_curso` (`id_curso`);

--
-- Indices de la tabla `asistencia`
--
ALTER TABLE `asistencia`
  ADD PRIMARY KEY (`id_asistencia`),
  ADD KEY `id_alumno` (`id_alumno`),
  ADD KEY `fk_asistencia_curso` (`id_curso`);

--
-- Indices de la tabla `calificacion`
--
ALTER TABLE `calificacion`
  ADD PRIMARY KEY (`id_calificacion`),
  ADD KEY `id_alumno` (`id_alumno`);

--
-- Indices de la tabla `curso`
--
ALTER TABLE `curso`
  ADD PRIMARY KEY (`id_curso`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alumno`
--
ALTER TABLE `alumno`
  MODIFY `id_alumno` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `asistencia`
--
ALTER TABLE `asistencia`
  MODIFY `id_asistencia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `calificacion`
--
ALTER TABLE `calificacion`
  MODIFY `id_calificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `curso`
--
ALTER TABLE `curso`
  MODIFY `id_curso` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `alumno`
--
ALTER TABLE `alumno`
  ADD CONSTRAINT `alumno_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`);

--
-- Filtros para la tabla `asistencia`
--
ALTER TABLE `asistencia`
  ADD CONSTRAINT `asistencia_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `alumno` (`id_alumno`),
  ADD CONSTRAINT `fk_asistencia_curso` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`);

--
-- Filtros para la tabla `calificacion`
--
ALTER TABLE `calificacion`
  ADD CONSTRAINT `calificacion_ibfk_1` FOREIGN KEY (`id_alumno`) REFERENCES `alumno` (`id_alumno`);
COMMIT;
