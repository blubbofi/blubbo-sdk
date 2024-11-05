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
  BlubboReserveStorage,
  isTONBool,
  ReserveVars0,
  ReserveVars1,
  ReserveVars2,
  ReserveVars3,
  SendBorrowArgs,
  SendWithdrawArgs,
  WithGas,
} from "./types";
import { Opcode } from "./constants";

export class BlubboMaster implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  /**
   * @example
   * ```
   * const masterAddr = Address.parse(`0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`);
   * const master = BlubboMaster.createFromAddress(masterAddr);
   * ```
   * 
   * @param address The on-chain address of the BlubboMaster contract
   * @returns A new instance of BlubboMaster class
   */
  static createFromAddress(address: Address) {
    return new BlubboMaster(address);
  }

  /**
   * @example
   * ```
   * const tonClient = new TonClient({
   *  endpoint: `https://toncenter.com/api/v2/jsonRPC`,
   *  apiKey: TONCENTER_APIKEY,
   * });
   * const masterAddr = Address.parse(`0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`);
   * const master = tonClient.open(BlubboMaster.createFromAddress(masterAddr));
   * const tonReserve = master.getReserve(0n);
   * const { reserve_vars_0, reserve_vars_1, reserve_vars_2, reserve_vars_3 } = BlubboMaster.unpackReserve(tonReserve);
   * ```
   * 
   * @description
   * Unpacks the first level of the BlubboMaster contract storage. There's no specific meaning in 
   * separating the storage into 4 parts - it's just a way to optimize the storage layout.
   * 
   * BlubboMaster contract storage contains useful information about the protocol. Refer to 
   * `ReserveVars0`, `ReserveVars1`, `ReserveVars2`, `ReserveVars3` types.
   */
  static unpackReserve(cell: Cell): BlubboReserveStorage {
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

  /**
   * 
   * @param blubboReserveStorage first level of the BlubboMaster contract storage unpacked by `BlubboMaster.unpackReserve`
   * @returns The fully unpacked BlubboMaster contract storage at the second level
   * @example
   * ```
   * const tonClient = new TonClient({
   *  endpoint: `https://toncenter.com/api/v2/jsonRPC`,
   *  apiKey: TONCENTER_APIKEY,
   * });
   * const masterAddr = Address.parse(`0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`);
   * const master = tonClient.open(BlubboMaster.createFromAddress(masterAddr));
   * const blubboReserveStorage = master.getReserve(0n);
   * const { reserve_vars_0, reserve_vars_1, reserve_vars_2, reserve_vars_3 } = master.fullyUnpackReserve(blubboReserveStorage);
   * 
   * // Use the unpacked variables
   * console.log(reserve_vars_0.enabled)
   * ```
   */
  static fullyUnpackReserve(blubboReserveStorage: BlubboReserveStorage) {
    const reserve_vars_0 = BlubboMaster.unpackReserveVars0(
      blubboReserveStorage.reserve_vars_0,
    );
    const reserve_vars_1 = BlubboMaster.unpackReserveVars1(
      blubboReserveStorage.reserve_vars_1,
    );
    const reserve_vars_2 = BlubboMaster.unpackReserveVars2(
      blubboReserveStorage.reserve_vars_2,
    );
    const reserve_vars_3 = BlubboMaster.unpackReserveVars3(
      blubboReserveStorage.reserve_vars_3,
    );

    return {
      reserve_vars_0,
      reserve_vars_1,
      reserve_vars_2,
      reserve_vars_3,
    };
  }

  /**
   * Unpacks reserve_vars_0 stored in BlubboMaster contract storage.
   */
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

  /**
   * @description A _reserve_ is a term that is used to denote 'asset' or 'jetton' supported on the protocol. 
   * The reserve variables would contain various pieces of information about that reserve, 
   * such as `enabled`, `decimals`, `borrow_factor_pct`, ... and so on.
   * @param reserve_id_6 
   * @returns the first level of the BlubboMaster contract storage that contains the reserve information
   * @example
   * ```
   * const tonClient = new TonClient({
   *  endpoint: `https://toncenter.com/api/v2/jsonRPC`,
   *  apiKey: TONCENTER_APIKEY,
   * });
   * const masterAddr = Address.parse(`0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`);
   * const master = tonClient.open(BlubboMaster.createFromAddress(masterAddr));
   * const blubboReserveStorage = master.getReserve(0n);
   * const { reserve_vars_0, reserve_vars_1, reserve_vars_2, reserve_vars_3 } = master.fullyUnpackReserve(blubboReserveStorage);
   * 
   * // Use the unpacked variables
   * console.log(reserve_vars_0.enabled)
   * ```
   */
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

  /**
   * @description gets the version of the smart contract.
   * @example
   * ```
   * const tonClient = new TonClient({
   *  endpoint: `https://toncenter.com/api/v2/jsonRPC`,
   *  apiKey: TONCENTER_APIKEY,
   * });
   * const masterAddr = Address.parse(`0:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`);
   * const master = tonClient.open(BlubboMaster.createFromAddress(masterAddr));
   * const version = master.getVersion();
   * ```
   */
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

  /**
   * Each user in Blubbo has a unique smart contract that represents their position.
   * This function calculates the address of the Blubbo user smart contract.
   */
  async getBlubboUserAddress(
    provider: ContractProvider,
    userWalletAddress: Address,
  ) {
    const res = await provider.get("fetch_blubbo_user_address", [
      {
        type: `slice`,
        cell: beginCell().storeAddress(userWalletAddress).endCell(),
      },
    ]);
    const blubboUserAddress = res.stack.readAddress();
    return blubboUserAddress;
  }

  static createSendWithdrawBody(args: SendWithdrawArgs) {
    return beginCell()
      .storeUint(Opcode.WITHDRAW_FROM_WALLET_TO_BLUBBO_MASTER, 32)
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
      body: BlubboMaster.createSendWithdrawBody(args),
    });
  }

  static createSendBorrowBody(args: SendBorrowArgs) {
    return beginCell()
      .storeUint(Opcode.BORROW_FROM_WALLET_TO_BLUBBO_MASETER, 32)
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
      body: BlubboMaster.createSendBorrowBody(args),
    });
  }
}
