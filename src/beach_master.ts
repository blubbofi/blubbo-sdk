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
  BeachReserveStorage,
  isTONBool,
  ReserveVars0,
  ReserveVars1,
  ReserveVars2,
  ReserveVars3,
  SendBorrowArgs,
  SendDepositArgs,
  SendRepayArgs,
  SendWithdrawArgs,
  WithGas,
} from "./types";
import { Opcode } from "./constants";
import { JettonWallet } from "./jetton/jetton_wallet";

export class BeachMaster implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromAddress(address: Address) {
    return new BeachMaster(address);
  }

  static unpackReserve(cell: Cell): BeachReserveStorage {
    const slice = cell.beginParse();
    const reserve_vars_0 = slice.loadRef();
    const reserve_vars_1 = slice.loadRef();
    const reserve_vars_2 = slice.loadRef();
    const reserve_vars_3 = slice.loadRef();
    slice.endParse();

    return {
      reserve_vars_0,
      reserve_vars_1,
      reserve_vars_2,
      reserve_vars_3,
    };
  }

  static fullyUnpackReserve(beachReserveStorage: BeachReserveStorage) {
    const reserve_vars_0 = BeachMaster.unpackReserveVars0(
      beachReserveStorage.reserve_vars_0,
    );
    const reserve_vars_1 = BeachMaster.unpackReserveVars1(
      beachReserveStorage.reserve_vars_1,
    );
    const reserve_vars_2 = BeachMaster.unpackReserveVars2(
      beachReserveStorage.reserve_vars_2,
    );
    const reserve_vars_3 = BeachMaster.unpackReserveVars3(
      beachReserveStorage.reserve_vars_3,
    );

    return {
      reserve_vars_0,
      reserve_vars_1,
      reserve_vars_2,
      reserve_vars_3,
    };
  }

  static unpackReserveVars0(cell: Cell): ReserveVars0 {
    const slice = cell.beginParse();
    const enabled = slice.loadIntBig(2);
    const decimals = slice.loadUintBig(8);
    const borrow_factor_pct = slice.loadUintBig(8);
    const collateral_factor_pct = slice.loadUintBig(8);
    const reserve_factor_pct = slice.loadUintBig(8);
    const liquidation_bonus_pct = slice.loadUintBig(8);
    const debt_limit = slice.loadUintBig(256);
    const jetton_wallet_code = slice.loadRef();
    slice.endParse();

    if (!isTONBool(enabled)) {
      throw new Error(`Invalid boolean value: ${enabled}`);
    }

    return {
      enabled: enabled,
      decimals: decimals,
      borrow_factor_pct,
      collateral_factor_pct,
      reserve_factor_pct,
      liquidation_bonus_pct,
      debt_limit: debt_limit,
      jetton_wallet_code,
    };
  }

  static unpackReserveVars1(cell: Cell): ReserveVars1 {
    const slice = cell.beginParse();
    const last_update_timestamp = slice.loadUintBig(64);
    const lending_accumulator = slice.loadUintBig(100);
    const debt_accumulator = slice.loadUintBig(100);
    const current_lending_rate = slice.loadUintBig(128);
    const current_borrowing_rate = slice.loadUintBig(128);
    const total_raw_amount_to_treasury = slice.loadUintBig(256);
    slice.endParse();

    return {
      last_update_timestamp,
      lending_accumulator,
      debt_accumulator,
      current_lending_rate,
      current_borrowing_rate,
      total_raw_amount_to_treasury,
    };
  }

  static unpackReserveVars2(cell: Cell): ReserveVars2 {
    const slice = cell.beginParse();
    const total_raw_available = slice.loadUintBig(256);
    const total_raw_debt = slice.loadUintBig(256);
    slice.endParse();

    return {
      total_raw_available,
      total_raw_debt,
    };
  }

  static unpackReserveVars3(cell: Cell): ReserveVars3 {
    const slice = cell.beginParse();
    const slope0_pct = slice.loadUintBig(8);
    const slope1_pct = slice.loadUintBig(8);
    const y_intercept = slice.loadUintBig(8);
    const optimal_rate_pct = slice.loadUintBig(8);
    slice.endParse();

    return {
      slope0_pct,
      slope1_pct,
      y_intercept,
      optimal_rate_pct,
    };
  }

  async getReserve(provider: ContractProvider, reserve_id_6: bigint) {
    const res = await provider.get("fetch_reserve", [
      {
        type: `int`,
        value: reserve_id_6,
      },
    ]);
    const reserve_storage = res.stack.readCell();
    return reserve_storage;
  }

  async getVersion(provider: ContractProvider) {
    const res = await provider.get("fetch_version", []);
    const version = res.stack.readBigNumber();
    return version;
  }

  async getLatestLendingAccumulator(
    provider: ContractProvider,
    reserve_id_6: bigint,
  ) {
    const res = await provider.get("fetch_latest_lending_accumulator", [
      {
        type: `int`,
        value: reserve_id_6,
      },
    ]);
    const version = res.stack.readBigNumber();
    return version;
  }

  async getLatestDebtAccumulator(
    provider: ContractProvider,
    reserve_id_6: bigint,
  ) {
    const res = await provider.get("fetch_latest_debt_accumulator", [
      {
        type: `int`,
        value: reserve_id_6,
      },
    ]);
    const version = res.stack.readBigNumber();
    return version;
  }

  static createSendDepositBody(args: SendDepositArgs) {
    const forwardPayload = beginCell()
      .storeUint(0b000, 3) // Deposit constructor prefix
      .storeUint(args.reserve_id_6, 6)
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
      body: BeachMaster.createSendDepositBody(args),
    });
  }

  static createSendRepayBody(args: SendRepayArgs) {
    const forwardPayload = beginCell()
      .storeUint(0b001, 3) // Repay constructor prefix
      .storeUint(args.reserve_id_6, 6)
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
      body: BeachMaster.createSendRepayBody(args),
    });
  }

  static createSendWithdrawBody(args: SendWithdrawArgs) {
    return beginCell()
      .storeUint(Opcode.WITHDRAW_FROM_WALLET_TO_BEACH_MASTER, 32)
      .storeCoins(args.face_amount)
      .storeUint(args.reserve_id_6, 6)
      .storeRef(args.redstoneData)
      .storeRef(args.configPayload)
      .storeRef(beginCell().storeRef(args.configSignature).endCell())
      .endCell();
  }

  async sendWithdraw(
    provider: ContractProvider,
    via: Sender,
    args: WithGas<SendWithdrawArgs>,
  ) {
    await provider.internal(via, {
      value: args.gas,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: BeachMaster.createSendWithdrawBody(args),
    });
  }

  static createSendBorrowBody(args: SendBorrowArgs) {
    return beginCell()
      .storeUint(Opcode.BORROW_FROM_WALLET_TO_BEACH_MASETER, 32)
      .storeCoins(args.face_amount)
      .storeUint(args.reserve_id_6, 6)
      .storeRef(args.redstoneData)
      .storeRef(args.configPayload)
      .storeRef(beginCell().storeRef(args.configSignature).endCell())
      .endCell();
  }

  async sendBorrow(
    provider: ContractProvider,
    via: Sender,
    args: WithGas<SendWithdrawArgs>,
  ) {
    await provider.internal(via, {
      value: args.gas,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: BeachMaster.createSendBorrowBody(args),
    });
  }
}
