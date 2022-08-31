// Copyright 2016-2021, Pulumi Corporation.  All rights reserved.

import * as pulumi from "@pulumi/pulumi";

import * as resources from "@pulumi/azure-native/resources";
import * as web from "@pulumi/azure-native/web";

const resourceGroupName = `${
  process.env.RESOURCE_GROUP_NAME || "azure-function-example"
}-${pulumi.getStack()}`;

const planName = process.env.PLAN_NAME || "plan";

// Find existing resource group for this example.
const resourceGroup = resources.getResourceGroupOutput({
  resourceGroupName,
});

// Define a Consumption Plan for the Function App.
// You can change the SKU to Premium or App Service Plan if needed.
const plan = new web.AppServicePlan(planName, {
  resourceGroupName: resourceGroup.name,
  sku: {
    name: "Y1",
    tier: "Dynamic",
  },
  reserved: true,
  kind: "Linux",
  name: planName,
});
