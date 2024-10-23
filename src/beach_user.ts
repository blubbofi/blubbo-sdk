import {
  Address,
  Cell,
  Contract,
  ContractProvider,
  Dictionary,
} from "@ton/core";
import { BeachUserVars0, BeachUserVars1, TxLocks } from "./types";

export class BeachUser implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromAddress(address: Address) {
    return new BeachUser(address);
  }

  static getBeachUserAddress = (beachMasterAddress: Address) =>
    BeachUser.createFromAddress(beachMasterAddress);

  static unpackUserVars0(cell: Cell): BeachUserVars0 {
    const slice = cell.asSlice();
    const owner_address = slice.loadAddress();
    const beach_master_address = slice.loadAddress();
    // Dictionaries = maybe refs in binary terms
    const raw_deposit_per_jetton_dict = slice.loadDict(
      Dictionary.Keys.BigUint(6),
      Dictionary.Values.Cell(),
    );
    const raw_debt_per_jetton_dict = slice.loadDict(
      Dictionary.Keys.BigUint(6),
      Dictionary.Values.Cell(),
    );
    const beach_user_code = slice.loadRef();
    const additionalData = slice.loadMaybeRef();
    slice.endParse();

    return {
      owner_address,
      beach_master_address,
      raw_deposit_per_jetton_dict,
      raw_debt_per_jetton_dict,
      beach_user_code,
      additionalData,
    };
  }

  static unpackuserVars1(cell: Cell): BeachUserVars1 {
    const slice = cell.asSlice();
    const tx_locks = slice.loadRef();
    slice.endParse();

    return {
      tx_locks,
    };
  }

  static unpackTxLocks(cell: Cell) {
    const slice = cell.asSlice();
    const withdrawal_lock = slice.loadUintBig(2);
    const borrow_lock = slice.loadUintBig(2);
    const deposit_lock = slice.loadUintBig(2);
    const repay_lock = slice.loadUintBig(2);
    slice.endParse();
    return {
      withdrawal_lock,
      borrow_lock,
      deposit_lock,
      repay_lock,
    };
  }

  static unpackRawBalanceDict(cell: Cell): bigint {
    const slice = cell.asSlice();
    const value = slice.loadUintBig(128);
    slice.endParse();
    return value;
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
}
