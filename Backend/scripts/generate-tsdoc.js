const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const SOURCE_ROOT = path.resolve(__dirname, "..", "src");

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function hasDoc(node, sourceFile) {
  const ranges =
    ts.getLeadingCommentRanges(sourceFile.text, node.getFullStart()) ?? [];
  return ranges.some((range) =>
    sourceFile.text.slice(range.pos, range.end).startsWith("/**"),
  );
}

function escapeDoc(text) {
  return text.replace(/\*\//g, "* /");
}

function formatDoc(lines, indent = "") {
  return [
    `${indent}/**`,
    ...lines.map((line) => `${indent} * ${escapeDoc(line)}`),
    `${indent} */`,
  ].join("\n");
}

function splitWords(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeEntityName(value) {
  return splitWords(
    value
      .replace(/Dto$/i, "")
      .replace(/Controller$/i, "")
      .replace(/Service$/i, "")
      .replace(/Module$/i, "")
      .replace(/Entity$/i, "")
      .replace(/Schema$/i, ""),
  );
}

function getFileRole(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.endsWith(".controller.ts")) {
    return "controller";
  }
  if (normalized.endsWith(".service.ts")) {
    return "service";
  }
  if (normalized.endsWith(".module.ts")) {
    return "module";
  }
  if (normalized.endsWith(".entity.ts")) {
    return "entity";
  }
  if (normalized.includes("/dto/")) {
    return "dto";
  }
  if (normalized.includes("/decorators/")) {
    return "decorator";
  }
  if (normalized.includes("/guards/")) {
    return "guard";
  }
  if (normalized.includes("/utils/")) {
    return "util";
  }
  if (normalized.includes("/filters/")) {
    return "filter";
  }
  if (normalized.includes("/schemas/")) {
    return "schema";
  }
  if (normalized.endsWith("/main.ts")) {
    return "bootstrap";
  }
  return "general";
}

function isNodeExported(node) {
  return Boolean(
    node.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ),
  );
}

function describeParam(name) {
  const lower = name.toLowerCase();
  if (lower === "id") {
    return "Identificador del registro objetivo.";
  }
  if (lower.endsWith("id")) {
    return `Identificador asociado a ${splitWords(name.replace(/Id$/, ""))}.`;
  }
  if (lower === "payload") {
    return "Datos validados que recibe la operación.";
  }
  if (lower === "credentials") {
    return "Credenciales enviadas por el cliente.";
  }
  if (lower === "req" || lower === "request") {
    return "Solicitud HTTP actual.";
  }
  if (lower === "user") {
    return "Usuario autenticado asociado a la solicitud.";
  }
  if (lower === "table") {
    return "Nombre de la tabla habilitada para la operación.";
  }
  if (lower === "error") {
    return "Error original que se está procesando.";
  }
  if (lower === "value") {
    return "Valor de entrada que se debe transformar o validar.";
  }
  if (lower === "values") {
    return "Colección de valores usada por el cálculo o la validación.";
  }
  if (lower === "date") {
    return "Fecha de referencia para la operación.";
  }
  if (
    lower === "timezone" ||
    lower === "timezoneuse" ||
    lower === "timezoneToUse"
  ) {
    return "Zona horaria que se utilizará en la operación.";
  }
  if (lower === "scheduletext") {
    return "Texto en lenguaje natural con la fecha u hora deseada.";
  }
  if (lower === "referencedate") {
    return "Fecha base desde la cual se interpreta el texto.";
  }
  if (lower === "context") {
    return "Contexto de ejecución actual.";
  }
  return `Valor del parámetro \`${name}\`.`;
}

function describeReturn(name, returnTypeText) {
  const lower = name.toLowerCase();
  if (lower.startsWith("findall")) {
    return "Colección de registros encontrados.";
  }
  if (
    lower.startsWith("findone") ||
    lower.startsWith("get") ||
    lower.startsWith("preview")
  ) {
    return "Resultado de la consulta solicitada.";
  }
  if (lower.startsWith("create")) {
    return "Registro creado.";
  }
  if (lower.startsWith("update")) {
    return "Registro actualizado.";
  }
  if (lower.startsWith("remove") || lower.startsWith("delete")) {
    return "La operación se completa sin devolver contenido.";
  }
  if (lower.startsWith("can")) {
    return "Indicador de si la condición evaluada se cumple.";
  }
  if (lower.startsWith("assert")) {
    return "La promesa se resuelve cuando la validación se cumple.";
  }
  if (lower.startsWith("build")) {
    return "Estructura construida para el flujo interno.";
  }
  if (lower.startsWith("parse")) {
    return "Valor interpretado a partir de la entrada recibida.";
  }
  if (lower.startsWith("to")) {
    return "Valor convertido al formato de salida esperado.";
  }
  if (/Promise<void>/.test(returnTypeText) || returnTypeText === "void") {
    return "La operación se completa sin devolver contenido.";
  }
  if (returnTypeText === "boolean" || /Promise<boolean>/.test(returnTypeText)) {
    return "Valor booleano que resume el resultado de la evaluación.";
  }
  return "Resultado de la operación.";
}

function buildSummaryFromName(name) {
  return splitWords(name);
}

function describeAction(name) {
  const lower = name.toLowerCase();
  if (lower === "create") {
    return "Crea un nuevo registro.";
  }
  if (lower === "findall") {
    return "Obtiene todos los registros disponibles.";
  }
  if (lower === "findone") {
    return "Obtiene un registro por su identificador.";
  }
  if (lower === "update") {
    return "Actualiza un registro existente.";
  }
  if (lower === "remove") {
    return "Elimina un registro existente.";
  }
  if (lower === "login") {
    return "Autentica un usuario y emite un token de acceso.";
  }
  if (lower === "logout") {
    return "Revoca el token activo del usuario autenticado.";
  }
  if (lower === "requestpasswordreset") {
    return "Genera un token para restablecer la contrasena.";
  }
  if (lower === "resetpassword") {
    return "Actualiza la contrasena usando un token valido.";
  }
  if (lower.startsWith("get")) {
    return `Obtiene ${splitWords(name.slice(3))}.`;
  }
  if (lower.startsWith("find")) {
    return `Busca ${splitWords(name.slice(4))}.`;
  }
  if (lower.startsWith("build")) {
    return `Construye ${splitWords(name.slice(5))}.`;
  }
  if (lower.startsWith("parse")) {
    return `Interpreta ${splitWords(name.slice(5))}.`;
  }
  if (lower.startsWith("to")) {
    return `Convierte el valor a ${splitWords(name.slice(2))}.`;
  }
  if (lower.startsWith("assert")) {
    return `Valida ${splitWords(name.slice(6))}.`;
  }
  if (lower.startsWith("can")) {
    return `Comprueba si se puede ${splitWords(name.slice(3))}.`;
  }
  if (lower.startsWith("resolve")) {
    return `Resuelve ${splitWords(name.slice(7))}.`;
  }
  return `${capitalize(buildSummaryFromName(name))}.`;
}

function describeProperty(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith("id")) {
    return `Identificador persistido para \`${name}\`.`;
  }
  if (lower.includes("fecha")) {
    return `Fecha asociada al campo \`${name}\`.`;
  }
  if (lower.includes("nombre") || lower.includes("titulo")) {
    return `Nombre descriptivo almacenado en \`${name}\`.`;
  }
  if (
    lower.includes("descripcion") ||
    lower.includes("detalle") ||
    lower.includes("observacion")
  ) {
    return `Texto descriptivo del campo \`${name}\`.`;
  }
  if (lower.includes("estado")) {
    return `Estado actual registrado en \`${name}\`.`;
  }
  if (lower.includes("email")) {
    return `Correo electrónico almacenado en \`${name}\`.`;
  }
  if (lower.includes("telefono")) {
    return `Número de contacto asociado a \`${name}\`.`;
  }
  if (
    lower.startsWith("es") ||
    lower.startsWith("tiene") ||
    lower.startsWith("requiere")
  ) {
    return `Indicador booleano persistido en \`${name}\`.`;
  }
  return `Campo de datos asociado a \`${name}\`.`;
}

function createDocForClass(node, fileRole, filePath, indent) {
  const name = node.name?.text ?? "Symbol";
  const domain = normalizeEntityName(name);
  switch (fileRole) {
    case "controller":
      return formatDoc(
        [`Expone los endpoints HTTP del dominio ${domain}.`],
        indent,
      );
    case "service":
      return formatDoc(
        [
          `Implementa la logica de negocio y persistencia del dominio ${domain}.`,
        ],
        indent,
      );
    case "module":
      return formatDoc(
        [`Agrupa controladores y proveedores del dominio ${domain}.`],
        indent,
      );
    case "entity":
      return formatDoc(
        [`Entidad TypeORM que modela el recurso ${domain}.`],
        indent,
      );
    case "dto":
      if (/^Create/i.test(name)) {
        return formatDoc(
          [
            `DTO de entrada para crear ${normalizeEntityName(name.replace(/^Create/, ""))}.`,
          ],
          indent,
        );
      }
      if (/^Update/i.test(name)) {
        return formatDoc(
          [
            `DTO de entrada para actualizar ${normalizeEntityName(name.replace(/^Update/, ""))}.`,
          ],
          indent,
        );
      }
      if (/^Reset/i.test(name)) {
        return formatDoc(
          [`DTO de entrada para ${normalizeEntityName(name)}.`],
          indent,
        );
      }
      return formatDoc([`DTO usado por el flujo ${domain}.`], indent);
    case "guard":
      return formatDoc(
        [`Guard de NestJS que protege el acceso relacionado con ${domain}.`],
        indent,
      );
    case "filter":
      return formatDoc(
        [`Filtro de excepciones que transforma errores del flujo ${domain}.`],
        indent,
      );
    default:
      if (path.basename(filePath) === "app.module.ts") {
        return formatDoc(["Modulo raiz de la aplicacion backend."], indent);
      }
      return formatDoc([`Clase que implementa el flujo ${domain}.`], indent);
  }
}

function createDocForInterface(node, indent) {
  const name = node.name.text;
  if (name === "AuthenticatedUser") {
    return formatDoc(
      [
        "Describe el usuario autenticado que se inyecta en la solicitud actual.",
      ],
      indent,
    );
  }
  return formatDoc(
    [`Describe la estructura de datos ${normalizeEntityName(name)}.`],
    indent,
  );
}

function createDocForTypeAlias(node, indent) {
  const name = node.name.text;
  return formatDoc(
    [`Define el tipo ${normalizeEntityName(name)} utilizado por el backend.`],
    indent,
  );
}

function createDocForFunction(node, indent) {
  const name = node.name?.text ?? "funcion";
  const lines = [describeAction(name)];
  for (const param of node.parameters) {
    if (ts.isIdentifier(param.name)) {
      lines.push(`@param ${param.name.text} ${describeParam(param.name.text)}`);
    }
  }
  if (node.type && node.type.getText() !== "void") {
    lines.push(`@returns ${describeReturn(name, node.type.getText())}`);
  }
  return formatDoc(lines, indent);
}

function createDocForMethod(node, indent) {
  const name = node.name.getText();
  const lines = [describeAction(name)];
  for (const param of node.parameters) {
    if (ts.isIdentifier(param.name)) {
      lines.push(`@param ${param.name.text} ${describeParam(param.name.text)}`);
    }
  }
  const returnType = node.type?.getText() ?? "";
  if (returnType !== "void") {
    lines.push(`@returns ${describeReturn(name, returnType)}`);
  }
  return formatDoc(lines, indent);
}

function createDocForVariable(statement, declaration, fileRole, indent) {
  const name = declaration.name.getText();
  if (/Schema$/.test(name)) {
    if (/^create/i.test(name)) {
      return formatDoc(
        [
          `Esquema Zod para validar la creacion de ${normalizeEntityName(name.replace(/^create/i, ""))}.`,
        ],
        indent,
      );
    }
    if (/^update/i.test(name)) {
      return formatDoc(
        [
          `Esquema Zod para validar la actualizacion de ${normalizeEntityName(name.replace(/^update/i, ""))}.`,
        ],
        indent,
      );
    }
    return formatDoc(
      [`Esquema Zod utilizado por ${normalizeEntityName(name)}.`],
      indent,
    );
  }
  if (name === "ROLES_KEY" || name === "IS_PUBLIC_KEY") {
    return formatDoc(
      [`Clave de metadata usada por el decorador \`${name}\`.`],
      indent,
    );
  }
  if (name === "allowedTables") {
    return formatDoc(
      ["Lista de tablas habilitadas para la API generica de base de datos."],
      indent,
    );
  }
  if (name === "tableNameSchema") {
    return formatDoc(
      ["Esquema Zod que restringe los nombres de tabla aceptados por la API."],
      indent,
    );
  }
  if (name === "recordIdSchema") {
    return formatDoc(
      ["Esquema Zod que valida el identificador textual de un registro."],
      indent,
    );
  }
  if (name === "createPayloadSchema") {
    return formatDoc(
      ["Esquema Zod para validar cargas de creacion en la API generica."],
      indent,
    );
  }
  if (name === "updatePayloadSchema") {
    return formatDoc(
      ["Esquema Zod para validar cargas de actualizacion en la API generica."],
      indent,
    );
  }
  if (name === "Roles") {
    return formatDoc(
      [
        "Decorador que asocia los roles permitidos a un endpoint o controlador.",
      ],
      indent,
    );
  }
  if (name === "Public") {
    return formatDoc(
      [
        "Decorador que marca un endpoint como publico y omite autenticacion obligatoria.",
      ],
      indent,
    );
  }
  if (name === "normalizeRole") {
    return formatDoc(
      ["Normaliza el nombre de un rol para comparaciones consistentes."],
      indent,
    );
  }
  if (name === "hasAnyRole") {
    return formatDoc(
      [
        "Comprueba si el usuario autenticado posee alguno de los roles permitidos.",
        "@param user Usuario autenticado asociado a la solicitud.",
        "@param allowedRoles Colección de roles aceptados para la operación.",
        "@returns Valor booleano que resume el resultado de la evaluación.",
      ],
      indent,
    );
  }
  if (name === "decodeBase64Image") {
    return formatDoc(
      [
        "Decodifica una imagen codificada en base64 y separa su metadata principal.",
        "@param value Valor del parámetro `value`.",
        "@returns Resultado de la operación.",
      ],
      indent,
    );
  }
  if (name === "validateImageMimeType") {
    return formatDoc(
      [
        "Valida si el tipo MIME de una imagen pertenece al conjunto permitido.",
        "@param mimeType Valor del parámetro `mimeType`.",
        "@returns Valor booleano que resume el resultado de la evaluación.",
      ],
      indent,
    );
  }
  if (fileRole === "schema") {
    return formatDoc(
      [`Definicion reutilizable para ${normalizeEntityName(name)}.`],
      indent,
    );
  }
  if (/^[A-Z0-9_]+$/.test(name)) {
    return formatDoc(
      [
        `Constante interna utilizada por el flujo ${normalizeEntityName(name)}.`,
      ],
      indent,
    );
  }
  return formatDoc(
    [`Valor reutilizable asociado a ${normalizeEntityName(name)}.`],
    indent,
  );
}

function createDocForProperty(node, indent) {
  const name = node.name.getText();
  return formatDoc([describeProperty(name)], indent);
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function isTopLevelStatement(node) {
  return node.parent && ts.isSourceFile(node.parent);
}

function getIndentation(sourceFile, node) {
  const start = node.getFullStart();
  const lineStart = sourceFile.text.lastIndexOf("\n", start - 1) + 1;
  const prefix = sourceFile.text.slice(lineStart, start);
  const match = prefix.match(/^\s*/);
  return match?.[0] ?? "";
}

function shouldDocumentPropertySignature(node) {
  if (ts.isInterfaceDeclaration(node.parent)) {
    return true;
  }
  return (
    ts.isTypeLiteralNode(node.parent) &&
    ts.isTypeAliasDeclaration(node.parent.parent)
  );
}

function collectInsertions(sourceFile, filePath) {
  const insertions = [];
  const fileRole = getFileRole(filePath);

  function visit(node) {
    const indent = getIndentation(sourceFile, node);
    if (
      (ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isEnumDeclaration(node)) &&
      node.name &&
      !hasDoc(node, sourceFile) &&
      (isTopLevelStatement(node) || ts.isClassLike(node.parent))
    ) {
      let doc = null;
      if (ts.isClassDeclaration(node)) {
        doc = createDocForClass(node, fileRole, filePath, indent);
      } else if (ts.isInterfaceDeclaration(node)) {
        doc = createDocForInterface(node, indent);
      } else if (ts.isTypeAliasDeclaration(node)) {
        doc = createDocForTypeAlias(node, indent);
      } else {
        doc = createDocForFunction(node, indent);
      }
      insertions.push({ pos: node.getStart(sourceFile), text: `${doc}\n` });
    }

    if (
      ts.isVariableStatement(node) &&
      isTopLevelStatement(node) &&
      !hasDoc(node, sourceFile) &&
      (isNodeExported(node) ||
        fileRole === "schema" ||
        fileRole === "util" ||
        fileRole === "decorator")
    ) {
      const [firstDeclaration] = node.declarationList.declarations;
      if (firstDeclaration && ts.isIdentifier(firstDeclaration.name)) {
        const doc = createDocForVariable(
          node,
          firstDeclaration,
          fileRole,
          indent,
        );
        insertions.push({ pos: node.getStart(sourceFile), text: `${doc}\n` });
      }
    }

    if (
      (ts.isMethodDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isGetAccessorDeclaration(node) ||
        ts.isSetAccessorDeclaration(node)) &&
      !hasDoc(node, sourceFile) &&
      node.parent &&
      ts.isClassLike(node.parent) &&
      !ts.isConstructorDeclaration(node)
    ) {
      const doc = createDocForMethod(node, indent);
      insertions.push({ pos: node.getStart(sourceFile), text: `${doc}\n` });
    }

    if (
      (ts.isPropertyDeclaration(node) ||
        (ts.isPropertySignature(node) &&
          shouldDocumentPropertySignature(node))) &&
      !hasDoc(node, sourceFile) &&
      node.name &&
      !node.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword,
      )
    ) {
      const doc = createDocForProperty(node, indent);
      insertions.push({ pos: node.getStart(sourceFile), text: `${doc}\n` });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return insertions;
}

function applyInsertions(content, insertions) {
  return insertions
    .sort((a, b) => b.pos - a.pos)
    .reduce(
      (current, insertion) =>
        current.slice(0, insertion.pos) +
        insertion.text +
        current.slice(insertion.pos),
      content,
    );
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
  );
  const insertions = collectInsertions(sourceFile, filePath);
  if (!insertions.length) {
    return false;
  }
  const nextContent = applyInsertions(content, insertions);
  fs.writeFileSync(filePath, nextContent, "utf8");
  return true;
}

function main() {
  const files = walk(SOURCE_ROOT);
  let changed = 0;
  for (const filePath of files) {
    if (processFile(filePath)) {
      changed += 1;
    }
  }
  console.log(`TSDoc generado en ${changed} archivos.`);
}

main();
