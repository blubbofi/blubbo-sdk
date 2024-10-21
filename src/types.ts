import { Address, Cell } from "@ton/core";

export const TONBool = Object.freeze({
  TRUE: -1n,
  FALSE: 0n,
});

export type TONBool = typeof TONBool.TRUE | typeof TONBool.FALSE;

export function isTONBool(
  value: bigint,
): value is typeof TONBool.TRUE | typeof TONBool.FALSE {
  return value === TONBool.TRUE || value === TONBool.FALSE;
}

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

export type SendDepositArgs = {
  reserve_id_6: bigint;
  jetton_amount: bigint;
  to: Address;
  response_address: Address;
  custom_payload: Cell | null;
  forward_ton_amount: bigint;
};

export type SendWithdrawArgs = {
  face_amount: bigint;
  reserve_id_6: bigint;
  configPayload: Cell;
  configSignature: Cell;
  redstoneData: Cell;
};

export type SendBorrowArgs = {
  face_amount: bigint;
  reserve_id_6: bigint;
  configPayload: Cell;
  configSignature: Cell;
  redstoneData: Cell;
};

export type SendRepayArgs = {
  reserve_id_6: bigint;
  jetton_amount: bigint;
  to: Address;
  response_address: Address;
  custom_payload: Cell | null;
  forward_ton_amount: bigint;
};
