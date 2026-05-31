import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Medicacion } from "./medicacion.entity";
import {
  CreateMedicacionDto,
  UpdateMedicacionDto,
} from "./dto/create-medicacion.dto";

const PRIMARY_KEYS = ["medicacionId"];
const PRIMARY_KEY_TYPES: Record<
  string,
  "number" | "string" | "boolean" | "Date"
> = {
  medicacionId: "number",
};

const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

type AttachmentPayloadFields = {
  archivoRecetaBase64?: string | null;
  nombreArchivoReceta?: string | null;
  mimeArchivoReceta?: string | null;
};

/**
 * Implementa la lógica de negocio y persistencia del dominio medicacion.
 */
@Injectable()
export class MedicacionService {
  constructor(
    @InjectRepository(Medicacion)
    private readonly medicacionRepository: Repository<Medicacion>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  async create(payload: CreateMedicacionDto) {
    const attachmentPayload = payload as CreateMedicacionDto &
      AttachmentPayloadFields;
    const entity = this.medicacionRepository.create();
    entity.pacienteId = payload.pacienteId;
    entity.consultaId = payload.consultaId ?? undefined;
    entity.nombremedicamento = payload.nombremedicamento;
    entity.presentacion = payload.presentacion ?? undefined;
    entity.dosis = payload.dosis ?? undefined;
    entity.viaadministracion = payload.viaadministracion ?? undefined;
    entity.indicaciones = payload.indicaciones ?? undefined;
    entity.fechainicio = payload.fechainicio;
    entity.fechafin = payload.fechafin ?? undefined;
    entity.medicacionactiva = payload.medicacionactiva ?? true;

    const attachment = this.decodeAttachment(
      attachmentPayload.archivoRecetaBase64,
      attachmentPayload.mimeArchivoReceta,
      "archivoRecetaBase64",
      "mimeArchivoReceta",
    );
    entity.archivoReceta = attachment?.buffer ?? null;
    entity.mimeArchivoReceta = attachment?.mimeType ?? null;
    entity.nombreArchivoReceta = attachment
      ? this.normalizeFileName(
          attachmentPayload.nombreArchivoReceta,
          attachment.mimeType,
        )
      : null;

    entity.creadopor = payload.creadopor ?? undefined;
    entity.creadoen = payload.creadoen ?? new Date();
    entity.modificadopor = payload.modificadopor ?? undefined;
    entity.modificadoen = payload.modificadoen ?? undefined;
    entity.campoprueba03 = payload.campoprueba03 ?? null;
    entity.campoprueba04 = payload.campoprueba04 ?? null;
    entity.campoprueba05 = payload.campoprueba05 ?? null;

    const saved = await this.medicacionRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  async findAll() {
    const items = await this.medicacionRepository.find({
      order: { fechainicio: "DESC", medicacionId: "DESC" },
    });
    return items.map((item) => this.toResponse(item));
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: string) {
    const where = this.parseId(id);
    const entity = await this.medicacionRepository.findOne({ where });
    if (!entity) {
      throw new NotFoundException(`registro ${id} no encontrado en medicacion`);
    }
    return this.toResponse(entity);
  }

  /**
   * Update.
   * @param id Identificador del registro objetivo.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro actualizado.
   */
  async update(id: string, payload: UpdateMedicacionDto) {
    const attachmentPayload = payload as UpdateMedicacionDto &
      AttachmentPayloadFields;
    const where = this.parseId(id);
    const entity = await this.medicacionRepository.findOne({ where });
    if (!entity) {
      throw new NotFoundException(`registro ${id} no encontrado en medicacion`);
    }

    if (payload.pacienteId !== undefined) {
      entity.pacienteId = payload.pacienteId;
    }
    if (payload.consultaId !== undefined) {
      entity.consultaId = payload.consultaId ?? undefined;
    }
    if (payload.nombremedicamento !== undefined) {
      entity.nombremedicamento = payload.nombremedicamento;
    }
    if (payload.presentacion !== undefined) {
      entity.presentacion = payload.presentacion ?? undefined;
    }
    if (payload.dosis !== undefined) {
      entity.dosis = payload.dosis ?? undefined;
    }
    if (payload.viaadministracion !== undefined) {
      entity.viaadministracion = payload.viaadministracion ?? undefined;
    }
    if (payload.indicaciones !== undefined) {
      entity.indicaciones = payload.indicaciones ?? undefined;
    }
    if (payload.fechainicio !== undefined) {
      entity.fechainicio = payload.fechainicio;
    }
    if (payload.fechafin !== undefined) {
      entity.fechafin = payload.fechafin ?? undefined;
    }
    if (payload.medicacionactiva !== undefined) {
      entity.medicacionactiva = payload.medicacionactiva;
    }

    if (
      attachmentPayload.archivoRecetaBase64 !== undefined ||
      attachmentPayload.mimeArchivoReceta !== undefined
    ) {
      const attachment = this.decodeAttachment(
        attachmentPayload.archivoRecetaBase64,
        attachmentPayload.mimeArchivoReceta,
        "archivoRecetaBase64",
        "mimeArchivoReceta",
      );
      entity.archivoReceta = attachment?.buffer ?? null;
      entity.mimeArchivoReceta = attachment?.mimeType ?? null;
      if (!attachment) {
        entity.nombreArchivoReceta = null;
      }
    }
    if (attachmentPayload.nombreArchivoReceta !== undefined) {
      entity.nombreArchivoReceta = entity.mimeArchivoReceta
        ? this.normalizeFileName(
            attachmentPayload.nombreArchivoReceta,
            entity.mimeArchivoReceta,
          )
        : null;
    }
    if (
      attachmentPayload.mimeArchivoReceta !== undefined &&
      attachmentPayload.archivoRecetaBase64 === undefined
    ) {
      entity.mimeArchivoReceta = attachmentPayload.mimeArchivoReceta
        ? this.normalizeAttachmentMimeType(
            attachmentPayload.mimeArchivoReceta,
            "mimeArchivoReceta",
          )
        : null;
    }

    if (payload.creadopor !== undefined) {
      entity.creadopor = payload.creadopor ?? undefined;
    }
    if (payload.creadoen !== undefined) {
      entity.creadoen = payload.creadoen;
    }
    if (payload.modificadopor !== undefined) {
      entity.modificadopor = payload.modificadopor ?? undefined;
    }
    entity.modificadoen = payload.modificadoen ?? new Date();
    if (payload.campoprueba03 !== undefined) {
      entity.campoprueba03 = payload.campoprueba03 ?? null;
    }
    if (payload.campoprueba04 !== undefined) {
      entity.campoprueba04 = payload.campoprueba04 ?? null;
    }
    if (payload.campoprueba05 !== undefined) {
      entity.campoprueba05 = payload.campoprueba05 ?? null;
    }

    const saved = await this.medicacionRepository.save(entity);
    return this.toResponse(saved);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: string): Promise<void> {
    const where = this.parseId(id);
    const result = await this.medicacionRepository.delete(where);
    if (!result.affected) {
      throw new NotFoundException(`registro ${id} no encontrado en medicacion`);
    }
  }

  /**
   * Get receta.
   * @param id Identificador del registro objetivo.
   * @returns Archivo adjunto asociado a la medicación.
   */
  async getReceta(id: string) {
    const where = this.parseId(id);
    const entity = await this.medicacionRepository
      .createQueryBuilder("medicacion")
      .addSelect("medicacion.archivoReceta")
      .where("medicacion.medicacionid = :id", {
        id: where.medicacionId,
      })
      .getOne();

    if (!entity) {
      throw new NotFoundException(`registro ${id} no encontrado en medicacion`);
    }
    if (!entity.archivoReceta || !entity.mimeArchivoReceta) {
      throw new NotFoundException(
        `la medicacion ${id} no tiene receta adjunta`,
      );
    }

    return {
      medicacionId: entity.medicacionId,
      nombreArchivoReceta:
        entity.nombreArchivoReceta ??
        `receta-medicacion-${entity.medicacionId}${this.extensionForMime(entity.mimeArchivoReceta)}`,
      mimeArchivoReceta: entity.mimeArchivoReceta,
      archivoRecetaBase64: entity.archivoReceta.toString("base64"),
    };
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

  /**
   * Convierte el valor a response.
   * @param entity Valor del parámetro `entity`.
   * @returns Valor convertido al formato de salida esperado.
   */
  private toResponse(entity: Medicacion) {
    return {
      medicacionId: entity.medicacionId,
      pacienteId: entity.pacienteId,
      consultaId: entity.consultaId ?? null,
      nombremedicamento: entity.nombremedicamento,
      presentacion: entity.presentacion ?? null,
      dosis: entity.dosis ?? null,
      viaadministracion: entity.viaadministracion ?? null,
      indicaciones: entity.indicaciones ?? null,
      fechainicio: entity.fechainicio,
      fechafin: entity.fechafin ?? null,
      medicacionactiva: entity.medicacionactiva,
      nombreArchivoReceta: entity.nombreArchivoReceta ?? null,
      mimeArchivoReceta: entity.mimeArchivoReceta ?? null,
      tieneArchivoReceta: !!entity.mimeArchivoReceta,
      creadopor: entity.creadopor ?? null,
      creadoen: entity.creadoen,
      modificadopor: entity.modificadopor ?? null,
      modificadoen: entity.modificadoen ?? null,
      campoprueba03: entity.campoprueba03 ?? null,
      campoprueba04: entity.campoprueba04 ?? null,
      campoprueba05: entity.campoprueba05 ?? null,
    };
  }

  /**
   * Decodifica un adjunto genérico de imagen o PDF.
   * @param base64Value Contenido en base64.
   * @param mimeType Valor del mime type reportado por el cliente.
   * @param base64Field Nombre del campo base64.
   * @param mimeField Nombre del campo mime.
   * @returns Buffer y mime normalizados o null/undefined.
   */
  private decodeAttachment(
    base64Value: string | null | undefined,
    mimeType: string | null | undefined,
    base64Field: string,
    mimeField: string,
  ):
    | { buffer: Buffer; mimeType: string }
    | null
    | undefined {
    if (base64Value === undefined && mimeType === undefined) {
      return undefined;
    }
    if (base64Value === null) {
      return null;
    }
    if (base64Value === undefined) {
      throw new BadRequestException(
        `${base64Field} es obligatorio cuando se envia ${mimeField}`,
      );
    }

    const trimmed = base64Value.trim();
    if (!trimmed) {
      return null;
    }

    const prefixMatch = trimmed.match(/^data:([^;,]+);base64,/i);
    const inferredMime = prefixMatch?.[1]?.trim().toLowerCase() ?? null;
    const normalizedMime = this.normalizeAttachmentMimeType(
      mimeType ?? inferredMime,
      mimeField,
    );
    if (!normalizedMime) {
      throw new BadRequestException(`${mimeField} es obligatorio`);
    }

    const payload = prefixMatch
      ? (trimmed.split(",", 2)[1] ?? "").trim()
      : trimmed.replace(/\s+/g, "");

    if (
      !payload ||
      payload.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)
    ) {
      throw new BadRequestException(
        `${base64Field} debe ser una cadena base64 valida`,
      );
    }

    const buffer = Buffer.from(payload, "base64");
    if (!buffer.length) {
      throw new BadRequestException(`${base64Field} no contiene datos validos`);
    }

    return {
      buffer,
      mimeType: normalizedMime,
    };
  }

  /**
   * Normaliza el mime type del adjunto.
   * @param value Valor del mime.
   * @param field Nombre del campo.
   * @returns Mime normalizado.
   */
  private normalizeAttachmentMimeType(
    value: string | null | undefined,
    field: string,
  ): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(normalized)) {
      throw new BadRequestException(
        `${field} debe ser una imagen valida o application/pdf`,
      );
    }
    return normalized === "image/jpg" ? "image/jpeg" : normalized;
  }

  /**
   * Normaliza el nombre del archivo.
   * @param value Nombre recibido.
   * @param mimeType Mime type del adjunto.
   * @returns Nombre de archivo normalizado.
   */
  private normalizeFileName(
    value: string | null | undefined,
    mimeType: string,
  ): string {
    const normalized = value?.trim();
    if (normalized) {
      return normalized;
    }
    return `receta-medicacion${this.extensionForMime(mimeType)}`;
  }

  /**
   * Obtiene una extensión sugerida a partir del mime.
   * @param mimeType Mime type del adjunto.
   * @returns Extensión sugerida.
   */
  private extensionForMime(mimeType: string): string {
    if (mimeType === "application/pdf") return ".pdf";
    if (mimeType === "image/png") return ".png";
    if (mimeType === "image/webp") return ".webp";
    return ".jpg";
  }
}
