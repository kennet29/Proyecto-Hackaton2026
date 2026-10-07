IF COL_LENGTH('dbo.medicacion', 'evidenciafotografica') IS NULL
BEGIN
    ALTER TABLE dbo.medicacion
    ADD evidenciafotografica VARBINARY(MAX) NULL;
END;
GO
