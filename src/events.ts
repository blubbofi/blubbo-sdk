import { Address, beginCell, Cell } from "@ton/core";

export type NonLiquidationEvent = {
  op: bigint;
  system_version: bigint;
  blubbo_user_version: bigint;
  reserve_id: bigint;

  last_update_timestamp: bigint;
  lending_accumulator: bigint;
  debt_accumulator: bigint;
  total_raw_amount_to_treasury: bigint;

  lending_rate: bigint;
  borrowing_rate: bigint;
  total_raw_available: bigint;
  total_raw_debt: bigint;

  message_origin_wallet_address: Address;
  raw_amount: bigint;
  face_amount: bigint;
};

export type LiquidationEvent = {
  system_version: bigint;
  blubbo_user_version: bigint;
  debt_reserve_id: bigint;

  last_update_timestamp: bigint;
  lending_accumulator: bigint;
  debt_accumulator: bigint;
  total_raw_amount_to_treasury: bigint;

  lending_rate: bigint;
  borrowing_rate: bigint;
  total_raw_available: bigint;
  total_raw_debt: bigint;

  liquidator_wallet_address: Address;
  liquidated_wallet_address: Address;
  raw_repayment_amount: bigint;
  face_repayment_amount: bigint;
  captured_collateral_reserve_id: bigint;
  raw_captured_collateral_amount: bigint;
  face_captured_collateral_amount: bigint;
};

export class Events {
  static DEPOSIT = 0n;
  static WITHDRAWAL = 1n;
  static BORROWING = 2n;
  static REPAYMENT = 3n;
  static LIQUIDATION = 4n;

  public static unpack = {
    liquidation: Events.liquidation,
    nonLiquidation: Events.nonLiquidation,
  };

  private static nonLiquidation(body: Cell): NonLiquidationEvent {
    const slice = body.asSlice();

    const op = slice.loadUintBig(6);

    const common = slice.loadRef();
    const common_slice = common.asSlice();

    const headers = common_slice.loadRef();
    const headers_slice = headers.asSlice();
    const system_version = headers_slice.loadUintBig(14);
    const blubbo_user_version = headers_slice.loadUintBig(14);
    const reserve_id = headers_slice.loadUintBig(6);

    const accumulators = common_slice.loadRef();
    const accumulators_slice = accumulators.asSlice();
    const last_update_timestamp = accumulators_slice.loadUintBig(64);
    const lending_accumulator = accumulators_slice.loadUintBig(105);
    const debt_accumulator = accumulators_slice.loadUintBig(105);
    const total_raw_amount_to_treasury = accumulators_slice.loadUintBig(256);

    const rates_and_totals = common_slice.loadRef();
    const rates_and_totals_slice = rates_and_totals.asSlice();
    const lending_rate = rates_and_totals_slice.loadUintBig(128);
    const borrowing_rate = rates_and_totals_slice.loadUintBig(128);
    const total_raw_available = rates_and_totals_slice.loadUintBig(256);
    const total_raw_debt = rates_and_totals_slice.loadUintBig(256);

    const event = slice.loadRef();
    const event_slice = event.asSlice();
    const message_origin_wallet_address = event_slice.loadAddress();
    const raw_amount = event_slice.loadCoins();
    const face_amount = event_slice.loadCoins();

    return {
      op,
      system_version,
      blubbo_user_version,
      reserve_id,
      last_update_timestamp,
      lending_accumulator,
      debt_accumulator,
      total_raw_amount_to_treasury,
      lending_rate,
      borrowing_rate,
      total_raw_available,
      total_raw_debt,
      message_origin_wallet_address,
      raw_amount,
      face_amount,
    };
  }

  private static liquidation(body: Cell): LiquidationEvent {
    const slice = body.asSlice();

    const op = slice.loadUintBig(6); // has to be 4

    if (op !== Events.LIQUIDATION) {
      throw new Error(`Unexpected op: ${op}. Expected: ${Events.LIQUIDATION}`);
    }

    const common = slice.loadRef();
    const common_slice = common.asSlice();

    const headers = common_slice.loadRef();
    const headers_slice = headers.asSlice();
    const system_version = headers_slice.loadUintBig(14);
    const blubbo_user_version = headers_slice.loadUintBig(14);
    const debt_reserve_id = headers_slice.loadUintBig(6);

    const accumulators = common_slice.loadRef();
    const accumulators_slice = accumulators.asSlice();
    const last_update_timestamp = accumulators_slice.loadUintBig(64);
    const lending_accumulator = accumulators_slice.loadUintBig(105);
    const debt_accumulator = accumulators_slice.loadUintBig(105);
    const total_raw_amount_to_treasury = accumulators_slice.loadUintBig(256);

    const rates_and_totals = common_slice.loadRef();
    const rates_and_totals_slice = rates_and_totals.asSlice();
    const lending_rate = rates_and_totals_slice.loadUintBig(128);
    const borrowing_rate = rates_and_totals_slice.loadUintBig(128);
    const total_raw_available = rates_and_totals_slice.loadUintBig(256);
    const total_raw_debt = rates_and_totals_slice.loadUintBig(256);

    const event = slice.loadRef();
    const event_slice = event.asSlice();

    const event_slice_0 = event_slice.loadRef();
    const event_slice_0_slice = event_slice_0.asSlice();
    const liquidator_wallet_address = event_slice_0_slice.loadAddress();
    const liquidated_wallet_address = event_slice_0_slice.loadAddress();
    const raw_repayment_amount = event_slice_0_slice.loadCoins();
    const face_repayment_amount = event_slice_0_slice.loadCoins();

    const event_slice_1 = event_slice.loadRef();
    const event_slice_1_slice = event_slice_1.asSlice();
    const captured_collateral_reserve_id = event_slice_1_slice.loadUintBig(6);
    const raw_captured_collateral_amount = event_slice_1_slice.loadCoins();
    const face_captured_collateral_amount = event_slice_1_slice.loadCoins();

    return {
      system_version,
      blubbo_user_version,
      debt_reserve_id,
      last_update_timestamp,
      lending_accumulator,
      debt_accumulator,
      total_raw_amount_to_treasury,
      lending_rate,
      borrowing_rate,
      total_raw_available,
      total_raw_debt,

      liquidator_wallet_address,
      liquidated_wallet_address,
      raw_repayment_amount,
      face_repayment_amount,

      captured_collateral_reserve_id,
      raw_captured_collateral_amount,
      face_captured_collateral_amount,
    };
  }
}

/**
 * Note: this class is only for the purpose of testing
 */
export class EventPacker {
  static DEPOSIT = 0n;
  static WITHDRAWAL = 1n;
  static BORROWING = 2n;
  static REPAYMENT = 3n;
  static LIQUIDATION = 4n;

  static nonLiquidation({
    op,
    system_version,
    blubbo_user_version,
    reserve_id,
    last_update_timestamp,
    lending_accumulator,
    debt_accumulator,
    total_raw_amount_to_treasury,
    lending_rate,
    borrowing_rate,
    total_raw_available,
    total_raw_debt,
    message_origin_wallet_address,
    raw_amount,
    face_amount,
  }: NonLiquidationEvent) {
    return beginCell()
      .storeUint(op, 6)
      .storeRef(
        beginCell()
          .storeRef(
            beginCell()
              .storeUint(system_version, 14)
              .storeUint(blubbo_user_version, 14)
              .storeUint(reserve_id, 6)
              .endCell(),
          )
          .storeRef(
            beginCell()
              .storeUint(last_update_timestamp, 64)
              .storeUint(lending_accumulator, 105)
              .storeUint(debt_accumulator, 105)
              .storeUint(total_raw_amount_to_treasury, 256)
              .endCell(),
          )
          .storeRef(
            beginCell()
              .storeUint(lending_rate, 128)
              .storeUint(borrowing_rate, 128)
              .storeUint(total_raw_available, 256)
              .storeUint(total_raw_debt, 256)
              .endCell(),
          )
          .endCell(),
      )
      .storeRef(
        beginCell()
          .storeAddress(message_origin_wallet_address)
          .storeCoins(raw_amount)
          .storeCoins(face_amount)
          .endCell(),
      )
      .storeRef(beginCell().endCell())
      .endCell();
  }

  static liquidation({
    system_version,
    blubbo_user_version,
    debt_reserve_id,
    last_update_timestamp,
    lending_accumulator,
    debt_accumulator,
    total_raw_amount_to_treasury,
    lending_rate,
    borrowing_rate,
    total_raw_available,
    total_raw_debt,

    liquidator_wallet_address,
    liquidated_wallet_address,
    raw_repayment_amount,
    face_repayment_amount,
    captured_collateral_reserve_id,
    raw_captured_collateral_amount,
    face_captured_collateral_amount,
  }: LiquidationEvent) {
    return beginCell()
      .storeUint(EventPacker.LIQUIDATION, 6)
      .storeRef(
        beginCell()
          .storeRef(
            beginCell()
              .storeUint(system_version, 14)
              .storeUint(blubbo_user_version, 14)
              .storeUint(debt_reserve_id, 6)
              .endCell(),
          )
          .storeRef(
            beginCell()
              .storeUint(last_update_timestamp, 64)
              .storeUint(lending_accumulator, 105)
              .storeUint(debt_accumulator, 105)
              .storeUint(total_raw_amount_to_treasury, 256)
              .endCell(),
          )
          .storeRef(
            beginCell()
              .storeUint(lending_rate, 128)
              .storeUint(borrowing_rate, 128)
              .storeUint(total_raw_available, 256)
              .storeUint(total_raw_debt, 256)
              .endCell(),
          )
          .endCell(),
      )
      .storeRef(
        beginCell()
          .storeRef(
            beginCell()
              .storeAddress(liquidator_wallet_address)
              .storeAddress(liquidated_wallet_address)
              .storeCoins(raw_repayment_amount)
              .storeCoins(face_repayment_amount)
              .endCell(),
          )
          .storeRef(
            beginCell()
              .storeUint(captured_collateral_reserve_id, 6)
              .storeCoins(raw_captured_collateral_amount)
              .storeCoins(face_captured_collateral_amount)
              .endCell(),
          )
          .storeRef(beginCell().endCell())
          .endCell(),
      )
      .storeRef(beginCell().endCell())
      .endCell();
  }
}
