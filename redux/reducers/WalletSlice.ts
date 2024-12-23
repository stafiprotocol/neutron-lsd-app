import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { lsdTokenChainConfig, neutronChainConfig } from "config/chain";
import { WALLET_NOT_INSTALLED_MESSAGE } from "constants/common";
import { ChainConfig, CosmosAccountMap } from "interfaces/common";
import { isKeplrInstalled } from "utils/commonUtils";
import { _connectKeplr } from "utils/cosmosUtils";
import snackbarUtil from "utils/snackbarUtils";
import {
  clearCosmosNetworkAllowedFlag,
  isCosmosNetworkAllowed,
} from "utils/storageUtils";
import { AppThunk } from "../store";
import { bridgeTargetsChainConfig } from "config/bridge";

export interface WalletState {
  cosmosAccounts: CosmosAccountMap;
}

const initialState: WalletState = {
  cosmosAccounts: {},
};

export const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setCosmosAccounts: (
      state: WalletState,
      action: PayloadAction<CosmosAccountMap>
    ) => {
      state.cosmosAccounts = action.payload;
    },
  },
});

export const { setCosmosAccounts } = walletSlice.actions;

export default walletSlice.reducer;

export const updateCosmosAccounts =
  (accountMap: CosmosAccountMap): AppThunk =>
  async (dispatch, getState) => {
    const newAccounts = {
      ...getState().wallet.cosmosAccounts,
      ...accountMap,
    };
    // console.log({ newAccounts });
    dispatch(setCosmosAccounts(newAccounts));
  };

/**
 * Auto connect keplr.
 */
export const autoConnectKeplrChains =
  (): AppThunk => async (dispatch, getState) => {
    const allowedChains: ChainConfig[] = [];

    if (isCosmosNetworkAllowed(neutronChainConfig.chainId)) {
      allowedChains.push(neutronChainConfig);
    }
    if (isCosmosNetworkAllowed(lsdTokenChainConfig.chainId)) {
      allowedChains.push(lsdTokenChainConfig);
    }

    if (allowedChains.length === 0) {
      return;
    }
    dispatch(connectKeplrAccount(allowedChains));
  };

/**
 * Connect to Keplr extension.
 */
export const connectKeplrAccount =
  (chainConfigs: ChainConfig[]): AppThunk =>
  async (dispatch, getState) => {
    if (chainConfigs.length === 0) {
      return;
    }
    if (!isKeplrInstalled()) {
      snackbarUtil.error(WALLET_NOT_INSTALLED_MESSAGE);
      return;
    }

    const requests = chainConfigs.map((chainConfig) => {
      return _connectKeplr(chainConfig);
    });

    const results = await Promise.all(requests);

    const newAccounts: CosmosAccountMap = {};
    results
      .filter((item) => !!item)
      .forEach((account, index) => {
        newAccounts[chainConfigs[index].chainId] = account;
      });

    dispatch(updateCosmosAccounts(newAccounts));
  };

/**
 * disconnect from wallet
 */
export const disconnectWallet =
  (chainId: string): AppThunk =>
  async (dispatch, getState) => {
    if (!chainId) {
      return;
    }

    dispatch(updateCosmosAccounts({ [chainId]: null }));
    clearCosmosNetworkAllowedFlag(chainId);
  };
