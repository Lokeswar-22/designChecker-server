import { Scopes } from '@aps_sdk/authentication';
import * as dotenv from 'dotenv';
dotenv.config();

const {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    APS_CALLBACK_URL,
    PORT = 8080,
} = process.env;

if (!APS_CLIENT_ID || !APS_CLIENT_SECRET || !APS_CALLBACK_URL ) {
    console.error('Missing required APS environment variables');
    process.exit(1);
}

export const apsConfig = {
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    APS_CALLBACK_URL,
    INTERNAL_TOKEN_SCOPES: [Scopes.DataRead, Scopes.ViewablesRead],
    PUBLIC_TOKEN_SCOPES: [Scopes.ViewablesRead],
    PORT: parseInt(PORT as string, 10),
};
