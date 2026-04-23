"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchStatus = exports.TitleType = exports.Role = void 0;
// Enums
var Role;
(function (Role) {
    Role["USER"] = "USER";
    Role["ADMIN"] = "ADMIN";
})(Role || (exports.Role = Role = {}));
var TitleType;
(function (TitleType) {
    TitleType["ANIME"] = "ANIME";
    TitleType["MANHWA"] = "MANHWA";
    TitleType["MOVIE"] = "MOVIE";
})(TitleType || (exports.TitleType = TitleType = {}));
var WatchStatus;
(function (WatchStatus) {
    WatchStatus["PLAN_TO_WATCH"] = "PLAN_TO_WATCH";
    WatchStatus["WATCHING"] = "WATCHING";
    WatchStatus["COMPLETED"] = "COMPLETED";
    WatchStatus["DROPPED"] = "DROPPED";
})(WatchStatus || (exports.WatchStatus = WatchStatus = {}));
//# sourceMappingURL=index.js.map