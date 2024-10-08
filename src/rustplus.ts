/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplus-ts

*/

'use strict'

import WebSocket from 'ws';
import { EventEmitter } from 'events';

import * as rpi from './interfaces/rustplus';
import * as validation from './validation';

export enum EmitErrorType {
    WebSocket = 0,
    Callback = 1
}

export enum AppResponseError {
    /**
     * No error was found.
     */
    NoError = 0,
    /**
     * unknown occurences:
     * - unknown
     */
    Unknown = 1,
    /**
     * server_error occurences:
     * - If there was an error during the executing of request handler on server side.
     * - If CameraRendererManager instance is null.
     */
    ServerError = 2,
    /**
     * banned occurences:
     * - Trying to run any request while being Rust+ banned on the rust server.
     */
    Banned = 3,
    /**
     * rate_limit occurences:
     * - Too many requests too fast, tokens ran out.
     */
    RateLimit = 4,
    /**
     * not_found occurences:
     * - playerToken might be invalid, rust server might have reset Rust+ data.
     * - smart device can't be found.
     * - Trying to run promoteToLeader on someone that is not in the team.
     * - Trying to run cameraSubscribe on a cameraId that could not be found.
     */
    NotFound = 5,
    /**
     * wrong_type occurences:
     * - Trying to run setEntityValue on Alarm or StorageMonitor.
     * - Trying to run checkSubscription on Switch or StorageMonitor.
     * - Trying to run setSubscription on Switch or StorageMonitor.
     */
    WrongType = 6,
    /**
     * no_team occurences:
     * - Trying to run promoteToLeader when you're not in a team.
     * - Trying to run getTeamChat when you're not in a team.
     */
    NoTeam = 7,
    /**
     * no_clan occurences:
     * - Trying to run getClanInfo when you're not in a clan.
     * - Trying to run setClanMotd when you're not in a clan.
     * - Trying to run getClanChat when you're not in a clan.
     * - Trying to run sendClanMessage when you're not in a clan.
     */
    NoClan = 8,
    /**
     * no_map occurences:
     * - Trying to run getMap but imageData is null.
     */
    NoMap = 9,
    /**
     * no_camera occurences:
     * - Trying to run cameraInput when there is no camera subscribed to.
     */
    NoCamera = 10,
    /**
     * no_player occurences:
     * - Trying to run cameraSubscribe while player token is invalid or player caller dead.
     */
    NoPlayer = 11,
    /**
     * access_denied occurences:
     * - Trying to run cameraSubscribe with a cameraId but access was denied.
     * - Trying to run getNexusAuth but access was denied.
     * - Trying to run promoteToLeader when you're not the leader.
     */
    AccessDenied = 12,
    /**
     * player_online occurences:
     * - Trying to run cameraSubscribe when requester online.
     */
    PlayerOnline = 13,
    /**
     * invalid_playerid occurences:
     * - Trying to run getNexusAuth but playerid is invalid.
     */
    InvalidPlayerid = 14,
    /**
     * invalid_id occurences:
     * - Trying to run cameraSubscribe with a cameraId that is an empty string.
     */
    InvalidId = 15,
    /**
     * invalid_motd occurences:
     * - Trying to run setClanMotd but motd was invalid.
     */
    InvalidMotd = 16,
    /**
     * too_many_subscribers occurences:
     * - Trying to run setSubscription on a Alarm that have too many subscribers already.
     */
    TooManySubscribers = 17,
    /**
     * not_enabled occurences:
     * - Trying to run cameraInput when cameras are disabled on the rust server.
     * - Trying to run cameraSubscribe when cameras are disabled on the rust server.
     * - Trying to run cameraUnsubscribe when cameras are disabled on the rust server.
     */
    NotEnabled = 18,
    /**
     * message_not_sent occurences:
     * - Trying to run sendClanMessage but something went wrong on server side.
     * - Trying to run sendTeamMessage but something went wrong on server side.
     */
    MessageNotSent = 19
}

export interface RustPlusRequestTokens {
    connection: number;
    playerId: { [playerId: string]: number };
    serverPairing: number;
}

export enum ConsumeTokensError {
    NoError = 0,
    Unknown = 1,
    NotEnoughConnectionTokens = 2,
    NotEnoughPlayerIdTokens = 3,
    WaitReplenishTimeout = 4
}

function getAddress(useFacepunchProxy: boolean, ip: string, port: string): string {
    return useFacepunchProxy ? `wss://companion-rust.facepunch.com/game/${ip}/${port}` : `ws://${ip}:${port}`;
}

interface CallbackFunction { (appMessage: rpi.AppMessage): void; }

export class RustPlus extends EventEmitter {

    private static readonly MAX_REQUESTS_PER_IP_ADDRESS = 50;
    private static readonly REQUESTS_PER_IP_REPLENISH_RATE = 15; /* Tokens per second. */
    private static readonly MAX_REQUESTS_PER_PLAYER_ID = 25;
    private static readonly REQUESTS_PER_PLAYER_ID_REPLENISH_RATE = 3; /* Tokens per second. */
    private static readonly MAX_REQUESTS_FOR_SERVER_PAIRING = 5;
    private static readonly REQUESTS_FOR_SERVER_PAIRING_REPLENISH_RATE = 0.1; /* Tokens per second. */

    private static readonly REQUEST_GET_INFO_TOKEN_COST = 1;
    private static readonly REQUEST_GET_TIME_TOKEN_COST = 1;
    private static readonly REQUEST_GET_MAP_TOKEN_COST = 5;
    private static readonly REQUEST_GET_TEAM_INFO_TOKEN_COST = 1;
    private static readonly REQUEST_GET_TEAM_CHAT_TOKEN_COST = 1;
    private static readonly REQUEST_SEND_TEAM_MESSAGE_TOKEN_COST = 2;
    private static readonly REQUEST_GET_ENTITY_INFO_TOKEN_COST = 1;
    private static readonly REQUEST_SET_ENTITY_VALUE_TOKEN_COST = 1;
    private static readonly REQUEST_CHECK_SUBSCRIPTION_TOKEN_COST = 1;
    private static readonly REQUEST_SET_SUBSCRIPTION_TOKEN_COST = 1;
    private static readonly REQUEST_GET_MAP_MARKERS_TOKEN_COST = 1;
    private static readonly REQUEST_PROMOTE_TO_LEADER_TOKEN_COST = 1;
    private static readonly REQUEST_GET_CLAN_INFO_TOKEN_COST = 1;
    private static readonly REQUEST_SET_CLAN_MOTD_TOKEN_COST = 1;
    private static readonly REQUEST_GET_CLAN_CHAT_TOKEN_COST = 1;
    private static readonly REQUEST_SEND_CLAN_MESSAGE_TOKEN_COST = 2;
    private static readonly REQUEST_GET_NEXUS_AUTH_TOKEN_COST = 1;
    private static readonly REQUEST_CAMERA_SUBSCRIBE_TOKEN_COST = 1;
    private static readonly REQUEST_CAMERA_UNSUBSCRIBE_TOKEN_COST = 1;
    private static readonly REQUEST_CAMERA_INPUT_TOKEN_COST = 0.01;

    private static readonly REQUEST_GET_INFO_TIMEOUT_MS = 10000;
    private static readonly REQUEST_GET_TIME_TIMEOUT_MS = 10000;
    private static readonly REQUEST_GET_MAP_TIMEOUT_MS = 30000;
    private static readonly REQUEST_GET_TEAM_INFO_TIMEOUT_MS = 10000;
    private static readonly REQUEST_GET_TEAM_CHAT_TIMEOUT_MS = 10000;
    private static readonly REQUEST_SEND_TEAM_MESSAGE_TIMEOUT_MS = 10000;
    private static readonly REQUEST_GET_ENTITY_INFO_TIMEOUT_MS = 10000;
    private static readonly REQUEST_SET_ENTITY_VALUE_TIMEOUT_MS = 10000;
    private static readonly REQUEST_CHECK_SUBSCRIPTION_TIMEOUT_MS = 10000;
    private static readonly REQUEST_SET_SUBSCRIPTION_TIMEOUT_MS = 10000;
    private static readonly REQUEST_GET_MAP_MARKERS_TIMEOUT_MS = 10000;
    private static readonly REQUEST_PROMOTE_TO_LEADER_TIMEOUT_MS = 10000;
    private static readonly REQUEST_GET_CLAN_INFO_TIMEOUT_MS = 10000;
    private static readonly REQUEST_SET_CLAN_MOTD_TIMEOUT_MS = 10000;
    private static readonly REQUEST_GET_CLAN_CHAT_TIMEOUT_MS = 10000;
    private static readonly REQUEST_SEND_CLAN_MESSAGE_TIMEOUT_MS = 10000;
    private static readonly REQUEST_GET_NEXUS_AUTH_TIMEOUT_MS = 10000;
    private static readonly REQUEST_CAMERA_SUBSCRIBE_TIMEOUT_MS = 10000;
    private static readonly REQUEST_CAMERA_UNSUBSCRIBE_TIMEOUT_MS = 10000;
    private static readonly REQUEST_CAMERA_INPUT_TIMEOUT_MS = 10000;

    public ip: string;
    public port: string;
    private useFacepunchProxy: boolean;

    private seq: number;
    private seqCallbacks: CallbackFunction[];

    private ws: WebSocket | null;

    private tokens: RustPlusRequestTokens;
    private replenishInterval: NodeJS.Timeout | null;

    /**
     * @param {string} ip The ip address or hostname of the Rust Server.
     * @param {string} port The port of the Rust Server (app.port in server.cfg)
     * @param useFacepunchProxy True to use secure websocket via Facepunch's proxy, or false to directly connect
     *                          to Rust Server.
     *
     * Events emitted by the RustPlus class instance
     * - connecting: When we are connecting to the Rust Server.
     * - connected: When we are connected to the Rust Server.
     * - message: When an AppMessage has been received from the Rust Server.
     * - request: When an AppRequest has been sent to the Rust Server.
     * - disconnected: When we are disconnected from the Rust Server.
     * - error: When something goes wrong with the WebSocket, incoming message or the request callback function.
     */
    constructor(ip: string, port: string, useFacepunchProxy: boolean = false) {
        super();

        this.ip = ip;
        this.port = port;
        this.useFacepunchProxy = useFacepunchProxy;

        this.seq = 0;
        this.seqCallbacks = [];

        this.ws = null;

        this.tokens = {
            connection: RustPlus.MAX_REQUESTS_PER_IP_ADDRESS,
            playerId: {},
            serverPairing: RustPlus.MAX_REQUESTS_FOR_SERVER_PAIRING
        }
        this.replenishInterval = null;
    }

    /**
     * Function that replenish the connection, playerId and server pairing tokens.
     */
    private replenishTask() {
        this.replenishConnectionTokens();
        this.replenishPlayerIdTokens();
        this.replenishServerPairingTokens();
    }

    /**
     * Function that replenish the connection tokens.
     */
    private replenishConnectionTokens() {
        /* Replenish tokens for requests per ip. */
        if (this.tokens.connection < RustPlus.MAX_REQUESTS_PER_IP_ADDRESS) {
            this.tokens.connection = Math.min(
                this.tokens.connection + RustPlus.REQUESTS_PER_IP_REPLENISH_RATE,
                RustPlus.MAX_REQUESTS_PER_IP_ADDRESS);
        }
    }

    /**
     * Function that replenish the playerId tokens.
     */
    private replenishPlayerIdTokens() {
        /* Replenish tokens for requests per player id. */
        for (const playerId in this.tokens.playerId) {
            if (this.tokens.playerId[playerId] < RustPlus.MAX_REQUESTS_PER_PLAYER_ID) {
                this.tokens.playerId[playerId] = Math.min(
                    this.tokens.playerId[playerId] + RustPlus.REQUESTS_PER_PLAYER_ID_REPLENISH_RATE,
                    RustPlus.MAX_REQUESTS_PER_PLAYER_ID
                );
            }
        }
    }

    /**
     * Function that replenish the server pairing tokens.
     */
    private replenishServerPairingTokens() {
        /* Replenish tokens for requests for server pairing. */
        if (this.tokens.serverPairing < RustPlus.MAX_REQUESTS_FOR_SERVER_PAIRING) {
            this.tokens.serverPairing = Math.min(
                this.tokens.serverPairing + RustPlus.REQUESTS_FOR_SERVER_PAIRING_REPLENISH_RATE,
                RustPlus.MAX_REQUESTS_FOR_SERVER_PAIRING
            );
        }
    }

    /**
     * Consume tokens amount of tokens from connection and playerId.
     * @param {string} playerId - The steamId of the player consuming the tokens.
     * @param {number} tokens - The tokens to consume.
     * @param {boolean} waitForReplenish - If true, it will wait till there are available tokens to consume.
     * @param {number} timeoutMs - Timeout if tokens were not replenished in timeout milliseconds.
     * @returns {Promise<ConsumeTokensError>} Resolves with a `ConsumeTokensError` enum value indicating success or
     *                                        the type of error encountered.
     */
    private async consumeTokens(playerId: string, tokens: number, waitForReplenish: boolean,
        timeoutMs: number = 10000): Promise<ConsumeTokensError> {
        /* Check if playerId exists, if not, initialize with max tokens. */
        if (!(playerId in this.tokens.playerId)) {
            this.tokens.playerId[playerId] = RustPlus.MAX_REQUESTS_PER_PLAYER_ID;
        }

        const startTime = Date.now();

        /* Function to check whether there are enough tokens available from connection and playerId. */
        const hasEnoughTokens = () => {
            return this.tokens.connection >= tokens && this.tokens.playerId[playerId] >= tokens;
        };

        if (!waitForReplenish && !hasEnoughTokens()) {
            if (this.tokens.connection >= tokens) {
                return ConsumeTokensError.NotEnoughConnectionTokens;
            }
            else if (this.tokens.playerId[playerId] >= tokens) {
                return ConsumeTokensError.NotEnoughPlayerIdTokens;
            }
            else {
                return ConsumeTokensError.Unknown;
            }
        }

        /* Wait until there are enough tokens or the timeout is reached */
        while (!hasEnoughTokens()) {
            const elapsedTime = Date.now() - startTime;

            if (elapsedTime >= timeoutMs) {
                return ConsumeTokensError.WaitReplenishTimeout;
            }

            await this.delay(100);
        }

        this.tokens.connection -= tokens;
        this.tokens.playerId[playerId] -= tokens;

        return ConsumeTokensError.NoError;
    }

    /**
     * Delays the execution of the next operation by a specified number of milliseconds.
     *
     * @param {number} ms - The amount of time, in milliseconds, to delay the execution.
     *
     * @returns {Promise<void>} A promise that resolves after the specified delay.
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Retrieves the next available sequence number for a request.
     *
     * Increments the sequence number and ensures that it is unique by checking for any existing callbacks
     * associated with the current sequence number. If a callback exists, it continues to increment the
     * sequence until a unique number is found.
     *
     * @returns {number} The next available sequence number.
     */
    private getNextSeq(): number {
        let nextSeq = this.seq + 1;

        /* Find the next available sequence number. */
        while (this.seqCallbacks[nextSeq]) {
            nextSeq++;
        }

        this.seq = nextSeq;
        return nextSeq;
    }

    /**
     * Setup and connect to the Rust Server via WebSocket.
     * @returns {Promise<boolean>} Promise of True if successful, else false.
     */
    async connect(): Promise<boolean> {
        /* Make sure existing connection is closed before connecting again. */
        if (this.ws !== null) {
            this.disconnect();
        }

        this.emit('connecting');

        this.ws = new WebSocket(getAddress(this.useFacepunchProxy, this.ip, this.port));

        this.ws.on('open', () => { this.emit('connected'); });
        this.ws.on('close', () => { this.emit('disconnected'); });
        this.ws.on('error', (e) => { this.emit('error', EmitErrorType.WebSocket, e); });
        this.ws.on('message', (data: WebSocket.Data) => {
            try {
                if (!data) {
                    throw new Error('Received empty or invalid message data.');
                }

                let handled = false;
                const appMessage: rpi.AppMessage = rpi.AppMessage.fromBinary(data as any);

                if (appMessage.response && this.seqCallbacks[appMessage.response.seq]) {
                    const callback: CallbackFunction = this.seqCallbacks[appMessage.response.seq];

                    try {
                        callback(appMessage);
                        handled = true;
                    }
                    catch (callbackError) {
                        const errorMessage = callbackError instanceof Error ? callbackError.message : 'Unknown error';
                        this.emit('error', EmitErrorType.Callback, new Error(`ERROR on.message: ${errorMessage}`));
                    }
                    finally {
                        delete this.seqCallbacks[appMessage.response.seq];
                    }
                }

                this.emit('message', appMessage, handled);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                this.emit('error', EmitErrorType.Callback, new Error(`ERROR on.message: ${errorMessage}`));
            }
        });

        /* Start interval to replenish tokens every second. */
        this.replenishInterval = setInterval(() => this.replenishTask(), 1000);

        return true;
    }

    /**
     * Disconnect from the Rust Server and clear WebSocket variable.
     * @returns {boolean} True if successful, else false.
     */
    async disconnect(): Promise<boolean> {
        if (this.replenishInterval) {
            clearInterval(this.replenishInterval);
        }

        if (this.ws !== null) {
            this.ws.terminate();
            await this.delay(100);
            this.ws.removeAllListeners();
            this.ws = null;
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * Check if RustPlus is connected to the server.
     * @returns {boolean} True if connected, else false.
     */
    isConnected(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Sends a request to the Rust server with a specified callback that will be executed upon receiving a response.
     * The request is created using the `AppRequest` protocol, and it ensures that the WebSocket connection is open
     * before sending the request. The function also handles the sequence number for requests and stores the callback
     * for when the response arrives.
     *
     * @param {Omit<rpi.AppRequest, 'seq' | 'playerId' | 'playerToken'>} data - The data for the request,
     *                                                                               excluding the `seq`, `playerId`,
     *                                                                               and `playerToken`, which are
     *                                                                               provided separately.
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {CallbackFunction} callback - The callback function that will be executed when the server responds.
     * @param {number | null} [seq=null] - The sequence number for the request. If not provided, a new sequence number
     *                                     is generated.
     *
     * @returns {Error | void} Returns an `Error` if there was an issue sending the request or formatting the data.
     *                         Returns `void` if the request is successfully sent.
     */
    sendRequest(data: Omit<rpi.AppRequest, 'seq' | 'playerId' | 'playerToken'>, playerId: string,
        playerToken: number, callback: CallbackFunction, seq: number | null = null): Error | void {
        /* Is the WebSocket present? */
        if (this.ws === null || this.ws.readyState !== WebSocket.OPEN) {
            return new Error('ERROR sendRequest: WebSocket is not open.');
        }

        if (seq === null) {
            seq = this.getNextSeq();
        }

        /* Save callback function. */
        this.seqCallbacks[seq] = callback;

        /* Create AppRequest object. */
        let appRequestData: rpi.AppRequest;
        try {
            appRequestData = {
                seq: seq,
                playerId: playerId,
                playerToken: playerToken,
                ...data
            };

            if (!validation.isValidAppRequest(appRequestData)) {
                throw new Error('AppRequest data is invalid.');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            delete this.seqCallbacks[seq];
            return new Error(`ERROR sendRequest: ${errorMessage}`);
        }

        /* Convert AppRequest object to binary format. */
        let appRequest: Uint8Array;
        try {
            appRequest = rpi.AppRequest.toBinary(appRequestData);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            delete this.seqCallbacks[seq];
            return new Error(`ERROR sendRequest AppRequest.toBinary: ${errorMessage}`);
        }

        /* Send AppRequest packet to the rust server. */
        try {
            this.ws.send(appRequest);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            delete this.seqCallbacks[seq];
            return new Error(`ERROR sendRequest ws.send: ${errorMessage}`);
        }

        this.emit('request', appRequestData);
    }

    /**
     * Sends an asynchronous request to the Rust server and returns a Promise that resolves when a response is received
     * or rejects when a timeout is reached. The request is formatted using the `AppRequest` protocol, and the server's
     * response is handled within the promise. If no response is received within the provided timeout, an error is
     * returned.
     *
     * @param {Omit<rpi.AppRequest, 'seq' | 'playerId' | 'playerToken'>} data - The data for the request,
     *                                                                               excluding the `seq`, `playerId`,
     *                                                                               and `playerToken`, which are
     *                                                                               passed separately.
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {number} [timeoutMs=10000] - The timeout in milliseconds to wait for a response before returning an error.
     *
     * @returns {Promise<rpi.AppResponse | Error>} A Promise that resolves to the server's response if
     *                                                  successful, or an Error if the request times out or encounters
     *                                                  an issue.
     */
    sendRequestAsync(data: Omit<rpi.AppRequest, 'seq' | 'playerId' | 'playerToken'>, playerId: string,
        playerToken: number, timeoutMs: number = 10000): Promise<rpi.AppResponse | Error> {
        return new Promise<rpi.AppResponse | Error>((resolve) => {
            const seq = this.getNextSeq();

            const timeout = setTimeout(() => {
                delete this.seqCallbacks[seq];
                resolve(new Error('Timeout reached while waiting for response.'));
            }, timeoutMs);

            const result = this.sendRequest(data, playerId, playerToken, (appMessage: rpi.AppMessage) => {
                clearTimeout(timeout);

                try {
                    if (!validation.isValidAppMessage(appMessage)) {
                        throw new Error('appMessage is invalid format.');
                    }

                    if (!appMessage.response) {
                        throw new Error('appMessage is missing response.');
                    }

                    const response: rpi.AppResponse = appMessage.response;

                    if (response.error) {
                        resolve(response);
                    }
                    else {
                        resolve(response);
                    }
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    resolve(new Error(`ERROR sendRequestAsync: ${errorMessage}`));
                }
            }, seq);

            if (result instanceof Error) {
                clearTimeout(timeout);
                resolve(result);
            }
        });
    }

    /**
     * Translates an `AppResponse` error object into a corresponding `AppResponseError` enum value.
     * If the `appResponse` contains no error, it returns `AppResponseError.NoError`.
     * If the `appResponse.error` matches any known error string, the function maps it to the appropriate
     * `AppResponseError` enum. If no matching error string is found, it returns `AppResponseError.Unknown`.
     *
     * @param {rpi.AppResponse} appResponse - The response object from the Rust server which may contain an error.
     *
     * @returns {AppResponseError} The corresponding `AppResponseError` enum value based on the error string in the
     *                             `appResponse.error` object. Returns `AppResponseError.NoError` if no error is
     *                             present.
     */
    getAppResponseError(appResponse: rpi.AppResponse): AppResponseError {
        if (!appResponse.error) {
            return AppResponseError.NoError;
        }

        switch (appResponse.error.error) {
            case 'server_error': { return AppResponseError.ServerError; }
            case 'banned': { return AppResponseError.Banned; }
            case 'rate_limit': { return AppResponseError.RateLimit; }
            case 'not_found': { return AppResponseError.NotFound; }
            case 'wrong_type': { return AppResponseError.WrongType; }
            case 'no_team': { return AppResponseError.NoTeam; }
            case 'no_clan': { return AppResponseError.NoClan; }
            case 'no_map': { return AppResponseError.NoMap; }
            case 'no_camera': { return AppResponseError.NoCamera; }
            case 'no_player': { return AppResponseError.NoPlayer; }
            case 'access_denied': { return AppResponseError.AccessDenied; }
            case 'player_online': { return AppResponseError.PlayerOnline; }
            case 'invalid_playerid': { return AppResponseError.InvalidPlayerid; }
            case 'invalid_id': { return AppResponseError.InvalidId; }
            case 'invalid_motd': { return AppResponseError.InvalidMotd; }
            case 'too_many_subscribers': { return AppResponseError.TooManySubscribers; }
            case 'not_enabled': { return AppResponseError.NotEnabled; }
            case 'message_not_sent': { return AppResponseError.MessageNotSent; }
            default: { return AppResponseError.Unknown; }
        }
    }

    /**
     * Rust+ API requests.
     */

    /**
     * Get the server info (callback version).
     * Consumes tokens and then sends a request to retrieve server information.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async getInfo(playerId: string, playerToken: number, callback: CallbackFunction, waitForReplenish: boolean = true):
        Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_GET_INFO_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            getInfo: {}
        }, playerId, playerToken, callback);
    }

    /**
     * Get the server info (async version).
     * Consumes tokens and then sends a request to retrieve server information, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       server info (AppResponse), or an error if
     *                                                                       token consumption fails or there is an
     *                                                                       issue with the request.
     */
    async getInfoAsync(playerId: string, playerToken: number, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_GET_INFO_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_GET_INFO_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            getInfo: {}
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Get the server time (callback version).
     * Consumes tokens and then sends a request to retrieve server time.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async getTime(playerId: string, playerToken: number, callback: CallbackFunction, waitForReplenish: boolean = true):
        Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_GET_TIME_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            getTime: {}
        }, playerId, playerToken, callback);
    }

    /**
     * Get the server time (async version).
     * Consumes tokens and then sends a request to retrieve server time, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       server time (AppResponse), or an error if
     *                                                                       token consumption fails or there is an
     *                                                                       issue with the request.
     */
    async getTimeAsync(playerId: string, playerToken: number, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_GET_TIME_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_GET_TIME_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            getTime: {}
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Get the server map (callback version).
     * Consumes tokens and then sends a request to retrieve server map.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async getMap(playerId: string, playerToken: number, callback: CallbackFunction, waitForReplenish: boolean = true):
        Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_GET_MAP_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            getMap: {}
        }, playerId, playerToken, callback);
    }

    /**
     * Get the server map (async version).
     * Consumes tokens and then sends a request to retrieve server map, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       server map (AppResponse), or an error if
     *                                                                       token consumption fails or there is an
     *                                                                       issue with the request.
     */
    async getMapAsync(playerId: string, playerToken: number, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_GET_MAP_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_GET_MAP_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            getMap: {}
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Get the team info (callback version).
     * Consumes tokens and then sends a request to retrieve team information.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async getTeamInfo(playerId: string, playerToken: number, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_GET_TEAM_INFO_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            getTeamInfo: {}
        }, playerId, playerToken, callback);
    }

    /**
     * Get the team info (async version).
     * Consumes tokens and then sends a request to retrieve team information, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       team info (AppResponse), or an error if
     *                                                                       token consumption fails or there is an
     *                                                                       issue with the request.
     */
    async getTeamInfoAsync(playerId: string, playerToken: number, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_GET_TEAM_INFO_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_GET_TEAM_INFO_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            getTeamInfo: {}
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Get the team chat (callback version).
     * Consumes tokens and then sends a request to retrieve team chat.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async getTeamChat(playerId: string, playerToken: number, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_GET_TEAM_CHAT_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            getTeamChat: {}
        }, playerId, playerToken, callback);
    }

    /**
     * Get the team chat (async version).
     * Consumes tokens and then sends a request to retrieve team chat, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       team chat (AppResponse), or an error if
     *                                                                       token consumption fails or there is an
     *                                                                       issue with the request.
     */
    async getTeamChatAsync(playerId: string, playerToken: number, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_GET_TEAM_CHAT_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_GET_TEAM_CHAT_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            getTeamChat: {}
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Send a team message (callback version).
     * Consumes tokens and then sends a request to send team message.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {string} message - The message to be sent in the team chat.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async sendTeamMessage(playerId: string, playerToken: number, message: string, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_SEND_TEAM_MESSAGE_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            sendTeamMessage: {
                message: message
            }
        }, playerId, playerToken, callback);
    }

    /**
     * Send a team message (async version).
     * Consumes tokens and then sends a request to send team message, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {string} message - The message to be sent in the team chat.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       send team message (AppResponse), or an
     *                                                                       error if token consumption fails or there
     *                                                                       is an issue with the request.
     */
    async sendTeamMessageAsync(playerId: string, playerToken: number, message: string, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_SEND_TEAM_MESSAGE_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_SEND_TEAM_MESSAGE_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            sendTeamMessage: {
                message: message
            }
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Get entity info (callback version).
     * Consumes tokens and then sends a request to retrieve entity information.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {number} entityId - The ID of the entity to retrieve information about.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async getEntityInfo(playerId: string, playerToken: number, entityId: number, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_GET_ENTITY_INFO_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            entityId: entityId,
            getEntityInfo: {}
        }, playerId, playerToken, callback);
    }

    /**
     * Get entity info (async version).
     * Consumes tokens and then sends a request to retrieve entity information, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {number} entityId - The ID of the entity to retrieve information about.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       entity info (AppResponse), or an error if
     *                                                                       token consumption fails or there is an
     *                                                                       issue with the request.
     */
    async getEntityInfoAsync(playerId: string, playerToken: number, entityId: number, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_GET_ENTITY_INFO_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_GET_ENTITY_INFO_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            entityId: entityId,
            getEntityInfo: {}
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Set entity value (callback version).
     * Consumes tokens and then sends a request to set entity value.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {number} entityId - The ID of the entity to set the value for.
     * @param {boolean} value - The value to set for the entity.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async setEntityValue(playerId: string, playerToken: number, entityId: number, value: boolean,
        callback: CallbackFunction, waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_SET_ENTITY_VALUE_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            entityId: entityId,
            setEntityValue: {
                value: value
            }
        }, playerId, playerToken, callback);
    }

    /**
     * Set entity value (async version).
     * Consumes tokens and then sends a request to set entity value, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {number} entityId - The ID of the entity to set the value for.
     * @param {boolean} value - The value to set for the entity.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       set entity value (AppResponse), or an
     *                                                                       error if token consumption fails or there
     *                                                                       is an issue with the request.
     */
    async setEntityValueAsync(playerId: string, playerToken: number, entityId: number, value: boolean,
        waitForReplenish: boolean = true, timeoutMs: number = RustPlus.REQUEST_SET_ENTITY_VALUE_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_SET_ENTITY_VALUE_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            entityId: entityId,
            setEntityValue: {
                value: value
            }
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Check the subscription status of an entity (Alarm) (callback version).
     * Consumes tokens and then sends a request to check if an entity (Alarm) is subscribed.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {number} entityId - The ID of the entity (Alarm) to check subscription for.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async checkSubscription(playerId: string, playerToken: number, entityId: number, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_CHECK_SUBSCRIPTION_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            entityId: entityId,
            checkSubscription: {}
        }, playerId, playerToken, callback);
    }

    /**
     * Check the subscription status of an entity (Alarm) (async version).
     * Consumes tokens and then sends a request to check if an entity (Alarm) is subscribed, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {number} entityId - The ID of the entity (Alarm) to check subscription for.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       check subscription (AppResponse), or an
     *                                                                       error if token consumption fails or there
     *                                                                       is an issue with the request.
     */
    async checkSubscriptionAsync(playerId: string, playerToken: number, entityId: number,
        waitForReplenish: boolean = true, timeoutMs: number = RustPlus.REQUEST_CHECK_SUBSCRIPTION_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_CHECK_SUBSCRIPTION_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            entityId: entityId,
            checkSubscription: {}
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Set the subscription status of an entity (Alarm) (callback version).
     * Consumes tokens and then sends a request to set the subscription status for an entity.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {number} entityId - The ID of the entity (Alarm) to set the subscription status for.
     * @param {boolean} value - The value to set for the subscription.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async setSubscription(playerId: string, playerToken: number, entityId: number, value: boolean,
        callback: CallbackFunction, waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_SET_SUBSCRIPTION_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            entityId: entityId,
            setSubscription: {
                value: value
            }
        }, playerId, playerToken, callback);
    }

    /**
     * Set the subscription status of an entity (Alarm) (async version).
     * Consumes tokens and then sends a request to set the subscription status for an entity, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {number} entityId - The ID of the entity (Alarm) to set the subscription status for.
     * @param {boolean} value - The value to set for the subscription.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       set subscription (AppResponse), or an
     *                                                                       error if token consumption fails or there
     *                                                                       is an issue with the request.
     */
    async setSubscriptionAsync(playerId: string, playerToken: number, entityId: number, value: boolean,
        waitForReplenish: boolean = true, timeoutMs: number = RustPlus.REQUEST_SET_SUBSCRIPTION_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_SET_SUBSCRIPTION_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            entityId: entityId,
            setSubscription: {
                value: value
            }
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Get map markers (callback version).
     * Consumes tokens and then sends a request to retrieve server map markers.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async getMapMarkers(playerId: string, playerToken: number, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_GET_MAP_MARKERS_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            getMapMarkers: {}
        }, playerId, playerToken, callback);
    }

    /**
     * Get map markers (async version).
     * Consumes tokens and then sends a request to retrieve server map markers, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       server map markers (AppResponse), or an
     *                                                                       error if token consumption fails or there
     *                                                                       is an issue with the request.
     */
    async getMapMarkersAsync(playerId: string, playerToken: number, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_GET_MAP_MARKERS_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_GET_MAP_MARKERS_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            getMapMarkers: {}
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Promote a team member to leader (callback version).
     * Consumes tokens and then sends a request to promote a specified team member to leader.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {string} steamId - The steamId of the player to be promoted to leader.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async promoteToLeader(playerId: string, playerToken: number, steamId: string, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_PROMOTE_TO_LEADER_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            promoteToLeader: {
                steamId: steamId
            }
        }, playerId, playerToken, callback);
    }

    /**
     * Promote a team member to leader (async version).
     * Consumes tokens and then sends a request to promote a specified team member to leader, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {string} steamId - The steamId of the player to be promoted to leader.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       promote to leader (AppResponse), or an
     *                                                                       error if token consumption fails or there
     *                                                                       is an issue with the request.
     */
    async promoteToLeaderAsync(playerId: string, playerToken: number, steamId: string, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_PROMOTE_TO_LEADER_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_PROMOTE_TO_LEADER_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            promoteToLeader: {
                steamId: steamId
            }
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Get the clan info (callback version).
     * Consumes tokens and then sends a request to retrieve clan information.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async getClanInfo(playerId: string, playerToken: number, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_GET_CLAN_INFO_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            getClanInfo: {}
        }, playerId, playerToken, callback);
    }

    /**
     * Get the clan info (async version).
     * Consumes tokens and then sends a request to retrieve clan information, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       clan info (AppResponse), or an error if
     *                                                                       token consumption fails or there is an
     *                                                                       issue with the request.
     */
    async getClanInfoAsync(playerId: string, playerToken: number, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_GET_CLAN_INFO_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_GET_CLAN_INFO_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            getClanInfo: {}
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Set clan motd (callback version).
     * Consumes tokens and then sends a request to set clan motd.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {string} message - The message to be set as clan motd.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async setClanMotd(playerId: string, playerToken: number, message: string, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_SET_CLAN_MOTD_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            setClanMotd: {
                message: message
            }
        }, playerId, playerToken, callback);
    }

    /**
     * Set clan motd (async version).
     * Consumes tokens and then sends a request to set clan motd, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {string} message - The message to be set as clan motd.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       set clan motd (AppResponse), or an error
     *                                                                       if token consumption fails or there is an
     *                                                                       issue with the request.
     */
    async setClanMotdAsync(playerId: string, playerToken: number, message: string, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_SET_CLAN_MOTD_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_SET_CLAN_MOTD_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            setClanMotd: {
                message: message
            }
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Get the clan chat (callback version).
     * Consumes tokens and then sends a request to retrieve clan chat.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async getClanChat(playerId: string, playerToken: number, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_GET_CLAN_CHAT_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            getClanChat: {}
        }, playerId, playerToken, callback);
    }

    /**
     * Get the clan chat (async version).
     * Consumes tokens and then sends a request to retrieve clan chat, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       clan chat (AppResponse), or an error if
     *                                                                       token consumption fails or there is an
     *                                                                       issue with the request.
     */
    async getClanChatAsync(playerId: string, playerToken: number, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_GET_CLAN_CHAT_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_GET_CLAN_CHAT_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            getClanChat: {}
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Send a clan message (callback version).
     * Consumes tokens and then sends a request to send clan message.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {string} message - The message to be sent in the clan chat.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async sendClanMessage(playerId: string, playerToken: number, message: string, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_SEND_CLAN_MESSAGE_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            sendClanMessage: {
                message: message
            }
        }, playerId, playerToken, callback);
    }

    /**
     * Send a clan message (async version).
     * Consumes tokens and then sends a request to send clan message, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {string} message - The message to be sent in the clan chat.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       send clan message (AppResponse), or an
     *                                                                       error if token consumption fails or there
     *                                                                       is an issue with the request.
     */
    async sendClanMessageAsync(playerId: string, playerToken: number, message: string, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_SEND_CLAN_MESSAGE_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_SEND_CLAN_MESSAGE_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            sendClanMessage: {
                message: message
            }
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Get nexus authentication (callback version).
     * Consumes tokens and then sends a request to get nexus authentication.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {string} appKey - The application key used to request Nexus authentication.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async getNexusAuth(playerId: string, playerToken: number, appKey: string, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_GET_NEXUS_AUTH_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            getNexusAuth: {
                appKey: appKey
            }
        }, playerId, playerToken, callback);
    }

    /**
     * Get nexus authentication (async version).
     * Consumes tokens and then sends a request to get nexus authentication, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {string} appKey - The application key used to request Nexus authentication.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       nexus authentication (AppResponse), or an
     *                                                                       error if token consumption fails or there
     *                                                                       is an issue with the request.
     */
    async getNexusAuthAsync(playerId: string, playerToken: number, appKey: string, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_GET_NEXUS_AUTH_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_GET_NEXUS_AUTH_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            getNexusAuth: {
                appKey: appKey
            }
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Subscribe to a camera (callback version).
     * Consumes tokens and then sends a request to subscribe to a camera.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {string} identifier - The camera identifier, such as OILRIG1 or a custom name.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async cameraSubscribe(playerId: string, playerToken: number, identifier: string, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_CAMERA_SUBSCRIBE_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            cameraSubscribe: {
                cameraId: identifier
            }
        }, playerId, playerToken, callback);
    }

    /**
     * Subscribe to a camera (async version).
     * Consumes tokens and then sends a request to subscribe to a camera, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {string} identifier - The camera identifier, such as OILRIG1 or a custom name.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       camera subscribe (AppResponse), or an
     *                                                                       error if token consumption fails or there
     *                                                                       is an issue with the request.
     */
    async cameraSubscribeAsync(playerId: string, playerToken: number, identifier: string,
        waitForReplenish: boolean = true, timeoutMs: number = RustPlus.REQUEST_CAMERA_SUBSCRIBE_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_CAMERA_SUBSCRIBE_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            cameraSubscribe: {
                cameraId: identifier
            }
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Unsubscribe from a camera (callback version).
     * Consumes tokens and then sends a request to unsubscribe from a camera.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async cameraUnsubscribe(playerId: string, playerToken: number, callback: CallbackFunction,
        waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_CAMERA_UNSUBSCRIBE_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            cameraUnsubscribe: {}
        }, playerId, playerToken, callback);
    }

    /**
     * Unsubscribe from a camera (async version).
     * Consumes tokens and then sends a request to unsubscribe from a camera, returning a promise.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       camera unsubscribe (AppResponse), or an
     *                                                                       error if token consumption fails or there
     *                                                                       is an issue with the request.
     */
    async cameraUnsubscribeAsync(playerId: string, playerToken: number, waitForReplenish: boolean = true,
        timeoutMs: number = RustPlus.REQUEST_CAMERA_UNSUBSCRIBE_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_CAMERA_UNSUBSCRIBE_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            cameraUnsubscribe: {}
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }

    /**
     * Send camera input to the server (mouse movement) (callback version).
     * Consumes tokens and then sends a request to send camera input to the server.
     * This function sends the current state of mouse buttons and the delta of mouse movement to the server.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {number} buttons - The buttons that are currently pressed.
     * @param {number} x - The x delta of the mouse movement.
     * @param {number} y - The y delta of the mouse movement.
     * @param {CallbackFunction} callback - The callback function that will be executed when a response is received.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     *
     * @returns {Promise<ConsumeTokensError | Error | void>} Returns an error if token consumption fails or if there is
     *                                                       an issue sending the request, otherwise returns void.
     */
    async cameraInput(playerId: string, playerToken: number, buttons: number, x: number, y: number,
        callback: CallbackFunction, waitForReplenish: boolean = true): Promise<ConsumeTokensError | Error | void> {
        const tokenCost = RustPlus.REQUEST_CAMERA_INPUT_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        return this.sendRequest({
            cameraInput: {
                buttons: buttons,
                mouseDelta: {
                    x: x,
                    y: y
                }
            }
        }, playerId, playerToken, callback);
    }

    /**
     * Send camera input to the server (mouse movement) (async version).
     * Consumes tokens and then sends a request to send camera input to the server, returning a promise.
     * This function sends the current state of mouse buttons and the delta of mouse movement to the server.
     *
     * @param {string} playerId - The steamId of the player making the request.
     * @param {number} playerToken - The authentication token of the player making the request.
     * @param {number} buttons - The buttons that are currently pressed.
     * @param {number} x - The x delta of the mouse movement.
     * @param {number} y - The y delta of the mouse movement.
     * @param {boolean} [waitForReplenish=true] - If true, wait until tokens are available before proceeding with the
     *                                            request.
     * @param {number} [timeoutMs=10000] - Time (in milliseconds) to wait for a response before timing out.
     *
     * @returns {Promise<ConsumeTokensError | Error | rpi.AppResponse>} Returns a promise that resolves to the
     *                                                                       camera input (AppResponse), or an error if
     *                                                                       token consumption fails or there is an
     *                                                                       issue with the request.
     */
    async cameraInputAsync(playerId: string, playerToken: number, buttons: number, x: number, y: number,
        waitForReplenish: boolean = true, timeoutMs: number = RustPlus.REQUEST_CAMERA_INPUT_TIMEOUT_MS):
        Promise<rpi.AppResponse | Error | ConsumeTokensError> {
        const tokenCost = RustPlus.REQUEST_CAMERA_INPUT_TOKEN_COST;
        const result = await this.consumeTokens(playerId, tokenCost, waitForReplenish);
        if (result !== ConsumeTokensError.NoError) return result;

        const appResponse = await this.sendRequestAsync({
            cameraInput: {
                buttons: buttons,
                mouseDelta: {
                    x: x,
                    y: y
                }
            }
        }, playerId, playerToken, timeoutMs);

        if (validation.isValidAppResponse(appResponse)) {
            return appResponse as rpi.AppResponse;
        }
        else {
            return appResponse as Error;
        }
    }
}