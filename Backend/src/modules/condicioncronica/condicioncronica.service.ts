import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Condicioncronica } from "./condicioncronica.entity";
import { CreateCondicioncronicaDto } from "./dto/create-condicioncronica.dto";
import { UpdateCondicioncronicaDto } from "./dto/update-condicioncronica.dto";

const PRIMARY_KEYS = ["condicioncronicaId"];
const PRIMARY_KEY_TYPES: Record<
  string,
  "number" | "string" | "boolean" | "Date"
> = {
  condicioncronicaId: "number",
};

/**
 * Implementa la lógica de negocio y persistencia del dominio condicioncronica.
 */
@Injectable()
export class CondicioncronicaService {
  constructor(
    @InjectRepository(Condicioncronica)
    private readonly condicioncronicaRepository: Repository<Condicioncronica>,
  ) {}

  /**
   * Create.
   * @param payload Datos validados que recibe la operación.
   * @returns Registro creado.
   */
  create(payload: CreateCondicioncronicaDto): Promise<Condicioncronica> {
    const entity = this.condicioncronicaRepository.create(
      payload as Partial<Condicioncronica>,
    );
    return this.condicioncronicaRepository.save(entity);
  }

  /**
   * Find all.
   * @returns Colección de registros encontrados.
   */
  findAll(): Promise<Condicioncronica[]> {
    return this.condicioncronicaRepository.find();
  }

  /**
   * Find one.
   * @param id Identificador del registro objetivo.
   * @returns Resultado de la consulta solicitada.
   */
  async findOne(id: string): Promise<Condicioncronica> {
    const where = this.parseId(id);
    const entity = await this.condicioncronicaRepository.findOne({ where });
    if (!entity) {
      throw new NotFoundException(
        `registro ${id} no encontrado en condicioncronica`,
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
    payload: UpdateCondicioncronicaDto,
  ): Promise<Condicioncronica> {
    const entity = await this.findOne(id);
    Object.assign(entity, payload);
    return this.condicioncronicaRepository.save(entity);
  }

  /**
   * Remove.
   * @param id Identificador del registro objetivo.
   * @returns La operación se completa sin devolver contenido.
   */
  async remove(id: string): Promise<void> {
    const where = this.parseId(id);
    const result = await this.condicioncronicaRepository.delete(where);
    if (!result.affected) {
      throw new NotFoundException(
        `registro ${id} no encontrado en condicioncronica`,
      );
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
}
