/**
 * @file Backend/src/nano/nano-appearance.service.ts
 * @description TypeScript module implementation.
 */

import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { nanoAppearanceIds } from "./dto/select-nano-appearance.dto";
import { UsuarioNanoAppearance } from "./entities/usuario-nano-appearance.entity";

type UnlockRule = { month: number; day: number };

const UNLOCK_RULES: Partial<
  Record<(typeof nanoAppearanceIds)[number], UnlockRule>
> = {
  valentin: { month: 2, day: 14 },
  gladiador: { month: 9, day: 14 },
  patriota: { month: 9, day: 15 },
  halloween: { month: 10, day: 31 },
  navideno: { month: 12, day: 25 },
};

@Injectable()
export class NanoAppearanceService {
  constructor(
    @InjectRepository(UsuarioNanoAppearance)
    private readonly repository: Repository<UsuarioNanoAppearance>,
    private readonly config: ConfigService,
  ) {}

  async registerLoginUnlocks(userId: number, loginDate = new Date()) {
    await this.ensureUnlocked(userId, "base", loginDate);

    const { month, day } = this.getCalendarDate(loginDate);
    for (const [appearanceId, rule] of Object.entries(UNLOCK_RULES)) {
      if (rule?.month === month && rule.day === day) {
        await this.ensureUnlocked(userId, appearanceId, loginDate);
      }
    }
  }

  async getState(userId: number) {
    const rows = await this.repository.find({
      where: { usuarioId: userId },
      order: { unlockedAt: "ASC" },
    });
    const unlockedIds = Array.from(
      new Set(["base", ...rows.map((row) => row.appearanceId)]),
    ).filter((id) => (nanoAppearanceIds as readonly string[]).includes(id));
    const selectedId =
      rows.find((row) => row.selected && unlockedIds.includes(row.appearanceId))
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

    const unlocked =
      appearanceId === "base" ||
      Boolean(
        await this.repository.findOne({
          where: { usuarioId: userId, appearanceId },
        }),
      );
    if (!unlocked) {
      throw new BadRequestException(
        "esta apariencia de Nano todavia esta bloqueada",
      );
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

  private getCalendarDate(date: Date) {
    const timeZone = this.config.get<string>(
      "NANO_UNLOCK_TIME_ZONE",
      "America/Managua",
    );
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      month: "numeric",
      day: "numeric",
    }).formatToParts(date);
    const value = (type: "month" | "day") =>
      Number(parts.find((part) => part.type === type)?.value);
    return { month: value("month"), day: value("day") };
  }
}
