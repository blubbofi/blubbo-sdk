import {
  Address,
  beginCell,
  Cell,
  Contract,
  ContractProvider,
  Sender,
  SendMode,
} from "@ton/core";
import { SendDepositToSotwArgs, SendRepayToSotwArgs, WithGas } from "./types";
import { JettonWallet } from "./jetton/jetton_wallet";

export class Sotw implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromAddress(address: Address) {
    return new Sotw(address);
  }

  static createSendDepositBody(args: SendDepositToSotwArgs) {
    const forwardPayload = beginCell()
      .storeUint(0b000, 3) // Deposit constructor prefix
      .storeUint(args.reserve_id_6, 6)
      .endCell();

    return JettonWallet.transferMessage(
      args.jetton_amount, // jetton_amount
      // Just addr_none to comply with the transfer message format
      Address.parse(
        `0:0000000000000000000000000000000000000000000000000000000000000000`,
      ), // to
      args.response_address, // responseAddress
      null, // customPayload
      0n, // forward_ton_amount (forward fee is directly paid by msg value)
      forwardPayload,
    );
  }

  static createSendRepayBody(args: SendRepayToSotwArgs) {
    const forwardPayload = beginCell()
      .storeUint(0b001, 3) // Repay constructor prefix
      .storeUint(args.reserve_id_6, 6)
      .endCell();

    return JettonWallet.transferMessage(
      args.jetton_amount, // jetton_amount
      // Just addr_none to comply with the transfer message format
      Address.parse(
        `0:0000000000000000000000000000000000000000000000000000000000000000`,
      ), // to
      args.response_address, // responseAddress
      null, // customPayload
      0n, // forward_ton_amount (forward fee is directly paid by msg value)
      forwardPayload,
    );
  }

  async sendDeposit(
    provider: ContractProvider,
    via: Sender,
    args: WithGas<SendDepositToSotwArgs>,
  ) {
    await provider.internal(via, {
      value: args.gas + args.jetton_amount,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: Sotw.createSendDepositBody(args),
    });
  }

  async sendRepay(
    provider: ContractProvider,
    via: Sender,
    args: WithGas<SendRepayToSotwArgs>,
  ) {
    await provider.internal(via, {
      value: args.gas + args.jetton_amount,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: Sotw.createSendRepayBody(args),
    });
  }

  async getStorage(provider: ContractProvider) {
    const state = await provider.getState();
    if (state.state.type !== "active") {
      return null;
    }
    const res = await provider.get("fetch_storage", []);

    const toncoin_balance = res.stack.readBigNumber();
    const owner_address = res.stack.readAddress();

    return {
      toncoin_balance,
      owner_address,
    };
  }
}
