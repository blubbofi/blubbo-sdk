/* eslint-disable */
import {
  Address,
  beginCell,
  Cell,
  Contract,
  ContractProvider,
  Sender,
  SendMode,
} from "@ton/core";
import {
  SendDepositArgs,
  SendLiquidateArgs,
  SendRepayArgs,
  WithGas,
} from "../types";

export class JettonWallet implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromAddress(address: Address) {
    return new JettonWallet(address);
  }

  async getJettonBalance(provider: ContractProvider) {
    let state = await provider.getState();
    if (state.state.type !== "active") {
      return 0n;
    }
    let res = await provider.get("get_wallet_data", []);
    return res.stack.readBigNumber();
  }

  static transferMessage(
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

  static createSendDepositBody(args: SendDepositArgs) {
    const forwardPayload = beginCell()
      .storeUint(0b000, 3) // Deposit constructor prefix
      .storeUint(args.reserve_id_6, 6)
      .storeUint(args.system_version, 14)
      .endCell();

    return JettonWallet.transferMessage(
      args.jetton_amount,
      args.to,
      args.response_address,
      null,
      args.forward_ton_amount,
      forwardPayload,
    );
  }

  async sendDeposit(
    provider: ContractProvider,
    via: Sender,
    args: WithGas<SendDepositArgs>,
  ) {
    return provider.internal(via, {
      value: args.gas,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: JettonWallet.createSendDepositBody(args),
    });
  }

  static createSendRepayBody(args: SendRepayArgs) {
    const forwardPayload = beginCell()
      .storeUint(0b001, 3) // Repay constructor prefix
      .storeUint(args.reserve_id_6, 6)
      .storeUint(args.system_version, 14)
      .endCell();

    return JettonWallet.transferMessage(
      args.jetton_amount,
      args.to,
      args.response_address,
      null,
      args.forward_ton_amount,
      forwardPayload,
    );
  }

  async sendRepay(
    provider: ContractProvider,
    via: Sender,
    args: WithGas<SendRepayArgs>,
  ) {
    return provider.internal(via, {
      value: args.gas,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: JettonWallet.createSendRepayBody(args),
    });
  }

  static createSendLiquidateBody(args: SendLiquidateArgs) {
    const forwardPayload = beginCell()
      .storeUint(0b010, 3) // Liquidate constructor prefix
      .storeUint(args.forward_payload.debt_reserve_id, 6)
      .storeUint(args.forward_payload.system_version ?? 1, 14) // system version
      .storeAddress(args.forward_payload.liquidation_target_wallet_address)
      .storeUint(args.forward_payload.collateral_reserve_id, 6)
      .storeRef(
        beginCell()
          .storeRef(args.forward_payload.redstoneData)
          .storeRef(args.forward_payload.configPayload)
          .storeRef(args.forward_payload.configSignature)
          .endCell(),
      )
      .endCell();

    return JettonWallet.transferMessage(
      args.jetton_amount,
      args.to,
      args.response_address,
      null,
      args.forward_ton_amount,
      forwardPayload,
    );
  }

  async sendLiquidate(
    provider: ContractProvider,
    via: Sender,
    args: WithGas<SendLiquidateArgs>,
  ) {
    return provider.internal(via, {
      value: args.gas,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: JettonWallet.createSendLiquidateBody(args),
    });
  }
}
