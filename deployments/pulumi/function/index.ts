// Copyright 2016-2021, Pulumi Corporation.  All rights reserved.

import * as pulumi from "@pulumi/pulumi";

import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";
import * as web from "@pulumi/azure-native/web";

import { getConnectionString } from "./helpers";

const currentStack = pulumi.getStack();

const resourceGroupName = `${
  process.env.RESOURCE_GROUP_NAME || "azure-function-example"
}-${currentStack}`;
const accountName = `${
  process.env.ACCOUNT_NAME || "azurefunctionac"
}${currentStack}`.replace(/[^0-9a-z]/gi, "");
const containerName = process.env.CONTAINER_NAME || "azure-function-example";
const codeBlobName = `function-${process.env.ENV}-v${process.env.VERSION}-${process.env.UPSTREAM_CI_COMMIT_SHORT_SHA}.zip`;
const prevBlobName = `function-${process.env.ENV}-v${process.env.PREV_VERSION}-${process.env.PREV_CI_COMMIT_SHORT_SHA}.zip`;
const planName = process.env.PLAN_NAME || "plan";

// Find existing resource group for this example.
const resourceGroup = resources.getResourceGroupOutput({
  resourceGroupName,
});

// Storage account is required by Function App.
const storageAccount = storage.getStorageAccountOutput({
  accountName,
  resourceGroupName,
});

// Function code archives are stored in this container.
const codeContainer = storage.getBlobContainerOutput({
  accountName,
  resourceGroupName,
  containerName,
});

// Define a Consumption Plan for the Function App.
// You can change the SKU to Premium or App Service Plan if needed.
const plan = web.getAppServicePlanOutput({
  resourceGroupName: resourceGroup.name,
  name: planName,
});

// Build the connection string and zip archive's SAS URL. They will go to Function App's settings.
const storageConnectionString = getConnectionString(
  resourceGroup.name,
  storageAccount.name
);

const codeBlobSAS = storage.listStorageAccountServiceSASOutput({
  accountName: storageAccount.name,
  protocols: storage.HttpProtocol.Https,
  sharedAccessExpiryTime: "2030-01-01",
  sharedAccessStartTime: "2021-01-01",
  resourceGroupName: resourceGroup.name,
  resource: storage.SignedResource.C,
  permissions: storage.Permissions.R,
  canonicalizedResource: pulumi.interpolate`/blob/${storageAccount.name}/${codeContainer.name}`,
  contentType: "application/json",
  cacheControl: "max-age=5",
  contentDisposition: "inline",
  contentEncoding: "deflate",
});

const codeBlobUrl = pulumi.interpolate`https://${storageAccount.name}.blob.core.windows.net/${codeContainer.name}/${codeBlobName}?${codeBlobSAS.serviceSasToken}`;
const prevBlobUrl = pulumi.interpolate`https://${storageAccount.name}.blob.core.windows.net/${codeContainer.name}/${prevBlobName}?${codeBlobSAS.serviceSasToken}`;

const app = new web.WebApp("functionApp", {
  resourceGroupName: resourceGroup.name,
  serverFarmId: plan.id,
  kind: "functionapp",
  siteConfig: {
    appSettings: [
      { name: "AzureWebJobsStorage", value: storageConnectionString },
      { name: "FUNCTIONS_EXTENSION_VERSION", value: "~3" },
      { name: "FUNCTIONS_WORKER_RUNTIME", value: "node" },
      { name: "WEBSITE_NODE_DEFAULT_VERSION", value: "~14" },
      {
        name: "WEBSITE_RUN_FROM_PACKAGE",
        value: currentStack === "prod-0" ? prevBlobUrl : codeBlobUrl,
      },
    ],
    http20Enabled: true,
    nodeVersion: "~14",
  },
  name: `example-function-app-${currentStack}`,
});

const appSlot = new web.WebAppSlot("functionApp", {
  resourceGroupName: resourceGroup.name,
  serverFarmId: plan.id,
  kind: "functionapp",
  siteConfig: {
    appSettings: [
      { name: "AzureWebJobsStorage", value: storageConnectionString },
      { name: "FUNCTIONS_EXTENSION_VERSION", value: "~3" },
      { name: "FUNCTIONS_WORKER_RUNTIME", value: "node" },
      { name: "WEBSITE_NODE_DEFAULT_VERSION", value: "~14" },
      {
        name: "WEBSITE_RUN_FROM_PACKAGE",
        value: currentStack === "prod-0" ? codeBlobUrl : prevBlobUrl,
      },
    ],
    http20Enabled: true,
    nodeVersion: "~14",
  },
  name: app.name,
  slot: "prev",
});

export const funcVersion = process.env.VERSION;
export const commit = process.env.UPSTREAM_CI_COMMIT_SHORT_SHA;
export const endpoint = pulumi.interpolate`https://${app.defaultHostName}/api/HelloWorld?name=Pulumi`;
export const slotEndpoint = pulumi.interpolate`https://${appSlot.defaultHostName}/api/HelloWorld?name=Pulumi`;
