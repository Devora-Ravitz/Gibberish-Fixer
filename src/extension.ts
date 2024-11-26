import * as vscode from 'vscode';
import axios from 'axios';

const keyboardMap: { [key: string]: string } = {
    a: 'ש', b: 'נ', c: 'ב', d: 'ג', e: 'ק', f: 'כ', g: 'ע', h: 'י', i: 'ן', j: 'ח', k: 'ל', l: 'ך', m: 'צ',
    n: 'מ', o: 'ם', p: 'פ', q: '/', r: 'ר', s: 'ד', t: 'א', u: 'ו', v: 'ה', w: '\'', x: 'ס', y: 'ט', z: 'ז',
    ',': 'ת',
    ש: 'a', נ: 'b', ב: 'c', ג: 'd', ק: 'e', כ: 'f', ע: 'g', י: 'h', ן: 'i', ח: 'j', ל: 'k', ך: 'l', צ: 'm',
    מ: 'n', ם: 'o', פ: 'p', '/': 'q', ר: 'r', ד: 's', א: 't', ו: 'u', ה: 'v', '\'': 'w', ס: 'x', ט: 'y', ז: 'z',
    ת: ','
};

interface OpenAIResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Hebrew to English Fixer is now active!');

    const setApiKeyCommand = vscode.commands.registerCommand('myExtension.setApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API Key',
            ignoreFocusOut: true,
            password: true, 
        });

        if (apiKey) {
            await context.globalState.update('openaiApiKey', apiKey);
            vscode.window.showInformationMessage('API Key saved successfully!');
        } else {
            vscode.window.showWarningMessage('No API Key entered. Please try again.');
        }
    });
    context.subscriptions.push(setApiKeyCommand);

    vscode.workspace.onDidChangeTextDocument(async (event) => {
        const apiKey = context.globalState.get<string>('openaiApiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage('No API Key set. Please run the "Set API Key" command.');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            console.log('No active editor found.');
            return;
        }

        const document = editor.document;
        const position = editor.selection.active;

        const change = event.contentChanges[0];
        if (!change) {
            console.log('No content changes detected.');
            return;
        }

        const changeText = change.text;
        if (changeText !== ' ' && changeText !== '\n') {
            return;
        }

        const lineText = document.lineAt(position.line).text;
        const words = lineText.trim().split(/\s+/);
        const lastWord = words[words.length - 1];

        if (lastWord) {
            const mappedWord = mapKeyboard(lastWord);
            const fixedWord = await checkAndFixWord(lastWord, mappedWord, apiKey);

            if (fixedWord && fixedWord !== lastWord) {
                const range = new vscode.Range(
                    position.line,
                    lineText.lastIndexOf(lastWord),
                    position.line,
                    lineText.lastIndexOf(lastWord) + lastWord.length
                );

                editor.edit((editBuilder: vscode.TextEditorEdit) => {
                    editBuilder.replace(range, fixedWord);
                });

                vscode.window.showInformationMessage(
                    `${lastWord} was replaced with ${fixedWord}. Undo?`,
                    "Undo"
                ).then((choice) => {
                    if (choice === "Undo") {
                        editor.edit((editBuilder: vscode.TextEditorEdit) => {
                            editBuilder.replace(range, lastWord);
                        });
                        vscode.window.showInformationMessage(`${fixedWord} was reverted to ${lastWord}.`);
                    }
                });
            }
        }
    });
}

export function deactivate() {
    console.log('Hebrew to English Fixer is now deactivated.');
}

function mapKeyboard(word: string): string {
    return word.split('').map(char => keyboardMap[char] || char).join('');
}

async function checkAndFixWord(originalWord: string, mappedWord: string, apiKey: string): Promise<string | null> {
    const apiUrl = 'https://api.openai.com/v1/chat/completions';

    try {
        const originalCheckResponse = await axios.post<OpenAIResponse>(
            apiUrl,
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an assistant that checks if a word is valid. Reply "Valid" or "Invalid".'
                    },
                    {
                        role: 'user',
                        content: `Is the word "${originalWord}" valid?`
                    }
                ],
                max_tokens: 10,
                temperature: 0,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                }
            }
        );

        const originalCheck = originalCheckResponse.data.choices[0].message.content.trim();
        if (originalCheck === 'Valid') {
            return null;
        }

        const mappedCheckResponse = await axios.post<OpenAIResponse>(
            apiUrl,
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an assistant that checks if a word is valid. Reply "Valid" or "Invalid".'
                    },
                    {
                        role: 'user',
                        content: `Is the word "${mappedWord}" valid?`
                    }
                ],
                max_tokens: 10,
                temperature: 0,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                }
            }
        );

        const mappedCheck = mappedCheckResponse.data.choices[0].message.content.trim();
        return mappedCheck === 'Valid' ? mappedWord : null;

    } catch (error: any) {
        console.error('Error communicating with OpenAI API:', error.response?.status, error.response?.data || error.message || error);
        return null;
    }
}
