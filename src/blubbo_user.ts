import {
  Address,
  beginCell,
  Cell,
  Contract,
  ContractProvider,
  Dictionary,
} from "@ton/core";
import {
  BlubboUserVars0,
  BlubboUserVars1,
  TxLocks,
  CollateralData,
  ReserveId,
  VariablePerReserve,
} from "./types";
import { HumanBoolean, Humanizer } from "./humanizer";

export class BlubboUser implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromAddress(address: Address) {
    return new BlubboUser(address);
  }

  static unpackUserVars0(cell: Cell): BlubboUserVars0 {
    const slice = cell.asSlice();
    const owner_address = slice.loadAddress();
    const blubbo_master_address = slice.loadAddress();
    // Dictionaries = maybe refs in binary terms
    const raw_deposit_per_jetton_dict = slice.loadDict(
      Dictionary.Keys.BigUint(6),
      Dictionary.Values.Cell(),
    );
    const raw_debt_per_jetton_dict = slice.loadDict(
      Dictionary.Keys.BigUint(6),
      Dictionary.Values.Cell(),
    );
    const blubbo_user_code = slice.loadRef();
    const additionalData = slice.loadMaybeRef();
    slice.endParse();

    return {
      owner_address,
      blubbo_master_address,
      raw_deposit_per_jetton_dict,
      raw_debt_per_jetton_dict,
      blubbo_user_code,
      additionalData,
    };
  }

  static packUserVars0(userVars0: BlubboUserVars0): Cell {
    return beginCell()
      .storeAddress(userVars0.owner_address)
      .storeAddress(userVars0.blubbo_master_address)
      .storeDict(
        userVars0.raw_deposit_per_jetton_dict,
        Dictionary.Keys.BigUint(6),
        Dictionary.Values.Cell(),
      )
      .storeDict(
        userVars0.raw_debt_per_jetton_dict,
        Dictionary.Keys.BigUint(6),
        Dictionary.Values.Cell(),
      )
      .storeRef(userVars0.blubbo_user_code)
      .storeMaybeRef(userVars0.additionalData)
      .endCell();
  }

  static unpackuserVars1(cell: Cell): BlubboUserVars1 {
    const slice = cell.asSlice();
    const tx_locks = slice.loadRef();
    slice.endParse();

    return {
      tx_locks,
    };
  }

  static packUserVars1(userVars1: BlubboUserVars1): Cell {
    return beginCell().storeRef(userVars1.tx_locks).endCell();
  }

  static unpackTxLocks(cell: Cell): TxLocks {
    const slice = cell.asSlice();
    const withdrawal_lock_id = slice.loadUintBig(10);
    const withdrawal_lock = slice.loadUintBig(2);
    const borrowing_lock_id = slice.loadUintBig(10);
    const borrowing_lock = slice.loadUintBig(2);
    const repayment_lock_id = slice.loadUintBig(10);
    const repayment_lock = slice.loadUintBig(2);
    const liquidation_lock_id = slice.loadUintBig(10);
    const liquidation_lock = slice.loadUintBig(2);
    slice.endParse();

    return {
      withdrawal_lock_id,
      withdrawal_lock,
      borrowing_lock_id,
      borrowing_lock,
      repayment_lock_id,
      repayment_lock,
      liquidation_lock_id,
      liquidation_lock,
    };
  }

  static packTxLocks(txLocks: TxLocks): Cell {
    return beginCell()
      .storeUint(txLocks.withdrawal_lock_id, 10)
      .storeUint(txLocks.withdrawal_lock, 2)
      .storeUint(txLocks.borrowing_lock_id, 10)
      .storeUint(txLocks.borrowing_lock, 2)
      .storeUint(txLocks.repayment_lock_id, 10)
      .storeUint(txLocks.repayment_lock, 2)
      .storeUint(txLocks.liquidation_lock_id, 10)
      .storeUint(txLocks.liquidation_lock, 2)
      .endCell();
  }

  static unpackRawBalanceDict(cell: Cell): bigint {
    const slice = cell.asSlice();
    const value = slice.loadUintBig(128);
    slice.endParse();
    return value;
  }

  static packStorage({
    userVars0,
    userVars1,
  }: {
    userVars0: Cell;
    userVars1: Cell;
  }): Cell {
    return beginCell().storeRef(userVars0).storeRef(userVars1).endCell();
  }

  static packVariablePerReserve({
    decimals,
    borrow_factor_pct,
    collateral_factor_pct,
    lending_accumulator,
    debt_accumulator,
    price,
  }: VariablePerReserve): Cell {
    return beginCell()
      .storeUint(decimals, 8)
      .storeUint(borrow_factor_pct, 8)
      .storeUint(collateral_factor_pct, 8)
      .storeUint(lending_accumulator, 100)
      .storeUint(debt_accumulator, 100)
      .storeUint(price, 128)
      .endCell();
  }

  static packVariablesPerReserveDict(
    variables_per_reserve: Record<ReserveId, VariablePerReserve>,
  ): Dictionary<bigint, Cell> {
    const variables_per_reserve_dict = Dictionary.empty<bigint, Cell>(
      Dictionary.Keys.BigInt(6),
      Dictionary.Values.Cell(),
    );
    for (const [reserveId, variable_per_reserve] of Object.entries(
      variables_per_reserve,
    )) {
      const rId = BigInt(reserveId);

      variables_per_reserve_dict.set(
        rId,
        BlubboUser.packVariablePerReserve(variable_per_reserve),
      );
    }

    return variables_per_reserve_dict;
  }

  async getStorage(provider: ContractProvider) {
    const res = await provider.get("fetch_storage", []);
    const stack = res.stack;

    const user_vars_0 = stack.readCell();

    return {
      user_vars_0,
    };
  }

  async getRawDepositPerReserve(
    provider: ContractProvider,
    reserve_id_6: bigint,
  ) {
    const res = await provider.get("fetch_raw_deposit_per_reserve", [
      {
        type: `int`,
        value: reserve_id_6,
      },
    ]);
    const rawDeposit = res.stack.readBigNumber();
    return rawDeposit;
  }

  async getRawDebtPerReserve(provider: ContractProvider, reserve_id_6: bigint) {
    const res = await provider.get("fetch_raw_debt_per_reserve", [
      {
        type: `int`,
        value: reserve_id_6,
      },
    ]);
    const rawDebt = res.stack.readBigNumber();
    return rawDebt;
  }

  async getTxLocks(provider: ContractProvider): Promise<TxLocks> {
    const res = await provider.get("fetch_tx_locks", []);
    const withdrawal_lock_id = res.stack.readBigNumber();
    const withdrawal_lock = res.stack.readBigNumber();
    const borrowing_lock_id = res.stack.readBigNumber();
    const borrowing_lock = res.stack.readBigNumber();
    const repayment_lock_id = res.stack.readBigNumber();
    const repayment_lock = res.stack.readBigNumber();
    const liquidation_lock_id = res.stack.readBigNumber();
    const liquidation_lock = res.stack.readBigNumber();

    return {
      withdrawal_lock_id,
      withdrawal_lock,
      borrowing_lock_id,
      borrowing_lock,
      repayment_lock_id,
      repayment_lock,
      liquidation_lock_id,
      liquidation_lock,
    };
  }

  async getCollateralData(
    provider: ContractProvider,
    variables_per_reserve: Record<ReserveId, VariablePerReserve>,
    apply_borrow_factor: HumanBoolean,
  ): Promise<CollateralData> {
    const res = await provider.get("fetch_collateral_data", [
      {
        type: `cell`,
        // Don't know how to send dictionary as a cell, so just wrap it in a cell
        cell: beginCell()
          .storeDict(
            BlubboUser.packVariablesPerReserveDict(variables_per_reserve),
          )
          .endCell(),
      },
      {
        type: `int`,
        value: Humanizer.bool.fromHuman(apply_borrow_factor),
      },
    ]);

    const total_discounted_face_deposit = res.stack.readBigNumber();
    const total_collateral_required = res.stack.readBigNumber();
    return {
      total_discounted_face_deposit,
      total_collateral_required,
    };
  }
}
