import { AnchorProvider, Idl, Program } from "@project-serum/anchor";
import { PublicKey, Transaction } from "@solana/web3.js";
import { ZEBEC_MULTISIG_PROGRAM_ID, ZEBEC_STREAM_PROGRAM_ID } from "../config";
import { ZEBEC_MULTISIG_PROGRAM_IDL, ZEBEC_STREAM_PROGRAM_IDL } from "../idl";
import { ZebecTransactionBuilder } from "../instruction";



class ZebecMultisig {
    readonly anchorProvider: AnchorProvider;
    readonly multisigProgram: Program;
    readonly streamProgram: Program;
    readonly multisigProgramId: PublicKey = ZEBEC_MULTISIG_PROGRAM_ID;
    readonly streamProgramId: PublicKey = ZEBEC_STREAM_PROGRAM_ID
    readonly transactionBuilder: ZebecTransactionBuilder;
    readonly feeReceiverAddress: PublicKey;

    constructor(anchorProvider: AnchorProvider, feeReceiver: string) {
        this.anchorProvider = anchorProvider;
        this.multisigProgram = new Program(ZEBEC_MULTISIG_PROGRAM_IDL as Idl, this.multisigProgramId, this.anchorProvider);
        this.streamProgram = new Program(ZEBEC_STREAM_PROGRAM_IDL as Idl, this.streamProgramId, this.anchorProvider);
        this.transactionBuilder = new ZebecTransactionBuilder(this.multisigProgram, this.streamProgram);
        this.feeReceiverAddress = new PublicKey(feeReceiver);
    }

}