# EAS Secrets Setup

## RevenueCat iOS API Key

The production RevenueCat iOS API key has been configured to use EAS secrets.

### Setting the Secret

Run the following command to set the production iOS API key:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value appl_NtZPViWRdJiiBaXDGFqUNsyitxx --type string
```

### How It Works

- **Development builds**: Uses the test key (`test_UaGbgyycZMSWByKGNzpUurFFxun`) as fallback
- **Production builds**: Uses the key from EAS secrets (`appl_NtZPViWRdJiiBaXDGFqUNsyitxx`)

The code automatically detects which environment it's running in and uses the appropriate key.

### Verifying the Secret

To verify the secret is set correctly:

```bash
eas secret:list
```

You should see `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` in the list.

### Updating the Secret

If you need to update the secret:

```bash
eas secret:update --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value appl_NtZPViWRdJiiBaXDGFqUNsyitxx
```
