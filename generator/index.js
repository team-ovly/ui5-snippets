const fs = require("fs/promises");
const path = require("path");

const apiDirectory = path.resolve(__dirname, "../tmp/api");
const outputDirectory = path.resolve(__dirname, "../snippets-generated");

function getClasses(apiFiles) {
    return apiFiles.flatMap((apiFile) => apiFile.symbols || [])
        .filter((symbol) => symbol.kind === "class" && symbol.name && symbol["ui5-metadata"]);
}

function isControlClass(className, classesByName, checkedClasses = new Map()) {
    if (className === "sap.ui.core.Control") {
        return false;
    }
    if (checkedClasses.has(className)) {
        return checkedClasses.get(className);
    }

    const classInfo = classesByName.get(className);
    if (!classInfo) {
        return false;
    }
    if (classInfo.extends === "sap.ui.core.Control") {
        checkedClasses.set(className, true);
        return true;
    }

    checkedClasses.set(className, false);
    const result = isControlClass(classInfo.extends, classesByName, checkedClasses);
    checkedClasses.set(className, result);
    return result;
}

function xmlValue(value) {
    if (value === undefined || value === null) {
        return "";
    }
    return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function getPrefix(className, suffix = "") {
    const baseName = className.split(".").pop();
    const kebabName = baseName.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    return `!5-${kebabName}${suffix ? `-${suffix}` : ""}`;
}

function propertyLines(properties) {
    return properties.map((property) => `${property.name}="${xmlValue(property.defaultValue)}"`);
}

function aggregationLines(aggregations) {
    return aggregations.flatMap((aggregation) => [
        `<${aggregation.name}>`,
        `\t<!-- <${aggregation.type || "Control"} /> -->`,
        `</${aggregation.name}>`,
    ]);
}

function eventLines(events, associations) {
    return events.concat(associations).map((event, index) => {
        const handlerName = event.name.charAt(0).toUpperCase() + event.name.slice(1);
        return `${event.name}=".on\${${index + 3}:${handlerName}}"`;
    });
}

function makeSnippetSet(classInfo) {
    const metadata = classInfo["ui5-metadata"];
    const properties = metadata.properties || [];
    const aggregations = metadata.aggregations || [];
    const associations = metadata.associations || [];
    const events = metadata.events || [];
    const className = classInfo.name;
    const baseName = className.split(".").pop();
    const propertiesBodyLines = propertyLines(properties);
    const aggregationsBodyLines = aggregationLines(aggregations);
    const eventsBodyLines = eventLines(events, associations);
    const propertyBody = propertiesBodyLines.length ? propertiesBodyLines.map((line, index) => `${index === 0 ? "$1" : ""}${line}${index === propertiesBodyLines.length - 1 ? "$2" : ""}`) : ["$1$2"];
    const aggregationBody = aggregationsBodyLines.length ? aggregationsBodyLines.map((line, index) => `${index === 0 ? "$1" : ""}${line}`) : ["$1$2"];
    if (aggregationBody.length > 1) {
        aggregationBody.push("$2");
    }
    const eventBody = eventsBodyLines.length ? eventsBodyLines.map((line, index) => `${index === 0 ? "$1" : ""}${line}${index === eventsBodyLines.length - 1 ? "$2" : ""}`) : ["$1$2"];
    const combinedLines = [...propertiesBodyLines, ...aggregationsBodyLines, ...eventsBodyLines];
    const combinedBody = combinedLines.length ? combinedLines.map((line, index) => `${index === 0 ? "$1" : ""}${line}${index === combinedLines.length - 1 ? "$2" : ""}`) : ["$1$2"];

    return {
        [className]: {
            prefix: getPrefix(className),
            body: [`<${baseName} `, "\t$1", "\t/>"],
            description: className,
        },
        [`${className}-properties`]: {
            prefix: getPrefix(className, "properties"),
            body: propertyBody,
            description: `${className} with non-inherited properties`,
        },
        [`${className}-aggregations`]: {
            prefix: getPrefix(className, "aggregations"),
            body: aggregationBody,
            description: `${className} with non-inherited aggregations`,
        },
        [`${className}-events`]: {
            prefix: getPrefix(className, "events"),
            body: eventBody,
            description: `${className} with non-inherited events`,
        },
        [`${className}-all`]: {
            prefix: getPrefix(className, "all"),
            body: combinedBody,
            description: `${className} with non-inherited properties, aggregations and events`,
        },
    };
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