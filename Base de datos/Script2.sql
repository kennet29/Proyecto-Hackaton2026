USE [master]
GO
/****** Object:  Database [gestionsalud]    Script Date: 29 mar. 2026 14:49:13 ******/
CREATE DATABASE [gestionsalud]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'gestionsalud', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\gestionsalud.mdf' , SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'gestionsalud_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\DATA\gestionsalud_log.ldf' , SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
 WITH CATALOG_COLLATION = DATABASE_DEFAULT
GO
ALTER DATABASE [gestionsalud] SET COMPATIBILITY_LEVEL = 150
GO
IF (1 = FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'))
begin
EXEC [gestionsalud].[dbo].[sp_fulltext_database] @action = 'enable'
end
GO
ALTER DATABASE [gestionsalud] SET ANSI_NULL_DEFAULT OFF 
GO
ALTER DATABASE [gestionsalud] SET ANSI_NULLS OFF 
GO
ALTER DATABASE [gestionsalud] SET ANSI_PADDING OFF 
GO
ALTER DATABASE [gestionsalud] SET ANSI_WARNINGS OFF 
GO
ALTER DATABASE [gestionsalud] SET ARITHABORT OFF 
GO
ALTER DATABASE [gestionsalud] SET AUTO_CLOSE OFF 
GO
ALTER DATABASE [gestionsalud] SET AUTO_SHRINK OFF 
GO
ALTER DATABASE [gestionsalud] SET AUTO_UPDATE_STATISTICS ON 
GO
ALTER DATABASE [gestionsalud] SET CURSOR_CLOSE_ON_COMMIT OFF 
GO
ALTER DATABASE [gestionsalud] SET CURSOR_DEFAULT  GLOBAL 
GO
ALTER DATABASE [gestionsalud] SET CONCAT_NULL_YIELDS_NULL OFF 
GO
ALTER DATABASE [gestionsalud] SET NUMERIC_ROUNDABORT OFF 
GO
ALTER DATABASE [gestionsalud] SET QUOTED_IDENTIFIER OFF 
GO
ALTER DATABASE [gestionsalud] SET RECURSIVE_TRIGGERS OFF 
GO
ALTER DATABASE [gestionsalud] SET  ENABLE_BROKER 
GO
ALTER DATABASE [gestionsalud] SET AUTO_UPDATE_STATISTICS_ASYNC OFF 
GO
ALTER DATABASE [gestionsalud] SET DATE_CORRELATION_OPTIMIZATION OFF 
GO
ALTER DATABASE [gestionsalud] SET TRUSTWORTHY OFF 
GO
ALTER DATABASE [gestionsalud] SET ALLOW_SNAPSHOT_ISOLATION OFF 
GO
ALTER DATABASE [gestionsalud] SET PARAMETERIZATION SIMPLE 
GO
ALTER DATABASE [gestionsalud] SET READ_COMMITTED_SNAPSHOT OFF 
GO
ALTER DATABASE [gestionsalud] SET HONOR_BROKER_PRIORITY OFF 
GO
ALTER DATABASE [gestionsalud] SET RECOVERY FULL 
GO
ALTER DATABASE [gestionsalud] SET  MULTI_USER 
GO
ALTER DATABASE [gestionsalud] SET PAGE_VERIFY CHECKSUM  
GO
ALTER DATABASE [gestionsalud] SET DB_CHAINING OFF 
GO
ALTER DATABASE [gestionsalud] SET FILESTREAM( NON_TRANSACTED_ACCESS = OFF ) 
GO
ALTER DATABASE [gestionsalud] SET TARGET_RECOVERY_TIME = 60 SECONDS 
GO
ALTER DATABASE [gestionsalud] SET DELAYED_DURABILITY = DISABLED 
GO
ALTER DATABASE [gestionsalud] SET ACCELERATED_DATABASE_RECOVERY = OFF  
GO
EXEC sys.sp_db_vardecimal_storage_format N'gestionsalud', N'ON'
GO
ALTER DATABASE [gestionsalud] SET QUERY_STORE = OFF
GO
USE [gestionsalud]
GO
/****** Object:  Table [dbo].[paciente]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[paciente](
	[pacienteid] [int] IDENTITY(1,1) NOT NULL,
	[nombres] [nvarchar](100) NOT NULL,
	[apellidos] [nvarchar](100) NOT NULL,
	[fechanacimiento] [date] NULL,
	[sexo] [char](1) NULL,
	[tipodocumento] [nvarchar](30) NULL,
	[numerodocumento] [nvarchar](50) NULL,
	[telefono] [nvarchar](30) NULL,
	[email] [nvarchar](120) NULL,
	[direccion] [nvarchar](200) NULL,
	[fecharegistro] [datetime2](7) NOT NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[pacienteid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[alergia]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[alergia](
	[alergiaid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[tipo] [nvarchar](120) NOT NULL,
	[desencadenante] [nvarchar](200) NULL,
	[severidad] [nvarchar](50) NULL,
	[reaccion] [nvarchar](max) NULL,
	[tratamiento] [nvarchar](max) NULL,
	[fechadiagnostico] [date] NULL,
	[estado] [nvarchar](40) NOT NULL,
	[observaciones] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[alergiaid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[condicioncronica]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[condicioncronica](
	[condicioncronicaid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[tipocondicionid] [int] NOT NULL,
	[fechadiagnostico] [date] NULL,
	[estado] [nvarchar](40) NOT NULL,
	[severidad] [nvarchar](40) NULL,
	[tratamientoprincipal] [nvarchar](200) NULL,
	[proveedorlider] [nvarchar](120) NULL,
	[proximoseguimiento] [date] NULL,
	[notas] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[condicioncronicaid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[medicacion]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[medicacion](
	[medicacionid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[consultaid] [int] NULL,
	[nombremedicamento] [nvarchar](150) NOT NULL,
	[presentacion] [nvarchar](100) NULL,
	[dosis] [nvarchar](80) NULL,
	[viaadministracion] [nvarchar](60) NULL,
	[indicaciones] [nvarchar](max) NULL,
	[fechainicio] [date] NOT NULL,
	[fechafin] [date] NULL,
	[medicacionactiva] [bit] NOT NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[medicacionid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[consultamedica]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[consultamedica](
	[consultaid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[fechaconsulta] [datetime2](7) NOT NULL,
	[motivo] [nvarchar](200) NOT NULL,
	[diagnostico] [nvarchar](max) NULL,
	[tratamiento] [nvarchar](max) NULL,
	[medico] [nvarchar](120) NULL,
	[estado] [nvarchar](40) NOT NULL,
	[notas] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[consultaid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[recordatoriocita]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[recordatoriocita](
	[recordatoriocitaid] [int] IDENTITY(1,1) NOT NULL,
	[citaid] [int] NOT NULL,
	[pacienteid] [int] NOT NULL,
	[fecharecordatorio] [datetime2](7) NOT NULL,
	[mensaje] [nvarchar](300) NOT NULL,
	[canal] [nvarchar](50) NULL,
	[estado] [nvarchar](30) NOT NULL,
	[intentos] [int] NOT NULL,
	[ultimointento] [datetime2](7) NULL,
	[proximaejecucion] [datetime2](7) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[recordatoriocitaid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[vacuna]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[vacuna](
	[vacunaid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[tipovacunaid] [int] NULL,
	[nombre] [nvarchar](150) NOT NULL,
	[fechaaplicacion] [date] NOT NULL,
	[lote] [nvarchar](60) NULL,
	[proximadosis] [date] NULL,
	[observaciones] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[vacunaid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[citamedica]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[citamedica](
	[citaid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[especialidadid] [int] NULL,
	[fechacita] [datetime2](7) NOT NULL,
	[especialidad] [nvarchar](120) NULL,
	[motivo] [nvarchar](200) NULL,
	[medico] [nvarchar](120) NULL,
	[estado] [nvarchar](40) NOT NULL,
	[notas] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[citaid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[vw_resumen_paciente]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   VIEW [dbo].[vw_resumen_paciente] AS
SELECT
    p.pacienteid,
    p.nombres,
    p.apellidos,
    ISNULL(cm.total_consultas, 0)      AS total_consultas,
    cm.ultima_consulta,
    ISNULL(ci.citas_pendientes, 0)     AS citas_pendientes,
    ISNULL(vac.vacunas_aplicadas, 0)   AS vacunas_aplicadas,
    ISNULL(med.medicaciones_activas, 0) AS medicaciones_activas,
    ISNULL(rc.recordatorios_pendientes, 0) AS recordatorios_pendientes,
    ISNULL(al.alergias_activas, 0)     AS alergias_activas,
    ISNULL(cc.condiciones_activas, 0)  AS condiciones_activas
FROM paciente p
LEFT JOIN (
    SELECT pacienteid,
           COUNT(*) AS total_consultas,
           MAX(fechaconsulta) AS ultima_consulta
    FROM consultamedica
    GROUP BY pacienteid
) cm ON cm.pacienteid = p.pacienteid
LEFT JOIN (
    SELECT pacienteid,
           COUNT(*) AS citas_pendientes
    FROM citamedica
    WHERE estado IN ('programada','no asistio')
    GROUP BY pacienteid
) ci ON ci.pacienteid = p.pacienteid
LEFT JOIN (
    SELECT pacienteid,
           COUNT(*) AS vacunas_aplicadas
    FROM vacuna
    GROUP BY pacienteid
) vac ON vac.pacienteid = p.pacienteid
LEFT JOIN (
    SELECT pacienteid,
           COUNT(*) AS medicaciones_activas
    FROM medicacion
    WHERE medicacionactiva = 1
    GROUP BY pacienteid
) med ON med.pacienteid = p.pacienteid
LEFT JOIN (
    SELECT pacienteid,
           COUNT(*) AS recordatorios_pendientes
    FROM recordatoriocita
    WHERE estado IN ('pendiente','programado')
    GROUP BY pacienteid
) rc ON rc.pacienteid = p.pacienteid
LEFT JOIN (
    SELECT pacienteid,
           COUNT(*) AS alergias_activas
    FROM alergia
    WHERE estado = 'activa'
    GROUP BY pacienteid
) al ON al.pacienteid = p.pacienteid
LEFT JOIN (
    SELECT pacienteid,
           COUNT(*) AS condiciones_activas
    FROM condicioncronica
    WHERE estado = 'activa'
    GROUP BY pacienteid
) cc ON cc.pacienteid = p.pacienteid;
GO
/****** Object:  Table [dbo].[antecedentefamiliar]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[antecedentefamiliar](
	[antecedenteid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[parentesco] [nvarchar](80) NOT NULL,
	[condicion] [nvarchar](150) NOT NULL,
	[estado] [nvarchar](50) NULL,
	[edaddiagnostico] [int] NULL,
	[observaciones] [nvarchar](max) NULL,
	[fecharegistro] [datetime2](7) NOT NULL,
	[confirmado] [bit] NOT NULL,
	[fuente] [nvarchar](100) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[antecedenteid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[habitoespecifico]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[habitoespecifico](
	[habitoid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[tipohabitoid] [int] NOT NULL,
	[categoria] [nvarchar](80) NULL,
	[nivel] [nvarchar](80) NULL,
	[frecuencia] [nvarchar](100) NULL,
	[cantidad] [decimal](10, 2) NULL,
	[unidad] [nvarchar](30) NULL,
	[inicio] [date] NULL,
	[fin] [date] NULL,
	[impactosalud] [nvarchar](150) NULL,
	[observaciones] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[habitoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[estilovida]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[estilovida](
	[estilovidaid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[fecharegistro] [date] NOT NULL,
	[alimentacion] [nvarchar](200) NULL,
	[actividadfisica] [nvarchar](200) NULL,
	[consumoalcohol] [nvarchar](100) NULL,
	[consumotabaco] [nvarchar](100) NULL,
	[horassueno] [decimal](4, 2) NULL,
	[estres] [nvarchar](100) NULL,
	[notas] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[estilovidaid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  View [dbo].[vw_patrones_estilo_salud]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   VIEW [dbo].[vw_patrones_estilo_salud] AS
SELECT
    CONVERT(varchar(64), HASHBYTES('SHA2_256',
        CONCAT(p.pacienteid, '|', ISNULL(p.tipodocumento,''), '|', ISNULL(p.numerodocumento,''))), 2) AS paciente_hash,
    DATEDIFF(year, p.fechanacimiento, CAST(GETDATE() AS date)) AS edad_aproximada,
    p.sexo,
    -- Estilo de vida
    ev.avg_horas_sueno,
    ev.promedio_estres,
    ev.frecuencia_tabaco,
    ev.frecuencia_alcohol,
    -- Hábitos específicos
    he.total_habitos,
    he.habitos_con_impacto,
    -- Condiciones crónicas
    cc.condiciones_activas,
    cc.condicion_principal,
    -- Antecedentes familiares
    af.total_antecedentes,
    af.principales_antecedentes
FROM paciente p
LEFT JOIN (
    SELECT
        pacienteid,
        AVG(COALESCE(horassueno, 0))                      AS avg_horas_sueno,
        AVG(CASE WHEN estres IS NULL THEN 0 ELSE TRY_CONVERT(int, estres) END) AS promedio_estres,
        MAX(CASE WHEN LOWER(COALESCE(consumotabaco,'')) NOT IN ('', 'n', 'no') THEN 1 ELSE 0 END) AS frecuencia_tabaco,
        MAX(CASE WHEN LOWER(COALESCE(consumoalcohol,'')) NOT IN ('', 'n', 'no') THEN 1 ELSE 0 END) AS frecuencia_alcohol
    FROM estilovida
    GROUP BY pacienteid
) ev ON ev.pacienteid = p.pacienteid
LEFT JOIN (
    SELECT
        pacienteid,
        COUNT(*) AS total_habitos,
        SUM(CASE WHEN impactosalud IS NOT NULL AND impactosalud <> '' THEN 1 ELSE 0 END) AS habitos_con_impacto
    FROM habitoespecifico
    GROUP BY pacienteid
) he ON he.pacienteid = p.pacienteid
LEFT JOIN (
    SELECT
        pacienteid,
        COUNT(*) AS condiciones_activas,
        MAX(CASE WHEN estado = 'activa' THEN tipocondicionid ELSE NULL END) AS condicion_principal
    FROM condicioncronica
    WHERE estado = 'activa'
    GROUP BY pacienteid
) cc ON cc.pacienteid = p.pacienteid
LEFT JOIN (
    SELECT
        pacienteid,
        COUNT(*) AS total_antecedentes,
        STRING_AGG(condicion, ', ') WITHIN GROUP (ORDER BY condicion) AS principales_antecedentes
    FROM antecedentefamiliar
    GROUP BY pacienteid
) af ON af.pacienteid = p.pacienteid;
GO
/****** Object:  Table [dbo].[adherenciacronica]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[adherenciacronica](
	[adherenciacronicaid] [int] IDENTITY(1,1) NOT NULL,
	[condicioncronicaid] [int] NOT NULL,
	[medicacionid] [int] NULL,
	[fechaevento] [datetime2](7) NOT NULL,
	[tipo] [nvarchar](60) NOT NULL,
	[porcentaje] [decimal](5, 2) NULL,
	[estado] [nvarchar](40) NULL,
	[descripcion] [nvarchar](200) NULL,
	[observaciones] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[adherenciacronicaid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[controlcronico]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[controlcronico](
	[controlcronicoid] [int] IDENTITY(1,1) NOT NULL,
	[condicioncronicaid] [int] NOT NULL,
	[fechacontrol] [datetime2](7) NOT NULL,
	[indicador] [nvarchar](120) NULL,
	[valor] [decimal](10, 2) NULL,
	[unidad] [nvarchar](40) NULL,
	[resultado] [nvarchar](150) NULL,
	[conclusiones] [nvarchar](max) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[proximocontrol] [date] NULL,
	[medico] [nvarchar](120) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[controlcronicoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[controlprenatal]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[controlprenatal](
	[controlid] [int] IDENTITY(1,1) NOT NULL,
	[embarazoid] [int] NOT NULL,
	[fechacontrol] [date] NOT NULL,
	[semanagestacion] [int] NULL,
	[presionarterial] [nvarchar](20) NULL,
	[peso] [decimal](6, 2) NULL,
	[fetalheartrate] [int] NULL,
	[intervenciones] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[controlid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[desparasitacion]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[desparasitacion](
	[desparasitacionid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[fecha] [date] NOT NULL,
	[producto] [nvarchar](150) NOT NULL,
	[dosis] [nvarchar](80) NULL,
	[proximafecha] [date] NULL,
	[observaciones] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[desparasitacionid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[detalleevaluacionsalud]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[detalleevaluacionsalud](
	[detalleid] [int] IDENTITY(1,1) NOT NULL,
	[evaluacionid] [int] NOT NULL,
	[habitoid] [int] NULL,
	[componente] [nvarchar](80) NULL,
	[peso] [decimal](5, 2) NULL,
	[comentario] [nvarchar](200) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[detalleid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[documentoclinico]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[documentoclinico](
	[documentoid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[tipodocumentoid] [int] NOT NULL,
	[entidadorigen] [nvarchar](80) NOT NULL,
	[entidadid] [int] NULL,
	[rutaarchivo] [nvarchar](260) NULL,
	[urlexterna] [nvarchar](300) NULL,
	[fechadocumento] [date] NULL,
	[notas] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[documentoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[embarazo]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[embarazo](
	[embarazoid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[fechainicio] [date] NOT NULL,
	[fechaprobableparto] [date] NULL,
	[numerocontrol] [int] NULL,
	[riesgo] [nvarchar](100) NULL,
	[estado] [nvarchar](40) NOT NULL,
	[notas] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[embarazoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[especialidad]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[especialidad](
	[especialidadid] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](120) NOT NULL,
	[descripcion] [nvarchar](200) NULL,
	[activo] [bit] NOT NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[especialidadid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombre] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[evaluacionsaludhabito]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[evaluacionsaludhabito](
	[evaluacionid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[fecha] [datetime2](7) NOT NULL,
	[puntaje] [decimal](5, 2) NOT NULL,
	[categoria] [nvarchar](80) NULL,
	[resumen] [nvarchar](200) NULL,
	[detalle] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[evaluacionid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[horariomedicamento]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[horariomedicamento](
	[horariomedicamentoid] [int] IDENTITY(1,1) NOT NULL,
	[medicacionid] [int] NOT NULL,
	[horaprogramada] [time](7) NOT NULL,
	[frecuencia] [nvarchar](80) NULL,
	[diasemana] [tinyint] NULL,
	[generarecordatorio] [bit] NOT NULL,
	[proximaalarma] [datetime2](7) NULL,
	[estadorecordatorio] [nvarchar](30) NOT NULL,
	[ultimoenvio] [datetime2](7) NULL,
	[observaciones] [nvarchar](300) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[horariomedicamentoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[lesion]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[lesion](
	[lesionid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[tipolesionid] [int] NULL,
	[fechalesion] [date] NOT NULL,
	[tipo] [nvarchar](120) NOT NULL,
	[partecuerpo] [nvarchar](120) NULL,
	[severidad] [nvarchar](50) NULL,
	[tratamiento] [nvarchar](max) NULL,
	[recuperado] [bit] NOT NULL,
	[notas] [nvarchar](max) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[lesionid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[notificacion]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[notificacion](
	[notificacionid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[tipo] [nvarchar](80) NOT NULL,
	[mensaje] [nvarchar](300) NOT NULL,
	[fechaprogramada] [datetime2](7) NOT NULL,
	[enviada] [bit] NOT NULL,
	[medio] [nvarchar](50) NULL,
	[entidadorigen] [nvarchar](80) NULL,
	[entidadid] [int] NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[notificacionid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[objetivocronico]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[objetivocronico](
	[objetivocronicoid] [int] IDENTITY(1,1) NOT NULL,
	[condicioncronicaid] [int] NOT NULL,
	[descripcion] [nvarchar](200) NOT NULL,
	[indicador] [nvarchar](120) NULL,
	[valormeta] [decimal](10, 2) NULL,
	[unidad] [nvarchar](40) NULL,
	[fechalimite] [date] NULL,
	[estado] [nvarchar](40) NOT NULL,
	[cumplido] [bit] NOT NULL,
	[observaciones] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[objetivocronicoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[operacion]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[operacion](
	[operacionid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[tipooperacionid] [int] NULL,
	[fechaoperacion] [date] NOT NULL,
	[tipo] [nvarchar](150) NOT NULL,
	[hospital] [nvarchar](150) NULL,
	[cirujano] [nvarchar](120) NULL,
	[resultado] [nvarchar](max) NULL,
	[complicaciones] [nvarchar](max) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[estado] [nvarchar](40) NOT NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[operacionid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[permiso]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[permiso](
	[permisoid] [int] IDENTITY(1,1) NOT NULL,
	[codigo] [nvarchar](80) NOT NULL,
	[descripcion] [nvarchar](200) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[permisoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[codigo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[permisoacceso]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[permisoacceso](
	[permisoid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[medicoid] [int] NOT NULL,
	[tipo] [nvarchar](20) NOT NULL,
	[duracion] [nvarchar](5) NULL,
	[fechainicio] [datetime2](7) NOT NULL,
	[fechafin] [datetime2](7) NULL,
	[estado] [nvarchar](20) NOT NULL,
	[notas] [nvarchar](200) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[permisoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[permisoacceso_token]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[permisoacceso_token](
	[id] [uniqueidentifier] NOT NULL,
	[token] [nvarchar](128) NOT NULL,
	[permisoid] [int] NOT NULL,
	[expiraen] [datetime2](7) NOT NULL,
	[usado] [bit] NOT NULL,
	[usadopor] [int] NULL,
	[usadoen] [datetime2](7) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadoen] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[token] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[puntajeriesgo]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[puntajeriesgo](
	[puntajeriesgoid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[consultaid] [int] NULL,
	[tipo] [nvarchar](120) NOT NULL,
	[valordecimal] [decimal](10, 2) NULL,
	[valortexto] [nvarchar](100) NULL,
	[unidad] [nvarchar](40) NULL,
	[rangoreferencia] [nvarchar](80) NULL,
	[clasificacion] [nvarchar](80) NULL,
	[fechamedicion] [datetime2](7) NOT NULL,
	[observaciones] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[puntajeriesgoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[registrodental]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[registrodental](
	[registrodentalid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[fechaatencion] [datetime2](7) NOT NULL,
	[procedimiento] [nvarchar](200) NOT NULL,
	[diagnostico] [nvarchar](200) NULL,
	[odontologo] [nvarchar](120) NULL,
	[piezastratadas] [nvarchar](100) NULL,
	[notas] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[registrodentalid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[registromensual]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[registromensual](
	[registromensualid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[mes] [int] NULL,
	[anio] [int] NOT NULL,
	[fechainicio] [date] NOT NULL,
	[duraciondias] [int] NULL,
	[dolor] [nvarchar](100) NULL,
	[sintomas] [nvarchar](max) NULL,
	[observaciones] [nvarchar](max) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[registromensualid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[rol]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[rol](
	[rolid] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](80) NOT NULL,
	[descripcion] [nvarchar](200) NULL,
	[activo] [bit] NOT NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[rolid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombre] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[rolpermiso]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[rolpermiso](
	[rolid] [int] NOT NULL,
	[permisoid] [int] NOT NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[rolid] ASC,
	[permisoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tipocondicioncronica]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tipocondicioncronica](
	[tipocondicionid] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](120) NOT NULL,
	[descripcion] [nvarchar](200) NULL,
	[categoria] [nvarchar](80) NULL,
	[activo] [bit] NOT NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[tipocondicionid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombre] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tipodocumentoclinico]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tipodocumentoclinico](
	[tipodocumentoid] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](120) NOT NULL,
	[descripcion] [nvarchar](200) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[tipodocumentoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombre] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tipohabito]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tipohabito](
	[tipohabitoid] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](120) NOT NULL,
	[categoria] [nvarchar](80) NULL,
	[descripcion] [nvarchar](200) NULL,
	[activo] [bit] NOT NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[tipohabitoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombre] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tipolesion]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tipolesion](
	[tipolesionid] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](150) NOT NULL,
	[descripcion] [nvarchar](200) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[tipolesionid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombre] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tipooperacion]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tipooperacion](
	[tipooperacionid] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](150) NOT NULL,
	[area] [nvarchar](120) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[tipooperacionid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombre] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tipovacuna]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tipovacuna](
	[tipovacunaid] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](150) NOT NULL,
	[dosisrequeridas] [int] NULL,
	[intervalodias] [int] NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[tipovacunaid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombre] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[tokenrevocado]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tokenrevocado](
	[tokenrevocadoid] [int] IDENTITY(1,1) NOT NULL,
	[jti] [nvarchar](128) NOT NULL,
	[usuarioid] [int] NOT NULL,
	[expira] [datetime2](7) NOT NULL,
	[motivo] [nvarchar](120) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[tokenrevocadoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[jti] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[usuario]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[usuario](
	[usuarioid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NULL,
	[nombreusuario] [nvarchar](60) NOT NULL,
	[hashpassword] [varbinary](256) NOT NULL,
	[huelladigitalhash] [varbinary](64) NULL,
	[rolprincipal] [nvarchar](40) NOT NULL,
	[activo] [bit] NOT NULL,
	[ultimoingreso] [datetime2](7) NULL,
	[fechacreacion] [datetime2](7) NOT NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[usuarioid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[nombreusuario] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[medicoregistro]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[medicoregistro](
	[medicoregistroid] [int] IDENTITY(1,1) NOT NULL,
	[usuarioid] [int] NOT NULL,
	[codigominsa] [nvarchar](40) NULL,
	[numerolicencia] [nvarchar](80) NOT NULL,
	[entidadcertificadora] [nvarchar](120) NULL,
	[especialidadprincipal] [nvarchar](120) NULL,
	[documentorespaldo] [nvarchar](260) NULL,
	[fotocodigominsa] [varbinary](max) NULL,
	[fototitulo] [varbinary](max) NULL,
	[estado] [nvarchar](30) NOT NULL,
	[fechasolicitud] [datetime2](7) NOT NULL,
	[fecharevision] [datetime2](7) NULL,
	[observaciones] [nvarchar](400) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED
(
	[medicoregistroid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 UNIQUE NONCLUSTERED
(
	[usuarioid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[usuariopaciente]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[usuariopaciente](
	[usuariopacienteid] [int] IDENTITY(1,1) NOT NULL,
	[usuarioid] [int] NOT NULL,
	[pacienteid] [int] NOT NULL,
	[parentesco] [nvarchar](80) NULL,
	[esprincipal] [bit] NOT NULL,
	[notas] [nvarchar](200) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[usuariopacienteid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [ux_usuariopaciente] UNIQUE NONCLUSTERED 
(
	[usuarioid] ASC,
	[pacienteid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[usuariorol]    Script Date: 29 mar. 2026 14:49:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[usuariorol](
	[usuariorolid] [int] IDENTITY(1,1) NOT NULL,
	[usuarioid] [int] NOT NULL,
	[rolid] [int] NOT NULL,
	[fechaasignacion] [datetime2](7) NOT NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[evidenciafotografica] [varbinary](max) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[usuariorolid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
 CONSTRAINT [ux_usuariorol] UNIQUE NONCLUSTERED 
(
	[usuarioid] ASC,
	[rolid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [ux_permisoacceso_activo]    Script Date: 29 mar. 2026 14:49:14 ******/
CREATE UNIQUE NONCLUSTERED INDEX [ux_permisoacceso_activo] ON [dbo].[permisoacceso]
(
	[pacienteid] ASC,
	[medicoid] ASC,
	[estado] ASC
)
WHERE ([estado]='activo')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[adherenciacronica] ADD  DEFAULT (sysdatetime()) FOR [fechaevento]
GO
ALTER TABLE [dbo].[adherenciacronica] ADD  DEFAULT ('medicacion') FOR [tipo]
GO
ALTER TABLE [dbo].[adherenciacronica] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[alergia] ADD  DEFAULT ('activa') FOR [estado]
GO
ALTER TABLE [dbo].[alergia] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[antecedentefamiliar] ADD  DEFAULT (sysdatetime()) FOR [fecharegistro]
GO
ALTER TABLE [dbo].[antecedentefamiliar] ADD  DEFAULT ((0)) FOR [confirmado]
GO
ALTER TABLE [dbo].[antecedentefamiliar] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[citamedica] ADD  DEFAULT ('programada') FOR [estado]
GO
ALTER TABLE [dbo].[citamedica] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[condicioncronica] ADD  DEFAULT ('activa') FOR [estado]
GO
ALTER TABLE [dbo].[condicioncronica] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[consultamedica] ADD  DEFAULT ('firmada') FOR [estado]
GO
ALTER TABLE [dbo].[consultamedica] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[controlcronico] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[controlprenatal] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[desparasitacion] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[detalleevaluacionsalud] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[documentoclinico] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[embarazo] ADD  DEFAULT ('activo') FOR [estado]
GO
ALTER TABLE [dbo].[embarazo] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[especialidad] ADD  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [dbo].[especialidad] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[estilovida] ADD  DEFAULT (CONVERT([date],getdate())) FOR [fecharegistro]
GO
ALTER TABLE [dbo].[estilovida] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[evaluacionsaludhabito] ADD  DEFAULT (sysdatetime()) FOR [fecha]
GO
ALTER TABLE [dbo].[evaluacionsaludhabito] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[habitoespecifico] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[horariomedicamento] ADD  DEFAULT ((1)) FOR [generarecordatorio]
GO
ALTER TABLE [dbo].[horariomedicamento] ADD  DEFAULT ('pendiente') FOR [estadorecordatorio]
GO
ALTER TABLE [dbo].[horariomedicamento] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[lesion] ADD  DEFAULT ((0)) FOR [recuperado]
GO
ALTER TABLE [dbo].[lesion] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[medicacion] ADD  DEFAULT ((1)) FOR [medicacionactiva]
GO
ALTER TABLE [dbo].[medicacion] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[notificacion] ADD  DEFAULT ((0)) FOR [enviada]
GO
ALTER TABLE [dbo].[notificacion] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[objetivocronico] ADD  DEFAULT ('pendiente') FOR [estado]
GO
ALTER TABLE [dbo].[objetivocronico] ADD  DEFAULT ((0)) FOR [cumplido]
GO
ALTER TABLE [dbo].[objetivocronico] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[operacion] ADD  DEFAULT ('programada') FOR [estado]
GO
ALTER TABLE [dbo].[operacion] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[paciente] ADD  DEFAULT (sysdatetime()) FOR [fecharegistro]
GO
ALTER TABLE [dbo].[paciente] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[permiso] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[permisoacceso] ADD  DEFAULT (sysdatetime()) FOR [fechainicio]
GO
ALTER TABLE [dbo].[permisoacceso] ADD  DEFAULT ('activo') FOR [estado]
GO
ALTER TABLE [dbo].[permisoacceso] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[permisoacceso_token] ADD  DEFAULT (newid()) FOR [id]
GO
ALTER TABLE [dbo].[permisoacceso_token] ADD  DEFAULT ((0)) FOR [usado]
GO
ALTER TABLE [dbo].[permisoacceso_token] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[puntajeriesgo] ADD  DEFAULT (sysdatetime()) FOR [fechamedicion]
GO
ALTER TABLE [dbo].[puntajeriesgo] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[recordatoriocita] ADD  DEFAULT ('pendiente') FOR [estado]
GO
ALTER TABLE [dbo].[recordatoriocita] ADD  DEFAULT ((0)) FOR [intentos]
GO
ALTER TABLE [dbo].[recordatoriocita] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[registrodental] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[registromensual] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[rol] ADD  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [dbo].[rol] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[rolpermiso] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[tipocondicioncronica] ADD  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [dbo].[tipocondicioncronica] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[tipodocumentoclinico] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[tipohabito] ADD  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [dbo].[tipohabito] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[tipolesion] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[tipooperacion] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[tipovacuna] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[tokenrevocado] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[usuario] ADD  DEFAULT ('paciente') FOR [rolprincipal]
GO
ALTER TABLE [dbo].[usuario] ADD  DEFAULT ((1)) FOR [activo]
GO
ALTER TABLE [dbo].[usuario] ADD  DEFAULT (sysdatetime()) FOR [fechacreacion]
GO
ALTER TABLE [dbo].[usuario] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[medicoregistro] ADD  DEFAULT ('pendiente') FOR [estado]
GO
ALTER TABLE [dbo].[medicoregistro] ADD  DEFAULT (sysdatetime()) FOR [fechasolicitud]
GO
ALTER TABLE [dbo].[medicoregistro] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[usuariopaciente] ADD  DEFAULT ((0)) FOR [esprincipal]
GO
ALTER TABLE [dbo].[usuariopaciente] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[usuariorol] ADD  DEFAULT (sysdatetime()) FOR [fechaasignacion]
GO
ALTER TABLE [dbo].[usuariorol] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[vacuna] ADD  DEFAULT (sysdatetime()) FOR [creadoen]
GO
ALTER TABLE [dbo].[adherenciacronica]  WITH CHECK ADD FOREIGN KEY([condicioncronicaid])
REFERENCES [dbo].[condicioncronica] ([condicioncronicaid])
GO
ALTER TABLE [dbo].[adherenciacronica]  WITH CHECK ADD FOREIGN KEY([medicacionid])
REFERENCES [dbo].[medicacion] ([medicacionid])
GO
ALTER TABLE [dbo].[alergia]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[antecedentefamiliar]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[citamedica]  WITH CHECK ADD FOREIGN KEY([especialidadid])
REFERENCES [dbo].[especialidad] ([especialidadid])
GO
ALTER TABLE [dbo].[citamedica]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[condicioncronica]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[condicioncronica]  WITH CHECK ADD FOREIGN KEY([tipocondicionid])
REFERENCES [dbo].[tipocondicioncronica] ([tipocondicionid])
GO
ALTER TABLE [dbo].[consultamedica]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[controlcronico]  WITH CHECK ADD FOREIGN KEY([condicioncronicaid])
REFERENCES [dbo].[condicioncronica] ([condicioncronicaid])
GO
ALTER TABLE [dbo].[controlprenatal]  WITH CHECK ADD FOREIGN KEY([embarazoid])
REFERENCES [dbo].[embarazo] ([embarazoid])
GO
ALTER TABLE [dbo].[desparasitacion]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[detalleevaluacionsalud]  WITH CHECK ADD FOREIGN KEY([evaluacionid])
REFERENCES [dbo].[evaluacionsaludhabito] ([evaluacionid])
GO
ALTER TABLE [dbo].[detalleevaluacionsalud]  WITH CHECK ADD FOREIGN KEY([habitoid])
REFERENCES [dbo].[habitoespecifico] ([habitoid])
GO
ALTER TABLE [dbo].[documentoclinico]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[documentoclinico]  WITH CHECK ADD FOREIGN KEY([tipodocumentoid])
REFERENCES [dbo].[tipodocumentoclinico] ([tipodocumentoid])
GO
ALTER TABLE [dbo].[embarazo]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[estilovida]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[evaluacionsaludhabito]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[habitoespecifico]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[habitoespecifico]  WITH CHECK ADD FOREIGN KEY([tipohabitoid])
REFERENCES [dbo].[tipohabito] ([tipohabitoid])
GO
ALTER TABLE [dbo].[horariomedicamento]  WITH CHECK ADD FOREIGN KEY([medicacionid])
REFERENCES [dbo].[medicacion] ([medicacionid])
GO
ALTER TABLE [dbo].[lesion]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[lesion]  WITH CHECK ADD FOREIGN KEY([tipolesionid])
REFERENCES [dbo].[tipolesion] ([tipolesionid])
GO
ALTER TABLE [dbo].[medicacion]  WITH CHECK ADD FOREIGN KEY([consultaid])
REFERENCES [dbo].[consultamedica] ([consultaid])
GO
ALTER TABLE [dbo].[medicacion]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[notificacion]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[objetivocronico]  WITH CHECK ADD FOREIGN KEY([condicioncronicaid])
REFERENCES [dbo].[condicioncronica] ([condicioncronicaid])
GO
ALTER TABLE [dbo].[operacion]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[operacion]  WITH CHECK ADD FOREIGN KEY([tipooperacionid])
REFERENCES [dbo].[tipooperacion] ([tipooperacionid])
GO
ALTER TABLE [dbo].[permisoacceso]  WITH CHECK ADD FOREIGN KEY([medicoid])
REFERENCES [dbo].[usuario] ([usuarioid])
GO
ALTER TABLE [dbo].[permisoacceso]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[permisoacceso_token]  WITH CHECK ADD FOREIGN KEY([permisoid])
REFERENCES [dbo].[permisoacceso] ([permisoid])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[puntajeriesgo]  WITH CHECK ADD FOREIGN KEY([consultaid])
REFERENCES [dbo].[consultamedica] ([consultaid])
GO
ALTER TABLE [dbo].[puntajeriesgo]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[recordatoriocita]  WITH CHECK ADD FOREIGN KEY([citaid])
REFERENCES [dbo].[citamedica] ([citaid])
GO
ALTER TABLE [dbo].[recordatoriocita]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[registrodental]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[registromensual]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[rolpermiso]  WITH CHECK ADD FOREIGN KEY([permisoid])
REFERENCES [dbo].[permiso] ([permisoid])
GO
ALTER TABLE [dbo].[rolpermiso]  WITH CHECK ADD FOREIGN KEY([rolid])
REFERENCES [dbo].[rol] ([rolid])
GO
ALTER TABLE [dbo].[tokenrevocado]  WITH CHECK ADD FOREIGN KEY([usuarioid])
REFERENCES [dbo].[usuario] ([usuarioid])
GO
ALTER TABLE [dbo].[usuario]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[usuariopaciente]  WITH CHECK ADD  CONSTRAINT [fk_usuariopaciente_paciente] FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[usuariopaciente] CHECK CONSTRAINT [fk_usuariopaciente_paciente]
GO
ALTER TABLE [dbo].[usuariopaciente]  WITH CHECK ADD  CONSTRAINT [fk_usuariopaciente_usuario] FOREIGN KEY([usuarioid])
REFERENCES [dbo].[usuario] ([usuarioid])
GO
ALTER TABLE [dbo].[usuariopaciente] CHECK CONSTRAINT [fk_usuariopaciente_usuario]
GO
ALTER TABLE [dbo].[usuariorol]  WITH CHECK ADD FOREIGN KEY([rolid])
REFERENCES [dbo].[rol] ([rolid])
GO
ALTER TABLE [dbo].[usuariorol]  WITH CHECK ADD FOREIGN KEY([usuarioid])
REFERENCES [dbo].[usuario] ([usuarioid])
GO
ALTER TABLE [dbo].[medicoregistro]  WITH CHECK ADD FOREIGN KEY([usuarioid])
REFERENCES [dbo].[usuario] ([usuarioid])
GO
ALTER TABLE [dbo].[vacuna]  WITH CHECK ADD FOREIGN KEY([pacienteid])
REFERENCES [dbo].[paciente] ([pacienteid])
GO
ALTER TABLE [dbo].[vacuna]  WITH CHECK ADD FOREIGN KEY([tipovacunaid])
REFERENCES [dbo].[tipovacuna] ([tipovacunaid])
GO
ALTER TABLE [dbo].[adherenciacronica]  WITH CHECK ADD  CONSTRAINT [ck_adherenciacronica_estado] CHECK  (([estado] IS NULL OR ([estado]='omitido' OR [estado]='parcial' OR [estado]='completo')))
GO
ALTER TABLE [dbo].[adherenciacronica] CHECK CONSTRAINT [ck_adherenciacronica_estado]
GO
ALTER TABLE [dbo].[adherenciacronica]  WITH CHECK ADD  CONSTRAINT [ck_adherenciacronica_tipo] CHECK  (([tipo]='autocontrol' OR [tipo]='estilo de vida' OR [tipo]='medicacion'))
GO
ALTER TABLE [dbo].[adherenciacronica] CHECK CONSTRAINT [ck_adherenciacronica_tipo]
GO
ALTER TABLE [dbo].[alergia]  WITH CHECK ADD  CONSTRAINT [ck_alergia_estado] CHECK  (([estado]='inactiva' OR [estado]='activa'))
GO
ALTER TABLE [dbo].[alergia] CHECK CONSTRAINT [ck_alergia_estado]
GO
ALTER TABLE [dbo].[citamedica]  WITH CHECK ADD  CONSTRAINT [ck_cita_estado] CHECK  (([estado]='no asistio' OR [estado]='cancelada' OR [estado]='completada' OR [estado]='programada'))
GO
ALTER TABLE [dbo].[citamedica] CHECK CONSTRAINT [ck_cita_estado]
GO
ALTER TABLE [dbo].[condicioncronica]  WITH CHECK ADD  CONSTRAINT [ck_condicioncronica_estado] CHECK  (([estado]='resuelta' OR [estado]='remision' OR [estado]='activa'))
GO
ALTER TABLE [dbo].[condicioncronica] CHECK CONSTRAINT [ck_condicioncronica_estado]
GO
ALTER TABLE [dbo].[consultamedica]  WITH CHECK ADD  CONSTRAINT [ck_consulta_estado] CHECK  (([estado]='anulada' OR [estado]='firmada' OR [estado]='borrador'))
GO
ALTER TABLE [dbo].[consultamedica] CHECK CONSTRAINT [ck_consulta_estado]
GO
ALTER TABLE [dbo].[documentoclinico]  WITH CHECK ADD  CONSTRAINT [ck_documento_origen] CHECK  (([entidadorigen]='general' OR [entidadorigen]='vacuna' OR [entidadorigen]='citamedica' OR [entidadorigen]='operacion' OR [entidadorigen]='lesion' OR [entidadorigen]='consultamedica'))
GO
ALTER TABLE [dbo].[documentoclinico] CHECK CONSTRAINT [ck_documento_origen]
GO
ALTER TABLE [dbo].[embarazo]  WITH CHECK ADD  CONSTRAINT [ck_embarazo_estado] CHECK  (([estado]='abortado' OR [estado]='cerrado' OR [estado]='activo'))
GO
ALTER TABLE [dbo].[embarazo] CHECK CONSTRAINT [ck_embarazo_estado]
GO
ALTER TABLE [dbo].[horariomedicamento]  WITH CHECK ADD CHECK  (([diasemana]>=(1) AND [diasemana]<=(7)))
GO
ALTER TABLE [dbo].[horariomedicamento]  WITH CHECK ADD  CONSTRAINT [ck_horariomedicamento_estado] CHECK  (([estadorecordatorio]='cancelado' OR [estadorecordatorio]='snoozed' OR [estadorecordatorio]='enviado' OR [estadorecordatorio]='programado' OR [estadorecordatorio]='pendiente'))
GO
ALTER TABLE [dbo].[horariomedicamento] CHECK CONSTRAINT [ck_horariomedicamento_estado]
GO
ALTER TABLE [dbo].[medicacion]  WITH CHECK ADD  CONSTRAINT [ck_medicacion_fechas] CHECK  (([fechafin] IS NULL OR [fechafin]>=[fechainicio]))
GO
ALTER TABLE [dbo].[medicacion] CHECK CONSTRAINT [ck_medicacion_fechas]
GO
ALTER TABLE [dbo].[objetivocronico]  WITH CHECK ADD  CONSTRAINT [ck_objetivocronico_estado] CHECK  (([estado]='cancelado' OR [estado]='logrado' OR [estado]='en progreso' OR [estado]='pendiente'))
GO
ALTER TABLE [dbo].[objetivocronico] CHECK CONSTRAINT [ck_objetivocronico_estado]
GO
ALTER TABLE [dbo].[operacion]  WITH CHECK ADD  CONSTRAINT [ck_operacion_estado] CHECK  (([estado]='cancelada' OR [estado]='completada' OR [estado]='en curso' OR [estado]='programada'))
GO
ALTER TABLE [dbo].[operacion] CHECK CONSTRAINT [ck_operacion_estado]
GO
ALTER TABLE [dbo].[paciente]  WITH CHECK ADD CHECK  (([sexo]='f' OR [sexo]='m'))
GO
ALTER TABLE [dbo].[permisoacceso]  WITH CHECK ADD CHECK  (([estado]='expirado' OR [estado]='revocado' OR [estado]='activo'))
GO
ALTER TABLE [dbo].[permisoacceso]  WITH CHECK ADD CHECK  (([tipo]='permanente' OR [tipo]='temporal'))
GO
ALTER TABLE [dbo].[recordatoriocita]  WITH CHECK ADD  CONSTRAINT [ck_recordatoriocita_estado] CHECK  (([estado]='cancelado' OR [estado]='enviado' OR [estado]='programado' OR [estado]='pendiente'))
GO
ALTER TABLE [dbo].[recordatoriocita] CHECK CONSTRAINT [ck_recordatoriocita_estado]
GO
ALTER TABLE [dbo].[medicoregistro]  WITH CHECK ADD  CONSTRAINT [ck_medicoregistro_estado] CHECK  (([estado]='pendiente' OR [estado]='aprobado' OR [estado]='rechazado'))
GO
ALTER TABLE [dbo].[medicoregistro] CHECK CONSTRAINT [ck_medicoregistro_estado]
GO
ALTER TABLE [dbo].[registromensual]  WITH CHECK ADD CHECK  (([mes]>=(1) AND [mes]<=(12)))
GO
/****** Object:  Table [dbo].[examenclinico]    Script Date: 4 may. 2026 12:00:00 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[examenclinico](
	[examenclinicoid] [int] IDENTITY(1,1) NOT NULL,
	[pacienteid] [int] NOT NULL,
	[consultaid] [int] NULL,
	[nombreexamen] [nvarchar](160) NOT NULL,
	[tipoexamen] [nvarchar](120) NULL,
	[laboratorio] [nvarchar](160) NULL,
	[fechaexamen] [date] NOT NULL,
	[fecharesultado] [date] NULL,
	[resultadotexto] [nvarchar](max) NULL,
	[observaciones] [nvarchar](max) NULL,
	[archivopdf] [varbinary](max) NULL,
	[nombrearchivopdf] [nvarchar](260) NULL,
	[mimearchivopdf] [nvarchar](100) NULL,
	[creadopor] [nvarchar](60) NULL,
	[creadoen] [datetime2](7) NOT NULL,
	[modificadopor] [nvarchar](60) NULL,
	[modificadoen] [datetime2](7) NULL,
	[campoprueba01] [nvarchar](200) NULL,
	[campoprueba02] [nvarchar](200) NULL,
	[campoprueba03] [nvarchar](200) NULL,
	[campoprueba04] [nvarchar](200) NULL,
	[campoprueba05] [nvarchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
	[examenclinicoid] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_examenclinico_paciente_fecha] ON [dbo].[examenclinico]
(
	[pacienteid] ASC,
	[fechaexamen] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
USE [master]
GO
ALTER DATABASE [gestionsalud] SET  READ_WRITE 
GO
