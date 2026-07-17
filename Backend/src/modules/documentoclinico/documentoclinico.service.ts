import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { Documentoclinico } from "./documentoclinico.entity";
import { CreateDocumentoclinicoDto } from "./dto/create-documentoclinico.dto";
import { UpdateDocumentoclinicoDto } from "./dto/update-documentoclinico.dto";

const PRIMARY_KEYS = ["documentoId"];
const PRIMARY_KEY_TYPES: Record<
  string,
  "number" | "string" | "boolean" | "Date"
> = {
  documentoId: "number",
};

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

type AttachmentPayloadFields = {
  archivoBase64?: string | null;
  nombreArchivo?: string | null;
  mimeArchivo?: string | null;
};

type StoredAttachment = {
  relativePath: string;
  absolutePath: string;
  originalName: string;
  mimeType: string;
};

/**
 * Implementa la lógica de negocio y persistencia del dominio documentoclinico.
 */
@Injectable()
export class DocumentoclinicoService {
  constructor(
    @InjectRepository(Documentoclinico)
    private readonly documentoclinicoRepository: Repository<Documentoclinico>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(payload: CreateDocumentoclinicoDto): Promise<Documentoclinico> {
    const attachmentPayload = payload as CreateDocumentoclinicoDto &
      AttachmentPayloadFields;
    const {
      archivoBase64,
      nombreArchivo,
      mimeArchivo,
      ...recordPayload
    } = attachmentPayload;
    const storedAttachment = await this.storeAttachment(
      archivoBase64,
      nombreArchivo,
      mimeArchivo,
    );
    const entity = this.documentoclinicoRepository.create(
      recordPayload as Partial<Documentoclinico>,
    );

    if (storedAttachment) {
      entity.rutaarchivo = storedAttachment.relativePath;
      entity.campoprueba01 = storedAttachment.originalName;
      entity.campoprueba02 = storedAttachment.mimeType;
    }

    try {
      return await this.documentoclinicoRepository.save(entity);
    } catch (error) {
      if (storedAttachment) {
        await fs.unlink(storedAttachment.absolutePath).catch(() => undefined);
      }
      throw error;
    }
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  findAll(): Promise<Documentoclinico[]> {
    return this.documentoclinicoRepository.find();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: string): Promise<Documentoclinico> {
    const where = this.parseId(id);
    const entity = await this.documentoclinicoRepository.findOne({ where });
    if (!entity) {
      throw new NotFoundException(
        `registro ${id} no encontrado en documentoclinico`,
      );
    }
    return entity;
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  async update(
    id: string,
    payload: UpdateDocumentoclinicoDto,
  ): Promise<Documentoclinico> {
    const entity = await this.findOne(id);
    const attachmentPayload = payload as UpdateDocumentoclinicoDto &
      AttachmentPayloadFields;
    const {
      archivoBase64,
      nombreArchivo,
      mimeArchivo,
      ...recordPayload
    } = attachmentPayload;
    const shouldReplaceAttachment =
      archivoBase64 !== undefined ||
      nombreArchivo !== undefined ||
      mimeArchivo !== undefined;
    const previousPath = entity.rutaarchivo;
    const storedAttachment = shouldReplaceAttachment
      ? await this.storeAttachment(archivoBase64, nombreArchivo, mimeArchivo)
      : undefined;

    Object.assign(entity, recordPayload);
    if (storedAttachment) {
      entity.rutaarchivo = storedAttachment.relativePath;
      entity.campoprueba01 = storedAttachment.originalName;
      entity.campoprueba02 = storedAttachment.mimeType;
    } else if (shouldReplaceAttachment && archivoBase64 === null) {
      entity.rutaarchivo = undefined;
      entity.campoprueba01 = undefined;
      entity.campoprueba02 = undefined;
    }

    try {
      const saved = await this.documentoclinicoRepository.save(entity);
      if (shouldReplaceAttachment && previousPath) {
        await this.deleteStoredAttachment(previousPath);
      }
      return saved;
    } catch (error) {
      if (storedAttachment) {
        await fs.unlink(storedAttachment.absolutePath).catch(() => undefined);
      }
      throw error;
    }
  }

  async getArchivo(id: string) {
    const entity = await this.findOne(id);
    const absolutePath = this.resolveStoredAttachment(entity.rutaarchivo);
    if (!absolutePath) {
      throw new NotFoundException(
        `el documento ${id} no tiene un archivo adjunto guardado`,
      );
    }

    const buffer = await fs.readFile(absolutePath).catch(() => null);
    if (!buffer) {
      throw new NotFoundException(
        `el archivo adjunto del documento ${id} no esta disponible`,
      );
    }

    return {
      nombreArchivo: entity.campoprueba01 ?? `documento-${entity.documentoId}`,
      mimeArchivo: entity.campoprueba02 ?? "application/octet-stream",
      archivoBase64: buffer.toString("base64"),
    };
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    const where = this.parseId(id);
    const result = await this.documentoclinicoRepository.delete(where);
    if (!result.affected) {
      throw new NotFoundException(
        `registro ${id} no encontrado en documentoclinico`,
      );
    }
    if (entity.rutaarchivo) {
      await this.deleteStoredAttachment(entity.rutaarchivo);
    }
  }

  /**
   * Interpreta id.
   * @param rawId Identificador asociado a raw.
   * @returns Valor interpretado a partir de la entrada recibida.
   */
  private parseId(rawId: string): Record<string, any> {
    if (!PRIMARY_KEYS.length) {
      throw new BadRequestException("la tabla no define una clave primaria");
    }
    if (PRIMARY_KEYS.length === 1) {
      const key = PRIMARY_KEYS[0];
      return { [key]: this.castValue(rawId, PRIMARY_KEY_TYPES[key]) };
    }
    const segments = rawId.split(",").map((segment) => segment.trim());
    if (segments.length !== PRIMARY_KEYS.length) {
      throw new BadRequestException(
        "usa valores separados por coma siguiendo el orden de la clave primaria",
      );
    }
    const where: Record<string, any> = {};
    segments.forEach((segment, index) => {
      const key = PRIMARY_KEYS[index];
      where[key] = this.castValue(segment, PRIMARY_KEY_TYPES[key]);
    });
    return where;
  }

  /**
   * Cast value.
   * @param value Valor de entrada que se debe transformar o validar.
   * @param type Valor del parámetro `type`.
   * @returns Resultado de la operación.
   */
  private castValue(value: string, type: string): any {
    if (type === "number") {
      const num = Number(value);
      if (Number.isNaN(num)) {
        throw new BadRequestException("el identificador debe ser numerico");
      }
      return num;
    }
    if (type === "boolean") {
      if (value === "1" || value.toLowerCase() === "true") {
        return true;
      }
      if (value === "0" || value.toLowerCase() === "false") {
        return false;
      }
      throw new BadRequestException("el identificador booleano es invalido");
    }
    if (type === "Date") {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException("el identificador de fecha es invalido");
      }
      return date;
    }
    return value;
  }

  private async storeAttachment(
    base64Value: string | null | undefined,
    originalName: string | null | undefined,
    mimeType: string | null | undefined,
  ): Promise<StoredAttachment | null | undefined> {
    const decoded = this.decodeAttachment(base64Value, mimeType);
    if (decoded === undefined || decoded === null) {
      return decoded;
    }

    const uploadRoot = this.getUploadRoot();
    await fs.mkdir(uploadRoot, { recursive: true });
    const storedName = `${Date.now()}-${randomUUID()}${this.extensionForMime(
      decoded.mimeType,
    )}`;
    const absolutePath = path.join(uploadRoot, storedName);
    await fs.writeFile(absolutePath, decoded.buffer);

    return {
      absolutePath,
      relativePath: `documentos/${storedName}`,
      originalName: this.normalizeFileName(originalName, decoded.mimeType),
      mimeType: decoded.mimeType,
    };
  }

  private decodeAttachment(
    base64Value: string | null | undefined,
    mimeType: string | null | undefined,
  ): { buffer: Buffer; mimeType: string } | null | undefined {
    if (base64Value === undefined && mimeType === undefined) {
      return undefined;
    }
    if (base64Value === null) {
      return null;
    }
    if (base64Value === undefined) {
      throw new BadRequestException(
        "archivoBase64 es obligatorio cuando se envia mimeArchivo",
      );
    }

    const trimmed = base64Value.trim();
    if (!trimmed) {
      return null;
    }
    const prefixMatch = trimmed.match(/^data:([^;,]+);base64,/i);
    const inferredMime = prefixMatch?.[1]?.trim().toLowerCase() ?? null;
    const normalizedMime = this.normalizeMimeType(
      mimeType ?? inferredMime,
    );
    const payload = prefixMatch
      ? (trimmed.split(",", 2)[1] ?? "").trim()
      : trimmed.replace(/\s+/g, "");

    if (
      !payload ||
      payload.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)
    ) {
      throw new BadRequestException(
        "archivoBase64 debe ser una cadena base64 valida",
      );
    }

    const buffer = Buffer.from(payload, "base64");
    if (!buffer.length) {
      throw new BadRequestException("archivoBase64 no contiene datos validos");
    }
    if (buffer.length > MAX_ATTACHMENT_BYTES) {
      throw new BadRequestException(
        "el archivo adjunto no puede superar 3 MB",
      );
    }

    return { buffer, mimeType: normalizedMime };
  }

  private normalizeMimeType(value: string | null | undefined): string {
    const normalized = value?.trim().toLowerCase();
    if (!normalized || !ALLOWED_ATTACHMENT_MIME_TYPES.has(normalized)) {
      throw new BadRequestException(
        "mimeArchivo debe ser una imagen valida o application/pdf",
      );
    }
    return normalized === "image/jpg" ? "image/jpeg" : normalized;
  }

  private normalizeFileName(
    value: string | null | undefined,
    mimeType: string,
  ): string {
    const normalized = value
      ? path.basename(value).replace(/[^\w.\-() ]+/g, "_").slice(0, 180)
      : "";
    return normalized || `documento${this.extensionForMime(mimeType)}`;
  }

  private extensionForMime(mimeType: string): string {
    if (mimeType === "application/pdf") return ".pdf";
    if (mimeType === "image/png") return ".png";
    if (mimeType === "image/webp") return ".webp";
    return ".jpg";
  }

  private getUploadRoot(): string {
    return path.resolve(
      process.env.DOCUMENT_UPLOAD_DIR ??
        path.join(process.cwd(), "uploads", "documentos"),
    );
  }

  private resolveStoredAttachment(
    relativePath?: string | null,
  ): string | null {
    if (!relativePath?.startsWith("documentos/")) {
      return null;
    }
    const uploadRoot = this.getUploadRoot();
    const absolutePath = path.resolve(
      uploadRoot,
      relativePath.slice("documentos/".length),
    );
    return absolutePath.startsWith(`${uploadRoot}${path.sep}`)
      ? absolutePath
      : null;
  }

  private async deleteStoredAttachment(
    relativePath: string,
  ): Promise<void> {
    const absolutePath = this.resolveStoredAttachment(relativePath);
    if (absolutePath) {
      await fs.unlink(absolutePath).catch(() => undefined);
    }
  }
}
