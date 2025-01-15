import { Address, toNano } from "@ton/core";
import {
  EventPacker,
  Events,
  LiquidationEvent,
  NonLiquidationEvent,
} from "../src/events";

describe("Events", () => {
  it(`can unpack non-liquidation event`, () => {
    const last_update_timestamp = BigInt(Math.floor(Date.now() / 1000));
    const depositEvent: NonLiquidationEvent = {
      op: EventPacker.DEPOSIT,
      system_version: 1n,
      blubbo_user_version: 1n,
      reserve_id: 1n,
      last_update_timestamp,
      lending_accumulator: 1000000000000000000000000000n,
      debt_accumulator: 1000000000000000000000000000n,
      total_raw_amount_to_treasury: 1231541n,

      lending_rate: 12351125151551n,
      borrowing_rate: 323567785151551n,
      total_raw_available: 12315124512124412441n,
      total_raw_debt: 24512124412441n,

      message_origin_wallet_address: Address.parse(
        `EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav`,
      ),
      raw_amount: 1231541n,
      face_amount: 1231541n,
    };
    const packedDepositEvent = EventPacker.nonLiquidation(depositEvent);

    const unpackedEvent = Events.unpack.nonLiquidation(packedDepositEvent);

    const { message_origin_wallet_address: m, ...rest } = unpackedEvent;
    const { message_origin_wallet_address: m2, ...rest2 } = depositEvent;
    expect(rest).toEqual(rest2);
    expect(m.equals(m2)).toBe(true);
  });

  it(`can unpack liquidation event`, () => {
    const last_update_timestamp = BigInt(Math.floor(Date.now() / 1000));
    const liquidationEvent: LiquidationEvent = {
      system_version: 1n,
      blubbo_user_version: 1n,
      debt_reserve_id: 1n,
      last_update_timestamp,
      lending_accumulator: 1000000000000000000000000000n,
      debt_accumulator: 1000000000000000000000000000n,
      total_raw_amount_to_treasury: 1231541n,

      lending_rate: 12351125151551n,
      borrowing_rate: 323567785151551n,
      total_raw_available: 12315124512124412441n,
      total_raw_debt: 24512124412441n,

      liquidator_wallet_address: Address.parse(
        `EQC0yj5mT3jND5VWPCpAC_nqErRMtXyurNO291J4PcWjmi1I`,
      ),
      liquidated_wallet_address: Address.parse(
        `UQAVkAV5mRv5O1H6qZNRuhY4FdJlInqoz4n-_LThUZ0TbMGB`,
      ),
      raw_repayment_amount: toNano(`124`),
      face_repayment_amount: toNano(`124`),
      captured_collateral_reserve_id: 3n,
      raw_captured_collateral_amount: toNano(`245`),
      face_captured_collateral_amount: toNano(`245`),
    };
    const packedLiquidationEvent = EventPacker.liquidation(liquidationEvent);

    const unpackedEvent = Events.unpack.liquidation(packedLiquidationEvent);

    const {
      liquidator_wallet_address: a,
      liquidated_wallet_address: b,
      ...rest
    } = unpackedEvent;
    const {
      liquidator_wallet_address: a2,
      liquidated_wallet_address: b2,
      ...rest2
    } = liquidationEvent;
    expect(rest).toEqual(rest2);
    expect(a.equals(a2)).toBe(true);
    expect(b.equals(b2)).toBe(true);
  });
});
