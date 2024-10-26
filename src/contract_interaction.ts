import { Address, Cell, OpenedContract, Sender, toNano } from "@ton/core";
import { BeachMaster } from "./beach_master";
import { Sotw } from "./sotw";
import {
  ContractInteractionBorrowArgs,
  ContractInteractionDepositArgs,
  ContractInteractionMintArgs,
  ContractInteractionRepayArgs,
  ContractInteractionWithdrawArgs,
  SendDepositToSotwArgs,
  SendRepayToSotwArgs,
} from "./types";
import { ConstantsByDeployment } from "./constants";
import { TonClient } from "@ton/ton";
import type { SendTransactionRequest } from "@tonconnect/sdk";
import { JettonMinter } from "./jetton";

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

  /**
   * @example
   * ```
   * const [tonConnectUI] = useTonConnectUI();
   * const result = await tonConnectUI.sendTransaction(depositRequest({...}));
   * ```
   */
  public depositRequest(
    args: ContractInteractionDepositArgs,
  ): SendTransactionRequest {
    const messages: SendTransactionRequest["messages"] = [];

    if (
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
    ) {
      const {
        jetton_amount,
        response_address,
        reserve_id_6,
      }: SendDepositToSotwArgs = args;
      messages.push({
        address: this.sotw.address.toString(),
        amount: (
          jetton_amount + this.constantsByDeployment.Fee.DEPOSIT.TONCOIN
        ).toString(),
        payload: Sotw.createSendDepositBody({
          jetton_amount,
          response_address,
          reserve_id_6,
        })
          .toBoc()
          .toString("base64"),
      });
    } else {
      messages.push({
        address: this.beachMaster.address.toString(),
        amount: this.constantsByDeployment.Fee.DEPOSIT.OTHER.TOTAL.toString(),
        payload: BeachMaster.createSendDepositBody({
          ...args,
          forward_ton_amount:
            this.constantsByDeployment.Fee.DEPOSIT.OTHER.FORWARD,
        })
          .toBoc()
          .toString("base64"),
      });
    }

    return {
      validUntil: Date.now() + 2 * 60 * 1000, // 2 minutes,
      messages,
    };
  }

  public deposit(sender: Sender, args: ContractInteractionDepositArgs) {
    if (
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
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

  public withdrawRequest(
    args: ContractInteractionWithdrawArgs,
  ): SendTransactionRequest {
    const gas =
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
        ? this.constantsByDeployment.Fee.WITHDRAW.TONCOIN
        : this.constantsByDeployment.Fee.WITHDRAW.OTHER;

    const messages: SendTransactionRequest["messages"] = [
      {
        address: this.beachMaster.address.toString(),
        amount: gas.toString(),
        payload: BeachMaster.createSendWithdrawBody({
          ...args,
          configPayload: this.constantsByDeployment.Config.PAYLOAD,
          configSignature: this.constantsByDeployment.Config.SIGNATURE,
        })
          .toBoc()
          .toString("base64"),
      },
    ];

    return {
      validUntil: Date.now() + 2 * 60 * 1000, // 2 minutes,
      messages,
    };
  }

  public withdraw(sender: Sender, args: ContractInteractionWithdrawArgs) {
    const gas =
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
        ? this.constantsByDeployment.Fee.WITHDRAW.TONCOIN
        : this.constantsByDeployment.Fee.WITHDRAW.OTHER;

    return this.beachMaster.sendWithdraw(sender, {
      ...args,
      gas,
      configPayload: this.constantsByDeployment.Config.PAYLOAD,
      configSignature: this.constantsByDeployment.Config.SIGNATURE,
    });
  }

  public borrowRequest(
    args: ContractInteractionBorrowArgs,
  ): SendTransactionRequest {
    const gas =
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
        ? this.constantsByDeployment.Fee.BORROW.TONCOIN
        : this.constantsByDeployment.Fee.BORROW.OTHER;

    const messages: SendTransactionRequest["messages"] = [
      {
        address: this.beachMaster.address.toString(),
        amount: gas.toString(),
        payload: BeachMaster.createSendBorrowBody({
          ...args,
          configPayload: this.constantsByDeployment.Config.PAYLOAD,
          configSignature: this.constantsByDeployment.Config.SIGNATURE,
        })
          .toBoc()
          .toString("base64"),
      },
    ];

    return {
      validUntil: Date.now() + 2 * 60 * 1000, // 2 minutes,
      messages,
    };
  }

  public borrow(sender: Sender, args: ContractInteractionBorrowArgs) {
    const gas =
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
        ? this.constantsByDeployment.Fee.BORROW.TONCOIN
        : this.constantsByDeployment.Fee.BORROW.OTHER;

    return this.beachMaster.sendBorrow(sender, {
      ...args,
      gas,
      configPayload: this.constantsByDeployment.Config.PAYLOAD,
      configSignature: this.constantsByDeployment.Config.SIGNATURE,
    });
  }

  public repayRequest(
    args: ContractInteractionRepayArgs,
  ): SendTransactionRequest {
    const messages: SendTransactionRequest["messages"] = [];

    if (
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
    ) {
      const {
        jetton_amount,
        response_address,
        reserve_id_6,
      }: SendRepayToSotwArgs = args;
      messages.push({
        address: this.sotw.address.toString(),
        amount: (
          jetton_amount + this.constantsByDeployment.Fee.REPAY.TONCOIN
        ).toString(),
        payload: Sotw.createSendRepayBody({
          jetton_amount,
          response_address,
          reserve_id_6,
        })
          .toBoc()
          .toString("base64"),
      });
    } else {
      messages.push({
        address: this.beachMaster.address.toString(),
        amount: this.constantsByDeployment.Fee.REPAY.OTHER.TOTAL.toString(),
        payload: BeachMaster.createSendRepayBody({
          ...args,
          forward_ton_amount:
            this.constantsByDeployment.Fee.REPAY.OTHER.FORWARD,
        })
          .toBoc()
          .toString("base64"),
      });
    }

    return {
      validUntil: Date.now() + 2 * 60 * 1000, // 2 minutes,
      messages,
    };
  }

  public repay(sender: Sender, args: ContractInteractionRepayArgs) {
    if (
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
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

  /**
   * Used to mint mock jettons for testing purposes.
   */
  public createMockJettonMintRequest(
    args: ContractInteractionMintArgs,
  ): SendTransactionRequest {
    const msg = JettonMinter.mintMessage(
      args.response_addr,
      args.to,
      args.jetton_amount,
      toNano("0.05"), // forward_ton_amount
      toNano("0.015"), // total_ton_amount
      0n, // query_id
    );
    const messages: SendTransactionRequest["messages"] = [
      {
        address: args.jetton_minter_addr.toString(),
        amount: (toNano(`0.15`) + toNano("0.015")).toString(),
        payload: msg.toBoc().toString("base64"),
      },
    ];

    return {
      validUntil: Date.now() + 2 * 60 * 1000, // 2 minutes,
      messages,
    };
  }

  /**
   * @example
   * const sendTxResp = await tonConnectUI.sendTransaction(contractInteraction.createMockJettonMintRequest({
   *  jetton_minter_addr: jettonMinter.address,
   *  response_addr: ownerAddress,
   *  to: toAddressParsed,
   *  jetton_amount: Humanizer.genericNumber.fromHuman(`100`, reserve.decimals),
   * }))
   *
   * const txHash = contractInteraction.getTxHash(sendTxResp.boc)
   */
  public getTxHash(boc: string) {
    return Cell.fromBase64(boc).hash().toString("hex");
  }
}
