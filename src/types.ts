import { Cell } from "@ton/core";

export const TONBool = Object.freeze({
  TRUE: -1n,
  FALSE: 0n,
});

export type TONBool = typeof TONBool.TRUE | typeof TONBool.FALSE;

export type ReserveVars0 = {
  enabled: TONBool;
  decimals: bigint;
  borrow_factor_pct: bigint;
  collateral_factor_pct: bigint;
  reserve_factor_pct: bigint;
  liquidation_bonus_pct: bigint;
  debt_limit: bigint;
  /**
   * This is null when the reserve is toncoin
   */
  jetton_wallet_code: Cell;
};

export type ReserveVars1 = {
  last_update_timestamp: bigint;
  lending_accumulator: bigint;
  debt_accumulator: bigint;
  current_lending_rate: bigint;
  current_borrowing_rate: bigint;
  total_raw_amount_to_treasury: bigint;
};

export type ReserveVars2 = {
  total_raw_available: bigint;
  total_raw_debt: bigint;
};

export type ReserveVars3 = {
  slope0_pct: bigint;
  slope1_pct: bigint;
  y_intercept: bigint;
  optimal_rate_pct: bigint;
};

export type BeachReserveStorage = {
  reserve_vars_0: Cell;
  reserve_vars_1: Cell;
  reserve_vars_2: Cell;
  reserve_vars_3: Cell;
};
