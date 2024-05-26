/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
	AzureWizardPromptStep,
	type IAzureQuickPickItem,
} from "@microsoft/vscode-azext-utils";
import { promptForFuncVersion } from "../../../FuncVersion";
import { hiddenStacksSetting } from "../../../constants";
import { localize } from "../../../localize";
import { cliFeedUtils } from "../../../utils/cliFeedUtils";
import { dotnetUtils } from "../../../utils/dotnetUtils";
import { getWorkspaceSetting } from "../../../vsCodeConfig/settings";
import type { IProjectWizardContext } from "../IProjectWizardContext";

export class DotnetRuntimeStep extends AzureWizardPromptStep<IProjectWizardContext> {
	public static async createStep(
		context: IProjectWizardContext,
	): Promise<DotnetRuntimeStep> {
		if (context.targetFramework) {
			context.targetFramework =
				typeof context.targetFramework === "string"
					? [context.targetFramework]
					: context.targetFramework;
			const runtimes = await getRuntimes(context);
			// if a targetFramework was provided from createNewProject
			const workerRuntime = runtimes.find((runtime) =>
				context.targetFramework?.includes(runtime.targetFramework),
			);
			if (!workerRuntime) {
				throw new Error(
					localize(
						"unknownFramework",
						'Unrecognized target frameworks: "{0}". Available frameworks: {1}.',
						context.targetFramework
							.map((tf) => `"${tf}"`)
							.join(", "),
						runtimes
							.map((rt) => `"${rt.targetFramework}"`)
							.join(", "),
					),
				);
			}
			setWorkerRuntime(context, workerRuntime);
		}

		return new DotnetRuntimeStep();
	}

	public async prompt(context: IProjectWizardContext): Promise<void> {
		const placeHolder: string = localize(
			"selectWorkerRuntime",
			"Select a .NET runtime",
		);
		let result: cliFeedUtils.IWorkerRuntime | undefined;
		while (true) {
			result = (
				await context.ui.showQuickPick(this.getPicks(context), {
					placeHolder,
				})
			).data;
			if (result) {
				break;
			} else {
				context.version = await promptForFuncVersion(context);
			}
		}

		setWorkerRuntime(context, result);
	}

	public shouldPrompt(context: IProjectWizardContext): boolean {
		return !context.workerRuntime;
	}

	private async getPicks(
		context: IProjectWizardContext,
	): Promise<IAzureQuickPickItem<cliFeedUtils.IWorkerRuntime | undefined>[]> {
		const runtimes = await getRuntimes(context);
		const picks: IAzureQuickPickItem<
			cliFeedUtils.IWorkerRuntime | undefined
		>[] = [];
		for (const runtime of runtimes) {
			picks.push({
				label: runtime.displayInfo.displayName,
				description: runtime.displayInfo.description,
				data: runtime,
			});
		}
		return picks;
	}
}

async function getRuntimes(
	context: IProjectWizardContext,
): Promise<cliFeedUtils.IWorkerRuntime[]> {
	const funcRelease = await cliFeedUtils.getRelease(
		context,
		await cliFeedUtils.getLatestVersion(context, context.version),
	);
	const showHiddenStacks = getWorkspaceSetting<boolean>(hiddenStacksSetting);
	const runtimes = Object.values(funcRelease.workerRuntimes.dotnet).filter(
		(r) => !r.displayInfo.hidden || showHiddenStacks,
	);
	if (runtimes.length === 0) {
		throw new Error("Internal error: No .NET worker runtimes found.");
	}
	return runtimes;
}

function setWorkerRuntime(
	context: IProjectWizardContext,
	runtime: cliFeedUtils.IWorkerRuntime,
): void {
	context.workerRuntime = runtime;
	context.projectTemplateKey =
		dotnetUtils.getTemplateKeyFromFeedEntry(runtime);
}
