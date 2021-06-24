import vscode from 'vscode';
import * as xdlVersions from 'xdl/build/Versions';

import * as manifest from '..';
import * as config from '../config';
import * as schema from '../schema';
import * as storage from '../storage';

describe('activateGlobalSchema', () => {
  it('downloads latest schema, stores and registers it', async () => {
    const context = { globalStoragePath: 'path' } as any;
    const versionData = { version: '39.0.0', data: null };
    const schemaData = { schema: {} } as any;
    const storagePath = vscode.Uri.file('path/to/file');

    jest.spyOn(xdlVersions, 'newestReleasedSdkVersionAsync').mockResolvedValue(versionData);
    const schemaSpy = jest.spyOn(schema, 'create').mockResolvedValue(schemaData);
    const storageSpy = jest.spyOn(storage, 'storeSchema').mockResolvedValue(storagePath);
    const configSpy = jest.spyOn(config, 'registerGlobalSchema').mockResolvedValue();

    await manifest.activateGlobalSchema(context);

    expect(schemaSpy).toBeCalledWith(versionData.version);
    expect(storageSpy).toBeCalledWith(context, schemaData);
    expect(configSpy).toBeCalledWith(storagePath);
  });
});

describe('deactivateGlobalSchema', () => {
  it('unregisters global schema', async () => {
    const spy = jest.spyOn(config, 'unregisterGlobalSchema').mockResolvedValue();
    await manifest.deactivateGlobalSchema();
    expect(spy).toBeCalled();
  });
});
