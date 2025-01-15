import { Address } from "@ton/core";
import { EventPacker, Events, NonLiquidationEvent } from "../src/events";

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

      message_origin_wallet_address: Address.parse(`EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav`),
      raw_amount: 1231541n,
      face_amount: 1231541n,
    }
    const packedDepositEvent = EventPacker.nonLiquidation(depositEvent)

    const unpackedEvent = Events.unpack.nonLiquidation(packedDepositEvent);

    const { message_origin_wallet_address: m, ...rest } = unpackedEvent;
    const { message_origin_wallet_address: m2, ...rest2 } = depositEvent;
    expect(rest).toEqual(rest2);
    expect(m.equals(m2)).toBe(true);
  })
})