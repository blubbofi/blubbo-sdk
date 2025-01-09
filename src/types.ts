import { Address, Cell, Dictionary } from "@ton/core";
import { Maybe } from "@ton/core/dist/utils/maybe";

/**
 * On TON, booleans are represented as -1 for true and 0 for false.
 */
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

/**
 * In the current deployment, there are only two reserves: TON and USDT.
 *
 * This is a reserve ID that is used to identify the reserve.
 *
 * Reserve ID 0 is TON and Reserve ID 1 is USDT.
 */
export type ReserveId = 0 | 1;

export type WithSystemVersion<T> = {
  system_version: bigint;
} & T;

export type ReserveVars0 = {
  /**
   * Whether the reserve is enabled or not.
   * MUST use TONBool to compare (not ordinary boolean operators)
   */
  enabled: TONBool;
  /**
   * The number of decimal places of the reserve.
   * For example, TON has 9 decimal places.
   */
  decimals: bigint;
  /**
   * The borrow factor of the reserve in percentage.
   * 0n <= borrow_factor_pct <= 100n
   */
  borrow_factor_pct: bigint;
  /**
   * The collateral factor of the reserve in percentage.
   * 0n <= collateral_factor_pct <= 100n
   */
  collateral_factor_pct: bigint;
  /**
   * The reserve factor of the reserve in percentage.
   * 0n <= reserve_factor_pct <= 100n
   */
  reserve_factor_pct: bigint;
  /**
   * The liquidation bonus in percentage that describes how much more
   * the liquidator receives when liquidating a position.
   * 0n <= liquidation_bonus_pct <= 100n
   */
  liquidation_bonus_pct: bigint;
  /**
   * The global debt limit of the reserve,
   * in the unit of the reserve's native amount and decimal places.
   */
  debt_limit: bigint;
  /**
   * This is null when the reserve is toncoin.
   * Stores the wallet code of a jetton specific to the reserve.
   * This is used for calculating the wallet address of the user's jetton wallet.
   */
  jetton_wallet_code: Cell;
};

export type ReserveVars1 = {
  /**
   * The last timestamp when the reserve's accumulators, rates, and totals were updated,
   * in the unit of seconds.
   */
  last_update_timestamp: bigint;
  /**
   * The lending accumulator of the reserve. i.e. the liquidity index.
   * In the unit of `ScMath.SCALE`.
   * @example
   * 1000000000564234572341374307
   */
  lending_accumulator: bigint;
  /**
   * The borrowing accumulator of the reserve. i.e. the debt index.
   * In the unit of `ScMath.SCALE`.
   * @example
   * 1000000000564234572341374307
   */
  debt_accumulator: bigint;
  /**
   * The current lending rate of the reserve.
   * In the unit of `ScMath.SCALE`.
   * @example
   * 50556930693069306930693069n would mean 5.0556930693069306930693069%
   */
  current_lending_rate: bigint;
  /**
   * The current borrowing rate of the reserve.
   * In the unit of `ScMath.SCALE`.
   * @example
   * 50556930693069306930693069n would mean 5.0556930693069306930693069%
   */
  current_borrowing_rate: bigint;
  total_raw_amount_to_treasury: bigint;
};

export type ReserveVars2 = {
  /**
   * The total raw available liquidity of the reserve, without
   * considering the accumulators.
   */
  total_raw_available: bigint;
  /**
   * The total raw debt of the reserve, without considering the accumulators.
   */
  total_raw_debt: bigint;
};

export type ReserveVars3 = {
  /**
   * 0 <= slope0_pct <= 100
   */
  slope0_pct: bigint;
  /**
   * 0 <= slope1_pct <= 100
   */
  slope1_pct: bigint;
  /**
   * 0 <= y_intercept
   */
  y_intercept: bigint;
  /**
   * 0 <= optimal_rate_pct <= 100
   */
  optimal_rate_pct: bigint;
};

export type BlubboReserveStorage = {
  reserve_vars_0: Cell;
  reserve_vars_1: Cell;
  reserve_vars_2: Cell;
  reserve_vars_3: Cell;
};

export type SendDepositArgs = WithSystemVersion<{
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
}>;

export type SendDepositToSotwArgs = Pick<
  SendDepositArgs,
  "jetton_amount" | "reserve_id_6" | "response_address" | "system_version"
>;

export type ContractInteractionDepositArgs = Omit<
  SendDepositArgs,
  "forward_ton_amount" | "to"
>;

export type SendWithdrawArgs = WithSystemVersion<{
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
}>;

export type ContractInteractionWithdrawArgs = Omit<
  SendWithdrawArgs,
  "configPayload" | "configSignature"
>;

export type SendBorrowArgs = WithSystemVersion<{
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
}>;

export type ContractInteractionBorrowArgs = Omit<
  SendBorrowArgs,
  "configPayload" | "configSignature"
>;

export type SendRepayArgs = WithSystemVersion<{
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
}>;

export type SendRepayToSotwArgs = Pick<
  SendRepayArgs,
  "jetton_amount" | "reserve_id_6" | "response_address" | "system_version"
>;

export type ContractInteractionRepayArgs = Omit<
  SendRepayArgs,
  "forward_ton_amount" | "to"
>;

export type SendLiquidateArgs = {
  jetton_amount: bigint;
  to: Address;
  response_address: Address;
  forward_ton_amount: bigint;
  forward_payload: {
    debt_reserve_id: ReserveId;
    /**
     * The address of the wallet to which to-be-liquidated BlubboUser contract belongs.
     * (This is NOT the address of BlubboUser contract)
     */
    liquidation_target_wallet_address: Address;
    collateral_reserve_id: ReserveId;
    redstoneData: Cell;
    configPayload: Cell;
    configSignature: Cell;
    system_version: bigint;
  };
};

export type SendLiquidateToSotwArgs = Omit<SendLiquidateArgs, "custom_payload">;

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

export type BlubboUserVars0 = {
  /**
   * The address of the user's wallet to which the Blubbo user contract belongs.
   */
  owner_address: Address;
  /**
   * The deployed address of the Blubbo master contract.
   */
  blubbo_master_address: Address;
  /**
   * A dictionary that maps the reserve ID to the raw amount of jetton deposited.
   */
  raw_deposit_per_jetton_dict: null | Dictionary<bigint, Cell>;
  /**
   * A dictionary that maps the reserve ID to the raw amount of jetton borrowed.
   */
  raw_debt_per_jetton_dict: null | Dictionary<bigint, Cell>;
  /**
   * Version of the BlubboUser contract.
   */
  blubbo_user_version: bigint;
  // Unused for now (always set as null)
  additionalData: Maybe<Cell>;
};

export type BlubboUserVars1 = {
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
  /**
   * The amount of the collateral in an 8-decimals long integer,
   * discounted by collateral factor.
   */
  total_discounted_face_deposit: bigint;
  /**
   * The amount of collaterals needed to back a user's debt in
   * an 8-decimals long integer, exaggerated by borrow factor (if specified in an option).
   */
  total_collateral_required: bigint;
};

/**
 * Data that is sent to Blubbo user contract to calculate `CollateralData`.
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
