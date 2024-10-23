import { Address, OpenedContract, Sender } from "@ton/core";
import { BeachMaster } from "./beach_master";
import { Sotw } from "./sotw";
import {
  ContractInteractionBorrowArgs,
  ContractInteractionDepositArgs,
  ContractInteractionRepayArgs,
  ContractInteractionWithdrawArgs,
  SendDepositToSotwArgs,
  SendRepayToSotwArgs,
} from "./types";
import { ConstantsByDeployment } from "./constants";
import { TonClient } from "@ton/ton";

export class ContractInteraction {
  beachMaster: OpenedContract<BeachMaster>;
  sotw: OpenedContract<Sotw>;
  client: TonClient;
  constantsByDeployment: ConstantsByDeployment;

  constructor(args: {
    client: TonClient;
    addressBook: {
      beachMaster: Address;
      sotw: Address;
    };
    constantsByDeployment: ConstantsByDeployment;
  }) {
    this.client = args.client;
    this.beachMaster = this.client.open(
      new BeachMaster(args.addressBook.beachMaster),
    );
    this.sotw = this.client.open(new Sotw(args.addressBook.sotw));
    this.constantsByDeployment = args.constantsByDeployment;
  }

  public deposit(sender: Sender, args: ContractInteractionDepositArgs) {
    if (
      args.reserve_id_6 ===
      BigInt(this.constantsByDeployment.Reserves.normal.TONCOIN)
    ) {
      const {
        jetton_amount,
        response_address,
        reserve_id_6,
      }: SendDepositToSotwArgs = args;
      return this.sotw.sendDeposit(sender, {
        jetton_amount,
        response_address,
        reserve_id_6,
        gas: this.constantsByDeployment.Fee.DEPOSIT.TONCOIN,
      });
    }

    return this.beachMaster.sendDeposit(sender, {
      ...args,
      gas: this.constantsByDeployment.Fee.DEPOSIT.OTHER.TOTAL,
      forward_ton_amount: this.constantsByDeployment.Fee.DEPOSIT.OTHER.FORWARD,
    });
  }

  public withdraw(sender: Sender, args: ContractInteractionWithdrawArgs) {
    const gas =
      args.reserve_id_6 ===
      BigInt(this.constantsByDeployment.Reserves.normal.TONCOIN)
        ? this.constantsByDeployment.Fee.WITHDRAW.TONCOIN
        : this.constantsByDeployment.Fee.WITHDRAW.OTHER;

    return this.beachMaster.sendWithdraw(sender, {
      ...args,
      gas,
      configPayload: this.constantsByDeployment.Config.PAYLOAD,
      configSignature: this.constantsByDeployment.Config.SIGNATURE,
    });
  }

  public borrow(sender: Sender, args: ContractInteractionBorrowArgs) {
    const gas =
      args.reserve_id_6 ===
      BigInt(this.constantsByDeployment.Reserves.normal.TONCOIN)
        ? this.constantsByDeployment.Fee.BORROW.TONCOIN
        : this.constantsByDeployment.Fee.BORROW.OTHER;

    return this.beachMaster.sendBorrow(sender, {
      ...args,
      gas,
      configPayload: this.constantsByDeployment.Config.PAYLOAD,
      configSignature: this.constantsByDeployment.Config.SIGNATURE,
    });
  }

  public repay(sender: Sender, args: ContractInteractionRepayArgs) {
    if (
      args.reserve_id_6 ===
      BigInt(this.constantsByDeployment.Reserves.normal.TONCOIN)
    ) {
      const {
        jetton_amount,
        response_address,
        reserve_id_6,
      }: SendRepayToSotwArgs = args;
      return this.sotw.sendRepay(sender, {
        jetton_amount,
        response_address,
        reserve_id_6,
        gas: this.constantsByDeployment.Fee.REPAY.TONCOIN,
      });
    }

    return this.beachMaster.sendRepay(sender, {
      ...args,
      gas: this.constantsByDeployment.Fee.REPAY.OTHER.TOTAL,
      forward_ton_amount: this.constantsByDeployment.Fee.REPAY.OTHER.FORWARD,
    });
  }
}
