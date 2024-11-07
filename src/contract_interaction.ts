import { Address, Cell, Sender, toNano } from "@ton/core";
import { BlubboMaster } from "./blubbo_master";
import { Sotw } from "./sotw";
import {
  ContractInteractionBorrowArgs,
  ContractInteractionDepositArgs,
  ContractInteractionMintArgs,
  ContractInteractionRepayArgs,
  ContractInteractionWithdrawArgs,
  SendDepositToSotwArgs,
  SendRepayToSotwArgs,
  WithOwnerAddress,
} from "./types";
import { ConstantsByDeployment } from "./constants";
import type { SendTransactionRequest } from "@tonconnect/sdk";
import {
  getStandardJettonWalletForAddress,
  JettonMinter,
  JettonWallet,
} from "./jetton";
import {
  OpenedContracts,
  TonClientWithFallbacks,
} from "./ton_client_with_fallbacks";

/**
 * This class bridges the developer with the contract.
 * @example
 * ```
 * export const tonClient = new TonClient({
 *  endpoint: `https://testnet.toncenter.com/api/v2/jsonRPC`,
 *  apiKey: TONCENTER_APIKEY,
 * });
 * const contractInteraction = new ContractInteraction({
 *   client: tonClient,
 *   addressBook: {
 *     beachMaster: ConstantsByDeployment.testnet_2024_11_01_7513aa7.AddressBook.BEACH_MASTER,
 *     sotw: ConstantsByDeployment.testnet_2024_11_01_7513aa7.AddressBook.SOTW,
 *   },
 *   constantsByDeployment: ConstantsByDeployment.testnet_2024_11_01_7513aa7,
 * });
 *
 * // needs to be called before anything else.
 * // can be called many times. It makes sure that it gets only initialized once
 * await contractInteraction.init();
 * ```
 */
export class ContractInteraction {
  /**
   * Not actually defined until `init` is called.
   */
  blubboMaster!: OpenedContracts<BlubboMaster>;
  /**
   * Not actually defined until `init` is called.
   */
  sotw!: OpenedContracts<Sotw>;
  client: TonClientWithFallbacks;
  constantsByDeployment: ConstantsByDeployment;
  addressBook: {
    blubboMaster: Address;
    sotw: Address;
  };
  initialized = false;
  initializing = false;

  constructor(args: {
    client: TonClientWithFallbacks;
    constantsByDeployment: ConstantsByDeployment;
    addressBook: {
      blubboMaster: Address;
      sotw: Address;
    };
  }) {
    this.client = args.client;
    this.constantsByDeployment = args.constantsByDeployment;
    this.addressBook = args.addressBook;
  }

  async init() {
    if (this.initializing) {
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (this.initialized) {
            clearInterval(interval);
            resolve(``);
          }
        }, 10);
      });

      return;
    }

    if (this.initialized) {
      return;
    }

    this.initializing = true;
    this.blubboMaster = await this.client.openWithFallbacks(
      new BlubboMaster(this.addressBook.blubboMaster),
    );
    this.sotw = await this.client.openWithFallbacks(
      new Sotw(this.addressBook.sotw),
    );
    this.initialized = true;
  }

  /**
   * @example
   * ```
   * const [tonConnectUI] = useTonConnectUI();
   * const contractInteraction = new ContractInteraction({ ... });
   * await contractInteraction.init();
   * const result = await tonConnectUI.sendTransaction(await contractInteraction.createDepositRequest({...}));
   * ```
   */
  public async createDepositRequest(
    args: WithOwnerAddress<ContractInteractionDepositArgs>,
  ): Promise<SendTransactionRequest> {
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
        address: this.sotw.getPrimary().address.toString(),
        amount: (
          jetton_amount + this.constantsByDeployment.Fee.DEPOSIT.TONCOIN.TOTAL
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
      const jettonMinterAddress =
        this.constantsByDeployment.Reserves.byId[args.reserve_id_6]
          .minterAddress;

      const ownerJettonWallet = await getStandardJettonWalletForAddress({
        tonClient: this.client,
        address: {
          owner: args.owner_address,
          jettonMinter: jettonMinterAddress,
        },
      });

      messages.push({
        address: ownerJettonWallet.accessVariable(`address`).toString(),
        amount: this.constantsByDeployment.Fee.DEPOSIT.OTHER.TOTAL.toString(),
        payload: JettonWallet.createSendDepositBody({
          ...args,
          to: this.blubboMaster.getPrimary().address,
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

  /**
   * To be used environments where tonConnectUI is not available (for example, node.js).
   */
  public async deposit(
    sender: Sender,
    args: WithOwnerAddress<ContractInteractionDepositArgs>,
  ) {
    if (
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
    ) {
      const {
        jetton_amount,
        response_address,
        reserve_id_6,
      }: SendDepositToSotwArgs = args;
      return this.sotw.getPrimary().sendDeposit(sender, {
        jetton_amount,
        response_address,
        reserve_id_6,
        gas: this.constantsByDeployment.Fee.DEPOSIT.TONCOIN.TOTAL,
      });
    }

    const { owner_address, ...restArgs } = args;

    const jettonMinterAddress =
      this.constantsByDeployment.Reserves.byId[args.reserve_id_6].minterAddress;

    const ownerJettonWallet = await getStandardJettonWalletForAddress({
      tonClient: this.client,
      address: {
        owner: owner_address,
        jettonMinter: jettonMinterAddress,
      },
    });

    return ownerJettonWallet.getPrimary().sendDeposit(sender, {
      ...restArgs,
      to: this.blubboMaster.getPrimary().address,
      gas: this.constantsByDeployment.Fee.DEPOSIT.OTHER.TOTAL,
      forward_ton_amount: this.constantsByDeployment.Fee.DEPOSIT.OTHER.FORWARD,
    });
  }

  /**
   * @example
   * ```
   * const [tonConnectUI] = useTonConnectUI();
   * const contractInteraction = new ContractInteraction({ ... });
   * await contractInteraction.init();
   * const result = await tonConnectUI.sendTransaction(await contractInteraction.createWithdrawRequest({...}));
   * ```
   */
  public createWithdrawRequest(
    args: ContractInteractionWithdrawArgs,
  ): SendTransactionRequest {
    const gas =
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
        ? this.constantsByDeployment.Fee.WITHDRAW.TONCOIN.TOTAL
        : this.constantsByDeployment.Fee.WITHDRAW.OTHER.TOTAL;

    const messages: SendTransactionRequest["messages"] = [
      {
        address: this.blubboMaster.getPrimary().address.toString(),
        amount: gas.toString(),
        payload: BlubboMaster.createSendWithdrawBody({
          ...args,
          configPayload: this.constantsByDeployment.Config.PAYLOAD,
          configSignature: this.constantsByDeployment.Config.SIGNATURE,
        })
          .toBoc()
          .toString("base64"),
      },
    ];

    return {
      validUntil: Date.now() + 60 * 1000, // 60 seconds to get the benefit of latest oracle prices
      messages,
    };
  }

  public withdraw(sender: Sender, args: ContractInteractionWithdrawArgs) {
    const gas =
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
        ? this.constantsByDeployment.Fee.WITHDRAW.TONCOIN.TOTAL
        : this.constantsByDeployment.Fee.WITHDRAW.OTHER.TOTAL;

    return this.blubboMaster.getPrimary().sendWithdraw(sender, {
      ...args,
      gas,
      configPayload: this.constantsByDeployment.Config.PAYLOAD,
      configSignature: this.constantsByDeployment.Config.SIGNATURE,
    });
  }

  /**
   * @example
   * ```
   * const [tonConnectUI] = useTonConnectUI();
   * const contractInteraction = new ContractInteraction({ ... });
   * await contractInteraction.init();
   * const result = await tonConnectUI.sendTransaction(await contractInteraction.createBorrowRequest({...}));
   * ```
   */
  public createBorrowRequest(
    args: ContractInteractionBorrowArgs,
  ): SendTransactionRequest {
    const gas =
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
        ? this.constantsByDeployment.Fee.BORROW.TONCOIN.TOTAL
        : this.constantsByDeployment.Fee.BORROW.OTHER.TOTAL;

    const messages: SendTransactionRequest["messages"] = [
      {
        address: this.blubboMaster.getPrimary().address.toString(),
        amount: gas.toString(),
        payload: BlubboMaster.createSendBorrowBody({
          ...args,
          configPayload: this.constantsByDeployment.Config.PAYLOAD,
          configSignature: this.constantsByDeployment.Config.SIGNATURE,
        })
          .toBoc()
          .toString("base64"),
      },
    ];

    return {
      validUntil: Date.now() + 60 * 1000, // 60 seconds to get the benefit of latest oracle prices
      messages,
    };
  }

  public borrow(sender: Sender, args: ContractInteractionBorrowArgs) {
    const gas =
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
        ? this.constantsByDeployment.Fee.BORROW.TONCOIN.TOTAL
        : this.constantsByDeployment.Fee.BORROW.OTHER.TOTAL;

    return this.blubboMaster.getPrimary().sendBorrow(sender, {
      ...args,
      gas,
      configPayload: this.constantsByDeployment.Config.PAYLOAD,
      configSignature: this.constantsByDeployment.Config.SIGNATURE,
    });
  }

  /**
   * @example
   * ```
   * const [tonConnectUI] = useTonConnectUI();
   * const contractInteraction = new ContractInteraction({ ... });
   * await contractInteraction.init();
   * const result = await tonConnectUI.sendTransaction(await contractInteraction.createRepayRequest({...}));
   * ```
   */
  public async createRepayRequest(
    args: WithOwnerAddress<ContractInteractionRepayArgs>,
  ): Promise<SendTransactionRequest> {
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
        address: this.sotw.getPrimary().address.toString(),
        amount: (
          jetton_amount + this.constantsByDeployment.Fee.REPAY.TONCOIN.TOTAL
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
      const { owner_address, ...restArgs } = args;

      const ownerJettonWallet = await getStandardJettonWalletForAddress({
        tonClient: this.client,
        address: {
          owner: owner_address,
          jettonMinter:
            this.constantsByDeployment.Reserves.byId[args.reserve_id_6]
              .minterAddress,
        },
      });

      messages.push({
        address: ownerJettonWallet.getPrimary().address.toString(),
        amount: this.constantsByDeployment.Fee.REPAY.OTHER.TOTAL.toString(),
        payload: JettonWallet.createSendRepayBody({
          ...restArgs,
          to: this.blubboMaster.getPrimary().address,
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

  public async repay(
    sender: Sender,
    args: WithOwnerAddress<ContractInteractionRepayArgs>,
  ) {
    if (
      args.reserve_id_6 === this.constantsByDeployment.Reserves.bySymbol.TON.id
    ) {
      const {
        jetton_amount,
        response_address,
        reserve_id_6,
      }: SendRepayToSotwArgs = args;
      return this.sotw.getPrimary().sendRepay(sender, {
        jetton_amount,
        response_address,
        reserve_id_6,
        gas: this.constantsByDeployment.Fee.REPAY.TONCOIN.TOTAL,
      });
    }

    const { owner_address, ...restArgs } = args;

    const ownerJettonWallet = await getStandardJettonWalletForAddress({
      tonClient: this.client,
      address: {
        owner: owner_address,
        jettonMinter:
          this.constantsByDeployment.Reserves.byId[args.reserve_id_6]
            .minterAddress,
      },
    });

    return ownerJettonWallet.getPrimary().sendRepay(sender, {
      ...restArgs,
      to: this.blubboMaster.getPrimary().address,
      gas: this.constantsByDeployment.Fee.DEPOSIT.OTHER.TOTAL,
      forward_ton_amount: this.constantsByDeployment.Fee.DEPOSIT.OTHER.FORWARD,
    });
  }

  /**
   * Used to mint mock jettons for testing purposes.
   * @example
   * ```
   * const [tonConnectUI] = useTonConnectUI();
   * const contractInteraction = new ContractInteraction({ ... });
   * await contractInteraction.init();
   * const result = await tonConnectUI.sendTransaction(await contractInteraction.createMockJettonMintRequest({...}));
   * ```
   */
  public createMockJettonMintRequest(
    args: ContractInteractionMintArgs,
  ): SendTransactionRequest {
    const msg = JettonMinter.mintMessage(
      args.response_addr,
      args.to,
      args.jetton_amount,
      toNano("0.05"), // forward_ton_amount
      toNano("0.15"), // total_ton_amount
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
