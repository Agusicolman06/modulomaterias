-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 28-11-2025 a las 00:44:58
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `gestor_modulos`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cursos`
--

CREATE TABLE `cursos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(10) NOT NULL,
  `nivel` int(11) NOT NULL,
  `division` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cursos`
--

INSERT INTO `cursos` (`id`, `nombre`, `nivel`, `division`) VALUES
(1, '1°1', 1, 1),
(2, '1°2', 1, 2),
(3, '1°3', 1, 3),
(4, '1°4', 1, 4),
(5, '1°5', 1, 5),
(6, '2°1', 2, 1),
(7, '2°2', 2, 2),
(8, '2°3', 2, 3),
(9, '2°4', 2, 4),
(10, '2°5', 2, 5),
(11, '3°1', 3, 1),
(12, '3°2', 3, 2),
(13, '3°3', 3, 3),
(14, '3°4', 3, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materias`
--

CREATE TABLE `materias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `profesor` varchar(100) DEFAULT NULL,
  `curso_id` int(11) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `dia_semana` enum('Lunes','Martes','Miércoles','Jueves','Viernes') NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `materias`
--

INSERT INTO `materias` (`id`, `nombre`, `profesor`, `curso_id`, `activo`, `dia_semana`, `hora_inicio`, `hora_fin`) VALUES
(8, 'Lengua', 'york', 1, 1, 'Lunes', '07:35:00', '09:35:00'),
(10, 'matematica', 'Piris', 1, 1, 'Lunes', '09:55:00', '11:55:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plan_estudio`
--

CREATE TABLE `plan_estudio` (
  `id` int(11) NOT NULL,
  `curso_id` int(11) NOT NULL,
  `materia_id` int(11) DEFAULT NULL,
  `dia_semana` enum('Lunes','Martes','Miércoles','Jueves','Viernes') NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `es_activo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `plan_estudio`
--

INSERT INTO `plan_estudio` (`id`, `curso_id`, `materia_id`, `dia_semana`, `hora_inicio`, `hora_fin`, `es_activo`) VALUES
(1, 1, 8, 'Lunes', '07:35:00', '09:35:00', 1),
(2, 1, 10, 'Lunes', '09:55:00', '11:55:00', 1),
(3, 1, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(4, 1, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(5, 1, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(6, 1, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(7, 1, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(8, 1, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(9, 1, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(10, 1, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(11, 1, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(12, 1, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(13, 1, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(14, 1, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(15, 1, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(16, 1, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(17, 1, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(18, 1, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(19, 1, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(20, 1, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(21, 2, NULL, 'Lunes', '07:35:00', '09:35:00', 1),
(22, 2, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(23, 2, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(24, 2, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(25, 2, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(26, 2, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(27, 2, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(28, 2, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(29, 2, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(30, 2, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(31, 2, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(32, 2, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(33, 2, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(34, 2, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(35, 2, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(36, 2, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(37, 2, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(38, 2, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(39, 2, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(40, 2, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(41, 3, 0, 'Lunes', '07:35:00', '09:35:00', 1),
(42, 3, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(43, 3, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(44, 3, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(45, 3, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(46, 3, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(47, 3, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(48, 3, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(49, 3, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(50, 3, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(51, 3, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(52, 3, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(53, 3, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(54, 3, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(55, 3, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(56, 3, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(57, 3, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(58, 3, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(59, 3, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(60, 3, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(61, 4, NULL, 'Lunes', '07:35:00', '09:35:00', 1),
(62, 4, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(63, 4, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(64, 4, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(65, 4, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(66, 4, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(67, 4, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(68, 4, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(69, 4, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(70, 4, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(71, 4, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(72, 4, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(73, 4, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(74, 4, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(75, 4, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(76, 4, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(77, 4, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(78, 4, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(79, 4, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(80, 4, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(81, 5, NULL, 'Lunes', '07:35:00', '09:35:00', 1),
(82, 5, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(83, 5, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(84, 5, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(85, 5, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(86, 5, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(87, 5, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(88, 5, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(89, 5, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(90, 5, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(91, 5, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(92, 5, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(93, 5, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(94, 5, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(95, 5, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(96, 5, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(97, 5, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(98, 5, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(99, 5, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(100, 5, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(101, 6, NULL, 'Lunes', '07:35:00', '09:35:00', 1),
(102, 6, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(103, 6, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(104, 6, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(105, 6, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(106, 6, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(107, 6, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(108, 6, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(109, 6, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(110, 6, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(111, 6, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(112, 6, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(113, 6, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(114, 6, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(115, 6, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(116, 6, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(117, 6, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(118, 6, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(119, 6, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(120, 6, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(121, 7, NULL, 'Lunes', '07:35:00', '09:35:00', 1),
(122, 7, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(123, 7, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(124, 7, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(125, 7, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(126, 7, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(127, 7, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(128, 7, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(129, 7, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(130, 7, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(131, 7, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(132, 7, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(133, 7, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(134, 7, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(135, 7, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(136, 7, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(137, 7, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(138, 7, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(139, 7, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(140, 7, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(141, 8, NULL, 'Lunes', '07:35:00', '09:35:00', 1),
(142, 8, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(143, 8, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(144, 8, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(145, 8, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(146, 8, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(147, 8, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(148, 8, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(149, 8, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(150, 8, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(151, 8, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(152, 8, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(153, 8, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(154, 8, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(155, 8, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(156, 8, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(157, 8, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(158, 8, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(159, 8, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(160, 8, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(161, 9, NULL, 'Lunes', '07:35:00', '09:35:00', 1),
(162, 9, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(163, 9, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(164, 9, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(165, 9, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(166, 9, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(167, 9, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(168, 9, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(169, 9, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(170, 9, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(171, 9, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(172, 9, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(173, 9, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(174, 9, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(175, 9, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(176, 9, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(177, 9, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(178, 9, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(179, 9, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(180, 9, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(181, 10, NULL, 'Lunes', '07:35:00', '09:35:00', 1),
(182, 10, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(183, 10, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(184, 10, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(185, 10, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(186, 10, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(187, 10, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(188, 10, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(189, 10, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(190, 10, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(191, 10, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(192, 10, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(193, 10, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(194, 10, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(195, 10, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(196, 10, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(197, 10, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(198, 10, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(199, 10, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(200, 10, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(201, 11, NULL, 'Lunes', '07:35:00', '09:35:00', 1),
(202, 11, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(203, 11, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(204, 11, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(205, 11, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(206, 11, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(207, 11, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(208, 11, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(209, 11, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(210, 11, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(211, 11, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(212, 11, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(213, 11, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(214, 11, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(215, 11, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(216, 11, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(217, 11, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(218, 11, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(219, 11, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(220, 11, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(221, 12, NULL, 'Lunes', '07:35:00', '09:35:00', 1),
(222, 12, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(223, 12, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(224, 12, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(225, 12, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(226, 12, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(227, 12, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(228, 12, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(229, 12, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(230, 12, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(231, 12, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(232, 12, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(233, 12, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(234, 12, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(235, 12, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(236, 12, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(237, 12, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(238, 12, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(239, 12, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(240, 12, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(241, 13, NULL, 'Lunes', '07:35:00', '09:35:00', 1),
(242, 13, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(243, 13, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(244, 13, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(245, 13, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(246, 13, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(247, 13, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(248, 13, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(249, 13, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(250, 13, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(251, 13, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(252, 13, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(253, 13, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(254, 13, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(255, 13, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(256, 13, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(257, 13, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(258, 13, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(259, 13, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(260, 13, NULL, 'Viernes', '15:15:00', '17:15:00', 1),
(261, 14, NULL, 'Lunes', '07:35:00', '09:35:00', 1),
(262, 14, NULL, 'Lunes', '09:55:00', '11:55:00', 1),
(263, 14, NULL, 'Lunes', '12:55:00', '14:55:00', 1),
(264, 14, NULL, 'Lunes', '15:15:00', '17:15:00', 1),
(265, 14, NULL, 'Martes', '07:35:00', '09:35:00', 1),
(266, 14, NULL, 'Martes', '09:55:00', '11:55:00', 1),
(267, 14, NULL, 'Martes', '12:55:00', '14:55:00', 1),
(268, 14, NULL, 'Martes', '15:15:00', '17:15:00', 1),
(269, 14, NULL, 'Miércoles', '07:35:00', '09:35:00', 1),
(270, 14, NULL, 'Miércoles', '09:55:00', '11:55:00', 1),
(271, 14, NULL, 'Miércoles', '12:55:00', '14:55:00', 1),
(272, 14, NULL, 'Miércoles', '15:15:00', '17:15:00', 1),
(273, 14, NULL, 'Jueves', '07:35:00', '09:35:00', 1),
(274, 14, NULL, 'Jueves', '09:55:00', '11:55:00', 1),
(275, 14, NULL, 'Jueves', '12:55:00', '14:55:00', 1),
(276, 14, NULL, 'Jueves', '15:15:00', '17:15:00', 1),
(277, 14, NULL, 'Viernes', '07:35:00', '09:35:00', 1),
(278, 14, NULL, 'Viernes', '09:55:00', '11:55:00', 1),
(279, 14, NULL, 'Viernes', '12:55:00', '14:55:00', 1),
(280, 14, NULL, 'Viernes', '15:15:00', '17:15:00', 1);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `cursos`
--
ALTER TABLE `cursos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `materias`
--
ALTER TABLE `materias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `curso_id` (`curso_id`);

--
-- Indices de la tabla `plan_estudio`
--
ALTER TABLE `plan_estudio`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_plan_curso_dia_hora` (`curso_id`,`dia_semana`,`hora_inicio`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `materias`
--
ALTER TABLE `materias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `plan_estudio`
--
ALTER TABLE `plan_estudio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=281;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
