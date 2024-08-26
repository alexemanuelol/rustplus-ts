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

    https://github.com/alexemanuelol/rustplusProto-ts

*/

import * as rustplusProto from './interfaces/rustplus';
import * as rustplus from './rustplus';

/**
 * Validation checks for the rustplus.proto file interfaces and enums.
 */

export function isValidVector2(object: any): object is rustplusProto.Vector2 {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidX = object.x === undefined || typeof object.x === 'number';
    const hasValidY = object.y === undefined || typeof object.y === 'number';

    const validKeys = [
        'x', 'y'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidX && hasValidY && hasOnlyValidKeys;
}

export function isValidVector3(object: any): object is rustplusProto.Vector3 {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidX = object.x === undefined || typeof object.x === 'number';
    const hasValidY = object.y === undefined || typeof object.y === 'number';
    const hasValidZ = object.z === undefined || typeof object.z === 'number';

    const validKeys = [
        'x', 'y', 'z'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidX && hasValidY && hasValidZ && hasOnlyValidKeys;
}

export function isValidVector4(object: any): object is rustplusProto.Vector4 {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidX = object.x === undefined || typeof object.x === 'number';
    const hasValidY = object.y === undefined || typeof object.y === 'number';
    const hasValidZ = object.z === undefined || typeof object.z === 'number';
    const hasValidW = object.w === undefined || typeof object.w === 'number';

    const validKeys = [
        'x', 'y', 'z', 'w'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidX && hasValidY && hasValidZ && hasValidW && hasOnlyValidKeys;
}

export function isValidHalf3(object: any): object is rustplusProto.Half3 {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidX = object.x === undefined || typeof object.x === 'number';
    const hasValidY = object.y === undefined || typeof object.y === 'number';
    const hasValidZ = object.z === undefined || typeof object.z === 'number';

    const validKeys = [
        'x', 'y', 'z'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidX && hasValidY && hasValidZ && hasOnlyValidKeys;
}

export function isValidColor(object: any): object is rustplusProto.Color {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidR = object.r === undefined || typeof object.r === 'number';
    const hasValidG = object.g === undefined || typeof object.g === 'number';
    const hasValidB = object.b === undefined || typeof object.b === 'number';
    const hasValidA = object.a === undefined || typeof object.a === 'number';

    const validKeys = [
        'r', 'g', 'b', 'a'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidR && hasValidG && hasValidB && hasValidA && hasOnlyValidKeys;
}

export function isValidRay(object: any): object is rustplusProto.Ray {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidOrigin = object.origin === undefined || isValidVector3(object.origin);
    const hasValidDirection = object.direction === undefined || isValidVector3(object.direction);

    const validKeys = [
        'origin', 'direction'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidOrigin && hasValidDirection && hasOnlyValidKeys;
}

export function isValidClanActionResult(object: any): object is rustplusProto.ClanActionResult {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidRequestId = typeof object.requestId === 'number';
    const hasValidResult = typeof object.result === 'number';
    const hasValidHasClanInfo = typeof object.hasClanInfo === 'boolean';
    const hasValidClanInfo = object.clanInfo === undefined || isValidClanInfo(object.clanInfo);

    const validKeys = [
        'requestId', 'result', 'hasClanInfo', 'clanInfo'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidRequestId && hasValidResult && hasValidHasClanInfo && hasValidClanInfo && hasOnlyValidKeys;
}

export function isValidClanInfo(object: any): object is rustplusProto.ClanInfo {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidClanId = typeof object.clanId === 'string';
    const hasValidName = typeof object.name === 'string';
    const hasValidCreated = typeof object.created === 'string';
    const hasValidCreator = typeof object.creator === 'string';
    const hasValidMotd = object.motd === undefined || typeof object.motd === 'string';
    const hasValidMotdTimestamp = typeof object.motdTimestamp === 'string';
    const hasValidMotdAuthor = typeof object.motdAuthor === 'string';
    const hasValidLogo = object.logo === undefined || object.logo instanceof Uint8Array;
    const hasValidColor = typeof object.color === 'number';
    const hasValidRoles = Array.isArray(object.roles) && object.roles.every(isValidClanInfo_Role);
    const hasValidMembers = Array.isArray(object.members) && object.members.every(isValidClanInfo_Member);
    const hasValidInvites = Array.isArray(object.invites) && object.invites.every(isValidClanInfo_Invite);
    const hasValidMaxMemberCount = typeof object.maxMemberCount === 'number';
    const hasValidScore = typeof object.score === 'string';

    const validKeys = [
        'clanId', 'name', 'created', 'creator', 'motd', 'motdTimestamp', 'motdAuthor', 'logo', 'color', 'roles',
        'members', 'invites', 'maxMemberCount', 'score'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidClanId && hasValidName && hasValidCreated && hasValidCreator && hasValidMotd &&
        hasValidMotdTimestamp && hasValidMotdAuthor && hasValidLogo && hasValidColor && hasValidRoles &&
        hasValidMembers && hasValidInvites && hasValidMaxMemberCount && hasValidScore && hasOnlyValidKeys;
}

export function isValidClanInfo_Role(object: any): object is rustplusProto.ClanInfo_Role {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidRoleId = typeof object.roleId === 'number';
    const hasValidRank = typeof object.rank === 'number';
    const hasValidName = typeof object.name === 'string';
    const hasValidCanSetMotd = typeof object.canSetMotd === 'boolean';
    const hasValidCanSetLogo = typeof object.canSetLogo === 'boolean';
    const hasValidCanInvite = typeof object.canInvite === 'boolean';
    const hasValidCanKick = typeof object.canKick === 'boolean';
    const hasValidCanPromote = typeof object.canPromote === 'boolean';
    const hasValidCanDemote = typeof object.canDemote === 'boolean';
    const hasValidCanSetPlayerNotes = typeof object.canSetPlayerNotes === 'boolean';
    const hasValidCanAccessLogs = typeof object.canAccessLogs === 'boolean';
    const hasValidCanAccessScoreEvents = typeof object.canAccessScoreEvents === 'boolean';

    const validKeys = [
        'roleId', 'rank', 'name', 'canSetMotd', 'canSetLogo', 'canInvite', 'canKick', 'canPromote', 'canDemote',
        'canSetPlayerNotes', 'canAccessLogs', 'canAccessScoreEvents'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidRoleId && hasValidRank && hasValidName && hasValidCanSetMotd && hasValidCanSetLogo &&
        hasValidCanInvite && hasValidCanKick && hasValidCanPromote && hasValidCanDemote && hasValidCanSetPlayerNotes &&
        hasValidCanAccessLogs && hasValidCanAccessScoreEvents && hasOnlyValidKeys;
}

export function isValidClanInfo_Member(object: any): object is rustplusProto.ClanInfo_Member {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidSteamId = typeof object.steamId === 'string';
    const hasValidRoleId = typeof object.roleId === 'number';
    const hasValidJoined = typeof object.joined === 'string';
    const hasValidLastSeen = typeof object.lastSeen === 'string';
    const hasValidNotes = object.notes === undefined || typeof object.notes === 'string';
    const hasValidOnline = typeof object.online === 'boolean';

    const validKeys = [
        'steamId', 'roleId', 'joined', 'lastSeen', 'notes', 'online'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidSteamId && hasValidRoleId && hasValidJoined && hasValidLastSeen && hasValidNotes &&
        hasValidOnline && hasOnlyValidKeys;
}

export function isValidClanInfo_Invite(object: any): object is rustplusProto.ClanInfo_Invite {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidSteamId = typeof object.steamId === 'string';
    const hasValidRecruiter = typeof object.recruiter === 'string';
    const hasValidTimestamp = typeof object.timestamp === 'string';

    const validKeys = [
        'steamId', 'recruiter', 'timestamp'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidSteamId && hasValidRecruiter && hasValidTimestamp && hasOnlyValidKeys;
}

export function isValidClanLog(object: any): object is rustplusProto.ClanLog {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidClanId = typeof object.clanId === 'string';
    const hasValidLogEntries = Array.isArray(object.logEntries) && object.logEntries.every(isValidClanLog_Entry);

    const validKeys = [
        'clanId', 'logEntries'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidClanId && hasValidLogEntries && hasOnlyValidKeys;
}

export function isValidClanLog_Entry(object: any): object is rustplusProto.ClanLog_Entry {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidTimestamp = typeof object.timestamp === 'string';
    const hasValidEventKey = typeof object.eventKey === 'string';
    const hasValidArg1 = object.arg1 === undefined || typeof object.arg1 === 'string';
    const hasValidArg2 = object.arg2 === undefined || typeof object.arg2 === 'string';
    const hasValidArg3 = object.arg3 === undefined || typeof object.arg3 === 'string';
    const hasValidArg4 = object.arg4 === undefined || typeof object.arg4 === 'string';

    const validKeys = [
        'timestamp', 'eventKey', 'arg1', 'arg2', 'arg3', 'arg4'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidTimestamp && hasValidEventKey && hasValidArg1 && hasValidArg2 && hasValidArg3 && hasValidArg4 &&
        hasOnlyValidKeys;
}

export function isValidClanInvitations(object: any): object is rustplusProto.ClanInvitations {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidInvitations = Array.isArray(object.invitations) &&
        object.invitations.every(isValidClanInvitations_Invitation);

    const validKeys = [
        'invitations'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidInvitations && hasOnlyValidKeys;
}

export function isValidClanInvitations_Invitation(object: any): object is rustplusProto.ClanInvitations_Invitation {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidClanId = typeof object.clanId === 'string';
    const hasValidRecruiter = typeof object.recruiter === 'string';
    const hasValidTimestamp = typeof object.timestamp === 'string';

    const validKeys = [
        'clanId', 'recruiter', 'timestamp'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidClanId && hasValidRecruiter && hasValidTimestamp && hasOnlyValidKeys;
}

export function isValidAppRequest(object: any): object is rustplusProto.AppRequest {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidSeq = typeof object.seq === 'number';
    const hasValidPlayerId = typeof object.playerId === 'string';
    const hasValidPlayerToken = typeof object.playerToken === 'number';
    const hasValidEntityId = object.entityId === undefined || typeof object.entityId === 'number';
    const hasValidGetInfo = object.getInfo === undefined || isValidAppEmpty(object.getInfo);
    const hasValidGetTime = object.getTime === undefined || isValidAppEmpty(object.getTime);
    const hasValidGetMap = object.getMap === undefined || isValidAppEmpty(object.getMap);
    const hasValidGetTeamInfo = object.getTeamInfo === undefined || isValidAppEmpty(object.getTeamInfo);
    const hasValidGetTeamChat = object.getTeamChat === undefined || isValidAppEmpty(object.getTeamChat);
    const hasValidSendTeamMessage = object.sendTeamMessage === undefined ||
        isValidAppSendMessage(object.sendTeamMessage);
    const hasValidGetEntityInfo = object.getEntityInfo === undefined || isValidAppEmpty(object.getEntityInfo);
    const hasValidSetEntityValue = object.setEntityValue === undefined ||
        isValidAppSetEntityValue(object.setEntityValue);
    const hasValidCheckSubscription = object.checkSubscription === undefined ||
        isValidAppEmpty(object.checkSubscription);
    const hasValidSetSubscription = object.setSubscription === undefined || isValidAppFlag(object.setSubscription);
    const hasValidGetMapMarkers = object.getMapMarkers === undefined || isValidAppEmpty(object.getMapMarkers);
    const hasValidPromoteToLeader = object.promoteToLeader === undefined ||
        isValidAppPromoteToLeader(object.promoteToLeader);
    const hasValidGetClanInfo = object.getClanInfo === undefined || isValidAppEmpty(object.getClanInfo);
    const hasValidSetClanMotd = object.setClanMotd === undefined || isValidAppSendMessage(object.setClanMotd);
    const hasValidGetClanChat = object.getClanChat === undefined || isValidAppEmpty(object.getClanChat);
    const hasValidSendClanMessage = object.sendClanMessage === undefined ||
        isValidAppSendMessage(object.sendClanMessage);
    const hasValidGetNexusAuth = object.getNexusAuth === undefined || isValidAppGetNexusAuth(object.getGetNexusAuth);
    const hasValidCameraSubscribe = object.cameraSubscribe === undefined ||
        isValidAppCameraSubscribe(object.cameraSubscribe);
    const hasValidCameraUnsubscribe = object.cameraUnsubscribe === undefined ||
        isValidAppEmpty(object.cameraUnsubscribe);
    const hasValidCameraInput = object.cameraInput === undefined || isValidAppCameraInput(object.cameraInput);

    const validKeys = [
        'seq', 'playerId', 'playerToken', 'entityId', 'getInfo', 'getTime', 'getMap', 'getTeamInfo', 'getTeamChat',
        'sendTeamMessage', 'getEntityInfo', 'setEntityValue', 'checkSubscription', 'setSubscription', 'getMapMarkers',
        'promoteToLeader', 'getClanInfo', 'setClanMotd', 'getClanChat', 'sendClanMessage', 'getNexusAuth',
        'cameraSubscribe', 'cameraUnsubscribe', 'cameraInput'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidSeq && hasValidPlayerId && hasValidPlayerToken && hasValidEntityId && hasValidGetInfo &&
        hasValidGetTime && hasValidGetMap && hasValidGetTeamInfo && hasValidGetTeamChat && hasValidSendTeamMessage &&
        hasValidGetEntityInfo && hasValidSetEntityValue && hasValidCheckSubscription && hasValidSetSubscription &&
        hasValidGetMapMarkers && hasValidPromoteToLeader && hasValidGetClanInfo && hasValidSetClanMotd &&
        hasValidGetClanChat && hasValidSendClanMessage && hasValidGetNexusAuth && hasValidCameraSubscribe &&
        hasValidCameraUnsubscribe && hasValidCameraInput && hasOnlyValidKeys;
}

export function isValidAppMessage(object: any): object is rustplusProto.AppMessage {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidResponse = object.response === undefined || isValidAppResponse(object.response);
    const hasValidBroadcast = object.broadcast === undefined || isValidAppBroadcast(object.broadcast);

    const validKeys = [
        'response', 'broadcast'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidResponse && hasValidBroadcast && hasOnlyValidKeys;
}

export function isValidAppResponse(object: any): object is rustplusProto.AppResponse {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidSeq = typeof object.seq === 'number';
    const hasValidSuccess = object.success === undefined || isValidAppSuccess(object.success);
    const hasValidError = object.error === undefined || isValidAppError(object.error);
    const hasValidInfo = object.info === undefined || isValidAppInfo(object.info);
    const hasValidTime = object.time === undefined || isValidAppTime(object.time);
    const hasValidMap = object.map === undefined || isValidAppMap(object.map);
    const hasValidTeamInfo = object.teamInfo === undefined || isValidAppTeamInfo(object.teamInfo);
    const hasValidTeamChat = object.teamChat === undefined || isValidAppTeamChat(object.teamChat);
    const hasValidEntityInfo = object.entityInfo === undefined || isValidAppEntityInfo(object.entityInfo);
    const hasValidFlag = object.flag === undefined || isValidAppFlag(object.flag);
    const hasValidMapMarkers = object.mapMarkers === undefined || isValidAppMapMarkers(object.mapMarkers);
    const hasValidClanInfo = object.clanInfo === undefined || isValidAppClanInfo(object.clanInfo);
    const hasValidClanChat = object.clanChat === undefined || isValidAppClanChat(object.clanChat);
    const hasValidNexusAuth = object.nexusAuth === undefined || isValidAppNexusAuth(object.nexusAuth);
    const hasValidCameraSubscribeInfo = object.cameraSubscribeInfo === undefined ||
        isValidAppCameraInfo(object.cameraSubscribeInfo);

    const validKeys = [
        'seq', 'success', 'error', 'info', 'time', 'map', 'teamInfo', 'teamChat', 'entityInfo', 'flag', 'mapMarkers',
        'clanInfo', 'clanChat', 'nexusAuth', 'cameraSubscribeInfo'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidSeq && hasValidSuccess && hasValidError && hasValidInfo && hasValidTime && hasValidMap &&
        hasValidTeamInfo && hasValidTeamChat && hasValidEntityInfo && hasValidFlag && hasValidMapMarkers &&
        hasValidClanInfo && hasValidClanChat && hasValidNexusAuth && hasValidCameraSubscribeInfo && hasOnlyValidKeys;
}

export function isValidAppBroadcast(object: any): object is rustplusProto.AppBroadcast {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidTeamChanged = object.teamChanged === undefined || isValidAppTeamChanged(object.teamChanged);
    const hasValidTeamMessage = object.teamMessage === undefined || isValidAppNewTeamMessage(object.teamMessage);
    const hasValidEntityChanged = object.entityChanged === undefined || isValidAppEntityChanged(object.entityChanged);
    const hasValidClanChanged = object.clanChanged === undefined || isValidAppClanChanged(object.clanChanged);
    const hasValidClanMessage = object.clanMessage === undefined || isValidAppNewClanMessage(object.clanMessage);
    const hasValidCameraRays = object.cameraRays === undefined || isValidAppCameraRays(object.cameraRays);

    const validKeys = [
        'teamChanged', 'teamMessage', 'entityChanged', 'clanChanged', 'clanMessage', 'cameraRays'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidTeamChanged && hasValidTeamMessage && hasValidEntityChanged && hasValidClanChanged &&
        hasValidClanMessage && hasValidCameraRays && hasOnlyValidKeys;
}

export function isValidAppEmpty(object: any): object is rustplusProto.AppEmpty {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasOnlyValidKeys = Object.keys(object).length === 0;

    return hasOnlyValidKeys;
}

export function isValidAppSendMessage(object: any): object is rustplusProto.AppSendMessage {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidMessage = typeof object.message === 'string';

    const validKeys = [
        'message'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidMessage && hasOnlyValidKeys;
}

export function isValidAppSetEntityValue(object: any): object is rustplusProto.AppSetEntityValue {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidValue = typeof object.value === 'boolean';

    const validKeys = [
        'value'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidValue && hasOnlyValidKeys;
}

export function isValidAppPromoteToLeader(object: any): object is rustplusProto.AppPromoteToLeader {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidSteamId = typeof object.steamId === 'string';

    const validKeys = [
        'steamId'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidSteamId && hasOnlyValidKeys;
}

export function isValidAppGetNexusAuth(object: any): object is rustplusProto.AppGetNexusAuth {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidAppKey = typeof object.appKey === 'string';

    const validKeys = [
        'appKey'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidAppKey && hasOnlyValidKeys;
}

export function isValidAppSuccess(object: any): object is rustplusProto.AppSuccess {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasOnlyValidKeys = Object.keys(object).length === 0;

    return hasOnlyValidKeys;
}

export function isValidAppError(object: any): object is rustplusProto.AppError {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidError = typeof object.error === 'string';

    const validKeys = [
        'error'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidError && hasOnlyValidKeys;
}

export function isValidAppFlag(object: any): object is rustplusProto.AppFlag {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidValue = typeof object.value === 'boolean';

    const validKeys = [
        'value'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidValue && hasOnlyValidKeys;
}

export function isValidAppInfo(object: any): object is rustplusProto.AppInfo {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidName = typeof object.name === 'string';
    const hasValidHeaderImage = typeof object.headerImage === 'string';
    const hasValidUrl = typeof object.url === 'string';
    const hasValidMap = typeof object.map === 'string';
    const hasValidMapSize = typeof object.mapSize === 'number';
    const hasValidWipeTime = typeof object.wipeTime === 'number';
    const hasValidPlayers = typeof object.players === 'number';
    const hasValidMaxPlayers = typeof object.maxPlayers === 'number';
    const hasValidQueuedPlayers = typeof object.queuedPlayers === 'number';
    const hasValidSeed = typeof object.seed === 'number';
    const hasValidSalt = typeof object.salt === 'number';
    const hasValidLogoImage = object.logoImage === undefined || typeof object.logoImage === 'string';
    const hasValidNexus = object.nexus === undefined || typeof object.nexus === 'string';
    const hasValidNexusId = typeof object.nexusId === 'number';
    const hasValidNexusZone = object.nexusZone === undefined || typeof object.nexusZone === 'string';
    const hasValidCamerasEnabled = object.camerasEnabled === undefined || typeof object.camerasEnabled === 'boolean';

    const validKeys = [
        'name', 'headerImage', 'url', 'map', 'mapSize', 'wipeTime', 'players', 'maxPlayers', 'queuedPlayers', 'seed',
        'salt', 'logoImage', 'nexus', 'nexusId', 'nexusZone', 'camerasEnabled'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidName && hasValidHeaderImage && hasValidUrl && hasValidMap && hasValidMapSize && hasValidWipeTime &&
        hasValidPlayers && hasValidMaxPlayers && hasValidQueuedPlayers && hasValidSeed && hasValidSalt &&
        hasValidLogoImage && hasValidNexus && hasValidNexusId && hasValidNexusZone && hasValidCamerasEnabled &&
        hasOnlyValidKeys;
}

export function isValidAppTime(object: any): object is rustplusProto.AppTime {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidDayLengthMinutes = typeof object.dayLengthMinutes === 'number';
    const hasValidTimeScale = typeof object.timeScale === 'number';
    const hasValidSunrise = typeof object.sunrise === 'number';
    const hasValidSunset = typeof object.sunset === 'number';
    const hasValidTime = typeof object.time === 'number';

    const validKeys = [
        'dayLengthMinutes', 'timeScale', 'sunrise', 'sunset', 'time'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidDayLengthMinutes && hasValidTimeScale && hasValidSunrise && hasValidSunset && hasValidTime &&
        hasOnlyValidKeys;
}

export function isValidAppMap(object: any): object is rustplusProto.AppMap {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidWidth = typeof object.width === 'number';
    const hasValidHeight = typeof object.height === 'number';
    const hasValidJpgImage = object.jpgImage instanceof Uint8Array;
    const hasValidOceanMargin = typeof object.oceanMargin === 'number';
    const hasValidMonuments = Array.isArray(object.monuments) &&
        object.monuments.every(isValidAppMap_Monument);
    const hasValidBackground = object.background === undefined || typeof object.background === 'string';

    const validKeys = [
        'width', 'height', 'jpgImage', 'oceanMargin', 'monuments', 'background'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidWidth && hasValidHeight && hasValidJpgImage && hasValidOceanMargin && hasValidMonuments &&
        hasValidBackground && hasOnlyValidKeys;
}

export function isValidAppMap_Monument(object: any): object is rustplusProto.AppMap_Monument {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidToken = typeof object.token === 'string';
    const hasValidX = typeof object.x === 'number';
    const hasValidY = typeof object.y === 'number';

    const validKeys = [
        'token', 'x', 'y'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidToken && hasValidX && hasValidY && hasOnlyValidKeys;
}

export function isValidAppEntityInfo(object: any): object is rustplusProto.AppEntityInfo {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidType = isValidAppEntityType(object.type);
    const hasValidPayload = object.payload === undefined || isValidAppEntityPayload(object.payload);

    const validKeys = [
        'type', 'payload'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidType && hasValidPayload && hasOnlyValidKeys;
}

export function isValidAppEntityPayload(object: any): object is rustplusProto.AppEntityPayload {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidValue = typeof object.value === 'boolean';
    const hasValidItems = Array.isArray(object.items) && object.items.every(isValidAppEntityPayload_Item);
    const hasValidCapacity = typeof object.capacity === 'number';
    const hasValidHasProtection = typeof object.hasProtection === 'boolean';
    const hasValidProtectionExpiry = typeof object.protectionExpiry === 'number';

    const validKeys = [
        'value', 'items', 'capacity', 'hasProtection', 'protectionExpiry'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidValue && hasValidItems && hasValidCapacity && hasValidHasProtection && hasValidProtectionExpiry &&
        hasOnlyValidKeys;
}

export function isValidAppEntityPayload_Item(object: any): object is rustplusProto.AppEntityPayload_Item {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidItemId = typeof object.itemId === 'number';
    const hasValidQuantity = typeof object.quantity === 'number';
    const hasValidItemIsBlueprint = typeof object.itemIsBlueprint === 'boolean';

    const validKeys = [
        'itemId', 'quantity', 'itemIsBlueprint'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidItemId && hasValidQuantity && hasValidItemIsBlueprint && hasOnlyValidKeys;
}

export function isValidAppTeamInfo(object: any): object is rustplusProto.AppTeamInfo {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidLeaderSteamId = typeof object.leaderSteamId === 'string';
    const hasValidMembers = Array.isArray(object.members) && object.members.every(isValidAppTeamInfo_Member);
    const hasValidMapNotes = Array.isArray(object.mapNotes) && object.mapNotes.every(isValidAppTeamInfo_Note);
    const hasValidLeaderMapNotes = Array.isArray(object.leaderMapNotes) &&
        object.leaderMapNotes.every(isValidAppTeamInfo_Note);

    const validKeys = [
        'leaderSteamId', 'members', 'mapNotes', 'leaderMapNotes'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidLeaderSteamId && hasValidMembers && hasValidMapNotes && hasValidLeaderMapNotes && hasOnlyValidKeys;
}

export function isValidAppTeamInfo_Member(object: any): object is rustplusProto.AppTeamInfo_Member {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidSteamId = typeof object.steamId === 'string';
    const hasValidName = typeof object.name === 'string';
    const hasValidX = typeof object.x === 'number';
    const hasValidY = typeof object.y === 'number';
    const hasValidIsOnline = typeof object.isOnline === 'boolean';
    const hasValidSpawnTime = typeof object.spawnTime === 'number';
    const hasValidIsAlive = typeof object.isAlive === 'boolean';
    const hasValidDeathTime = typeof object.deathTime === 'number';

    const validKeys = [
        'steamId', 'name', 'x', 'y', 'isOnline', 'spawnTime', 'isAlive', 'deathTime'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidSteamId && hasValidName && hasValidX && hasValidY && hasValidIsOnline && hasValidSpawnTime &&
        hasValidIsAlive && hasValidDeathTime && hasOnlyValidKeys;
}

export function isValidAppTeamInfo_Note(object: any): object is rustplusProto.AppTeamInfo_Note {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidType = isValidAppTeamInfo_Note_Type(object.type);
    const hasValidX = typeof object.x === 'number';
    const hasValidY = typeof object.y === 'number';
    const hasValidIcon = object.icon === undefined || typeof object.icon === 'number';
    const hasValidcolourIndex = object.colourIndex === undefined || typeof object.colourIndex === 'number';
    const hasValidLabel = object.label === undefined || typeof object.label === 'string';

    const validKeys = [
        'type', 'x', 'y', 'icon', 'colourIndex', 'label'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidType && hasValidX && hasValidY && hasValidIcon && hasValidcolourIndex && hasValidLabel &&
        hasOnlyValidKeys;
}

export function isValidAppTeamMessage(object: any): object is rustplusProto.AppTeamMessage {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidSteamId = typeof object.steamId === 'string';
    const hasValidName = typeof object.name === 'string';
    const hasValidMessage = typeof object.message === 'string';
    const hasValidColor = typeof object.color === 'string';
    const hasValidTime = typeof object.time === 'number';

    const validKeys = [
        'steamId', 'name', 'message', 'color', 'time'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidSteamId && hasValidName && hasValidMessage && hasValidColor && hasValidTime && hasOnlyValidKeys;
}

export function isValidAppTeamChat(object: any): object is rustplusProto.AppTeamChat {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidMessages = Array.isArray(object.messages) && object.messages.every(isValidAppTeamMessage);

    const validKeys = [
        'messages'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidMessages && hasOnlyValidKeys;
}

export function isValidAppMarker(object: any): object is rustplusProto.AppMarker {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidId = typeof object.id === 'number';
    const hasValidType = isValidAppMarkerType(object.type);
    const hasValidX = typeof object.x === 'number';
    const hasValidY = typeof object.y === 'number';
    const hasValidSteamId = typeof object.steamId === 'string';
    const hasValidRotation = typeof object.rotation === 'number';
    const hasValidRadius = typeof object.radius === 'number';
    const hasValidColor1 = object.color1 === undefined || isValidVector4(object.color1);
    const hasValidColor2 = object.color2 === undefined || isValidVector4(object.color2);
    const hasValidAlpha = typeof object.alpha === 'number';
    const hasValidName = object.name === undefined || typeof object.name === 'string';
    const hasValidOutOfStock = typeof object.outOfStock === 'boolean';
    const hasValidSellOrders = Array.isArray(object.sellOrders) && object.sellOrders.every(isValidAppMarker_SellOrder);

    const validKeys = [
        'id', 'type', 'x', 'y', 'steamId', 'rotation', 'radius', 'color1', 'color2', 'alpha', 'name', 'outOfStock',
        'sellOrders'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidId && hasValidType && hasValidX && hasValidY && hasValidSteamId && hasValidRotation &&
        hasValidRadius && hasValidColor1 && hasValidColor2 && hasValidAlpha && hasValidName && hasValidOutOfStock &&
        hasValidSellOrders && hasOnlyValidKeys;
}

export function isValidAppMarker_SellOrder(object: any): object is rustplusProto.AppMarker_SellOrder {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidItemId = typeof object.itemId === 'number';
    const hasValidQuantity = typeof object.quantity === 'number';
    const hasValidCurrencyId = typeof object.currencyId === 'number';
    const hasValidCostPerItem = typeof object.costPerItem === 'number';
    const hasValidAmountInStock = typeof object.amountInStock === 'number';
    const hasValidItemIsBlueprint = typeof object.itemIsBlueprint === 'boolean';
    const hasValidCurrencyIsBlueprint = typeof object.currencyIsBlueprint === 'boolean';
    const hasValidItemCondition = typeof object.itemCondition === 'number';
    const hasValidItemConditionMax = typeof object.itemConditionMax === 'number';
    const hasValidPriceMultiplier = object.priceMultiplier === undefined || typeof object.priceMultiplier === 'number';

    const validKeys = [
        'itemId', 'quantity', 'currencyId', 'costPerItem', 'amountInStock', 'itemIsBlueprint', 'currencyIsBlueprint',
        'itemCondition', 'itemConditionMax', 'priceMultiplier'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidItemId && hasValidQuantity && hasValidCurrencyId && hasValidCostPerItem && hasValidAmountInStock &&
        hasValidItemIsBlueprint && hasValidCurrencyIsBlueprint && hasValidItemCondition && hasValidItemConditionMax &&
        hasValidPriceMultiplier && hasOnlyValidKeys;
}

export function isValidAppMapMarkers(object: any): object is rustplusProto.AppMapMarkers {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidMarkers = Array.isArray(object.markers) && object.markers.every(isValidAppMarker);

    const validKeys = [
        'markers'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidMarkers && hasOnlyValidKeys;
}

export function isValidAppClanInfo(object: any): object is rustplusProto.AppClanInfo {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidClanInfo = object.clanInfo === undefined || isValidClanInfo(object.clanInfo);

    const validKeys = [
        'clanInfo'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidClanInfo && hasOnlyValidKeys;
}

export function isValidAppClanMessage(object: any): object is rustplusProto.AppClanMessage {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidSteamId = typeof object.steamId === 'string';
    const hasValidName = typeof object.name === 'string';
    const hasValidMessage = typeof object.message === 'string';
    const hasValidTime = typeof object.time === 'string';

    const validKeys = [
        'steamId', 'name', 'message', 'time'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidSteamId && hasValidName && hasValidMessage && hasValidTime && hasOnlyValidKeys;
}

export function isValidAppClanChat(object: any): object is rustplusProto.AppClanChat {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidMessages = Array.isArray(object.messages) && object.messages.every(isValidAppClanMessage);

    const validKeys = [
        'messages'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidMessages && hasOnlyValidKeys;
}

export function isValidAppNexusAuth(object: any): object is rustplusProto.AppNexusAuth {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidServerId = typeof object.serverId === 'string';
    const hasValidPlayerToken = typeof object.playerToken === 'number';

    const validKeys = [
        'serverId', 'playerToken'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidServerId && hasValidPlayerToken && hasOnlyValidKeys;
}

export function isValidAppTeamChanged(object: any): object is rustplusProto.AppTeamChanged {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidPlayerId = typeof object.playerId === 'string';
    const hasValidTeamInfo = object.teamInfo === undefined || isValidAppTeamInfo(object.teamInfo);

    const validKeys = [
        'playerId', 'teamInfo'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidPlayerId && hasValidTeamInfo && hasOnlyValidKeys;
}

export function isValidAppNewTeamMessage(object: any): object is rustplusProto.AppNewTeamMessage {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidMessage = object.message === undefined || isValidAppTeamMessage(object.message);

    const validKeys = [
        'message'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidMessage && hasOnlyValidKeys;
}

export function isValidAppEntityChanged(object: any): object is rustplusProto.AppEntityChanged {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidEntityId = typeof object.entityId === 'number';
    const hasValidPayload = object.payload === undefined || isValidAppEntityPayload(object.payload);

    const validKeys = [
        'entityId', 'payload'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidEntityId && hasValidPayload && hasOnlyValidKeys;
}

export function isValidAppClanChanged(object: any): object is rustplusProto.AppClanChanged {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidClanInfo = object.clanInfo === undefined || isValidClanInfo(object.clanInfo);

    const validKeys = [
        'clanInfo'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidClanInfo && hasOnlyValidKeys;
}

export function isValidAppNewClanMessage(object: any): object is rustplusProto.AppNewClanMessage {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidClanId = typeof object.clanId === 'string';
    const hasValidMessage = object.message === undefined || isValidAppClanMessage(object.message);

    const validKeys = [
        'clanId', 'message'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidClanId && hasValidMessage && hasOnlyValidKeys;
}

export function isValidAppCameraSubscribe(object: any): object is rustplusProto.AppCameraSubscribe {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidCameraId = typeof object.cameraId === 'string';

    const validKeys = [
        'cameraId'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidCameraId && hasOnlyValidKeys;
}

export function isValidAppCameraInput(object: any): object is rustplusProto.AppCameraInput {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidButtons = typeof object.buttons === 'number';
    const hasValidMouseDelta = object.mouseDelta === undefined || isValidVector2(object.mouseDelta);

    const validKeys = [
        'buttons', 'mouseDelta'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidButtons && hasValidMouseDelta && hasOnlyValidKeys;
}

export function isValidAppCameraInfo(object: any): object is rustplusProto.AppCameraInfo {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidWidth = typeof object.width === 'number';
    const hasValidHeight = typeof object.height === 'number';
    const hasValidNearPlane = typeof object.nearPlane === 'number';
    const hasValidFarPlane = typeof object.farPlane === 'number';
    const hasValidControlFlags = typeof object.controlFlags === 'number';

    const validKeys = [
        'width', 'height', 'nearPlane', 'farPlane', 'controlFlags'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidWidth && hasValidHeight && hasValidNearPlane && hasValidFarPlane && hasValidControlFlags &&
        hasOnlyValidKeys;
}

export function isValidAppCameraRays(object: any): object is rustplusProto.AppCameraRays {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidVerticalFov = typeof object.verticalFov === 'number';
    const hasValidSampleOffset = typeof object.sampleOffset === 'number';
    const hasValidRayData = object.rayData instanceof Uint8Array;
    const hasValidDistance = typeof object.distance === 'number';
    const hasValidEntities = Array.isArray(object.entities) && object.entities.every(isValidAppCameraRays_Entity);
    const hasValidTimeOfDay = typeof object.timeOfDay === 'number';

    const validKeys = [
        'verticalFov', 'sampleOffset', 'rayData', 'distance', 'entities', 'number'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidVerticalFov && hasValidSampleOffset && hasValidRayData && hasValidDistance && hasValidEntities &&
        hasValidTimeOfDay && hasOnlyValidKeys;
}

export function isValidAppCameraRays_Entity(object: any): object is rustplusProto.AppCameraRays_Entity {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidEntityId = typeof object.entityId === 'number';
    const hasValidType = isValidAppCameraRays_EntityType(object.type);
    const hasValidPosition = object.position === undefined || isValidVector3(object.position);
    const hasValidRotation = object.rotation === undefined || isValidVector3(object.rotation);
    const hasValidSize = object.size === undefined || isValidVector3(object.size);
    const hasValidName = object.name === undefined || typeof object.name === 'string';

    const validKeys = [
        'entityId', 'type', 'position', 'rotation', 'size', 'name'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidEntityId && hasValidType && hasValidPosition && hasValidRotation && hasValidSize && hasValidName &&
        hasOnlyValidKeys;
}

export function isValidAppEntityType(value: any): value is rustplusProto.AppEntityType {
    return Object.values(rustplusProto.AppEntityType).includes(value);
}

export function isValidAppMarkerType(value: any): value is rustplusProto.AppMarkerType {
    return Object.values(rustplusProto.AppMarkerType).includes(value);
}

export function isValidAppTeamInfo_Note_Type(value: any): value is rustplusProto.AppTeamInfo_Note_Type {
    return Object.values(rustplusProto.AppTeamInfo_Note_Type).includes(value);
}

export function isValidAppCameraRays_EntityType(value: any): value is rustplusProto.AppCameraRays_EntityType {
    return Object.values(rustplusProto.AppCameraRays_EntityType).includes(value);
}

/**
 * Validation checks for other interfaces and enums.
 */

export function isValidRustPlusRequestTokens(object: any): object is rustplus.RustPlusRequestTokens {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidConnection = typeof object.connection === 'number';
    const hasValidPlayerId = typeof object.playerId === 'object' && object.playerId !== null &&
        Object.keys(object.playerId).every(key => typeof key === 'string' && typeof object.playerId[key] === 'number');
    const hasValidServerPairing = typeof object.serverPairing === 'number';

    const validKeys = [
        'connection', 'playerId', 'serverPairing'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidConnection && hasValidPlayerId && hasValidServerPairing && hasOnlyValidKeys;
}

export function isValidEmitErrorType(value: any): value is rustplus.EmitErrorType {
    return Object.values(rustplus.EmitErrorType).includes(value);
}

export function isValidAppResponseError(value: any): value is rustplus.AppResponseError {
    return Object.values(rustplus.AppResponseError).includes(value);
}

export function isValidConsumeTokensError(value: any): value is rustplus.ConsumeTokensError {
    return Object.values(rustplus.ConsumeTokensError).includes(value);
}