#!/usr/bin/env node
// Imports the Google Cloud client library
const { Translate } = require("@google-cloud/translate").v2;
const _cliProgress = require("cli-progress");
const fs = require("fs");

const progressBar = new _cliProgress.Bar(
  {},
  _cliProgress.Presets.shades_classic
);

const addNoTranslate = (sourceString) => {
  return sourceString
    .replace("{", '<span class="notranslate">')
    .replace("}", "</span>");
};

const removeNoTranslate = (sourceString) => {
  return sourceString
    .replace('<span class="notranslate">', "{")
    .replace("</span>", "}");
};

async function main(args) {
  const [
    sourceFile,
    targetFile,
    targetLanguageCode = "zh",
    keyFilename = "./google-translate-api-key.json",
  ] = args;

  const targetKeyFile =
    process.env.GOOGLE_TRANSLATION_API_CREDENTIALS || keyFilename;

  const translateOptions = {
    keyFilename: targetKeyFile,
  };

  // eslint-disable-next-line no-console
  console.log("Instantiating Google client");
  const translate = new Translate(translateOptions);

  const rawData = fs.readFileSync(sourceFile);
  const jsonData = JSON.parse(rawData);

  const translatedObject = {};
  let numberOfKeys = 0;
  // eslint-disable-next-line no-console
  console.log("Translating ...");
  progressBar.start(Object.keys(jsonData).length, 0);
  for (const [key, value] of Object.entries(jsonData)) {
    const [translation] = await translate.translate(
      addNoTranslate(value),
      targetLanguageCode
    );
    translatedObject[key] = removeNoTranslate(translation);
    numberOfKeys++;
    progressBar.update(numberOfKeys);
  }
  progressBar.stop();
  // eslint-disable-next-line no-console
  console.log(`${numberOfKeys} keys translated successfully!`);
  // eslint-disable-next-line no-console
  console.log(`Writing ${targetFile} . . .`);

  fs.writeFileSync(targetFile, JSON.stringify(translatedObject, null, 4));
}

const args = process.argv.slice(2);
main(args).catch(console.error);
