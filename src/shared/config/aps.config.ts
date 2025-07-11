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
    INTERNAL_TOKEN_SCOPES: [
        Scopes.DataRead, 
        Scopes.ViewablesRead,
        Scopes.DataWrite,
        Scopes.DataCreate,
        Scopes.DataSearch,
        Scopes.BucketCreate,
        Scopes.BucketRead,
        Scopes.BucketUpdate,
        Scopes.BucketDelete,
        // Scopes.CodeAll,
        // Scopes.AccountRead,
        // Scopes.AccountWrite,
        // Scopes.OpenId,
    ],
    PUBLIC_TOKEN_SCOPES: [
        Scopes.ViewablesRead,
        Scopes.DataRead,
        Scopes.DataWrite,
        Scopes.DataCreate,
        Scopes.DataSearch,
        Scopes.BucketRead,
        Scopes.BucketUpdate,
        Scopes.BucketDelete,
        // Scopes.DataReadUrnOfResource,
        // Scopes.CodeAll,
        // Scopes.AccountRead,
        // Scopes.AccountWrite,
        // Scopes.OpenId,
    ],
    PORT: parseInt(PORT as string, 10),
};
