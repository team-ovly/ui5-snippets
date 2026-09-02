const fs = require("fs/promises");
const path = require("path");
const makeSnippetSet = require("./templates")

const apiDirectory = path.resolve(__dirname, "../tmp/api");
const outputDirectory = path.resolve(__dirname, "../snippets-generated");

function getClasses(apiFiles) {
    return apiFiles.flatMap((apiFile) => apiFile.symbols || [])
        .filter((symbol) => {
            return  symbol.name && 
                    symbol.kind === "class" && 
                    symbol.deprecated === undefined &&
                    symbol.visibility === "public"
        });
}

function isControlClass(className, classesByName, checkedClasses = new Map()) {
    const classInfo = classesByName.get(className);
    if (!classInfo) {
        return false;
    }
    let ui5Metadata = classInfo["ui5-metadata"];
    return  ui5Metadata && 
            ui5Metadata.stereotype === "control"

    /*
    if (className === "sap.ui.core.Control") {
        return false;
    }
    if (checkedClasses.has(className)) {
        return checkedClasses.get(className);
    }


    if (classInfo.extends === "sap.ui.core.Control") {
        checkedClasses.set(className, true);
        return true;
    }

    checkedClasses.set(className, false);
    const result = isControlClass(classInfo.extends, classesByName, checkedClasses);
    checkedClasses.set(className, result);
    return result;
    */
}


async function main() {
    console.log(`Generate snippets based on OpenUI5 api.json files...`);
    const fileNames = (await fs.readdir(apiDirectory)).filter((fileName) => fileName.endsWith(".api.json"));
    const apiFiles = await Promise.all(fileNames.map(async (fileName) => {
        const content = await fs.readFile(path.join(apiDirectory, fileName), "utf8");
        return JSON.parse(content);
    }));
    const classes = getClasses(apiFiles);
    const classesByName = new Map(classes.map((classInfo) => [classInfo.name, classInfo]));
    const controlClasses = classes
        .filter((classInfo) => isControlClass(classInfo.name, classesByName))
        .sort((left, right) => left.name.localeCompare(right.name));

    await fs.mkdir(outputDirectory, { recursive: true });
    const outputFiles = new Set(controlClasses.map((classInfo) => `${classInfo.name}.code-snippets`));
    for (const fileName of await fs.readdir(outputDirectory)) {
        if (fileName.endsWith(".code-snippets") && !outputFiles.has(fileName)) {
            await fs.rm(path.join(outputDirectory, fileName));
        }
    }
    await Promise.all(controlClasses.map((classInfo) => fs.writeFile(
        path.join(outputDirectory, `${classInfo.name}.code-snippets`),
        `${JSON.stringify(makeSnippetSet(classInfo), null, 4)}\n`,
    )));

    console.log(`Generated ${controlClasses.length} class snippet files.`);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});