/*
  Amplía embarazo con los datos obstétricos del formulario clínico.
  Es idempotente y conserva las columnas y los registros existentes.
*/

IF COL_LENGTH('dbo.embarazo', 'metodocalculofpp') IS NULL
  ALTER TABLE dbo.embarazo ADD metodocalculofpp nvarchar(80) NULL;

IF COL_LENGTH('dbo.embarazo', 'fechaprimerultrasonido') IS NULL
  ALTER TABLE dbo.embarazo ADD fechaprimerultrasonido date NULL;

IF COL_LENGTH('dbo.embarazo', 'edadgestacionalprimerussemanas') IS NULL
  ALTER TABLE dbo.embarazo ADD edadgestacionalprimerussemanas int NULL;

IF COL_LENGTH('dbo.embarazo', 'edadgestacionalprimerusdias') IS NULL
  ALTER TABLE dbo.embarazo ADD edadgestacionalprimerusdias int NULL;

IF COL_LENGTH('dbo.embarazo', 'numerofetos') IS NULL
  ALTER TABLE dbo.embarazo ADD numerofetos int NULL;

IF COL_LENGTH('dbo.embarazo', 'embarazoplanificado') IS NULL
  ALTER TABLE dbo.embarazo ADD embarazoplanificado bit NULL;

IF COL_LENGTH('dbo.embarazo', 'embarazosanteriores') IS NULL
  ALTER TABLE dbo.embarazo ADD embarazosanteriores int NULL;

IF COL_LENGTH('dbo.embarazo', 'partosanteriores') IS NULL
  ALTER TABLE dbo.embarazo ADD partosanteriores int NULL;

IF COL_LENGTH('dbo.embarazo', 'abortosanteriores') IS NULL
  ALTER TABLE dbo.embarazo ADD abortosanteriores int NULL;

IF COL_LENGTH('dbo.embarazo', 'cesareasanteriores') IS NULL
  ALTER TABLE dbo.embarazo ADD cesareasanteriores int NULL;

IF COL_LENGTH('dbo.embarazo', 'gruposanguineo') IS NULL
  ALTER TABLE dbo.embarazo ADD gruposanguineo nvarchar(3) NULL;

IF COL_LENGTH('dbo.embarazo', 'factorrh') IS NULL
  ALTER TABLE dbo.embarazo ADD factorrh nvarchar(8) NULL;

IF COL_LENGTH('dbo.embarazo', 'antecedentesrelevantes') IS NULL
  ALTER TABLE dbo.embarazo ADD antecedentesrelevantes nvarchar(max) NULL;

IF COL_LENGTH('dbo.embarazo', 'medicoresponsable') IS NULL
  ALTER TABLE dbo.embarazo ADD medicoresponsable nvarchar(150) NULL;

IF COL_LENGTH('dbo.embarazo', 'centromedico') IS NULL
  ALTER TABLE dbo.embarazo ADD centromedico nvarchar(200) NULL;
