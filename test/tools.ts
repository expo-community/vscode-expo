import path from 'path';
import vscode from 'vscode';

const pkg = require('../../package');

/**
 * The unique ID of this extension.
 */
export const EXTENSION_ID = `${pkg.publisher}.${pkg.name}`;

/**
 * Get information from vscode about this extension.
 */
export const getExtension = () => vscode.extensions.getExtension(EXTENSION_ID)!;

/**
 * Get the absolute path to a fixture.
 *
 * @remark This is executed from `out/test`.
 */
export const getFixturePath = (target: string) =>
  path.resolve(__dirname, '../../test/fixtures', target);

/**
 * Get the contents of a fixture file.
 */
export const getFixtureFile = (target: string) => require(getFixturePath(target));

/**
 * Open and show a fixture file.
 */
export const openFixtureFile = async (target: string) =>
  await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument(getFixturePath(target))
  );

/**
 * Wait until the extension is activated.
 * This is a hacky workaround for the missing lifecycle events in the VSCode API.
 * It pings the extension's `isActive` property with a max duration of 5 seconds.
 */
export const waitForExtensionActivation = async (maxWait = 5 * 1000, delay = 1000) =>
  new Promise<void>((resolve) => {
    let checkTimer: NodeJS.Timeout;

    const maxTimer = setTimeout(() => {
      clearTimeout(checkTimer);
      resolve();
    }, maxWait);

    function pingExtension() {
      if (getExtension().isActive) {
        clearTimeout(maxTimer);
        resolve();
      } else {
        checkTimer = setTimeout(pingExtension, delay);
      }
    }

    pingExtension();
  });
