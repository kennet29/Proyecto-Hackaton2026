import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import {
  AllowedTable,
  allowedTables,
  createPayloadSchema,
  tableNameSchema,
  updatePayloadSchema,
} from "./database.schemas";

/**
 * Describe la estructura de datos column info.
 */
interface ColumnInfo {
  /**
   * Campo de datos asociado a `name`.
   */
  name: string;
  /**
   * Campo de datos asociado a `normalized`.
   */
  normalized: string;
  /**
   * Campo de datos asociado a `dataType`.
   */
  dataType: string;
  /**
   * Campo de datos asociado a `isIdentity`.
   */
  isIdentity: boolean;
  /**
   * Campo de datos asociado a `isNullable`.
   */
  isNullable: boolean;
  /**
   * Campo de datos asociado a `hasDefault`.
   */
  hasDefault: boolean;
}

/**
 * Implementa la lógica de negocio y persistencia del dominio database.
 */
@Injectable()
export class DatabaseService {
  private readonly allowedTables = new Set<AllowedTable>(allowedTables);
  private readonly schema = "dbo";
  private readonly columnCache = new Map<AllowedTable, ColumnInfo[]>();
  private readonly pkCache = new Map<AllowedTable, string[]>();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * List tables.
   * @returns Resultado de la operación.
   */
  listTables(): AllowedTable[] {
    return Array.from(this.allowedTables.values());
  }

  /**
   * Find all.
   * @param table Nombre de la tabla habilitada para la operación.
   * @returns Colección de registros encontrados.
   */
  async findAll(table: string): Promise<Record<string, any>[]> {
    const normalized = this.normalizeTable(table);
    return this.dataSource.query(`select * from ${this.wrapTable(normalized)}`);
  }

  /**
   * Find one.
   * @param table Nombre de la tabla habilitada para la operación.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(table: string, id: string): Promise<Record<string, any>> {
    const normalized = this.normalizeTable(table);
    const { whereClause, params } = await this.buildPkFilter(normalized, id);
    const rows = await this.dataSource.query(
      `select top (1) * from ${this.wrapTable(normalized)} where ${whereClause}`,
      params,
    );
    if (!rows.length) {
      throw new NotFoundException(
        `registro ${id} no encontrado en ${normalized}`,
      );
    }
    return rows[0];
  }

  /**
   * Create.
   * @param table Nombre de la tabla habilitada para la operación.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(
    table: string,
    payload: Record<string, any>,
  ): Promise<Record<string, any>> {
    const normalized = this.normalizeTable(table);
    const data = createPayloadSchema.parse(payload ?? {});
    const columnInfo = await this.getColumns(normalized);
    const columnMap = this.getColumnMap(columnInfo);

    const entries = Object.entries(data).map(([key, value]) => ({
      key,
      column: columnMap.get(key.toLowerCase()),
      value,
    }));

    const invalidColumns = entries
      .filter(({ column }) => !column)
      .map((entry) => entry.key);
    if (invalidColumns.length) {
      throw new BadRequestException({
        message: "existen columnas no reconocidas para la tabla",
        columnasInvalidas: invalidColumns,
      });
    }

    const insertable = entries
      .filter((entry) => entry.column && !entry.column.isIdentity)
      .map((entry) => ({
        column: entry.column as ColumnInfo,
        value: entry.value,
      }));

    if (!insertable.length) {
      throw new BadRequestException(
        "debes enviar al menos una columna editable",
      );
    }

    const columnsClause = insertable
      .map(({ column }) => this.wrapColumn(column.name))
      .join(", ");
    const placeholders = insertable.map((_, idx) => `@p${idx}`).join(", ");
    const values = insertable.map(({ value }) => value);

    const query = `insert into ${this.wrapTable(normalized)} (${columnsClause}) output inserted.* values (${placeholders})`;
    try {
      const rows = await this.dataSource.query(query, values);
      return rows[0];
    } catch (error) {
      throw new InternalServerErrorException(
        this.buildDbErrorMessage("crear", normalized, error),
      );
    }
  }

  /**
   * Update.
   * @param table Nombre de la tabla habilitada para la operación.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  async update(
    table: string,
    id: string,
    payload: Record<string, any>,
  ): Promise<Record<string, any>> {
    const normalized = this.normalizeTable(table);
    const data = updatePayloadSchema.parse(payload ?? {});
    const columnInfo = await this.getColumns(normalized);
    const columnMap = this.getColumnMap(columnInfo);

    const mappedEntries = Object.entries(data).map(([key, value]) => ({
      key,
      column: columnMap.get(key.toLowerCase()),
      value,
    }));

    const invalidColumns = mappedEntries
      .filter(({ column }) => !column)
      .map((entry) => entry.key);
    if (invalidColumns.length) {
      throw new BadRequestException({
        message: "existen columnas no reconocidas para la tabla",
        columnasInvalidas: invalidColumns,
      });
    }

    const entries = mappedEntries
      .filter((entry) => entry.column)
      .map((entry) => ({
        column: entry.column as ColumnInfo,
        value: entry.value,
      }));

    if (!entries.length) {
      throw new BadRequestException(
        "no se proporcionaron columnas validas para actualizar",
      );
    }

    const setClauses = entries.map(
      ({ column }, idx) => `${this.wrapColumn(column.name)} = @p${idx}`,
    );
    const values = entries.map(({ value }) => value);
    const { whereClause, params } = await this.buildPkFilter(
      normalized,
      id,
      values.length,
    );

    const query = `update ${this.wrapTable(normalized)} set ${setClauses.join(", ")} output inserted.* where ${whereClause}`;
    try {
      const rows = await this.dataSource.query(query, [...values, ...params]);
      if (!rows.length) {
        throw new NotFoundException(
          `registro ${id} no encontrado en ${normalized}`,
        );
      }
      return rows[0];
    } catch (error) {
      throw new InternalServerErrorException(
        this.buildDbErrorMessage("actualizar", normalized, error),
      );
    }
  }

  /**
   * Remove.
   * @param table Nombre de la tabla habilitada para la operación.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(table: string, id: string): Promise<void> {
    const normalized = this.normalizeTable(table);
    const { whereClause, params } = await this.buildPkFilter(normalized, id);
    const rows = await this.dataSource.query(
      `delete from ${this.wrapTable(normalized)} output deleted.* where ${whereClause}`,
      params,
    );
    if (!rows.length) {
      throw new NotFoundException(
        `registro ${id} no encontrado en ${normalized}`,
      );
    }
  }

  /**
   * Normalize table.
   * @param table Nombre de la tabla habilitada para la operación.
   * @returns Resultado de la operación.
   */
  private normalizeTable(table: string): AllowedTable {
    try {
      return tableNameSchema.parse(table.toLowerCase());
    } catch {
      throw new BadRequestException({
        message: "tabla no permitida",
        tablaRecibida: table,
        tablasDisponibles: this.listTables(),
      });
    }
  }

  /**
   * Wrap table.
   * @param table Nombre de la tabla habilitada para la operación.
   * @returns Resultado de la operación.
   */
  private wrapTable(table: string): string {
    return `${this.wrapColumn(this.schema)}.${this.wrapColumn(table)}`;
  }

  /**
   * Wrap column.
   * @param column Valor del parámetro `column`.
   * @returns Resultado de la operación.
   */
  private wrapColumn(column: string): string {
    return `[${column.replace(/]/g, "]]")}]`;
  }

  /**
   * Obtiene columns.
   * @param table Nombre de la tabla habilitada para la operación.
   * @returns Resultado de la consulta solicitada.
   */
  private async getColumns(table: AllowedTable): Promise<ColumnInfo[]> {
    const cached = this.columnCache.get(table);
    if (cached) {
      return cached;
    }
    const rows = await this.dataSource.query(
      `
      select
        c.COLUMN_NAME as name,
        lower(c.COLUMN_NAME) as normalized,
        c.DATA_TYPE as dataType,
        case when c.IS_NULLABLE = 'YES' then 1 else 0 end as isNullable,
        case when c.COLUMN_DEFAULT is not null then 1 else 0 end as hasDefault,
        case when COLUMNPROPERTY(object_id(@0 + '.' + @1), c.COLUMN_NAME, 'IsIdentity') = 1 then 1 else 0 end as isIdentity
      from INFORMATION_SCHEMA.COLUMNS c
      where c.TABLE_SCHEMA = @0 and c.TABLE_NAME = @1
      order by c.ORDINAL_POSITION
      `,
      [this.schema, table],
    );
    if (!rows.length) {
      throw new NotFoundException(
        `no se encontraron columnas para la tabla ${table}`,
      );
    }
    const columns = rows.map((row: any) => ({
      name: row.name,
      normalized: row.normalized,
      dataType: row.dataType,
      isIdentity: Boolean(row.isIdentity),
      isNullable: Boolean(row.isNullable),
      hasDefault: Boolean(row.hasDefault),
    }));
    this.columnCache.set(table, columns);
    return columns;
  }

  /**
   * Obtiene column map.
   * @param columns Valor del parámetro `columns`.
   * @returns Resultado de la consulta solicitada.
   */
  private getColumnMap(columns: ColumnInfo[]): Map<string, ColumnInfo> {
    return columns.reduce(
      (map, column) => map.set(column.normalized, column),
      new Map<string, ColumnInfo>(),
    );
  }

  /**
   * Obtiene primary keys.
   * @param table Nombre de la tabla habilitada para la operación.
   * @returns Resultado de la consulta solicitada.
   */
  private async getPrimaryKeys(table: AllowedTable): Promise<string[]> {
    const cached = this.pkCache.get(table);
    if (cached) {
      return cached;
    }
    const rows = await this.dataSource.query(
      `
      select ku.COLUMN_NAME as columnName
      from INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      inner join INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
        on tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
        and tc.TABLE_NAME = ku.TABLE_NAME
        and tc.TABLE_SCHEMA = ku.TABLE_SCHEMA
      where tc.TABLE_SCHEMA = @0
        and tc.TABLE_NAME = @1
        and tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
      order by ku.ORDINAL_POSITION
      `,
      [this.schema, table],
    );
    if (!rows.length) {
      throw new BadRequestException(
        `la tabla ${table} no tiene clave primaria definida`,
      );
    }
    const pk = rows.map((row: any) => row.columnName.toLowerCase());
    this.pkCache.set(table, pk);
    return pk;
  }

  /**
   * Construye pk filter.
   * @param table Nombre de la tabla habilitada para la operación.
   * @param id Identificador del registro objetivo.
   * @param offset Valor del parámetro `offset`.
   * @returns Estructura construida para el flujo interno.
   */
  private async buildPkFilter(
    table: AllowedTable,
    id: string,
    offset = 0,
  ): Promise<{
    /**
     * Campo de datos asociado a `whereClause`.
     */
    whereClause: string; /**
     * Campo de datos asociado a `params`.
     */
    params: any[];
  }> {
    const pkColumns = await this.getPrimaryKeys(table);
    const columns = await this.getColumns(table);
    const columnMap = this.getColumnMap(columns);
    const values = this.parseIdValues(id, pkColumns.length);

    if (values.length !== pkColumns.length) {
      throw new BadRequestException({
        message:
          "el identificador no coincide con la cantidad de columnas en la clave primaria",
        columnasEsperadas: pkColumns,
      });
    }

    const clauses = pkColumns.map((column, idx) => {
      const metadata = columnMap.get(column);
      if (!metadata) {
        throw new InternalServerErrorException(
          `no se encontro metadata para la columna ${column} en la clave primaria`,
        );
      }
      return `${this.wrapColumn(metadata.name)} = @p${idx + offset}`;
    });
    return { whereClause: clauses.join(" and "), params: values };
  }

  /**
   * Interpreta id values.
   * @param rawId Identificador asociado a raw.
   * @param expectedParts Valor del parámetro `expectedParts`.
   * @returns Valor interpretado a partir de la entrada recibida.
   */
  private parseIdValues(rawId: string, expectedParts: number): any[] {
    if (expectedParts === 1) {
      return [rawId.trim()];
    }
    const segments = rawId.split(",").map((segment) => segment.trim());
    if (segments.length !== expectedParts) {
      throw new BadRequestException({
        message:
          "para claves compuestas usa valores separados por coma en el mismo orden definido en la tabla",
        ejemplo: "valor1,valor2",
      });
    }
    return segments;
  }

  /**
   * Construye db error message.
   * @param action Valor del parámetro `action`.
   * @param table Nombre de la tabla habilitada para la operación.
   * @param error Error original que se está procesando.
   * @returns Estructura construida para el flujo interno.
   */
  private buildDbErrorMessage(
    action: string,
    table: string,
    error: unknown,
  ): string {
    if (error instanceof Error) {
      return `no se pudo ${action} el registro en ${table}: ${error.message}`;
    }
    return `no se pudo ${action} el registro en ${table}`;
  }
}
