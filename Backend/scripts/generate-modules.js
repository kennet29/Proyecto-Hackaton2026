const path = require('path');
const fs = require('fs/promises');
const { DataSource } = require('typeorm');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const TABLES = [
  'paciente',
  'usuario',
  'rol',
  'permiso',
  'rolpermiso',
  'usuariorol',
  'especialidad',
  'tipovacuna',
  'tipolesion',
  'tipooperacion',
  'tipodocumentoclinico',
  'tipocondicioncronica',
  'tipohabito',
  'consultamedica',
  'lesion',
  'estilovida',
  'vacuna',
  'citamedica',
  'registrodental',
  'operacion',
  'desparasitacion',
  'registromensual',
  'embarazo',
  'controlprenatal',
  'documentoclinico',
  'notificacion',
  'recordatoriocita',
  'medicacion',
  'horariomedicamento',
  'alergia',
  'antecedentefamiliar',
  'habitoespecifico',
  'puntajeriesgo',
  'condicioncronica',
  'objetivocronico',
  'controlcronico',
  'adherenciacronica',
  'evaluacionsaludhabito',
  'detalleevaluacionsalud',
];

const SCHEMA = 'dbo';
const OUTPUT_ROOT = path.join(__dirname, '..', 'src', 'modules');

const dataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 1433),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: { encrypt: false },
  extra: { trustServerCertificate: true },
});

async function ensureDatabaseConnection() {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
}

async function fetchColumns(table) {
  const rows = await dataSource.query(
    `
    select
      c.COLUMN_NAME as name,
      c.DATA_TYPE as dataType,
      c.CHARACTER_MAXIMUM_LENGTH as charMaxLength,
      c.NUMERIC_PRECISION as numericPrecision,
      c.NUMERIC_SCALE as numericScale,
      c.DATETIME_PRECISION as datetimePrecision,
      case when c.IS_NULLABLE = 'YES' then 1 else 0 end as isNullable,
      case when c.COLUMN_DEFAULT is not null then 1 else 0 end as hasDefault,
      columnproperty(object_id(@0 + '.' + @1), c.COLUMN_NAME, 'IsIdentity') as isIdentity
    from INFORMATION_SCHEMA.COLUMNS c
    where c.TABLE_SCHEMA = @0 and c.TABLE_NAME = @1
    order by c.ORDINAL_POSITION
    `,
    [SCHEMA, table],
  );
  return rows.map((row) => ({
    name: row.name,
    dataType: row.dataType,
    charMaxLength: row.charMaxLength,
    numericPrecision: row.numericPrecision,
    numericScale: row.numericScale,
    datetimePrecision: row.datetimePrecision,
    isNullable: Boolean(row.isNullable),
    hasDefault: Boolean(row.hasDefault),
    isIdentity: row.isIdentity === 1,
  }));
}

async function fetchPrimaryKeys(table) {
  const rows = await dataSource.query(
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
    [SCHEMA, table],
  );
  return rows.map((row) => row.columnName);
}

function toCamelCase(value) {
  return value
    .toLowerCase()
    .replace(/[-_\s]+([a-z0-9])/g, (_, chr) => chr.toUpperCase())
    .replace(/id$/i, 'Id');
}

function toPascalCase(value) {
  const camel = toCamelCase(value);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function mapColumnType(column) {
  const type = column.dataType.toLowerCase();
  if (['int', 'smallint', 'tinyint', 'bigint'].includes(type)) {
    return { tsType: 'number', zod: 'z.number().int()' };
  }
  if (['decimal', 'numeric', 'money', 'smallmoney', 'float', 'real'].includes(type)) {
    return { tsType: 'number', zod: 'z.number()' };
  }
  if (['bit'].includes(type)) {
    return { tsType: 'boolean', zod: 'z.boolean()' };
  }
  if (['date', 'datetime', 'datetime2', 'smalldatetime', 'datetimeoffset', 'time'].includes(type)) {
    return { tsType: 'Date', zod: 'z.coerce.date()' };
  }
  if (['varbinary', 'binary', 'image'].includes(type)) {
    return { tsType: 'Buffer', zod: 'z.instanceof(Buffer)' };
  }
  return { tsType: 'string', zod: 'z.string()' };
}

function buildColumnOptions(column, { omitPrecision } = { omitPrecision: false }) {
  const options = {
    name: column.name,
    type: column.dataType,
  };
  if (column.charMaxLength && Number(column.charMaxLength) > 0) {
    options.length = column.charMaxLength === -1 ? 'max' : Number(column.charMaxLength);
  }
  if (!omitPrecision && column.numericPrecision) {
    options.precision = Number(column.numericPrecision);
  }
  if (!omitPrecision && column.numericScale) {
    options.scale = Number(column.numericScale);
  }
  if (!omitPrecision && column.datetimePrecision) {
    options.precision = Number(column.datetimePrecision);
  }
  if (column.isNullable) {
    options.nullable = true;
  }
  return options;
}

function formatOptions(options) {
  const entries = Object.entries(options).filter(([, value]) => value !== undefined && value !== null);
  if (!entries.length) {
    return '';
  }
  const parts = entries.map(([key, value]) => {
    if (typeof value === 'string') {
      return `${key}: '${value}'`;
    }
    return `${key}: ${value}`;
  });
  return `{ ${parts.join(', ')} }`;
}

function buildEntityContent(table, columns, primaryKeys) {
  const className = toPascalCase(table);
  const usedDecorators = new Set(['Entity', 'Column']);
  const lines = [`@Entity({ name: '${table}' })`, `export class ${className} {`];
  const primaryLookup = primaryKeys.map((key) => key.toLowerCase());

  columns.forEach((column) => {
    const propertyName = toCamelCase(column.name);
    const { tsType } = mapColumnType(column);
    const isPrimary = primaryLookup.includes(column.name.toLowerCase());
    let decorator = 'Column';
    if (isPrimary && column.isIdentity) {
      decorator = 'PrimaryGeneratedColumn';
    } else if (isPrimary) {
      decorator = 'PrimaryColumn';
    }
    usedDecorators.add(decorator);
    const options = formatOptions(
      buildColumnOptions(column, { omitPrecision: decorator === 'PrimaryGeneratedColumn' }),
    );
    const optionalFlag = column.isNullable ? '?' : '!';
    const optionText = options ? `(${options})` : '';
    lines.push(`  @${decorator}${optionText}`);
    lines.push(`  ${propertyName}${optionalFlag}: ${tsType};`);
    lines.push('');
  });

  lines.push('}');

  const imports = Array.from(usedDecorators)
    .sort()
    .join(', ');

  return `import { ${imports} } from 'typeorm';\n\n${lines.join('\n')}`;
}

function buildDtoContent(table, columns) {
  const dtoName = toPascalCase(table);
  const createFields = columns
    .filter((column) => !column.isIdentity)
    .map((column) => {
      const propertyName = toCamelCase(column.name);
      const { zod } = mapColumnType(column);
      const base = column.isNullable ? `${zod}.nullable()` : zod;
      const required = !column.isNullable && !column.hasDefault && !column.isIdentity;
      const finalExpression = required ? base : `${base}.optional()`;
      return `  ${propertyName}: ${finalExpression},`;
    });

  const createSchema = createFields.length
    ? `z.object({\n${createFields.join('\n')}\n})`
    : 'z.object({})';

  const updateSchema = `${createSchema}.partial().refine((value) => Object.keys(value).length > 0, { message: 'debes enviar al menos un campo' })`;

  return `import { createZodDto } from 'nestjs-zod';\nimport { z } from 'zod';\n\nexport const create${dtoName}Schema = ${createSchema};\nexport class Create${dtoName}Dto extends createZodDto(create${dtoName}Schema) {}\n\nexport const update${dtoName}Schema = ${updateSchema};\nexport class Update${dtoName}Dto extends createZodDto(update${dtoName}Schema) {}\n`;
}

function buildPkMeta(primaryKeys, columns) {
  const primaryProps = primaryKeys.map((key) => toCamelCase(key));
  const meta = primaryProps.map((prop, index) => {
    const column = columns.find((col) => col.name.toLowerCase() === primaryKeys[index].toLowerCase());
    const { tsType } = column ? mapColumnType(column) : { tsType: 'string' };
    return `  ${prop}: '${tsType}',`;
  });
  return { primaryProps, pkMeta: meta.join('\n') };
}

function buildServiceContent(table, columns, primaryKeys) {
  const className = toPascalCase(table);
  const serviceName = `${className}Service`;
  const repositoryName = `${toCamelCase(table)}Repository`;
  const createDto = `Create${className}Dto`;
  const updateDto = `Update${className}Dto`;
  const entityName = className;
  const { primaryProps, pkMeta } = buildPkMeta(primaryKeys, columns);

  const lines = [];
  lines.push(`import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';`);
  lines.push(`import { InjectRepository } from '@nestjs/typeorm';`);
  lines.push(`import { Repository } from 'typeorm';`);
  lines.push(`import { ${entityName} } from './${table}.entity';`);
  lines.push(`import { ${createDto} } from './dto/create-${table}.dto';`);
  lines.push(`import { ${updateDto} } from './dto/update-${table}.dto';`);
  lines.push('');
  lines.push(`const PRIMARY_KEYS = ${JSON.stringify(primaryProps)};`);
  lines.push(`const PRIMARY_KEY_TYPES: Record<string, 'number' | 'string' | 'boolean' | 'Date'> = {`);
  lines.push(pkMeta);
  lines.push('};');
  lines.push('');
  lines.push('@Injectable()');
  lines.push(`export class ${serviceName} {`);
  lines.push('  constructor(');
  lines.push(`    @InjectRepository(${entityName})`);
  lines.push(`    private readonly ${repositoryName}: Repository<${entityName}>,`);
  lines.push('  ) {}');
  lines.push('');
  lines.push(`  create(payload: ${createDto}): Promise<${entityName}> {`);
  lines.push(`    const entity = this.${repositoryName}.create(payload as Partial<${entityName}>);`);
  lines.push(`    return this.${repositoryName}.save(entity);`);
  lines.push('  }');
  lines.push('');
  lines.push(`  findAll(): Promise<${entityName}[]> {`);
  lines.push(`    return this.${repositoryName}.find();`);
  lines.push('  }');
  lines.push('');
  lines.push(`  async findOne(id: string): Promise<${entityName}> {`);
  lines.push('    const where = this.parseId(id);');
  lines.push(`    const entity = await this.${repositoryName}.findOne({ where });`);
  lines.push('    if (!entity) {');
  lines.push(`      throw new NotFoundException(\`registro \${id} no encontrado en ${table}\`);`);
  lines.push('    }');
  lines.push('    return entity;');
  lines.push('  }');
  lines.push('');
  lines.push(`  async update(id: string, payload: ${updateDto}): Promise<${entityName}> {`);
  lines.push('    const entity = await this.findOne(id);');
  lines.push('    Object.assign(entity, payload);');
  lines.push(`    return this.${repositoryName}.save(entity);`);
  lines.push('  }');
  lines.push('');
  lines.push('  async remove(id: string): Promise<void> {');
  lines.push('    const where = this.parseId(id);');
  lines.push(`    const result = await this.${repositoryName}.delete(where);`);
  lines.push('    if (!result.affected) {');
  lines.push(`      throw new NotFoundException(\`registro \${id} no encontrado en ${table}\`);`);
  lines.push('    }');
  lines.push('  }');
  lines.push('');
  lines.push('  private parseId(rawId: string): Record<string, any> {');
  lines.push('    if (!PRIMARY_KEYS.length) {');
  lines.push("      throw new BadRequestException('la tabla no define una clave primaria');");
  lines.push('    }');
  lines.push('    if (PRIMARY_KEYS.length === 1) {');
  lines.push('      const key = PRIMARY_KEYS[0];');
  lines.push('      return { [key]: this.castValue(rawId, PRIMARY_KEY_TYPES[key]) };');
  lines.push('    }');
  lines.push("    const segments = rawId.split(',').map((segment) => segment.trim());");
  lines.push('    if (segments.length !== PRIMARY_KEYS.length) {');
  lines.push("      throw new BadRequestException('usa valores separados por coma siguiendo el orden de la clave primaria');");
  lines.push('    }');
  lines.push('    const where: Record<string, any> = {};');
  lines.push('    segments.forEach((segment, index) => {');
  lines.push('      const key = PRIMARY_KEYS[index];');
  lines.push('      where[key] = this.castValue(segment, PRIMARY_KEY_TYPES[key]);');
  lines.push('    });');
  lines.push('    return where;');
  lines.push('  }');
  lines.push('');
  lines.push('  private castValue(value: string, type: string): any {');
  lines.push("    if (type === 'number') {");
  lines.push('      const num = Number(value);');
  lines.push('      if (Number.isNaN(num)) {');
  lines.push("        throw new BadRequestException('el identificador debe ser numerico');");
  lines.push('      }');
  lines.push('      return num;');
  lines.push('    }');
  lines.push("    if (type === 'boolean') {");
  lines.push("      if (value === '1' || value.toLowerCase() === 'true') {");
  lines.push('        return true;');
  lines.push('      }');
  lines.push("      if (value === '0' || value.toLowerCase() === 'false') {");
  lines.push('        return false;');
  lines.push('      }');
  lines.push("      throw new BadRequestException('el identificador booleano es invalido');");
  lines.push('    }');
  lines.push("    if (type === 'Date') {");
  lines.push('      const date = new Date(value);');
  lines.push('      if (Number.isNaN(date.getTime())) {');
  lines.push("        throw new BadRequestException('el identificador de fecha es invalido');");
  lines.push('      }');
  lines.push('      return date;');
  lines.push('    }');
  lines.push('    return value;');
  lines.push('  }');
  lines.push('}');

  return lines.join('\n');
}

function buildControllerContent(table) {
  const className = toPascalCase(table);
  const serviceName = `${className}Service`;
  const controllerName = `${className}Controller`;
  const createDto = `Create${className}Dto`;
  const updateDto = `Update${className}Dto`;
  const serviceProp = toCamelCase(serviceName);

  return `import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';\nimport { ${serviceName} } from './${table}.service';\nimport { ${createDto} } from './dto/create-${table}.dto';\nimport { ${updateDto} } from './dto/update-${table}.dto';\n\n@Controller('${table}')\nexport class ${controllerName} {\n  constructor(private readonly ${serviceProp}: ${serviceName}) {}\n\n  @Post()\n  create(@Body() payload: ${createDto}) {\n    return this.${serviceProp}.create(payload);\n  }\n\n  @Get()\n  findAll() {\n    return this.${serviceProp}.findAll();\n  }\n\n  @Get(':id')\n  findOne(@Param('id') id: string) {\n    return this.${serviceProp}.findOne(id);\n  }\n\n  @Patch(':id')\n  update(@Param('id') id: string, @Body() payload: ${updateDto}) {\n    return this.${serviceProp}.update(id, payload);\n  }\n\n  @Delete(':id')\n  remove(@Param('id') id: string) {\n    return this.${serviceProp}.remove(id);\n  }\n}\n`;
}

function buildModuleContent(table) {
  const className = toPascalCase(table);
  const moduleName = `${className}Module`;
  const serviceName = `${className}Service`;
  const controllerName = `${className}Controller`;

  return `import { Module } from '@nestjs/common';\nimport { TypeOrmModule } from '@nestjs/typeorm';\nimport { ${className} } from './${table}.entity';\nimport { ${serviceName} } from './${table}.service';\nimport { ${controllerName} } from './${table}.controller';\n\n@Module({\n  imports: [TypeOrmModule.forFeature([${className}])],\n  controllers: [${controllerName}],\n  providers: [${serviceName}],\n  exports: [${serviceName}],\n})\nexport class ${moduleName} {}\n`;
}

async function writeFile(targetPath, content) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content.trimStart() + '\n', 'utf8');
}

async function generateModule(table) {
  const columns = await fetchColumns(table);
  if (!columns.length) {
    console.warn(`no se encontraron columnas para ${table}, se omite`);
    return null;
  }
  const primaryKeys = await fetchPrimaryKeys(table);
  if (!primaryKeys.length) {
    console.warn(`la tabla ${table} no tiene clave primaria, se omite`);
    return null;
  }

  const folder = path.join(OUTPUT_ROOT, table);
  await writeFile(path.join(folder, `${table}.entity.ts`), buildEntityContent(table, columns, primaryKeys));
  const dtoPath = path.join(folder, 'dto');
  await writeFile(path.join(dtoPath, `create-${table}.dto.ts`), buildDtoContent(table, columns));
  await writeFile(path.join(dtoPath, `update-${table}.dto.ts`), `export { Update${toPascalCase(table)}Dto } from './create-${table}.dto';\n`);
  await writeFile(path.join(folder, `${table}.service.ts`), buildServiceContent(table, columns, primaryKeys));
  await writeFile(path.join(folder, `${table}.controller.ts`), buildControllerContent(table));
  await writeFile(path.join(folder, `${table}.module.ts`), buildModuleContent(table));
  return {
    moduleName: `${toPascalCase(table)}Module`,
    modulePath: `./${table}/${table}.module`,
  };
}

function buildAggregator(modulesMeta) {
  const imports = modulesMeta
    .map(({ moduleName, modulePath }) => `import { ${moduleName} } from '${modulePath}';`)
    .join('\n');
  const moduleNames = modulesMeta.map(({ moduleName }) => moduleName);
  const body = `@Module({\n  imports: [${moduleNames.join(', ')}],\n  exports: [${moduleNames.join(', ')}],\n})\nexport class GestionSaludModule {}\n`;
  return `import { Module } from '@nestjs/common';\n${imports}\n\n${body}`;
}

async function main() {
  await ensureDatabaseConnection();
  const results = [];
  for (const table of TABLES) {
    try {
      const meta = await generateModule(table);
      if (meta) {
        results.push(meta);
        console.log(`modulo generado para ${table}`);
      }
    } catch (error) {
      console.error(`fallo la generacion de ${table}:`, error.message);
    }
  }
  if (results.length) {
    const aggregator = buildAggregator(results);
    await writeFile(path.join(OUTPUT_ROOT, 'gestionsalud.module.ts'), aggregator);
  }
}

main()
  .catch((error) => {
    console.error('fallo el generador', error);
    process.exit(1);
  })
  .finally(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });
