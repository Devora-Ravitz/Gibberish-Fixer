"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const keyboardMap = {
    a: 'ש', b: 'נ', c: 'ב', d: 'ג', e: 'ק', f: 'כ', g: 'ע', h: 'י', i: 'ן', j: 'ח', k: 'ל', l: 'ך', m: 'צ',
    n: 'מ', o: 'ם', p: 'פ', q: '/', r: 'ר', s: 'ד', t: 'א', u: 'ו', v: 'ה', w: '\'', x: 'ס', y: 'ט', z: 'ז',
    ',': 'ת',
    ש: 'a', נ: 'b', ב: 'c', ג: 'd', ק: 'e', כ: 'f', ע: 'g', י: 'h', ן: 'i', ח: 'j', ל: 'k', ך: 'l', צ: 'm',
    מ: 'n', ם: 'o', פ: 'p', '/': 'q', ר: 'r', ד: 's', א: 't', ו: 'u', ה: 'v', '\'': 'w', ס: 'x', ט: 'y', ז: 'z',
    ת: ','
};
function activate(context) {
    console.log('Hebrew to English Fixer is now active!');
    const setApiKeyCommand = vscode.commands.registerCommand('myExtension.setApiKey', () => __awaiter(this, void 0, void 0, function* () {
        const apiKey = yield vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API Key',
            ignoreFocusOut: true,
            password: true,
        });
        if (apiKey) {
            yield context.globalState.update('openaiApiKey', apiKey);
            vscode.window.showInformationMessage('API Key saved successfully!');
        }
        else {
            vscode.window.showWarningMessage('No API Key entered. Please try again.');
        }
    }));
    context.subscriptions.push(setApiKeyCommand);
    vscode.workspace.onDidChangeTextDocument((event) => __awaiter(this, void 0, void 0, function* () {
        const apiKey = context.globalState.get('openaiApiKey');
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
            const fixedWord = yield checkAndFixWord(lastWord, mappedWord, apiKey);
            if (fixedWord && fixedWord !== lastWord) {
                const range = new vscode.Range(position.line, lineText.lastIndexOf(lastWord), position.line, lineText.lastIndexOf(lastWord) + lastWord.length);
                editor.edit((editBuilder) => {
                    editBuilder.replace(range, fixedWord);
                });
                vscode.window.showInformationMessage(`${lastWord} was replaced with ${fixedWord}. Undo?`, "Undo").then((choice) => {
                    if (choice === "Undo") {
                        editor.edit((editBuilder) => {
                            editBuilder.replace(range, lastWord);
                        });
                        vscode.window.showInformationMessage(`${fixedWord} was reverted to ${lastWord}.`);
                    }
                });
            }
        }
    }));
}
function deactivate() {
    console.log('Hebrew to English Fixer is now deactivated.');
}
function mapKeyboard(word) {
    return word.split('').map(char => keyboardMap[char] || char).join('');
}
function checkAndFixWord(originalWord, mappedWord, apiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const apiUrl = 'https://api.openai.com/v1/chat/completions';
        try {
            const originalCheckResponse = yield axios_1.default.post(apiUrl, {
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
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const originalCheck = originalCheckResponse.data.choices[0].message.content.trim();
            if (originalCheck === 'Valid') {
                return null;
            }
            const mappedCheckResponse = yield axios_1.default.post(apiUrl, {
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
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`
                }
            });
            const mappedCheck = mappedCheckResponse.data.choices[0].message.content.trim();
            return mappedCheck === 'Valid' ? mappedWord : null;
        }
        catch (error) {
            console.error('Error communicating with OpenAI API:', (_a = error.response) === null || _a === void 0 ? void 0 : _a.status, ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message || error);
            return null;
        }
    });
}
