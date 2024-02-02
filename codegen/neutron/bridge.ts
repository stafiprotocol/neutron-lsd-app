import {
  CosmWasmClient,
  SigningCosmWasmClient,
  ExecuteResult,
  InstantiateResult,
} from "@cosmjs/cosmwasm-stargate";
import { StdFee } from "@cosmjs/amino";
import { Coin } from "@cosmjs/amino";
/**
 * A human readable address.
 *
 * In Cosmos, this is typically bech32 encoded. But for multi-chain smart contracts no assumptions should be made other than being UTF-8 encoded and of reasonable length.
 *
 * This type represents a validated address. It can be created in the following ways 1. Use `Addr::unchecked(input)` 2. Use `let checked: Addr = deps.api.addr_validate(input)?` 3. Use `let checked: Addr = deps.api.addr_humanize(canonical_addr)?` 4. Deserialize from JSON. This must only be done from JSON that was validated before such as a contract's state. `Addr` must not be used in messages sent by the user because this would result in unvalidated instances.
 *
 * This type is immutable. If you really need to mutate it (Really? Are you sure?), create a mutable copy using `let mut mutable = Addr::to_string()` and operate on that `String` instance.
 */

export interface InstantiateMsg {
  admin: Addr;
  lsd_token: Addr;
  relayers: Addr[];
  threshold: number;
}
/**
 * A human readable address.
 *
 * In Cosmos, this is typically bech32 encoded. But for multi-chain smart contracts no assumptions should be made other than being UTF-8 encoded and of reasonable length.
 *
 * This type represents a validated address. It can be created in the following ways 1. Use `Addr::unchecked(input)` 2. Use `let checked: Addr = deps.api.addr_validate(input)?` 3. Use `let checked: Addr = deps.api.addr_humanize(canonical_addr)?` 4. Deserialize from JSON. This must only be done from JSON that was validated before such as a contract's state. `Addr` must not be used in messages sent by the user because this would result in unvalidated instances.
 *
 * This type is immutable. If you really need to mutate it (Really? Are you sure?), create a mutable copy using `let mut mutable = Addr::to_string()` and operate on that `String` instance.
 */
export type Addr = string;
/**
 * A thin wrapper around u128 that is using strings for JSON encoding/decoding, such that the full u128 range can be used for clients that convert JSON numbers to floats, like JavaScript and jq.
 *
 * # Examples
 *
 * Use `from` to create instances of this and `u128` to get the value out:
 *
 * ``` # use cosmwasm_std::Uint128; let a = Uint128::from(123u128); assert_eq!(a.u128(), 123);
 *
 * let b = Uint128::from(42u64); assert_eq!(b.u128(), 42);
 *
 * let c = Uint128::from(70u32); assert_eq!(c.u128(), 70); ```
 */
export type Uint128 = string;

export interface BridgeSchema {
  responses: BridgeInfo | Proposal;
  query: ProposalArgs;
  execute:
    | VoteProposalArgs
    | AddRelayerArgs
    | RemoveRelayerArgs
    | ChangeThresholdArgs
    | TransferAdminArgs;
  [k: string]: unknown;
}
export interface BridgeInfo {
  admin: Addr;
  lsd_token: Addr;
  relayers: Addr[];
  threshold: number;
}
export interface Proposal {
  amount: Uint128;
  chain_id: number;
  deposit_nonce: number;
  executed: boolean;
  recipient: Addr;
  voters: Addr[];
}
export interface ProposalArgs {
  amount: Uint128;
  chain_id: number;
  deposit_nonce: number;
  recipient: Addr;
}
export interface VoteProposalArgs {
  amount: Uint128;
  chain_id: number;
  deposit_nonce: number;
  recipient: Addr;
}
export interface AddRelayerArgs {
  relayer: Addr;
}
export interface RemoveRelayerArgs {
  relayer: Addr;
}
export interface ChangeThresholdArgs {
  threshold: number;
}
export interface TransferAdminArgs {
  new_admin: string;
}

function isSigningCosmWasmClient(
  client: CosmWasmClient | SigningCosmWasmClient
): client is SigningCosmWasmClient {
  return "execute" in client;
}

export class Client {
  private readonly client: CosmWasmClient | SigningCosmWasmClient;
  contractAddress: string;
  constructor(
    client: CosmWasmClient | SigningCosmWasmClient,
    contractAddress: string
  ) {
    this.client = client;
    this.contractAddress = contractAddress;
  }
  mustBeSigningClient() {
    return new Error("This client is not a SigningCosmWasmClient");
  }
  static async instantiate(
    client: SigningCosmWasmClient,
    sender: string,
    codeId: number,
    initMsg: InstantiateMsg,
    label: string,
    initCoins?: readonly Coin[],
    fees?: StdFee | "auto" | number
  ): Promise<InstantiateResult> {
    const res = await client.instantiate(
      sender,
      codeId,
      initMsg,
      label,
      fees || "auto",
      {
        ...(initCoins && initCoins.length && { funds: initCoins }),
      }
    );
    return res;
  }
  queryBridgeInfo = async (): Promise<BridgeInfo> => {
    return this.client.queryContractSmart(this.contractAddress, {
      bridge_info: {},
    });
  };
  queryProposal = async (args: ProposalArgs): Promise<Proposal> => {
    return this.client.queryContractSmart(this.contractAddress, {
      proposal: args,
    });
  };
  voteProposal = async (
    sender: string,
    args: VoteProposalArgs,
    fee?: number | StdFee | "auto",
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    if (!isSigningCosmWasmClient(this.client)) {
      throw this.mustBeSigningClient();
    }
    return this.client.execute(
      sender,
      this.contractAddress,
      { vote_proposal: args },
      fee || "auto",
      memo,
      funds
    );
  };
  addRelayer = async (
    sender: string,
    args: AddRelayerArgs,
    fee?: number | StdFee | "auto",
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    if (!isSigningCosmWasmClient(this.client)) {
      throw this.mustBeSigningClient();
    }
    return this.client.execute(
      sender,
      this.contractAddress,
      { add_relayer: args },
      fee || "auto",
      memo,
      funds
    );
  };
  removeRelayer = async (
    sender: string,
    args: RemoveRelayerArgs,
    fee?: number | StdFee | "auto",
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    if (!isSigningCosmWasmClient(this.client)) {
      throw this.mustBeSigningClient();
    }
    return this.client.execute(
      sender,
      this.contractAddress,
      { remove_relayer: args },
      fee || "auto",
      memo,
      funds
    );
  };
  changeThreshold = async (
    sender: string,
    args: ChangeThresholdArgs,
    fee?: number | StdFee | "auto",
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    if (!isSigningCosmWasmClient(this.client)) {
      throw this.mustBeSigningClient();
    }
    return this.client.execute(
      sender,
      this.contractAddress,
      { change_threshold: args },
      fee || "auto",
      memo,
      funds
    );
  };
  transferAdmin = async (
    sender: string,
    args: TransferAdminArgs,
    fee?: number | StdFee | "auto",
    memo?: string,
    funds?: Coin[]
  ): Promise<ExecuteResult> => {
    if (!isSigningCosmWasmClient(this.client)) {
      throw this.mustBeSigningClient();
    }
    return this.client.execute(
      sender,
      this.contractAddress,
      { transfer_admin: args },
      fee || "auto",
      memo,
      funds
    );
  };
}
