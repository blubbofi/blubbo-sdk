/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Address,
  Cell,
  Contract,
  Message,
  OpenedContract,
  TonClient,
  TonClientParameters,
  Transaction,
  TupleItem,
  TupleReader,
} from "@ton/ton";
export type ResolvableTonClient = Promise<TonClient>;
export type SupportedFallbackTonClient = TonClient | ResolvableTonClient;
export type TonClientWithFallbackConfig = {
  retryTimes: number;
  retryIntervalMs: number;
};

export class OpenedContracts<C> {
  contracts: OpenedContract<C>[];

  constructor(contracts: OpenedContract<C>[]) {
    if (contracts.length === 0) {
      throw new Error(`OpenedContracts must have at least one contract`);
    }

    this.contracts = contracts;
  }

  async callAsyncMethod<
    T extends OpenedContract<C>,
    K extends {
      [M in keyof T]: T[M] extends (...args: any) => Promise<any> ? M : never;
    }[keyof T],
  >(
    method: K,
    ...args: T[K] extends (...args: any) => Promise<any>
      ? Parameters<T[K]>
      : never
  ): Promise<
    T[K] extends (...args: any) => Promise<any> ? ReturnType<T[K]> : never
  > {
    for (const openedContract of this.contracts) {
      try {
        // @ts-ignore: there is no way to infer the parameter types of the method
        return await openedContract[method](...args);
      } catch (err) {
        console.error(err);
      }
    }

    throw new Error(`Failed to call method ${String(method)}`);
  }

  callMethod<
    T extends OpenedContract<C>,
    K extends {
      [M in keyof T]: T[M] extends (...args: any) => any ? M : never;
    }[keyof T],
  >(
    method: K,
    ...args: T[K] extends (...args: any) => Promise<any>
      ? Parameters<T[K]>
      : never
  ): T[K] extends (...args: any) => Promise<any> ? ReturnType<T[K]> : never {
    for (const openedContract of this.contracts) {
      try {
        // @ts-ignore: there is no way to infer the parameter types of the method
        return openedContract[method](...args);
      } catch (err) {
        console.error(err);
      }
    }

    throw new Error(`Failed to call method ${String(method)}`);
  }

  accessVariable<
    T extends OpenedContract<C>,
    K extends {
      [M in keyof T]: T[M] extends (...args: any) => any ? never : M;
    }[keyof T],
  >(method: K): T[K] {
    for (const openedContract of this.contracts) {
      try {
        // @ts-ignore: there is no way to infer the parameter types of the method
        return openedContract[method];
      } catch (err) {
        console.error(err);
      }
    }

    throw new Error(`Failed to call method ${String(method)}`);
  }

  getPrimary(): OpenedContract<C> {
    return this.contracts[0]!;
  }
}

/**
 * A TonClient with fallbacks. If the primary TonClient fails, it will try to use the fallbacks.
 */
export class TonClientWithFallbacks extends TonClient {
  primary: TonClient;
  fallbacks: SupportedFallbackTonClient[];

  config: TonClientWithFallbackConfig;

  constructor(
    parameters: TonClientParameters,
    fallbacks: SupportedFallbackTonClient[],
    config: TonClientWithFallbackConfig = {
      retryTimes: 3,
      retryIntervalMs: 2000,
    },
  ) {
    super(parameters);
    this.primary = new TonClient(parameters);
    this.config = config;
    this.fallbacks = fallbacks;
  }

  async runFn<
    MethodKey extends {
      [K in keyof InstanceType<typeof TonClient>]: InstanceType<
        typeof TonClient
      >[K] extends (...args: any) => Promise<any>
        ? K
        : never;
    }[keyof InstanceType<typeof TonClient>],
    Params extends Parameters<InstanceType<typeof TonClient>[MethodKey]>,
  >(
    method: MethodKey,
    params: Params,
  ): Promise<ReturnType<InstanceType<typeof TonClient>[MethodKey]>> {
    if (params.length === 0) {
      // @ts-ignore: there is no way to infer the parameter types of the method
      return await this.primary[method]();
    }

    if (params.length === 1) {
      // @ts-ignore: there is no way to infer the parameter types of the method
      return await this.primary[method](params[0]);
    }

    if (params.length === 2) {
      // @ts-ignore: there is no way to infer the parameter types of the method
      return await this.primary[method](params[0], params[1]);
    }

    if (params.length === 3) {
      // @ts-ignore: there is no way to infer the parameter types of the method
      return await this.primary[method](params[0], params[1], params[2]);
    }

    // TonClient's methods have at most 3 parameters
    throw new Error(
      `Too many parameters for method ${method}: ${params.length} parameters`,
    );
  }

  async runFnWithFallback<
    MethodKey extends {
      [K in keyof InstanceType<typeof TonClient>]: InstanceType<
        typeof TonClient
      >[K] extends (...args: any) => Promise<any>
        ? K
        : never;
    }[keyof InstanceType<typeof TonClient>],
    Params extends Parameters<InstanceType<typeof TonClient>[MethodKey]>,
  >(
    method: MethodKey,
    params: Params,
  ): Promise<ReturnType<InstanceType<typeof TonClient>[MethodKey]>> {
    for (const fallback of this.fallbacks) {
      const resolvedFallback = await fallback;
      try {
        if (params.length === 0) {
          // @ts-ignore: there is no way to infer the parameter types of the method
          return await resolvedFallback[method]();
        }

        if (params.length === 1) {
          // @ts-ignore: there is no way to infer the parameter types of the method
          return await resolvedFallback[method](params[0]);
        }

        if (params.length === 2) {
          // @ts-ignore: there is no way to infer the parameter types of the method
          return await resolvedFallback[method](params[0], params[1]);
        }

        if (params.length === 3) {
          // @ts-ignore: there is no way to infer the parameter types of the method
          return await resolvedFallback[method](
            // @ts-ignore: there is no way to infer the parameter types of the method
            params[0],
            params[1],
            params[2],
          );
        }

        // TonClient's methods have at most 3 parameters
        throw new Error(`Too many parameters for method ${method}`);
      } catch (err) {
        console.error(err);
      }
    }

    throw new Error(
      `Fallback function did not return a value for method ${method}`,
    );
  }

  async fn<
    MethodKey extends {
      [K in keyof InstanceType<typeof TonClient>]: InstanceType<
        typeof TonClient
      >[K] extends (...args: any) => Promise<any>
        ? K
        : never;
    }[keyof InstanceType<typeof TonClient>],
    Params extends Parameters<InstanceType<typeof TonClient>[MethodKey]>,
  >(
    method: MethodKey,
    params: Params,
  ): Promise<Awaited<ReturnType<InstanceType<typeof TonClient>[MethodKey]>>> {
    for (let i = 0; i < this.config.retryTimes; i++) {
      try {
        return await this.runFn(method, params);
      } catch (err) {
        console.error(err);
        try {
          return await this.runFnWithFallback(method, params);
        } catch (err) {
          console.error(err);

          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryIntervalMs),
          );
        }
      }
    }

    throw new Error(
      `Failed to run method ${method} after ${this.config.retryTimes} retries`,
    );
  }

  override getBalance(address: Address): Promise<bigint> {
    return this.fn(`getBalance`, [address]);
  }
  override runMethod(
    address: Address,
    name: string,
    stack?: TupleItem[],
  ): Promise<{ gas_used: number; stack: TupleReader }> {
    return this.fn(`runMethod`, [address, name, stack]);
  }
  override callGetMethod(
    address: Address,
    name: string,
    stack?: TupleItem[],
  ): Promise<{ gas_used: number; stack: TupleReader }> {
    return this.fn(`callGetMethod`, [address, name, stack]);
  }

  override runMethodWithError(
    address: Address,
    name: string,
    params?: any[],
  ): Promise<{ gas_used: number; stack: TupleReader; exit_code: number }> {
    return this.fn(`runMethodWithError`, [address, name, params]);
  }
  override callGetMethodWithError(
    address: Address,
    name: string,
    stack?: TupleItem[],
  ): Promise<{ gas_used: number; stack: TupleReader }> {
    return this.fn(`callGetMethodWithError`, [address, name, stack]);
  }
  override getTransactions(
    address: Address,
    opts: {
      limit: number;
      lt?: string;
      hash?: string;
      to_lt?: string;
      inclusive?: boolean;
      archival?: boolean;
    },
  ): Promise<Transaction[]> {
    return this.fn(`getTransactions`, [address, opts]);
  }
  override getTransaction(
    address: Address,
    lt: string,
    hash: string,
  ): Promise<Transaction | null> {
    return this.fn(`getTransaction`, [address, lt, hash]);
  }
  override tryLocateResultTx(
    source: Address,
    destination: Address,
    created_lt: string,
  ): Promise<Transaction> {
    return this.fn(`tryLocateResultTx`, [source, destination, created_lt]);
  }
  override tryLocateSourceTx(
    source: Address,
    destination: Address,
    created_lt: string,
  ): Promise<Transaction> {
    return this.fn(`tryLocateSourceTx`, [source, destination, created_lt]);
  }
  override getMasterchainInfo(): Promise<{
    workchain: number;
    shard: string;
    initSeqno: number;
    latestSeqno: number;
  }> {
    return this.fn(`getMasterchainInfo`, []);
  }
  override getWorkchainShards(
    seqno: number,
  ): Promise<{ workchain: number; shard: string; seqno: number }[]> {
    return this.fn(`getWorkchainShards`, [seqno]);
  }
  override getShardTransactions(
    workchain: number,
    seqno: number,
    shard: string,
  ): Promise<{ account: Address; lt: string; hash: string }[]> {
    return this.fn(`getShardTransactions`, [workchain, seqno, shard]);
  }
  override sendMessage(src: Message): Promise<void> {
    return this.fn(`sendMessage`, [src]);
  }
  override sendFile(src: Buffer): Promise<void> {
    return this.fn(`sendFile`, [src]);
  }
  override estimateExternalMessageFee(
    address: Address,
    args: {
      body: Cell;
      initCode: Cell | null;
      initData: Cell | null;
      ignoreSignature: boolean;
    },
  ): Promise<{
    "@type": "query.fees";
    source_fees: {
      "@type": "fees";
      in_fwd_fee: number;
      storage_fee: number;
      gas_fee: number;
      fwd_fee: number;
    };
  }> {
    return this.fn(`estimateExternalMessageFee`, [address, args]);
  }
  override sendExternalMessage(contract: Contract, src: Cell): Promise<void> {
    return this.fn(`sendExternalMessage`, [contract, src]);
  }
  override isContractDeployed(address: Address): Promise<boolean> {
    return this.fn(`isContractDeployed`, [address]);
  }
  override getContractState(address: Address): Promise<{
    balance: bigint;
    state: "active" | "uninitialized" | "frozen";
    code: Buffer | null;
    data: Buffer | null;
    lastTransaction: { lt: string; hash: string } | null;
    blockId: { workchain: number; shard: string; seqno: number };
    timestampt: number;
  }> {
    return this.fn(`getContractState`, [address]);
  }

  /**
   * @description Open a contract with fallbacks. A safer replacement of `.open()` method.
   * @example
   * const tonClientWithFallbacks = new TonClientWithFallbacks(
      {
        endpoint: `https://does.not.work`,
      },
      [
        (async () => {
          const endpoint = await getHttpEndpoint({ network: `testnet` });
          return new TonClient({
            endpoint,
          });
        })(),
      ],
      {
        retryTimes: 3,
        retryIntervalMs: 2000,
      },
    );
    const blubboMaster = await tonClientWithFallbacks.openWithFallbacks(
      BlubboMaster.createFromAddress(
        ConstantsByDeployment.testnet_2024_11_01_7513aa7.AddressBook
          .BLUBBO_MASTER,
      ),
    );
    try {
      const reserve = await blubboMaster.callAsyncMethod(`getReserve`, 0n);

      console.log(reserve);
    } catch (e) {
      console.error(e);
      fail(e);
    }
   */
  async openWithFallbacks<T extends Contract>(
    src: T,
  ): Promise<OpenedContracts<T>> {
    const openedContract = this.open(src);
    const fallbackOpenedContracts: OpenedContract<T>[] = [];
    for (const fallback of this.fallbacks) {
      const f = await fallback;
      fallbackOpenedContracts.push(f.open(src));
    }
    return new OpenedContracts([openedContract, ...fallbackOpenedContracts]);
  }
}
