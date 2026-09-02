const controlTemplates = require("./control")

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
        [className]: controlTemplates.createTagOnlySnippet(classInfo),
        //  {
        //     prefix: getPrefix(),
        //     body: [`<${baseName} `, "\t$1", "\t/>"],
        //     description: className,
        // },
        [`${className}-properties`]: controlTemplates.renderProperties(classInfo),
        [`${className}-aggregations`]: controlTemplates.renderAggregations(classInfo),
        [`${className}-events`]: controlTemplates.renderEvents(classInfo),
        [`${className}-all`]: controlTemplates.renderFull(classInfo),
    };
}

module.exports = makeSnippetSet