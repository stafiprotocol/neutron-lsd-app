export interface NavigationItem {
  name: string;
  path?: string;
}

export interface Coin {
  denom: string;
  amount: string;
}

export interface CosmosAccount {
  name: string;
  bech32Address: string;
  isNanoLedger: boolean;
  allBalances?: Coin[];
}

export type CosmosAccountMap = { [key: string]: CosmosAccount | null };

export interface ChainConfig {
  chainId: string;
  chainName: string;
  displayHubName: string;
  rpc: string;
  restEndpoint: string;
  denom: string;
  coinDenom: string;
  decimals: number;
  bech32Config: any;
  gasPriceStep?: any;
  currencies?: [];
  explorerUrl: string;
  defaultApy?: string;
  isNativeKeplrChain?: boolean;
  stakeDisabled?: boolean;
  stakeReserveAmount?: number;
  gasLimit?: string;
  stakeIbcChannel?: string;
}
