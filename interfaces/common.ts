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
  lsdTokenName?: string;
  decimals: number;
  bech32Config: any;
  gasPriceStep?: any;
  currencies?: [];
  explorerUrl: string;
  defaultApr?: string;
  isNativeKeplrChain?: boolean;
  stakeDisabled?: boolean;
  stakeReserveAmount?: number;
  gasLimit?: string;
  stakeIbcChannel?: string;
}

export interface LsmBalanceItem {
  validatorAddr: string;
  recordId: string;
  balance: Coin;
}

export interface LsmSendItem {
  recordId: string;
  validator: string;
  amount: string;
}
