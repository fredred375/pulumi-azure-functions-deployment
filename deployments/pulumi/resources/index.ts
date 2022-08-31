// Copyright 2016-2021, Pulumi Corporation.  All rights reserved.

import * as pulumi from "@pulumi/pulumi";

import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";

const currentStack = pulumi.getStack();

// use stack to differentiate resource groups
const resourceGroupName = `${
  process.env.RESOURCE_GROUP_NAME || "azure-function-example"
}-${currentStack}`;

// account names only accept alphanumeric values and should also be differentiated in the subscription scope
const accountName = `${
  process.env.ACCOUNT_NAME || "azurefunctionac"
}${currentStack}`.replace(/[^0-9a-z]/gi, "");

const containerName = process.env.CONTAINER_NAME || "azure-function-example";

const resourceGroup = new resources.ResourceGroup(resourceGroupName, {
  resourceGroupName,
});

const account = new storage.StorageAccount(accountName, {
  accountName,
  resourceGroupName: resourceGroup.name,
  sku: {
    name: storage.SkuName.Standard_LRS,
  },
  kind: storage.Kind.StorageV2,
});

const container = new storage.BlobContainer(containerName, {
  resourceGroupName: resourceGroup.name,
  accountName: account.name,
});
