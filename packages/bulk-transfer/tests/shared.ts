import dotenv from "dotenv";

import { AnchorProvider } from "@project-serum/anchor";

dotenv.config();
export const provider = AnchorProvider.env();
