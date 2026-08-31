import { downloadApiJson } from "@ui5/dts-generator";

export async function getOpenUI5PossibleLibNames(version) {
    const openUI5OrgResponse = await fetch(`https://registry.npmjs.com/-/v1/search?text=@openui5&size=250`, {
        headers: {
            "User-Agent": "@ui5-dts-generator",
        },
    });
    if (!openUI5OrgResponse.ok) {
        console.error(`error fetching sapui5 metadata`);
        return [];
    }
    const openUI5OrgSearchText = await openUI5OrgResponse.text();
    const openUI5OrgSearch = JSON.parse(openUI5OrgSearchText);
    const possibleOpenUI5LibNames = openUI5OrgSearch.objects
        .map((packageObject) => packageObject.package.name)
        .filter((name) => name.startsWith("@openui5/sap"))
        .map((name) => name.replace("@openui5/", ""))
        .filter((name) => {
            return name !== 'sap.ui.demokit'
        })
    return possibleOpenUI5LibNames;
}

const version = "1.136.18";

// async function getOpenUILibraries(version) {
//     const response = await fetch(
//         `https://unpkg.com/@sapui5/distribution-metadata@${version}/metadata.json`
//     );

//     if (!response.ok) {
//         throw new Error(
//             `Failed to fetch distribution metadata: ${response.status} ${response.statusText}`
//         );
//     }

//     const metadata = await response.json();

//     return Object.keys(metadata.libraries)
//         .filter(name => name.startsWith("sap."));
// }
async function downloadApi(){
    
    const libraries = await getOpenUI5PossibleLibNames(version);

    console.log(`Found ${libraries.length} libraries`);
    //console.log(libraries.join(','));

    await downloadApiJson(libraries,version,"./tmp/api");

}

 
async function main() {
    console.log(`Getting OpenUI5 libraries for ${version}...`);
    await downloadApi();
    console.log("api.json files downloaded!");
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});