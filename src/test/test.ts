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

import * as fs from 'fs';
import * as dotenv from 'dotenv';

import * as rustplus from '../index';

dotenv.config();

const ip = process.env.RUST_SERVER_IP_ADDRESS as string;
const port = process.env.RUST_SERVER_PORT as string;

const teamMember1SteamId = process.env.TEAM_MEMBER_1_STEAM_ID as string;
const teamMember1Token = parseInt(process.env.TEAM_MEMBER_1_TOKEN as string, 10);

const teamMember2SteamId = process.env.TEAM_MEMBER_2_STEAM_ID as string;
const teamMember2Token = parseInt(process.env.TEAM_MEMBER_2_TOKEN as string, 10);

const smartSwitch0 = parseInt(process.env.SMART_SWITCH_0 as string, 10);
const smartSwitch1 = parseInt(process.env.SMART_SWITCH_1 as string, 10);
const smartSwitch2 = parseInt(process.env.SMART_SWITCH_2 as string, 10);

const smartAlarm0 = parseInt(process.env.SMART_ALARM_0 as string, 10);
const smartAlarm1 = parseInt(process.env.SMART_ALARM_1 as string, 10);
const smartAlarm2 = parseInt(process.env.SMART_ALARM_2 as string, 10);

const storageMonitor0 = parseInt(process.env.STORAGE_MONITOR_0 as string, 10); // Tool Cupboard
const storageMonitor1 = parseInt(process.env.STORAGE_MONITOR_1 as string, 10); // Vending Machine
const storageMonitor2 = parseInt(process.env.STORAGE_MONITOR_2 as string, 10); // Large Wood Box

const camera1 = process.env.CAM1 as string; // Regular camera
const camera2 = process.env.CAM2 as string; // PTZ camera
const drone1 = process.env.DRONE1 as string;
const turret1 = process.env.TURRET1 as string;

let printMessage = true;
let printRequest = true;


function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run_test_functions() {
    const rp = new rustplus.RustPlus(ip, port)

    rp.on('connecting', async () => {
        console.log('EVENT connecting');
    });

    rp.on('connected', async () => {
        console.log('EVENT connected');

        printMessage = false;
        printRequest = false;
        //await test_callback_api_functions(rp);
        //await test_async_api_functions(rp);
        //await test_camera_module(rp);
        printMessage = true;
        printRequest = true;

        await rp.disconnect()
        await delay(5000)
        await rp.connect()
    });

    rp.on('message', async (appMessage: rustplus.AppMessage, handled: boolean) => {
        if (printMessage) {
            console.log(`EVENT message: ${JSON.stringify(appMessage)}, handled: ${handled}`);
        }
    });

    rp.on('request', async (appRequest: rustplus.AppRequest) => {
        if (printRequest) {
            console.log(`EVENT request: ${JSON.stringify(appRequest)}`);
        }
    });

    rp.on('disconnected', async () => {
        console.log('EVENT disconnected');
    });

    rp.on('error', async (errorType: rustplus.EmitErrorType, error: any) => {
        console.log(`EVENT error: Type: ${errorType}, Error: ${error.message}, Code: ${error.code}`);
    });

    await rp.connect()
}

async function test_callback_api_functions(rp: rustplus.RustPlus) {
    //rp.getInfo('76561198114074446', token, (appInfo: rustplus.AppMessage) => {
    //    console.log(JSON.stringify(appInfo))
    //});
}

async function test_async_api_functions(rp: rustplus.RustPlus) {
    let response: rustplus.AppResponse | Error | rustplus.ConsumeTokensError;
    response = await rp.getInfoAsync(teamMember1SteamId, teamMember1Token);
    validateAsyncResponse(rp, 'getInfoAsync', response);
    console.log('getInfoAsync: OK');
    await delay(500);

    response = await rp.getTimeAsync(teamMember1SteamId, teamMember1Token);
    validateAsyncResponse(rp, 'getTimeAsync', response);
    console.log('getTimeAsync: OK');
    await delay(500);

    response = await rp.getMapAsync(teamMember1SteamId, teamMember1Token);
    validateAsyncResponse(rp, 'getMapAsync', response);
    console.log('getMapAsync: OK');
    await delay(500);

    response = await rp.getTeamInfoAsync(teamMember1SteamId, teamMember1Token);
    validateAsyncResponse(rp, 'getTeamInfoAsync', response);
    console.log('getTeamInfoAsync: OK');
    await delay(500);

    response = await rp.getTeamChatAsync(teamMember1SteamId, teamMember1Token);
    validateAsyncResponse(rp, 'getTeamChatAsync', response);
    console.log('getTeamChatAsync: OK');
    await delay(500);

    response = await rp.sendTeamMessageAsync(teamMember1SteamId, teamMember1Token, 'Test Message');
    validateAsyncResponse(rp, 'sendTeamMessageAsync', response);
    console.log('sendTeamMessageAsync: OK');
    await delay(500);

    response = await rp.getEntityInfoAsync(teamMember1SteamId, teamMember1Token, smartSwitch0);
    validateAsyncResponse(rp, 'getEntityInfoAsync', response);
    console.log('getEntityInfoAsync: OK');
    await delay(500);

    response = await rp.setEntityValueAsync(teamMember1SteamId, teamMember1Token, smartSwitch0, false);
    validateAsyncResponse(rp, 'setEntityValueAsync', response);
    console.log('setEntityValueAsync: OK');
    await delay(500);

    response = await rp.checkSubscriptionAsync(teamMember1SteamId, teamMember1Token, smartAlarm0);
    validateAsyncResponse(rp, 'checkSubscriptionAsync', response);
    console.log('checkSubscriptionAsync: OK');
    await delay(500);

    response = await rp.setSubscriptionAsync(teamMember1SteamId, teamMember1Token, smartAlarm0, false);
    validateAsyncResponse(rp, 'setSubscriptionAsync', response);
    console.log('setSubscriptionAsync: OK');
    await delay(500);

    response = await rp.getMapMarkersAsync(teamMember1SteamId, teamMember1Token);
    validateAsyncResponse(rp, 'getMapMarkersAsync', response);
    console.log('getMapMarkersAsync: OK');
    await delay(500);

    response = await rp.promoteToLeaderAsync(teamMember1SteamId, teamMember1Token, teamMember1SteamId);
    validateAsyncResponse(rp, 'promoteToLeaderAsync', response);
    console.log('promoteToLeaderAsync: OK');
    await delay(500);

    /* Not implemented yet. */
    response = await rp.getClanInfoAsync(teamMember1SteamId, teamMember1Token);
    validateAsyncResponse(rp, 'getClanInfoAsync', response, rustplus.AppResponseError.NoClan);
    console.log('getClanInfoAsync: OK');
    await delay(500);

    /* Not implemented yet. */
    response = await rp.setClanMotdAsync(teamMember1SteamId, teamMember1Token, 'Test Motd');
    validateAsyncResponse(rp, 'setClanMotdAsync', response, rustplus.AppResponseError.NoClan);
    console.log('setClanMotdAsync: OK');
    await delay(500);

    /* Not implemented yet. */
    response = await rp.getClanChatAsync(teamMember1SteamId, teamMember1Token);
    validateAsyncResponse(rp, 'getClanChatAsync', response, rustplus.AppResponseError.NoClan);
    console.log('getClanChatdAsync: OK');
    await delay(500);

    /* Not implemented yet. */
    response = await rp.sendClanMessageAsync(teamMember1SteamId, teamMember1Token, 'Test Message');
    validateAsyncResponse(rp, 'sendClanMessageAsync', response, rustplus.AppResponseError.NoClan);
    console.log('sendClanMessageAsync: OK');
    await delay(500);

    /* Not implemented yet. */
    //response = await rp.getNexusAuthAsync(teamMember1SteamId, teamMember1Token, 'Test Application Key');
    //validateAsyncResponse(rp, 'getNexusAuthAsync', response)//, rustplus.AppResponseError.NoClan);
    //console.log('getNexusAuthAsync: OK');
    //await delay(500);

    response = await rp.cameraSubscribeAsync(teamMember2SteamId, teamMember2Token, 'Test1');
    validateAsyncResponse(rp, 'cameraSubscribeAsync', response);
    console.log('cameraSubscribeAsync: OK');
    await delay(500);

    response = await rp.cameraUnsubscribeAsync(teamMember2SteamId, teamMember2Token);
    validateAsyncResponse(rp, 'cameraUnsubscribeAsync', response);
    console.log('cameraUnsubscribeAsync: OK');
    await delay(500);

    response = await rp.cameraSubscribeAsync(teamMember2SteamId, teamMember2Token, 'TestDrone1');
    validateAsyncResponse(rp, 'cameraSubscribeAsync', response);
    console.log('cameraSubscribeAsync: OK');
    await delay(500);

    response = await rp.cameraInputAsync(teamMember2SteamId, teamMember2Token, 0, 10, 10);
    validateAsyncResponse(rp, 'cameraInputAsync', response);
    console.log('cameraInputAsync: OK');
    await delay(500);
}

async function test_camera_module(rp: rustplus.RustPlus) {
    const camera = new rustplus.Camera(rp);

    camera.on('render', async (frame) => {
        /* Save camera frame to disk. */
        fs.writeFileSync(`camera.png`, frame);

        await camera.unsubscribe();
    });

    await camera.subscribe(teamMember1SteamId, teamMember1Token, 'CAM2');
    await delay(5000);
}

function validateAsyncResponse(rp: rustplus.RustPlus, funcString: string,
    response: rustplus.AppResponse | Error | rustplus.ConsumeTokensError,
    allowedResponseError: rustplus.AppResponseError | null = null) {
    if (response instanceof Error) {
        console.error(`${funcString}: NOK, ${response.message}`);
        rp.disconnect()
        process.exit(1);
    }

    if (rustplus.isValidConsumeTokensError(response) && response !== rustplus.ConsumeTokensError.NoError) {
        console.error(`${funcString}: NOK, ConsumeTokensError: ${response}`);
        rp.disconnect()
        process.exit(1);
    }

    if (rustplus.isValidAppResponse(response)) {
        if (allowedResponseError !== null && rp.getAppResponseError(response) === allowedResponseError) {
            return;
        }
        else if (rp.getAppResponseError(response) !== rustplus.AppResponseError.NoError) {
            console.error(`${funcString}: NOK, AppResponseError: ${rp.getAppResponseError(response)}`);
            rp.disconnect()
            process.exit(1);
        }
    }
    else {
        console.error(`${funcString}: NOK, Unknown error.`);
        rp.disconnect()
        process.exit(1);
    }
}

run_test_functions();