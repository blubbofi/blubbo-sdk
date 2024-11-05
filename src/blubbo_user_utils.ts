import { Cell, Address, beginCell } from "@ton/core";
import { BlubboUser } from "./blubbo_user";
import { Lock } from "./constants";

class BlubboUserUtils_testnet_2024_10_22_847a54a {
  // cell pack_blubbo_user_data(slice owner_address, slice blubbo_master_address, cell blubbo_user_code) inline {
  //   cell user_vars_0 = blubbo_user_storage_packer::pack_user_vars_0(
  //     owner_address, ;; owner_address,
  //     blubbo_master_address, ;; blubbo_master_address,
  //     null(), ;; raw_deposit_per_jetton_dict,
  //     null(), ;; raw_debt_per_jetton_dict,
  //     blubbo_user_code, ;; blubbo_user_code,
  //     null() ;; additional_data
  //   );
  //   cell user_vars_1 = blubbo_user_storage_packer::pack_user_vars_1(
  //     blubbo_user_storage_packer::pack_user_vars_1::tx_locks(
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
  //   return blubbo_user_storage_packer::pack_storage(user_vars_0, user_vars_1);
  // }
  static packBlubboUserData(
    owner_address: Address,
    blubbo_master_address: Address,
    blubbo_user_code: Cell,
  ) {
    const userVars0 = BlubboUser.packUserVars0({
      owner_address: owner_address,
      blubbo_master_address: blubbo_master_address,
      raw_deposit_per_jetton_dict: null,
      raw_debt_per_jetton_dict: null,
      blubbo_user_code: blubbo_user_code,
      additionalData: null,
    });
    const userVars1 = BlubboUser.packUserVars1({
      tx_locks: BlubboUser.packTxLocks({
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

    return BlubboUser.packStorage({ userVars0, userVars1 });
  }

  // slice blubbo_user_utils::calculate_blubbo_user_address_inner(cell state_init) inline {
  //   return begin_cell()
  //     .store_uint(4, 3)
  //     ;; Workchain is only 0 for now
  //     .store_int(0, 8)
  //     .store_uint(cell_hash(state_init), 256)
  //     .end_cell()
  //     .begin_parse();
  // }
  static calculateBlubboUserAddressInner(state_init: Cell) {
    return beginCell()
      .storeUint(4, 3)
      .storeInt(0, 8)
      .storeUint(BigInt("0x" + state_init.hash().toString("hex")), 256)
      .endCell()
      .beginParse();
  }

  // cell blubbo_user_utils::calculate_blubbo_user_state_init(slice owner_address, slice blubbo_master_address, cell blubbo_user_code) inline {
  //   return begin_cell()
  //     .store_uint(0, 2)
  //     .store_dict(blubbo_user_code)
  //     .store_dict(pack_blubbo_user_data(owner_address, blubbo_master_address, blubbo_user_code))
  //     .store_uint(0, 1)
  //     .end_cell();
  // }
  static calculateBlubboUserStateInit(
    owner_address: Address,
    blubbo_master_address: Address,
    blubbo_user_code: Cell,
  ) {
    return (
      beginCell()
        .storeUint(0, 2)
        // store_dict is same as storeMaybeRef
        .storeMaybeRef(blubbo_user_code)
        // store_dict is same as storeMaybeRef
        .storeMaybeRef(
          this.packBlubboUserData(
            owner_address,
            blubbo_master_address,
            blubbo_user_code,
          ),
        )
        .storeUint(0, 1)
        .endCell()
    );
  }

  // slice blubbo_user_utils::calculate_user_blubbo_user_address(
  //   slice owner_address, slice blubbo_master_address, cell blubbo_user_code
  // ) inline {
  //   return blubbo_user_utils::calculate_blubbo_user_address_inner(blubbo_user_utils::calculate_blubbo_user_state_init(owner_address, blubbo_master_address, blubbo_user_code));
  // }
  /**
   * Off-chain version of {@link BlubboMaster.getBlubboUserAddress}
   * which does not require running a get method on the blockchain.
   *
   * @param owner_address The address of the owner (user wallet)
   * @param blubbo_master_address The address of the blubbo master
   * @param blubbo_user_code The code of the blubbo user contract
   * @returns The address of the blubbo user contract belonging to the owner
   */
  static calculateUserBlubboUserAddress(
    owner_address: Address,
    blubbo_master_address: Address,
    blubbo_user_code: Cell,
  ) {
    const slice = this.calculateBlubboUserAddressInner(
      this.calculateBlubboUserStateInit(
        owner_address,
        blubbo_master_address,
        blubbo_user_code,
      ),
    );
    return slice.loadAddress();
  }
}

export class BlubboUserUtils {
  static testnet_2024_10_22_847a54a = BlubboUserUtils_testnet_2024_10_22_847a54a;
  static testnet_2024_10_25_687c2cb = this.testnet_2024_10_22_847a54a;
  static testnet_2024_11_01_7513aa7 = this.testnet_2024_10_22_847a54a;
}
