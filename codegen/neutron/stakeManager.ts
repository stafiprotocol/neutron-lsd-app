import { CosmWasmClient, SigningCosmWasmClient, ExecuteResult, InstantiateResult } from "@cosmjs/cosmwasm-stargate"; 
import { StdFee } from "@cosmjs/amino";
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
export type Uint8 = number;
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
export type Uint1281 = string;
/**
 * Binary is a wrapper around Vec<u8> to add base64 de/serialization with serde. It also adds some helper methods to help encode inline.
 *
 * This is only needed as serde-json-{core,wasm} has a horrible encoding for Vec<u8>. See also <https://github.com/CosmWasm/cosmwasm/blob/main/docs/MESSAGE_TYPES.md>.
 */
export type Binary = string;
/**
 * Describes possible interchain query types
 */
export type QueryType = "kv" | "tx";
export type ArrayOfString = string[];
export type EraStatus =
  | "register_ended"
  | "init_started"
  | "init_failed"
  | "era_update_started"
  | "era_update_ended"
  | "era_stake_started"
  | "era_stake_ended"
  | "withdraw_started"
  | "withdraw_ended"
  | "era_restake_started"
  | "era_restake_ended"
  | "active_ended";
export type ValidatorUpdateStatus = "start" | "wait_query_update" | "end";
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
export type Uint1282 = string;
export type Uint64 = number;
export type WithdrawStatus = "default" | "pending";
export type ArrayOfUnstakeInfo = UnstakeInfo[];
export type String = string;
/**
 * A fixed-point decimal value with 18 fractional digits, i.e. Decimal(1_000_000_000_000_000_000) == 1.0
 *
 * The greatest possible value that can be represented is 340282366920938463463.374607431768211455 (which is (2^128 - 1) / 10^18)
 */
export type Decimal = string;
export type QueryKind = "balances" | "delegations" | "validators";

export interface StakeManagerSchema {
  responses:
    | BalanceResponse
    | Uint8
    | DelegatorDelegationsResponse
    | Uint1281
    | EraSnapshot
    | QueryRegisteredQueryResponse
    | QueryRegisteredQueryResponse1
    | QueryInterchainAccountAddressResponse
    | IcaInfos
    | ArrayOfString
    | PoolInfo
    | QueryIds
    | Stack
    | Uint1282
    | Uint64
    | ArrayOfUnstakeInfo
    | String
    | ValidatorResponse;
  query:
    | GetRegisteredQueryArgs
    | GetIcaRegisteredQueryArgs
    | BalanceArgs
    | DelegationsArgs
    | ValidatorsArgs
    | PoolInfoArgs
    | TotalStackFeeArgs
    | EraSnapshotArgs
    | InterchainAccountAddressArgs
    | InterchainAccountAddressFromContractArgs
    | UserUnstakeArgs
    | UserUnstakeIndexArgs
    | EraRateArgs
    | UnbondingSecondsArgs
    | DecimalsArgs
    | QueryIdsArgs
    | InterchainAccountIdFromCreatorArgs;
  execute:
    | RegisterPoolArgs
    | InitPoolArgs
    | ConfigPoolArgs
    | ConfigStackArgs
    | ConfigPoolStackFeeArgs
    | ConfigUnbondingSecondsArgs
    | ConfigDecimalsArgs
    | OpenChannelArgs
    | RedeemTokenForShareArgs
    | StakeArgs
    | UnstakeArgs
    | WithdrawArgs
    | PoolRmValidatorArgs
    | PoolAddValidatorArgs
    | PoolUpdateValidatorArgs
    | PoolUpdateValidatorsIcqArgs
    | EraUpdateArgs
    | EraStakeArgs
    | EraCollectWithdrawArgs
    | EraRestakeArgs
    | EraActiveArgs
    | StakeLsmArgs
    | UpdateIcqUpdatePeriodArgs;
  instantiate?: InstantiateMsg;
  [k: string]: unknown;
}
export interface BalanceResponse {
  balances: Balances;
  last_submitted_local_height: number;
  [k: string]: unknown;
}
/**
 * A structure that can be reconstructed from **StorageValues**'s for the **Balance Interchain Query**. Contains coins that are held by some account on remote chain.
 */
export interface Balances {
  coins: Coin[];
  [k: string]: unknown;
}
export interface Coin {
  amount: Uint128;
  denom: string;
  [k: string]: unknown;
}
export interface DelegatorDelegationsResponse {
  delegations: Delegation[];
  last_submitted_local_height: number;
  [k: string]: unknown;
}
/**
 * Delegation is basic (cheap to query) data about a delegation.
 *
 * Instances are created in the querier.
 */
export interface Delegation {
  /**
   * How much we have locked in the delegation
   */
  amount: Coin;
  delegator: Addr;
  /**
   * A validator address (e.g. cosmosvaloper1...)
   */
  validator: string;
  [k: string]: unknown;
}
export interface EraSnapshot {
  active: Uint128;
  bond: Uint128;
  era: number;
  last_step_height: number;
  restake_amount: Uint128;
  unbond: Uint128;
}
export interface QueryRegisteredQueryResponse {
  /**
   * *registered_query** is a registered query
   */
  registered_query: RegisteredQuery;
  [k: string]: unknown;
}
export interface RegisteredQuery {
  /**
   * The IBC connection ID for getting ConsensusState to verify proofs.
   */
  connection_id: string;
  /**
   * Amount of coins deposited for the query.
   */
  deposit?: Coin[];
  /**
   * The unique id of the registered query.
   */
  id: number;
  /**
   * The KV-storage keys for which we want to get values from remote chain
   */
  keys: KVKey[];
  /**
   * The local chain last block height when the query result was updated.
   */
  last_submitted_result_local_height?: number;
  /**
   * The remote chain last block height when the query result was updated.
   */
  last_submitted_result_remote_height?: Height;
  /**
   * The address that registered the query.
   */
  owner: string;
  /**
   * The query type identifier (i.e. 'kv' or 'tx' for now)
   */
  query_type: QueryType;
  /**
   * The local chain height when the query was registered.
   */
  registered_at_height?: number;
  /**
   * Timeout before query becomes available for everybody to remove.
   */
  submit_timeout?: number;
  /**
   * The filter for transaction search ICQ
   */
  transactions_filter: string;
  /**
   * Parameter that defines how often the query must be updated.
   */
  update_period: number;
  [k: string]: unknown;
}
/**
 * Describes a KV key for which you want to get value from the storage on remote chain
 */
export interface KVKey {
  /**
   * *key** is a key you want to read from the storage
   */
  key: Binary;
  /**
   * *path** is a path to the storage (storage prefix) where you want to read value by key (usually name of cosmos-packages module: 'staking', 'bank', etc.)
   */
  path: string;
  [k: string]: unknown;
}
export interface Height {
  /**
   * *height** is a height of remote chain
   */
  revision_height?: number;
  /**
   * the revision that the client is currently on
   */
  revision_number?: number;
  [k: string]: unknown;
}
export interface QueryRegisteredQueryResponse1 {
  /**
   * *registered_query** is a registered query
   */
  registered_query: RegisteredQuery;
  [k: string]: unknown;
}
export interface QueryInterchainAccountAddressResponse {
  /**
   * *interchain_account_address** is a interchain account address on the remote chain
   */
  interchain_account_address: string;
  [k: string]: unknown;
}
export interface IcaInfos {
  admin: Addr;
  pool_address_ica_info: IcaInfo;
  withdraw_address_ica_info: IcaInfo;
}
export interface IcaInfo {
  ctrl_channel_id: string;
  ctrl_connection_id: string;
  ctrl_port_id: string;
  host_channel_id: string;
  host_connection_id: string;
  ica_addr: string;
}
export interface PoolInfo {
  active: Uint128;
  admin: Addr;
  bond: Uint128;
  channel_id_of_ibc_denom: string;
  era: number;
  era_seconds: number;
  era_snapshot: EraSnapshot1;
  ibc_denom: string;
  ica_id: string;
  lsd_token: Addr;
  lsm_pending_limit: number;
  lsm_support: boolean;
  minimal_stake: Uint128;
  next_unstake_index: number;
  offset: number;
  paused: boolean;
  platform_fee_commission: Uint128;
  platform_fee_receiver: Addr;
  rate: Uint128;
  rate_change_limit: Uint128;
  redeemming_share_token_denom: string[];
  remote_denom: string;
  share_tokens: Coin[];
  stack_fee_commission: Uint128;
  status: EraStatus;
  total_lsd_token_amount: Uint128;
  total_platform_fee: Uint128;
  unbond: Uint128;
  unbond_commission: Uint128;
  unbonding_period: number;
  unstake_times_limit: number;
  validator_addrs: string[];
  validator_update_status: ValidatorUpdateStatus;
}
export interface EraSnapshot1 {
  active: Uint128;
  bond: Uint128;
  era: number;
  last_step_height: number;
  restake_amount: Uint128;
  unbond: Uint128;
}
export interface QueryIds {
  pool_balance_query_id: number;
  pool_delegations_query_id: number;
  pool_validators_query_id: number;
  withdraw_balance_query_id: number;
}
export interface Stack {
  admin: Addr;
  entrusted_pools: string[];
  lsd_token_code_id: number;
  stack_fee_commission: Uint128;
  stack_fee_receiver: Addr;
}
export interface UnstakeInfo {
  amount: Uint128;
  era: number;
  index: number;
  pool_addr: string;
  status: WithdrawStatus;
  unstaker: string;
}
export interface ValidatorResponse {
  last_submitted_local_height: number;
  validator: StakingValidator;
  [k: string]: unknown;
}
/**
 * A structure that can be reconstructed from **StorageValues**'s for the **Staking Validator Interchain Query**. Contains validator info from remote chain.
 */
export interface StakingValidator {
  validators: Validator[];
  [k: string]: unknown;
}
/**
 * Validator structure for the querier. Contains validator from staking module
 */
export interface Validator {
  /**
   * consensus_pubkey is the consensus public key of the validator, as a Protobuf Any.
   */
  consensus_pubkey?: number[] | null;
  /**
   * delegator_shares defines total shares issued to a validator's delegators.
   */
  delegator_shares: string;
  /**
   * details define other optional details.
   */
  details?: string | null;
  /**
   * identity defines an optional identity signature (ex. UPort or Keybase).
   */
  identity?: string | null;
  /**
   * jailed defined whether the validator has been jailed from bonded status or not.
   */
  jailed: boolean;
  /**
   * max_change_rate defines the maximum daily increase of the validator commission, as a fraction.
   */
  max_change_rate?: Decimal | null;
  /**
   * max_rate defines the maximum commission rate which validator can ever charge, as a fraction.
   */
  max_rate?: Decimal | null;
  /**
   * min_self_delegation is the validator's self declared minimum self delegation.
   */
  min_self_delegation: Decimal;
  /**
   * moniker defines a human-readable name for the validator.
   */
  moniker?: string | null;
  operator_address: string;
  /**
   * rate is the commission rate charged to delegators, as a fraction.
   */
  rate?: Decimal | null;
  /**
   * security_contact defines an optional email for security contact.
   */
  security_contact?: string | null;
  /**
   * status is the validator status (bonded/unbonding/unbonded).
   */
  status: number;
  /**
   * tokens define the delegated tokens (incl. self-delegation).
   */
  tokens: string;
  /**
   * unbonding_height defines, if unbonding, the height at which this validator has begun unbonding.
   */
  unbonding_height: number;
  /**
   * unbonding_time defines, if unbonding, the min time for the validator to complete unbonding.
   */
  unbonding_time?: number | null;
  /**
   * update_time is the last time the commission rate was changed.
   */
  update_time?: number | null;
  /**
   * website defines an optional website link.
   */
  website?: string | null;
  [k: string]: unknown;
}
export interface GetRegisteredQueryArgs {
  query_id: number;
}
export interface GetIcaRegisteredQueryArgs {
  ica_addr: string;
  query_kind: QueryKind;
}
export interface BalanceArgs {
  ica_addr: string;
}
export interface DelegationsArgs {
  pool_addr: string;
}
export interface ValidatorsArgs {
  pool_addr: string;
}
export interface PoolInfoArgs {
  pool_addr: string;
}
export interface TotalStackFeeArgs {
  pool_addr: string;
}
export interface EraSnapshotArgs {
  pool_addr: string;
}
export interface InterchainAccountAddressArgs {
  connection_id: string;
  interchain_account_id: string;
}
export interface InterchainAccountAddressFromContractArgs {
  interchain_account_id: string;
}
export interface UserUnstakeArgs {
  pool_addr: string;
  user_neutron_addr: Addr;
}
export interface UserUnstakeIndexArgs {
  pool_addr: string;
  user_neutron_addr: Addr;
}
export interface EraRateArgs {
  era: number;
  pool_addr: string;
}
export interface UnbondingSecondsArgs {
  remote_denom: string;
}
export interface DecimalsArgs {
  remote_denom: string;
}
export interface QueryIdsArgs {
  pool_addr: string;
}
export interface InterchainAccountIdFromCreatorArgs {
  addr: Addr;
}
export interface RegisterPoolArgs {
  connection_id: string;
  interchain_account_id: string;
}
export interface InitPoolArgs {
  type?: "object";
  required?: [
    "channel_id_of_ibc_denom",
    "ibc_denom",
    "interchain_account_id",
    "lsd_token_name",
    "lsd_token_symbol",
    "minimal_stake",
    "platform_fee_receiver",
    "remote_denom",
    "validator_addrs"
  ];
  properties?: {
    [k: string]: unknown;
  };
  additionalProperties?: never;
}
export interface ConfigPoolArgs {
  type?: "object";
  required?: ["pool_addr"];
  properties?: {
    [k: string]: unknown;
  };
  additionalProperties?: never;
}
export interface ConfigStackArgs {
  type?: "object";
  properties?: {
    [k: string]: unknown;
  };
  additionalProperties?: never;
  required?: [];
}
export interface ConfigPoolStackFeeArgs {
  type?: "object";
  required?: ["pool_addr", "stack_fee_commission"];
  properties?: {
    [k: string]: unknown;
  };
  additionalProperties?: never;
}
export interface ConfigUnbondingSecondsArgs {
  remote_denom: string;
  unbonding_seconds?: number | null;
}
export interface ConfigDecimalsArgs {
  decimals?: number | null;
  remote_denom: string;
}
export interface OpenChannelArgs {
  closed_channel_id: string;
  pool_addr: string;
}
export interface RedeemTokenForShareArgs {
  pool_addr: string;
  tokens: Coin[];
}
export interface StakeArgs {
  neutron_address: string;
  pool_addr: string;
}
export interface UnstakeArgs {
  amount: Uint128;
  pool_addr: string;
}
export interface WithdrawArgs {
  pool_addr: string;
  receiver: Addr;
  unstake_index_list: number[];
}
export interface PoolRmValidatorArgs {
  pool_addr: string;
  validator_addr: string;
}
export interface PoolAddValidatorArgs {
  pool_addr: string;
  validator_addr: string;
}
export interface PoolUpdateValidatorArgs {
  new_validator: string;
  old_validator: string;
  pool_addr: string;
}
export interface PoolUpdateValidatorsIcqArgs {
  pool_addr: string;
}
export interface EraUpdateArgs {
  pool_addr: string;
}
export interface EraStakeArgs {
  pool_addr: string;
}
export interface EraCollectWithdrawArgs {
  pool_addr: string;
}
export interface EraRestakeArgs {
  pool_addr: string;
}
export interface EraActiveArgs {
  pool_addr: string;
}
export interface StakeLsmArgs {
  neutron_address: string;
  pool_addr: string;
}
export interface UpdateIcqUpdatePeriodArgs {
  pool_addr: string;
}
export interface InstantiateMsg {
  lsd_token_code_id: number;
  stack_fee_receiver: Addr;
}


function isSigningCosmWasmClient(
  client: CosmWasmClient | SigningCosmWasmClient
): client is SigningCosmWasmClient {
  return 'execute' in client;
}

export class Client {
  private readonly client: CosmWasmClient | SigningCosmWasmClient;
  contractAddress: string;
  constructor(client: CosmWasmClient | SigningCosmWasmClient, contractAddress: string) {
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
    fees: StdFee | 'auto' | number,
    initCoins?: readonly Coin[],
  ): Promise<InstantiateResult> {
    const res = await client.instantiate(sender, codeId, initMsg, label, fees, {
      ...(initCoins && initCoins.length && { funds: initCoins }),
    });
    return res;
  }
  static async instantiate2(
    client: SigningCosmWasmClient,
    sender: string,
    codeId: number,
    salt: number,
    initMsg: InstantiateMsg,
    label: string,
    fees: StdFee | 'auto' | number,
    initCoins?: readonly Coin[],
  ): Promise<InstantiateResult> {
    const res = await client.instantiate2(sender, codeId, new Uint8Array([salt]), initMsg, label, fees, {
      ...(initCoins && initCoins.length && { funds: initCoins }),
    });
    return res;
  }
  queryGetRegisteredQuery = async(args: GetRegisteredQueryArgs): Promise<QueryRegisteredQueryResponse> => {
    return this.client.queryContractSmart(this.contractAddress, { get_registered_query: args });
  }
  queryGetIcaRegisteredQuery = async(args: GetIcaRegisteredQueryArgs): Promise<QueryRegisteredQueryResponse> => {
    return this.client.queryContractSmart(this.contractAddress, { get_ica_registered_query: args });
  }
  queryBalance = async(args: BalanceArgs): Promise<BalanceResponse> => {
    return this.client.queryContractSmart(this.contractAddress, { balance: args });
  }
  queryDelegations = async(args: DelegationsArgs): Promise<DelegatorDelegationsResponse> => {
    return this.client.queryContractSmart(this.contractAddress, { delegations: args });
  }
  queryValidators = async(args: ValidatorsArgs): Promise<ValidatorResponse> => {
    return this.client.queryContractSmart(this.contractAddress, { validators: args });
  }
  queryPoolInfo = async(args: PoolInfoArgs): Promise<PoolInfo> => {
    return this.client.queryContractSmart(this.contractAddress, { pool_info: args });
  }
  queryStackInfo = async(): Promise<Stack> => {
    return this.client.queryContractSmart(this.contractAddress, { stack_info: {} });
  }
  queryTotalStackFee = async(args: TotalStackFeeArgs): Promise<Uint128> => {
    return this.client.queryContractSmart(this.contractAddress, { total_stack_fee: args });
  }
  queryEraSnapshot = async(args: EraSnapshotArgs): Promise<EraSnapshot> => {
    return this.client.queryContractSmart(this.contractAddress, { era_snapshot: args });
  }
  queryInterchainAccountAddress = async(args: InterchainAccountAddressArgs): Promise<QueryInterchainAccountAddressResponse> => {
    return this.client.queryContractSmart(this.contractAddress, { interchain_account_address: args });
  }
  queryInterchainAccountAddressFromContract = async(args: InterchainAccountAddressFromContractArgs): Promise<IcaInfos> => {
    return this.client.queryContractSmart(this.contractAddress, { interchain_account_address_from_contract: args });
  }
  queryUserUnstake = async(args: UserUnstakeArgs): Promise<ArrayOfUnstakeInfo> => {
    return this.client.queryContractSmart(this.contractAddress, { user_unstake: args });
  }
  queryUserUnstakeIndex = async(args: UserUnstakeIndexArgs): Promise<String> => {
    return this.client.queryContractSmart(this.contractAddress, { user_unstake_index: args });
  }
  queryEraRate = async(args: EraRateArgs): Promise<Uint128> => {
    return this.client.queryContractSmart(this.contractAddress, { era_rate: args });
  }
  queryUnbondingSeconds = async(args: UnbondingSecondsArgs): Promise<Uint64> => {
    return this.client.queryContractSmart(this.contractAddress, { unbonding_seconds: args });
  }
  queryDecimals = async(args: DecimalsArgs): Promise<Uint8> => {
    return this.client.queryContractSmart(this.contractAddress, { decimals: args });
  }
  queryQueryIds = async(args: QueryIdsArgs): Promise<QueryIds> => {
    return this.client.queryContractSmart(this.contractAddress, { query_ids: args });
  }
  queryInterchainAccountIdFromCreator = async(args: InterchainAccountIdFromCreatorArgs): Promise<ArrayOfString> => {
    return this.client.queryContractSmart(this.contractAddress, { interchain_account_id_from_creator: args });
  }
  registerPool = async(sender:string, args: RegisterPoolArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { register_pool: args }, fee || "auto", memo, funds);
  }
  initPool = async(sender:string, args: InitPoolArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { init_pool: args }, fee || "auto", memo, funds);
  }
  configPool = async(sender:string, args: ConfigPoolArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { config_pool: args }, fee || "auto", memo, funds);
  }
  configStack = async(sender:string, args: ConfigStackArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { config_stack: args }, fee || "auto", memo, funds);
  }
  configPoolStackFee = async(sender:string, args: ConfigPoolStackFeeArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { config_pool_stack_fee: args }, fee || "auto", memo, funds);
  }
  configUnbondingSeconds = async(sender:string, args: ConfigUnbondingSecondsArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { config_unbonding_seconds: args }, fee || "auto", memo, funds);
  }
  configDecimals = async(sender:string, args: ConfigDecimalsArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { config_decimals: args }, fee || "auto", memo, funds);
  }
  openChannel = async(sender:string, args: OpenChannelArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { open_channel: args }, fee || "auto", memo, funds);
  }
  redeemTokenForShare = async(sender:string, args: RedeemTokenForShareArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { redeem_token_for_share: args }, fee || "auto", memo, funds);
  }
  stake = async(sender:string, args: StakeArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { stake: args }, fee || "auto", memo, funds);
  }
  unstake = async(sender:string, args: UnstakeArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { unstake: args }, fee || "auto", memo, funds);
  }
  withdraw = async(sender:string, args: WithdrawArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { withdraw: args }, fee || "auto", memo, funds);
  }
  poolRmValidator = async(sender:string, args: PoolRmValidatorArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { pool_rm_validator: args }, fee || "auto", memo, funds);
  }
  poolAddValidator = async(sender:string, args: PoolAddValidatorArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { pool_add_validator: args }, fee || "auto", memo, funds);
  }
  poolUpdateValidator = async(sender:string, args: PoolUpdateValidatorArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { pool_update_validator: args }, fee || "auto", memo, funds);
  }
  poolUpdateValidatorsIcq = async(sender:string, args: PoolUpdateValidatorsIcqArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { pool_update_validators_icq: args }, fee || "auto", memo, funds);
  }
  eraUpdate = async(sender:string, args: EraUpdateArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { era_update: args }, fee || "auto", memo, funds);
  }
  eraStake = async(sender:string, args: EraStakeArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { era_stake: args }, fee || "auto", memo, funds);
  }
  eraCollectWithdraw = async(sender:string, args: EraCollectWithdrawArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { era_collect_withdraw: args }, fee || "auto", memo, funds);
  }
  eraRestake = async(sender:string, args: EraRestakeArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { era_restake: args }, fee || "auto", memo, funds);
  }
  eraActive = async(sender:string, args: EraActiveArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { era_active: args }, fee || "auto", memo, funds);
  }
  stakeLsm = async(sender:string, args: StakeLsmArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { stake_lsm: args }, fee || "auto", memo, funds);
  }
  updateIcqUpdatePeriod = async(sender:string, args: UpdateIcqUpdatePeriodArgs, fee?: number | StdFee | "auto", memo?: string, funds?: Coin[]): Promise<ExecuteResult> =>  {
          if (!isSigningCosmWasmClient(this.client)) { throw this.mustBeSigningClient(); }
    return this.client.execute(sender, this.contractAddress, { update_icq_update_period: args }, fee || "auto", memo, funds);
  }
}
