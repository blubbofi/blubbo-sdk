import { Address, beginCell, Cell } from "@ton/core";

export function jettonTransferMessage(
  jetton_amount: bigint,
  to: Address,
  responseAddress: Address,
  customPayload: Cell | null,
  forward_ton_amount: bigint,
  forwardPayload: Cell | null,
) {
  return beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(0, 64) // op, queryId
    .storeCoins(jetton_amount)
    .storeAddress(to)
    .storeAddress(responseAddress)
    .storeMaybeRef(customPayload)
    .storeCoins(forward_ton_amount)
    .storeMaybeRef(forwardPayload)
    .endCell();
}
