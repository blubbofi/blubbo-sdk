import { Address, ContractProvider, Sender } from "@ton/core";
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

export class ContractInteraction {
  beachMaster: BeachMaster;
  sotw: Sotw;
  provider: ContractProvider;
  constantsByDeployment: ConstantsByDeployment;

  constructor(args: {
    provider: ContractProvider;
    addressBook: {
      beachMaster: Address;
      sotw: Address;
    };
    constantsByDeployment: ConstantsByDeployment;
  }) {
    this.provider = args.provider;
    this.beachMaster = new BeachMaster(args.addressBook.beachMaster);
    this.sotw = new Sotw(args.addressBook.sotw);
    this.constantsByDeployment = args.constantsByDeployment;
  }

  public deposit(sender: Sender, args: ContractInteractionDepositArgs) {
    if (
      args.reserve_id_6 === this.constantsByDeployment.Reserves.normal.TONCOIN
    ) {
      const {
        jetton_amount,
        response_address,
        reserve_id_6,
      }: SendDepositToSotwArgs = args;
      return this.sotw.sendDeposit(this.provider, sender, {
        jetton_amount,
        response_address,
        reserve_id_6,
        gas: this.constantsByDeployment.Fee.DEPOSIT.TONCOIN,
      });
    }

    return this.beachMaster.sendDeposit(this.provider, sender, {
      ...args,
      gas: this.constantsByDeployment.Fee.DEPOSIT.OTHER.TOTAL,
      forward_ton_amount: this.constantsByDeployment.Fee.DEPOSIT.OTHER.FORWARD,
    });
  }

  public withdraw(sender: Sender, args: ContractInteractionWithdrawArgs) {
    const gas =
      args.reserve_id_6 === this.constantsByDeployment.Reserves.normal.TONCOIN
        ? this.constantsByDeployment.Fee.WITHDRAW.TONCOIN
        : this.constantsByDeployment.Fee.WITHDRAW.OTHER;

    return this.beachMaster.sendWithdraw(this.provider, sender, {
      ...args,
      gas,
      configPayload: this.constantsByDeployment.Config.PAYLOAD,
      configSignature: this.constantsByDeployment.Config.SIGNATURE,
    });
  }

  public borrow(sender: Sender, args: ContractInteractionBorrowArgs) {
    const gas =
      args.reserve_id_6 === this.constantsByDeployment.Reserves.normal.TONCOIN
        ? this.constantsByDeployment.Fee.BORROW.TONCOIN
        : this.constantsByDeployment.Fee.BORROW.OTHER;

    return this.beachMaster.sendBorrow(this.provider, sender, {
      ...args,
      gas,
      configPayload: this.constantsByDeployment.Config.PAYLOAD,
      configSignature: this.constantsByDeployment.Config.SIGNATURE,
    });
  }

  public repay(sender: Sender, args: ContractInteractionRepayArgs) {
    if (
      args.reserve_id_6 === this.constantsByDeployment.Reserves.normal.TONCOIN
    ) {
      const {
        jetton_amount,
        response_address,
        reserve_id_6,
      }: SendRepayToSotwArgs = args;
      return this.sotw.sendRepay(this.provider, sender, {
        jetton_amount,
        response_address,
        reserve_id_6,
        gas: this.constantsByDeployment.Fee.REPAY.TONCOIN,
      });
    }

    return this.beachMaster.sendRepay(this.provider, sender, {
      ...args,
      gas: this.constantsByDeployment.Fee.REPAY.OTHER.TOTAL,
      forward_ton_amount: this.constantsByDeployment.Fee.REPAY.OTHER.FORWARD,
    });
  }
}
