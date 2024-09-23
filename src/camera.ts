/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

    This program is free software = you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https =//www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplus-ts

*/

'use strict'

import { EventEmitter } from 'events';
import * as jimp from 'jimp';

import * as rpi from './interfaces/rustplus';
import * as rp from './rustplus';
import * as validation from './validation';

/**
 * The buttons that can be sent to the server.
 */
export enum Buttons {
    NONE = 0,
    FORWARD = 2,
    BACKWARD = 4,
    LEFT = 8,
    RIGHT = 16,
    JUMP = 32,
    DUCK = 64,
    SPRINT = 128,
    USE = 256,
    FIRE_PRIMARY = 1024,
    FIRE_SECONDARY = 2048,
    RELOAD = 8192,
    FIRE_THIRD = 134217728
}

/**
 * The control flags that can be sent to the server.
 * - CCTV Camera:       0, NONE
 * - PTZ CCTV Camera:   10, NONE, MOUSE, FIRE
 * - Drone:             7, NONE, MOVEMENT, MOUSE, SPRINT_AND_DUCK
 * - Auto Turret:       58, NONE, MOUSE, FIRE, RELOAD, CROSSHAIR
 */
export enum ControlFlags {
    NONE = 0,
    MOVEMENT = 1,
    MOUSE = 2,
    SPRINT_AND_DUCK = 4,
    FIRE = 8,
    RELOAD = 16,
    CROSSHAIR = 32
}

export enum CameraType {
    UNKNOWN = 0,
    CCTV_CAMERA = 1,
    PTZ_CCTV_CAMERA = 2,
    DRONE = 3,
    AUTO_TURRET = 4
}

export function getCameraType(controlFlags: number): CameraType {
    switch (controlFlags) {
        case 0: {
            return CameraType.CCTV_CAMERA;
        }
        case 10: {
            return CameraType.PTZ_CCTV_CAMERA;
        }
        case 7: {
            return CameraType.DRONE;
        }
        case 58: {
            return CameraType.AUTO_TURRET;
        }
        default: {
            return CameraType.UNKNOWN;
        }
    }
}

export class Camera extends EventEmitter {

    private rustplus: rp.RustPlus;
    private identifier: string;
    private cameraType: CameraType;
    private playerId: string;
    private playerToken: number;
    private isSubscribed: boolean;

    private cameraRays: rpi.AppCameraRays[];
    private cameraSubscribeInfo: rpi.AppCameraInfo | null;

    /**
     * @param {rp.RustPlus} rustplus An existing RustPlus instance.
     *
     * Events emitted by the Camera class instance
     * - subscribing: When we are subscribing to a Camera.
     * - subscribed: When we are subscribed to a Camera.
     * - unsubscribing: When we are unsubscribing from the Camera.
     * - unsubscribed: When we are unsubscribed from the Camera.
     * - render: When a camera frame has been rendered. A png image buffer will be provided.
     */
    constructor(rustplus: rp.RustPlus) {
        super();

        this.rustplus = rustplus;
        this.identifier = '';
        this.playerId = '';
        this.playerToken = 0;
        this.isSubscribed = false;

        this.cameraRays = [];
        this.cameraSubscribeInfo = null;
        this.cameraType = CameraType.UNKNOWN;

        this.rustplus.on('message', async (appMessage: rpi.AppMessage, handled: boolean) => {
            if (this.isSubscribed && appMessage.broadcast && appMessage.broadcast.cameraRays) {
                /* Add new camera rays to cache. */
                this.cameraRays.push(appMessage.broadcast.cameraRays);

                if (this.cameraRays.length > 10) {
                    /* Remove oldest camera rays. */
                    this.cameraRays.shift();

                    /* Render to png. */
                    const image = await this.renderCameraFrame();

                    this.emit('render', image);
                }
            }
        });

        this.rustplus.on('disconnected', async () => {
            if (this.isSubscribed) {
                await this.unsubscribe();
            }
        });
    }

    /**
     * Render a camera frame to a PNG image buffer.
     * @returns {Promise<Buffer>} Returns a promise that resolves to Buffer.
     */
    private async renderCameraFrame(): Promise<Buffer> {
        const frames = this.cameraRays;
        const width = (this.cameraSubscribeInfo as rpi.AppCameraInfo).width;
        const height = (this.cameraSubscribeInfo as rpi.AppCameraInfo).height;

        /* First we populate the samplePositionBuffer with the positions of each sample. */
        const samplePositionBuffer = new Int16Array(width * height * 2);
        for (let y = 0, index = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                samplePositionBuffer[index++] = x;
                samplePositionBuffer[index++] = y;
            }
        }

        const indexGenerator = new IndexGenerator(1337);
        for (let R = width * height - 1; R >= 1; R--) {
            const C = 2 * R;
            const I = 2 * indexGenerator.nextInt(R + 1);

            const P = samplePositionBuffer[C];
            const k = samplePositionBuffer[C + 1];
            const A = samplePositionBuffer[I];
            const F = samplePositionBuffer[I + 1];

            samplePositionBuffer[I] = P;
            samplePositionBuffer[I + 1] = k;
            samplePositionBuffer[C] = A;
            samplePositionBuffer[C + 1] = F;
        }

        /* Create the output buffer. */
        const output = new Array(width * height);

        /* Loop through each frame */
        for (const frame of frames) {
            /* Reset some look back and pointer variables. */
            let sampleOffset = 2 * frame.sampleOffset;
            let dataPointer = 0;
            const rayLookback = new Array(64);
            for (let r = 0; r < 64; r++) {
                rayLookback[r] = [0, 0, 0];
            }

            const rayData = frame.rayData;

            /* Loop through the ray data. */
            while (true) {
                if (dataPointer >= rayData.length - 1) {
                    break;
                }

                /* Get the first byte and set some variables. */
                let t, r, i;
                const n = rayData[dataPointer++];

                /* Ray Decoding Logic. */
                if (255 === n) {
                    const l = rayData[dataPointer++];
                    const o = rayData[dataPointer++];
                    const s = rayData[dataPointer++];
                    const u = (3 * (((t = (l << 2) | (o >> 6)) / 128) | 0) + 5 *
                        (((r = 63 & o) / 16) | 0) + 7 * (i = s)) & 63;
                    let f = rayLookback[u];

                    f[0] = t;
                    f[1] = r;
                    f[2] = i;
                }
                else {
                    const c = 192 & n;

                    if (0 === c) {
                        const h = 63 & n;
                        const y = rayLookback[h];
                        t = y[0];
                        r = y[1];
                        i = y[2];
                    }
                    else if (64 === c) {
                        const p = 63 & n;
                        const v = rayLookback[p];
                        const b = v[0];
                        const w = v[1];
                        const h = v[2];
                        const g = rayData[dataPointer++];
                        t = b + ((g >> 3) - 15);
                        r = w + ((7 & g) - 3);
                        i = h;
                    }
                    else if (128 === c) {
                        const R = 63 & n;
                        const C = rayLookback[R];
                        const I = C[0];
                        const P = C[1];
                        const k = C[2];
                        t = I + (rayData[dataPointer++] - 127);
                        r = P;
                        i = k;
                    }
                    else {
                        const A = rayData[dataPointer++];
                        const F = rayData[dataPointer++];
                        const D = (3 * (((t = (A << 2) | (F >> 6)) / 128) | 0) + 5 *
                            (((r = 63 & F) / 16) | 0) + 7 * (i = 63 & n)) & 63;
                        let E = rayLookback[D];
                        E[0] = t;
                        E[1] = r;
                        E[2] = i;
                    }
                }

                sampleOffset %= 2 * width * height;
                const index = samplePositionBuffer[sampleOffset++] + samplePositionBuffer[sampleOffset++] * width;
                output[index] = [t / 1023, r / 63, i];
            }
        }

        const colours = [
            [0.5, 0.5, 0.5], [0.8, 0.7, 0.7], [0.3, 0.7, 1], [0.6, 0.6, 0.6],
            [0.7, 0.7, 0.7], [0.8, 0.6, 0.4], [1, 0.4, 0.4], [1, 0.1, 0.1],
        ];

        const image = new jimp.Jimp({ width: width, height: height });

        for (let i = 0; i < output.length; i++) {
            const ray = output[i];
            if (!ray) {
                continue;
            }

            const distance = ray[0]
            const alignment = ray[1]
            const material = ray[2]

            let target_colour;

            if (distance === 1 && alignment === 0 && material === 0) {
                target_colour = [208, 230, 252];
            }
            else {
                const colour = colours[material];
                target_colour = [
                    (alignment * colour[0] * 255),
                    (alignment * colour[1] * 255),
                    (alignment * colour[2] * 255)
                ]
            }

            const x = i % width;
            const y = height - 1 - Math.floor(i / width);
            image.setPixelColor(jimp.rgbaToInt(target_colour[0], target_colour[1], target_colour[2], 255), x, y);
        }

        /* Return png buffer. */
        return await image.getBuffer(jimp.JimpMime.png);
    }

    /**
     * Subscribe to a camera.
     * @param {string} playerId The steamId of the player making the request.
     * @param {number} playerToken The authentication token of the player making the request.
     * @param {string} identifier Camera identifier.
     * @returns {Promise<boolean>} Returns a promise that resolves true if successful, else false.
     */
    async subscribe(playerId: string, playerToken: number, identifier: string): Promise<boolean> {
        this.emit('subscribing');

        const response = await this.rustplus.cameraSubscribeAsync(playerId, playerToken, identifier);
        if (validation.isValidAppResponse(response) &&
            this.rustplus.getAppResponseError(response) === rp.AppResponseError.NoError) {
            this.identifier = identifier;
            this.playerId = playerId;
            this.playerToken = playerToken;
            this.isSubscribed = true;
            this.cameraRays = [];
            this.cameraSubscribeInfo = response.cameraSubscribeInfo as rpi.AppCameraInfo;
            this.cameraType = getCameraType(this.cameraSubscribeInfo.controlFlags);

            this.emit('subscribed');

            return true;
        }

        this.identifier = '';
        this.playerId = '';
        this.playerToken = 0;
        this.isSubscribed = false;
        this.cameraRays = [];
        this.cameraSubscribeInfo = null;
        this.cameraType = CameraType.UNKNOWN;

        return false;
    }

    /**
     * Unsubscribe from a camera.
     * @returns {Promise<boolean>} Returns a promise that resolves true if successful, else false.
     */
    async unsubscribe(): Promise<boolean> {
        this.emit('unsubscribing');

        if (this.rustplus.isConnected()) {
            await this.rustplus.cameraUnsubscribeAsync(this.playerId, this.playerToken);
        }

        this.identifier = '';
        this.playerId = '';
        this.playerToken = 0;
        this.isSubscribed = false;
        this.cameraRays = [];
        this.cameraSubscribeInfo = null;
        this.cameraType = CameraType.UNKNOWN;

        this.emit('unsubscribed');

        return true;
    }

    /**
     * Zoom a PTZ CCTV camera.
     * @returns {Promise<boolean>} Returns a promise that resolves true if successful, else false.
     */
    async zoom(): Promise<boolean> {
        if (!this.isSubscribed || this.cameraType !== CameraType.PTZ_CCTV_CAMERA) {
            return false;
        }

        /* Press left mouse button to zoom in. */
        await this.rustplus.cameraInputAsync(this.playerId, this.playerToken, Buttons.FIRE_PRIMARY, 0, 0);

        /* Release all mouse buttons. */
        await this.rustplus.cameraInputAsync(this.playerId, this.playerToken, Buttons.NONE, 0, 0);

        return true;
    }

    /**
     * Shoot a PTZ CCTV controlled Auto Turret.
     * @returns {Promise<boolean>} Returns a promise that resolves true if successful, else false.
     */
    async shoot(): Promise<boolean> {
        if (!this.isSubscribed || this.cameraType !== CameraType.AUTO_TURRET) {
            return false;
        }

        /* Press left mouse button to shoot. */
        await this.rustplus.cameraInputAsync(this.playerId, this.playerToken, Buttons.FIRE_PRIMARY, 0, 0);

        /* Release all mouse buttons. */
        await this.rustplus.cameraInputAsync(this.playerId, this.playerToken, Buttons.NONE, 0, 0);

        return true;
    }

    /**
     * Reload a PTZ CCTV controlled Auto Turret.
     * @returns {Promise<boolean>} Returns a promise that resolves true if successful, else false.
     */
    async reload(): Promise<boolean> {
        if (!this.isSubscribed || this.cameraType !== CameraType.AUTO_TURRET) {
            return false;
        }

        /* Press left mouse button to shoot. */
        await this.rustplus.cameraInputAsync(this.playerId, this.playerToken, Buttons.RELOAD, 0, 0);

        /* Release all mouse buttons. */
        await this.rustplus.cameraInputAsync(this.playerId, this.playerToken, Buttons.NONE, 0, 0);

        return true;
    }
}

class IndexGenerator {
    private state: number;

    constructor(e: number) {
        this.state = 0 | e;
        this.nextState();
    }

    nextInt(e: number): number {
        let t = ((this.nextState() * (e | 0)) / 4294967295) | 0;
        if (t < 0) t = e + t - 1;
        return t | 0;
    }

    private nextState(): number {
        let e = this.state;
        let t = e;
        e = ((e = ((e = (e ^ ((e << 13) | 0)) | 0) ^ ((e >>> 17) | 0)) | 0) ^ ((e << 5) | 0)) | 0;
        this.state = e;
        return t >= 0 ? t : 4294967295 + t - 1;
    }
}