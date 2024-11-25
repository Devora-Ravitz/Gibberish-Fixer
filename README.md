# Hebrew to English Fixer

A Visual Studio Code extension that dynamically fixes Hebrew gibberish to English text.

## Features
- Automatically detects and fixes gibberish text written in Hebrew.
- Highlights words that need correction and suggests replacements.
- Provides options to replace or keep the original word.
- Undo functionality for accidental replacements.

## Installation
1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar.
3. Search for "Hebrew to English Fixer" and click "Install".

## Setting up an OpenAI API Key
This extension requires an OpenAI API Key to function. Follow these steps to create and configure your API key:

1. Go to the [OpenAI API Key Page](https://platform.openai.com/signup/).
2. Sign up or log in to your OpenAI account.
3. Generate a new API key under the API section.
4. Copy your API key.

### Configuring the API Key in the Extension
1. Open Visual Studio Code.
2. Go to **Settings** (`Ctrl+,` or `Cmd+,` on macOS).
3. Search for `Hebrew to English Fixer`.
4. Paste your OpenAI API Key into the `API Key` field.

Alternatively, you can configure the API Key directly in your settings file:
1. Open your `settings.json` file in VS Code.
2. Add the following line:
   ```json
   "hebrewToEnglishFixer.apiKey": "your-api-key-here"
