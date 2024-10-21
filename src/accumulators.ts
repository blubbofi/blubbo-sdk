import { ScMath } from "./math";
import { ReserveVars0, ReserveVars1, ReserveVars2 } from "./types";

type GetLendingAccumulatorArgs = {
  reserve_vars_0: Pick<ReserveVars0, "reserve_factor_pct">;
  reserve_vars_1: Pick<
    ReserveVars1,
    "last_update_timestamp" | "lending_accumulator" | "current_lending_rate"
  >;
  block_timestamp: bigint;
};

type GetDebtAccumulatorArgs = {
  reserve_vars_1: Pick<
    ReserveVars1,
    "last_update_timestamp" | "debt_accumulator" | "current_borrowing_rate"
  >;
  block_timestamp: bigint;
};

type GetPendingTreasuryAmountArgs = {
  reserve_vars_0: Pick<ReserveVars0, "reserve_factor_pct">;
  reserve_vars_1: Pick<
    ReserveVars1,
    "last_update_timestamp" | "lending_accumulator" | "current_lending_rate"
  >;
  reserve_vars_2: Pick<ReserveVars2, "total_raw_available">;
  block_timestamp: bigint;
};

export class Accumulators {
  static getLendingAccumulator(args: GetLendingAccumulatorArgs): bigint {
    const reserve_factor_pct_scaled = ScMath.uint_scale_pct(
      args.reserve_vars_0.reserve_factor_pct,
    );
    const { last_update_timestamp, lending_accumulator, current_lending_rate } =
      args.reserve_vars_1;

    if (last_update_timestamp === args.block_timestamp) {
      return lending_accumulator;
    } else {
      const time_diff = ScMath.uint_sub(
        args.block_timestamp,
        last_update_timestamp,
      );
      const one_minus_reserve_factor = ScMath.uint_sub(
        ScMath.SCALE,
        reserve_factor_pct_scaled,
      );

      const temp_1 = current_lending_rate * time_diff;
      const temp_2 = temp_1 * one_minus_reserve_factor;
      const temp_3 = temp_2 / ScMath.SECONDS_PER_YEAR;
      const temp_4 = temp_3 / ScMath.SCALE;
      const temp_5 = temp_4 + ScMath.SCALE;

      return ScMath.uint_mul(temp_5, lending_accumulator);
    }
  }

  static getDebtAccumulator(args: GetDebtAccumulatorArgs): bigint {
    const { last_update_timestamp, debt_accumulator, current_borrowing_rate } =
      args.reserve_vars_1;

    if (last_update_timestamp === args.block_timestamp) {
      return debt_accumulator;
    } else {
      const time_diff = ScMath.uint_sub(
        args.block_timestamp,
        last_update_timestamp,
      );

      const temp_1 = current_borrowing_rate * time_diff;
      const temp_2 = temp_1 / ScMath.SECONDS_PER_YEAR;
      const temp_3 = temp_2 + ScMath.SCALE;

      return ScMath.uint_mul(temp_3, debt_accumulator);
    }
  }

  static getPendingTreasuryAmount(args: GetPendingTreasuryAmountArgs): bigint {
    const reserve_factor_pct_scaled = ScMath.uint_scale_pct(
      args.reserve_vars_0.reserve_factor_pct,
    );
    const { last_update_timestamp, lending_accumulator, current_lending_rate } =
      args.reserve_vars_1;
    const { total_raw_available } = args.reserve_vars_2;

    if (last_update_timestamp === args.block_timestamp) {
      return BigInt(0);
    } else {
      const time_diff = ScMath.uint_sub(
        args.block_timestamp,
        last_update_timestamp,
      );

      const temp_1 = current_lending_rate * time_diff;
      const temp_2 = temp_1 * reserve_factor_pct_scaled;
      const temp_3 = temp_2 / ScMath.SECONDS_PER_YEAR;
      const temp_4 = temp_3 / ScMath.SCALE;
      const temp_5 = ScMath.uint_mul(temp_4, lending_accumulator);

      return ScMath.uint_mul(total_raw_available, temp_5);
    }
  }
}
