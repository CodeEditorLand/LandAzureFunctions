/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ext } from '../extensionVariables';
import { cpUtils } from './cpUtils';

export namespace gitUtils {
    const gitCommand: string = 'git';
    export async function isGitInstalled(workingDirectory: string): Promise<boolean> {
        try {
            await cpUtils.executeCommand(undefined, workingDirectory, gitCommand, '--version');
            return true;
        } catch (error) {
            return false;
        }
    }

    export async function gitInit(workingDirectory: string): Promise<void> {
        await cpUtils.executeCommand(ext.outputChannel, workingDirectory, gitCommand, 'init');
    }

    export async function isInsideRepo(workingDirectory: string): Promise<boolean> {
        try {
            await cpUtils.executeCommand(undefined, workingDirectory, gitCommand, 'rev-parse', '--git-dir');
            return true;
        } catch (error) {
            return false;
        }
    }
}
