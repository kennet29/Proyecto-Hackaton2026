IF OBJECT_ID(N'[dbo].[examenclinico]', N'U') IS NULL
BEGIN
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
    CONSTRAINT [PK_examenclinico] PRIMARY KEY CLUSTERED ([examenclinicoid] ASC)
  ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];

  CREATE INDEX [IX_examenclinico_paciente_fecha]
    ON [dbo].[examenclinico]([pacienteid] ASC, [fechaexamen] DESC);
END
