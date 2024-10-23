import { getDataServiceIdForSigner, getOracleRegistryState, requestDataPackages } from '@redstone-finance/sdk';
import { RedstonePayload, SignedDataPackage } from '@redstone-finance/protocol';
import { createPayloadCell } from './create-payload-cell';
import { RedstoneOracleConstants } from './constants';
import { hexlify } from 'ethers/lib/utils';

type Ticker = 'TON' | 'USDT';
const allowedTickers = new Set<Ticker>(['TON', 'USDT']);
function isAllowedTicker(ticker: string): ticker is Ticker {
    return allowedTickers.has(ticker as Ticker);
}

/**
 * Off-chain median price calculation
 * to check against the correctness of the
 * on-chain median price calculation
 */
class MedianPricesBuilder {
    private prices: {
        TON: bigint[];
        USDT: bigint[];
    } = {
        TON: [],
        USDT: [],
    };

    private findMedian(arr: bigint[]): bigint {
        const sortedArr = arr.slice().sort((a, b) => Number(a - b));
        const midIndex = Math.floor(sortedArr.length / 2);

        if (sortedArr.length % 2 === 0) {
            return (sortedArr[midIndex - 1]! + sortedArr[midIndex]!) / 2n;
        } else {
            return sortedArr[midIndex]!;
        }
    }

    addPrice(ticker: string, price: bigint) {
        if (!isAllowedTicker(ticker)) {
            throw new Error(`Invalid ticker: ${ticker}`);
        }
        this.prices[ticker].push(price);
    }

    build() {
        Object.keys(this.prices).forEach((key) => {
            if (this.prices[key as Ticker] === undefined) {
                throw new Error(`Missing price for ${key}`);
            }
        });

        return {
            TON: this.findMedian(this.prices.TON),
            USDT: this.findMedian(this.prices.USDT),
        };
    }
}

export class RedstoneOracle {
    static async getLatestPricesFromOracle() {
        for (let i = 0; i < RedstoneOracleConstants.ORACLE_RETRY_COUNT; i++) {
            try {
                return await RedstoneOracle.getLatestPricesFromOracleInternal();
            } catch (err) {
                console.error(`Error fetching prices from oracle: ${err}. Retry count: ${i}`);
                await new Promise((resolve) => setTimeout(resolve, RedstoneOracleConstants.ORACLE_RETRY_DELAY_MS));
            }
        }

        throw new Error('Failed to fetch prices from oracle after retries');
    }

    private static async getLatestPricesFromOracleInternal() {
        const oracleStateWithSigners = await getOracleRegistryState();
        // Copied from https://github.com/evaafi/merkle-oracles/blob/fbe3a92ba82553359815bda43d64f0997665e43a/src/oracles/redstone/redstone.ts#L1
        const signedDataPackagesResponse = await requestDataPackages({
            dataPackagesIds: RedstoneOracleConstants.DATA_FEEDS,
            dataServiceId: RedstoneOracleConstants.DATA_SERVICE_ID,
            uniqueSignersCount: RedstoneOracleConstants.UNIQUE_SIGNERS_COUNT,
            urls: RedstoneOracleConstants.GATEWAY_URLS,
            maxTimestampDeviationMS: RedstoneOracleConstants.MAX_TIMESTAMP_DEVIATION_MS,
        });

        const medianPricesBuilder = new MedianPricesBuilder();
        const now = Date.now();
        for (const [dataFeedId, dataPackages] of Object.entries(signedDataPackagesResponse)) {
            if (!dataPackages) {
                throw new Error(`No data packages for ${dataFeedId}`);
            }

            for (const signedDataPackage of dataPackages) {
                if (now - signedDataPackage.dataPackage.timestampMilliseconds > RedstoneOracleConstants.PRICE_TTL_MS) {
                    throw new Error(`Stale price data package for ${dataFeedId}`);
                }
                const signerAddress = signedDataPackage.recoverSignerAddress();
                if (!RedstoneOracleConstants.AUTHORIZED_SIGNER_ADDRESSES_BIGINT_SET.has(BigInt(signerAddress))) {
                    throw new Error(`Unauthorized signer address: ${signerAddress}`);
                }
                const dataServiceBySigner = getDataServiceIdForSigner(oracleStateWithSigners, signerAddress);
                if (dataServiceBySigner !== RedstoneOracleConstants.DATA_SERVICE_ID) {
                    throw new Error(`Invalid data service id for signer ${signerAddress}`);
                }

                const valueBytes = signedDataPackage.dataPackage.dataPoints[0]!.value;
                const valueAsBigNumber = BigInt(hexlify(valueBytes));

                medianPricesBuilder.addPrice(dataFeedId, valueAsBigNumber);
            }
        }

        // See requestRedstonePayload function from @redstone-finance/sdk
        // for reference
        const signedDataPackages = Object.values(signedDataPackagesResponse).flat() as SignedDataPackage[];
        const payload = new RedstonePayload(
            signedDataPackages,
            // unsignedMetadata (empty)
            '',
        );

        const payloadCell = createPayloadCell(payload.toBytesHexWithout0xPrefix());
        const medianPricesObj = medianPricesBuilder.build();
        const dataFeedIds = RedstoneOracleConstants.DATA_FEEDS as Ticker[];

        return {
            payload: payloadCell,
            medianPrices: {
                obj: medianPricesObj,
                // Sort according to DATA_FEEDS array
                arr: dataFeedIds.map((dataFeedId) => medianPricesObj[dataFeedId]),
            },
        };
    }
}
