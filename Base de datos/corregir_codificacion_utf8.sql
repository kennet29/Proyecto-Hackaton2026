/*
  Repara texto UTF-8 que fue interpretado por error como Windows-1252.
  Ejecutar con sqlcmd -f 65001 para que este archivo se lea en UTF-8.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;

DECLARE @sql nvarchar(max) = N'';
DECLARE @expresion nvarchar(max) =
  N'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE('
  + N'REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE({campo},'
  + N' N''Ã¡'', N''á''), N''Ã©'', N''é''), N''Ã­'', N''í''), N''Ã³'', N''ó''),'
  + N' N''Ãº'', N''ú''), N''Ã±'', N''ñ''), N''Ã'', N''Á''), N''Ã‰'', N''É''),'
  + N' N''Ã'', N''Í''), N''Ã“'', N''Ó''), N''Ãš'', N''Ú''), N''Ã‘'', N''Ñ''),'
  + N' N''Â¿'', N''¿''), N''Â¡'', N''¡''), N''â€¢'', N''•''), N''â€”'', N''—'')';

SELECT @sql = @sql + CAST(
  N'UPDATE dbo.' + QUOTENAME(c.TABLE_NAME)
  + N' SET ' + QUOTENAME(c.COLUMN_NAME) + N' = '
  + REPLACE(@expresion, N'{campo}', QUOTENAME(c.COLUMN_NAME))
  + N' WHERE ' + QUOTENAME(c.COLUMN_NAME) + N' LIKE N''%Ã%'''
  + N' OR ' + QUOTENAME(c.COLUMN_NAME) + N' LIKE N''%Â%'''
  + N' OR ' + QUOTENAME(c.COLUMN_NAME) + N' LIKE N''%â%'';' + CHAR(10)
  AS nvarchar(max))
FROM INFORMATION_SCHEMA.COLUMNS c
INNER JOIN sys.tables t ON t.name = c.TABLE_NAME AND t.schema_id = SCHEMA_ID(c.TABLE_SCHEMA)
WHERE c.TABLE_SCHEMA = N'dbo'
  AND c.TABLE_NAME NOT LIKE N'MSSQL_LedgerHistoryFor[_]%'
  AND c.DATA_TYPE IN (N'nvarchar', N'varchar', N'nchar', N'char');

BEGIN TRANSACTION;
EXEC sys.sp_executesql @sql;
COMMIT TRANSACTION;
