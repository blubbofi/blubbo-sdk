import { Address, Cell, Dictionary } from "@ton/core";
import { Maybe } from "@ton/core/dist/utils/maybe";

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

export const TonBoolToBoolean = (value: TONBool) => value === TONBool.TRUE;

export type ReserveId = 0 | 1;

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
  /**
   * The reserve ID of the jetton.
   * Each jetton has a unique reserve ID.
   */
  reserve_id_6: ReserveId;
  /**
   * Amount to deposit, in its native amount.
   * Note that the decimals in the native amount differs across different jetton types.
   */
  jetton_amount: bigint;
  /**
   * In case of TON, this is the address of SOTW.
   *
   * In case of jetton, this is the address of user's jetton wallet
   * ```
   * user -> user's jetton wallet -> receiver's jetton wallet -> receiver
   *         ^^ this address
   * ```
   */
  to: Address;
  /**
   * The address of the contract that will receive the leftover TON that was
   * not used as gas. Typically, this is the address of the user's wallet.
   */
  response_address: Address;
  /**
   * The amount of TON to forward to the contracts that will receive
   * forwarded messages from the first contract that received the transaction,
   * to be used as a gas.
   */
  forward_ton_amount: bigint;
};

export type SendDepositToSotwArgs = Pick<
  SendDepositArgs,
  "jetton_amount" | "reserve_id_6" | "response_address"
>;

export type ContractInteractionDepositArgs = Omit<
  SendDepositArgs,
  "forward_ton_amount" | "to"
>;

export type SendWithdrawArgs = {
  /**
   * The reserve ID of the jetton.
   * Each jetton has a unique reserve ID.
   */
  reserve_id_6: ReserveId;
  /**
   * Amount to withdraw, in its native amount.
   * Note that the decimals in the native amount differs across different jetton types.
   */
  face_amount: bigint;
  /**
   * Config payload. This is calculated statically before the transaction.
   */
  configPayload: Cell;
  /**
   * Config signature. This is calculated statically before the transaction.
   */
  configSignature: Cell;
  /**
   * Redstone data. This is retrieved from Redstone oracle before the transaction.
   */
  redstoneData: Cell;
};

export type ContractInteractionWithdrawArgs = Omit<
  SendWithdrawArgs,
  "configPayload" | "configSignature"
>;

export type SendBorrowArgs = {
  /**
   * The reserve ID of the jetton.
   * Each jetton has a unique reserve ID.
   */
  reserve_id_6: ReserveId;
  /**
   * Amount to borrow, in its native amount.
   * Note that the decimals in the native amount differs across different jetton types.
   */
  face_amount: bigint;
  /**
   * Config payload. This is calculated statically before the transaction.
   */
  configPayload: Cell;
  /**
   * Config signature. This is calculated statically before the transaction.
   */
  configSignature: Cell;
  /**
   * Redstone data. This is retrieved from Redstone oracle before the transaction.
   */
  redstoneData: Cell;
};

export type ContractInteractionBorrowArgs = Omit<
  SendBorrowArgs,
  "configPayload" | "configSignature"
>;

export type SendRepayArgs = {
  /**
   * The reserve ID of the jetton.
   * Each jetton has a unique reserve ID.
   */
  reserve_id_6: ReserveId;
  /**
   * Amount to repay, in its native amount.
   * Note that the decimals in the native amount differs across different jetton types.
   */
  jetton_amount: bigint;
  /**
   * In case of TON, this is the address of SOTW.
   *
   * In case of jetton, this is the address of user's jetton wallet
   * ```
   * user -> user's jetton wallet -> receiver's jetton wallet -> receiver
   *         ^^ this address
   * ```
   */
  to: Address;
  /**
   * The address of the contract that will receive the leftover TON that was
   * not used as gas. Typically, this is the address of the user's wallet.
   */
  response_address: Address;
  /**
   * The amount of TON to forward to the contracts that will receive
   * forwarded messages from the first contract that received the transaction,
   */
  forward_ton_amount: bigint;
};

export type SendRepayToSotwArgs = Pick<
  SendRepayArgs,
  "jetton_amount" | "reserve_id_6" | "response_address"
>;

export type ContractInteractionRepayArgs = Omit<
  SendRepayArgs,
  "forward_ton_amount" | "to"
>;

export type ContractInteractionMintArgs = {
  jetton_minter_addr: Address;
  response_addr: Address;
  to: Address;
  jetton_amount: bigint;
};

export type WithGas<T> = {
  gas: bigint;
} & T;

export type WithOwnerAddress<T> = {
  /**
   * The address of user's wallet that is initiating the transaction
   */
  owner_address: Address;
} & T;

export type BeachUserVars0 = {
  owner_address: Address;
  beach_master_address: Address;
  // Null means empty dictionary
  raw_deposit_per_jetton_dict: null | Dictionary<bigint, Cell>;
  // Null means empty dictionary
  raw_debt_per_jetton_dict: null | Dictionary<bigint, Cell>;
  beach_user_code: Cell;
  // Unused for now (always set as null)
  additionalData: Maybe<Cell>;
};

export type BeachUserVars1 = {
  tx_locks: Cell;
};

export type TxLocks = {
  withdrawal_lock_id: bigint;
  withdrawal_lock: bigint;
  borrowing_lock_id: bigint;
  borrowing_lock: bigint;
  repayment_lock_id: bigint;
  repayment_lock: bigint;
  liquidation_lock_id: bigint;
  liquidation_lock: bigint;
};

export type CollateralData = {
  total_discounted_face_deposit: bigint;
  total_collateral_required: bigint;
};

/**
 * @example
 * ```
   decimals: 9n,
   borrow_factor_pct: 80n,
   collateral_factor_pct: 70n,
   lending_accumulator: 1200000000000000000000000000n,
   debt_accumulator: 1100000000000000000000000000n,
   price: 539997381n, // 5.39997381 USD
   ```
 */
export type VariablePerReserve = {
  decimals: bigint;
  borrow_factor_pct: bigint;
  collateral_factor_pct: bigint;
  lending_accumulator: bigint;
  debt_accumulator: bigint;
  price: bigint;
};
