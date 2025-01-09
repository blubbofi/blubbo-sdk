// #include "../constants.fc";

import { Address, beginCell, Cell, Slice } from "@ton/core";

const blubbo_user_version_bits = 14;
const blubbo_user_variant_bits = 4;

// cell owner_upgradable::pack_data(
//   slice user_wallet_address,
//   slice blubbo_master_address,
//   int blubbo_user_version,
//   int variant
// ) inline {
//    return  begin_cell()
//             .store_slice(user_wallet_address)
//             .store_slice(blubbo_master_address)
//             .store_uint(blubbo_user_version, blubbo_user::version_bits)
//             .store_uint(variant, blubbo_user::variant_bits)
//            .end_cell();
// }
function pack_data(
  user_wallet_address: Address,
  blubbo_master_address: Address,
  blubbo_user_version: bigint,
  variant: bigint,
): Cell {
  return beginCell()
    .storeAddress(user_wallet_address)
    .storeAddress(blubbo_master_address)
    .storeUint(blubbo_user_version, blubbo_user_version_bits)
    .storeUint(variant, blubbo_user_variant_bits)
    .endCell();
}

// cell owner_upgradable::calculate_state_init(
//   slice user_wallet_address,
//   slice blubbo_master_address,
//   cell owner_upgradable_code,
//   ;; uint representing the BlubboUser version.
//   ;; increments by 1 every time the BlubboUser code is upgraded.
//   int blubbo_user_version,
//   ;; the variant of any owner-upgradable contract owned by Blubbo Master.
//   ;; for BlubboUser, it will just be 0.
//   ;; However, if we need any other owner-upgradable contracts
//   ;; whose master address is BlubboMaster, we can use this field to differentiate between them.
//   int variant
// ) inline {
//   return begin_cell()
//           .store_uint(0, 2)
//           .store_dict(owner_upgradable_code)
//           .store_dict(owner_upgradable::pack_data(
//             user_wallet_address,
//             blubbo_master_address,
//             blubbo_user_version,
//             variant
//           ))
//           .store_uint(0, 1)
//          .end_cell();
// }
function calculate_state_init(
  user_wallet_address: Address,
  blubbo_master_address: Address,
  owner_upgradable_code: Cell,
  blubbo_user_version: bigint,
  variant: bigint,
): Cell {
  return beginCell()
    .storeUint(0, 2)
    .storeMaybeRef(owner_upgradable_code)
    .storeMaybeRef(
      pack_data(
        user_wallet_address,
        blubbo_master_address,
        blubbo_user_version,
        variant,
      ),
    )
    .storeUint(0, 1)
    .endCell();
}

// slice owner_upgradable::calculate_address_internal(cell state_init) inline {
//   return begin_cell()
//     .store_uint(4, 3)
//     .store_int(0, 8)
//     .store_uint(cell_hash(state_init), 256)
//     .end_cell()
//     .begin_parse();
// }
function calculate_address_internal(state_init: Cell): Slice {
  return beginCell()
    .storeUint(4, 3)
    .storeInt(0, 8)
    .storeUint(BigInt("0x" + state_init.hash().toString("hex")), 256)
    .endCell()
    .beginParse();
}

// slice owner_upgradable::calculate_owner_upgradable_address(
//   slice user_wallet_address,
//   slice blubbo_master_address,
//   cell owner_upgradable_code
// ) inline {
//   return owner_upgradable::calculate_address_internal(
//     owner_upgradable::calculate_state_init(
//       user_wallet_address, blubbo_master_address, owner_upgradable_code,
//       ;; For address derivation, all that matters is the initial parameters
//       ;; that were used to deploy the BlubboUser contract.
//       ;;
//       ;; Initially, blubbo_user_version = 0, so we always have 0 here.
//       0,
//       0
//     )
//   );
// }
export function calculate_owner_upgradable_address(
  user_wallet_address: Address,
  blubbo_master_address: Address,
  owner_upgradable_code: Cell,
): Slice {
  return calculate_address_internal(
    calculate_state_init(
      user_wallet_address,
      blubbo_master_address,
      owner_upgradable_code,
      0n,
      0n,
    ),
  );
}
