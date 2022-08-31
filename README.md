# pulumi-azure-function-example

Example deploy code for js code on Azure functions.

## Development

### Requirements

- Pulumi
- Azure CLI

### Instruction

#### Clone Code

```bash
git clone git@gitlab.com:moxa/ibg/software/platform/cloud/public/examples/nodejs-azure-function-example/deployments/pulumi-azure-function.git
```

#### Setup Local Environment

```bash
# setup azure cli
azure login

# setup pulumi
pulumi login
```

#### Deployment

Run

```bash
pulumi up -C deployments/pulumi/resources
```

if resource groups and storage accounts are yet not created.

To deploy a plan

```bash
pulumi up -C deployments/pulumi/plan
```

To deploy a function

```bash
pulumi up -C deployments/pulumi/function
```

#### Pipeline

Needed environment variables defined in Gitlab CI/CD settings:

```
ARM_CLIENT_ID
ARM_CLIENT_SECRET
ARM_SUBSCRIPTION_ID
ARM_TENANT_ID
PULUMI_ACCESS_TOKEN
```

#### Bugs

On deleting a Function App `pulumi destroy -C deployment/pulumi/function`, the according app service plan will also be deleted by default due to Azure.

This currently cannot be worked around by any pulumi code, since the current implementation of `pulumi destroy` deletes the stack based on the stack state, not on the Iac code.

https://github.com/pulumi/pulumi-azure-native/issues/1529

---

Changing the app service plan might cause the pulumi and thus gitlab ci to fail. This is due to the app service plan being replaced, which is not allowed by Azure if any app service using this plan exists. Currently pulumi cannot correctly deal with the replacement order of this resource, hence the seperate pulumi packages.

On pipeline fail please manally re-deploy the app.
# pulumi-azure-functions-deployment
