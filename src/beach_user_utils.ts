import { Cell, Address, beginCell } from "@ton/core";
import { BeachUser } from "./beach_user";
import { Lock } from "./constants";

class BeachUserUtils_testnet_2024_10_22_847a54a {
  // cell pack_beach_user_data(slice owner_address, slice beach_master_address, cell beach_user_code) inline {
  //   cell user_vars_0 = beach_user_storage_packer::pack_user_vars_0(
  //     owner_address, ;; owner_address,
  //     beach_master_address, ;; beach_master_address,
  //     null(), ;; raw_deposit_per_jetton_dict,
  //     null(), ;; raw_debt_per_jetton_dict,
  //     beach_user_code, ;; beach_user_code,
  //     null() ;; additional_data
  //   );
  //   cell user_vars_1 = beach_user_storage_packer::pack_user_vars_1(
  //     beach_user_storage_packer::pack_user_vars_1::tx_locks(
  //       0, ;; withdrawal_lock_id,
  //       lock::UNLOCKED, ;; withdrawal_lock,
  //       0, ;; borrowing_lock_id,
  //       lock::UNLOCKED, ;; borrowing_lock,
  //       0, ;; repayment_lock_id,
  //       lock::UNLOCKED, ;; repayment_lock,
  //       0, ;; liquidation_lock_id,
  //       lock::UNLOCKED ;; liquidation_lock
  //     )
  //   );
  //   return beach_user_storage_packer::pack_storage(user_vars_0, user_vars_1);
  // }
  static packBeachUserData(
    owner_address: Address,
    beach_master_address: Address,
    beach_user_code: Cell,
  ) {
    const userVars0 = BeachUser.packUserVars0({
      owner_address: owner_address,
      beach_master_address: beach_master_address,
      raw_deposit_per_jetton_dict: null,
      raw_debt_per_jetton_dict: null,
      beach_user_code: beach_user_code,
      additionalData: null,
    });
    const userVars1 = BeachUser.packUserVars1({
      tx_locks: BeachUser.packTxLocks({
        withdrawal_lock_id: 0n,
        withdrawal_lock: Lock.UNLOCKED,
        borrowing_lock_id: 0n,
        borrowing_lock: Lock.UNLOCKED,
        repayment_lock_id: 0n,
        repayment_lock: Lock.UNLOCKED,
        liquidation_lock_id: 0n,
        liquidation_lock: Lock.UNLOCKED,
      }),
    });

    return BeachUser.packStorage({ userVars0, userVars1 });
  }

  // slice beach_user_utils::calculate_beach_user_address_inner(cell state_init) inline {
  //   return begin_cell()
  //     .store_uint(4, 3)
  //     ;; Workchain is only 0 for now
  //     .store_int(0, 8)
  //     .store_uint(cell_hash(state_init), 256)
  //     .end_cell()
  //     .begin_parse();
  // }
  static calculateBeachUserAddressInner(state_init: Cell) {
    return beginCell()
      .storeUint(4, 3)
      .storeInt(0, 8)
      .storeUint(BigInt("0x" + state_init.hash().toString("hex")), 256)
      .endCell()
      .beginParse();
  }

  // cell beach_user_utils::calculate_beach_user_state_init(slice owner_address, slice beach_master_address, cell beach_user_code) inline {
  //   return begin_cell()
  //     .store_uint(0, 2)
  //     .store_dict(beach_user_code)
  //     .store_dict(pack_beach_user_data(owner_address, beach_master_address, beach_user_code))
  //     .store_uint(0, 1)
  //     .end_cell();
  // }
  static calculateBeachUserStateInit(
    owner_address: Address,
    beach_master_address: Address,
    beach_user_code: Cell,
  ) {
    return (
      beginCell()
        .storeUint(0, 2)
        // store_dict is same as storeMaybeRef
        .storeMaybeRef(beach_user_code)
        // store_dict is same as storeMaybeRef
        .storeMaybeRef(
          this.packBeachUserData(
            owner_address,
            beach_master_address,
            beach_user_code,
          ),
        )
        .storeUint(0, 1)
        .endCell()
    );
  }

  // slice beach_user_utils::calculate_user_beach_user_address(
  //   slice owner_address, slice beach_master_address, cell beach_user_code
  // ) inline {
  //   return beach_user_utils::calculate_beach_user_address_inner(beach_user_utils::calculate_beach_user_state_init(owner_address, beach_master_address, beach_user_code));
  // }
  /**
   * Off-chain version of {@link BeachMaster.getBeachUserAddress}
   * which does not require running a get method on the blockchain.
   *
   * @param owner_address The address of the owner (user wallet)
   * @param beach_master_address The address of the beach master
   * @param beach_user_code The code of the beach user contract
   * @returns The address of the beach user contract belonging to the owner
   */
  static calculateUserBeachUserAddress(
    owner_address: Address,
    beach_master_address: Address,
    beach_user_code: Cell,
  ) {
    const slice = this.calculateBeachUserAddressInner(
      this.calculateBeachUserStateInit(
        owner_address,
        beach_master_address,
        beach_user_code,
      ),
    );
    return slice.loadAddress();
  }
}

export class BeachUserUtils {
  static testnet_2024_10_22_847a54a = BeachUserUtils_testnet_2024_10_22_847a54a;
}
