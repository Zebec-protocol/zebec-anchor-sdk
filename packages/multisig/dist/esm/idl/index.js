"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZEBEC_STREAM_PROGRAM_IDL = exports.ZEBEC_MULTISIG_PROGRAM_IDL = void 0;
const zebec_multisig_json_1 = __importDefault(require("./zebec-multisig.json"));
const zebec_stream_json_1 = __importDefault(require("./zebec-stream.json"));
exports.ZEBEC_MULTISIG_PROGRAM_IDL = zebec_multisig_json_1.default;
exports.ZEBEC_STREAM_PROGRAM_IDL = zebec_stream_json_1.default;
