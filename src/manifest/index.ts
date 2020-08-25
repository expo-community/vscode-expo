import vscode from 'vscode';
import * as xdlVersions from '@expo/xdl/build/Versions';
import * as config from './config';
import * as schema from './schema';
import * as storage from './storage';

/**
 * Download, store and activate the global Expo manifest JSON schema.
 * This will not check if the cache has an existing one, because we always want to fetch the latest.
 */
export async function activateGlobalSchema(context: vscode.ExtensionContext) {
  const latestSdk = await xdlVersions.newestReleasedSdkVersionAsync();
  const schemaFile = await schema.getSchema(latestSdk.version);
  const storagePath = await storage.storeSchema(context, schemaFile);
  await config.registerGlobalSchema(storagePath);
}

/**
 * Remove any existing Expo manifest JSON schema from global config.
 */
export async function deactivateGlobalSchema() {
  await config.unregisterGlobalSchema();
}
