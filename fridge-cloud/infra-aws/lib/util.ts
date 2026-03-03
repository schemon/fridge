import {Construct} from "constructs";

export function getStageAppName(scope: Construct): string {
    return getStageName(scope) + '-' + getAppName(scope);
}

export function prefixedId(scope: Construct, id: string): string {
    return getStageAppName(scope) + '-' + id;
}

export function getAppName(scope: Construct): string {
    const appName = scope.node.tryGetContext('appName');

    if(appName == undefined || appName == '') {
        console.error('Missing appName. Rerun with -c appName=fridge-cloud');
        process.exit(1);
    }

    return appName;
}

export function getStageName(scope: Construct): string {
    const stageName = scope.node.tryGetContext('stageName');

    if(stageName == undefined || stageName == '') {
        console.error('Missing stageName. Rerun with -c stageName=a');
        process.exit(1);
    }

    return stageName;
}
