DECLARE @fkName sysname;

SELECT @fkName = fk.name
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
WHERE fk.parent_object_id = OBJECT_ID(N'[dbo].[recordatoriocita]')
  AND c.name = N'citaid';

IF @fkName IS NOT NULL
BEGIN
  EXEC(N'ALTER TABLE [dbo].[recordatoriocita] DROP CONSTRAINT [' + @fkName + N']');
END
GO

ALTER TABLE [dbo].[recordatoriocita] ALTER COLUMN [citaid] [int] NULL;
GO

ALTER TABLE [dbo].[recordatoriocita] WITH CHECK ADD CONSTRAINT [FK_recordatoriocita_citamedica]
FOREIGN KEY([citaid]) REFERENCES [dbo].[citamedica] ([citaid]);
GO
