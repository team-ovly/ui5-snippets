function getXmlTagName(className) {
    const parts = className.split(".");
    const namespace = parts.slice(0, -1).join(".");
    const classNameOnly = parts.at(-1);

    const prefixMap = {
        "sap.m": "m",
        "sap.f": "f",
        "sap.f.cards": "cards",
        "sap.f.semantic": "semantic",
        "sap.m.semantic": "semantic",
        "sap.m.table.columnmenu": "columnmenu",
        
        "sap.m.p13n": "p13n",
        "sap.m.upload": "upload",
        "sap.tnt": "tnt",
        
        
        "sap.ui.core": "core",
        "sap.ui.table": "table",
        "sap.ui.layout": "l",
        "sap.ui.comp": "comp"
    };

    //const prefix = prefixMap[namespace];
    const prefix = parts[parts.length - 2]
    if (!prefix) {
        throw new Error(`Unknown UI5 namespace: ${namespace}`);
    }

    return `${prefix}:${classNameOnly}`;
}

function getSnippetPrefix(className) {
    return className
        .replaceAll(".", "-")
        .toLowerCase();
}

function createTagOnlySnippet(control) {
    const tagName = getXmlTagName(control.name);
    const prefix = getSnippetPrefix(control.name);

    return {
        prefix: `!5-${prefix}`,
        body: [
            `<${tagName} `,
            "\t$1",
            "\t/>"
        ],
        description: control.name
    };
}

function renderProperties(control) {
    const tagName = getXmlTagName(control.name);
    const prefix = getSnippetPrefix(control.name);

    const properties = control["ui5-metadata"]?.properties
        ?.filter(property => property.visibility === "public")
        ?.filter(property => property.defaultValue !== undefined)
        ?.map(property =>
            `\t${property.name}="${property.defaultValue}"`
        ) ?? [];

    return {
        prefix: `!5-${prefix}`,
        body: [
            `<${tagName}`,
            ...properties,
            "$1/>"
        ],
        description: control.name
    };
}

function renderAggregations(control) {
    const tagName = getXmlTagName(control.name);
    const prefix = getSnippetPrefix(control.name);

    const aggregations = control["ui5-metadata"]?.aggregations
        ?.filter(aggregation => aggregation.visibility === "public")
        ?? [];

    const body = [
        `<${tagName}>`
    ];

    let tabStop = 1;

    for (const aggregation of aggregations) {
        const aggregationTag = getXmlTagName(aggregation.type);

        body.push(
            `\t<${aggregationTag}>`,
            `\t\t$${tabStop++}`,
            `\t</${aggregationTag}>`
        );
    }

    body.push(`</${tagName}>`);

    return {
        prefix: `!5-${prefix}`,
        body,
        description: control.name
    };
}

function renderEvents(control) {
    const tagName = getXmlTagName(control.name);

    const events = control["ui5-metadata"]?.events
        ?.filter(event => event.visibility === "public")
        ?? [];

    const body = [`<${tagName}`];

    let tabStop = 1;

    for (const event of events) {
        body.push(
            `\t${event.name}=".on${capitalize(event.name)}"`
        );
    }

    body.push(
        `\t$${tabStop}`,
        "/>"
    );

    return {
        prefix: `!5-${getSnippetPrefix(control.name)}`,
        body,
        description: control.name
    };
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderFull(control) {
    const tagName = getXmlTagName(control.name);
    const metadata = control["ui5-metadata"];

    const properties = metadata?.properties
        ?.filter(property => property.visibility === "public")
        ?.filter(property => property.defaultValue !== undefined)
        ?? [];

    const aggregations = metadata?.aggregations
        ?.filter(aggregation => aggregation.visibility === "public")
        ?? [];

    const events = metadata?.events
        ?.filter(event => event.visibility === "public")
        ?? [];

    const body = [
        `<${tagName}`
    ];

    // Properties
    for (const property of properties) {
        body.push(
            `\t${property.name}="${property.defaultValue}"`
        );
    }

    // Events
    for (const event of events) {
        body.push(
            `\t${event.name}=".on${capitalize(event.name)}"`
        );
    }

    // Aggregations
    if (aggregations.length === 0) {
        body.push(
            "\t$1",
            "/>"
        );
    } else {
        body.push(">");

        let tabStop = 1;

        for (const aggregation of aggregations) {
            const itemTagName = getXmlTagName(aggregation.type);

            body.push(
                `\t<${aggregation.name}>`,
                `\t\t<${itemTagName}`,
                `\t\t\t$${tabStop++}`,
                "\t\t/>",
                `\t</${aggregation.name}>`
            );
        }

        body.push(
            `</${tagName}>`
        );
    }

    return {
        prefix: `!5-${getSnippetPrefix(control.name)}`,
        body,
        description: control.name
    };
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

module.exports = {
    createTagOnlySnippet,
    renderProperties,
    renderAggregations,
    renderEvents,
    renderFull,
    getXmlTagName,
    getSnippetPrefix
};