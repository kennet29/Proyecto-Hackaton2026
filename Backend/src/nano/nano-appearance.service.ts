/**
 * @file Backend/src/nano/nano-appearance.service.ts
 * @description TypeScript module implementation.
 */

import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { nanoAppearanceIds } from "./dto/select-nano-appearance.dto";
import { UsuarioNanoAppearance } from "./entities/usuario-nano-appearance.entity";

@Injectable()
export class NanoAppearanceService {
  constructor(
    @InjectRepository(UsuarioNanoAppearance)
    private readonly repository: Repository<UsuarioNanoAppearance>,
  ) {}

  async registerLoginUnlocks(userId: number, loginDate = new Date()) {
    await Promise.all(
      nanoAppearanceIds.map((appearanceId) =>
        this.ensureUnlocked(userId, appearanceId, loginDate),
      ),
    );
  }

  async getState(userId: number) {
    const rows = await this.repository.find({
      where: { usuarioId: userId },
      order: { unlockedAt: "ASC" },
    });
    const unlockedIds = [...nanoAppearanceIds];
    const selectedId =
      rows.find(
        (row) =>
          row.selected &&
          (unlockedIds as readonly string[]).includes(row.appearanceId),
      )
        ?.appearanceId ?? "base";

    return { selectedId, unlockedIds };
  }

  async select(userId: number, appearanceId: string) {
    const validAppearance = (nanoAppearanceIds as readonly string[]).includes(
      appearanceId,
    );
    if (!validAppearance) {
      throw new BadRequestException("apariencia de Nano no valida");
    }

    await this.repository.manager.transaction(async (manager) => {
      const transactionRepository =
        manager.getRepository(UsuarioNanoAppearance);
      await transactionRepository.update(
        { usuarioId: userId },
        { selected: false },
      );
      let selectedRow = await transactionRepository.findOne({
        where: { usuarioId: userId, appearanceId },
      });
      if (!selectedRow) {
        selectedRow = transactionRepository.create({
          usuarioId: userId,
          appearanceId,
          unlockedAt: new Date(),
        });
      }
      selectedRow.selected = true;
      await transactionRepository.save(selectedRow);
    });

    return this.getState(userId);
  }

  private async ensureUnlocked(
    userId: number,
    appearanceId: string,
    unlockedAt: Date,
  ) {
    const existing = await this.repository.findOne({
      where: { usuarioId: userId, appearanceId },
    });
    if (existing) return;

    await this.repository.save(
      this.repository.create({
        usuarioId: userId,
        appearanceId,
        unlockedAt,
        selected: false,
      }),
    );
  }

}
