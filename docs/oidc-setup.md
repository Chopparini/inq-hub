# Połączenie GitHub ↔ Azure przez OIDC

GitHub Actions loguje się do Azure bez haseł i kluczy, przez poświadczenie federacyjne (OIDC).
Komendy uruchamia się w Azure CLI na koncie z rolą **Owner** na subskrypcji.

## 1. Logowanie i odczytanie identyfikatorów

```bash
az login
az account show --query "{subscriptionId:id, tenantId:tenantId}" -o table
```

## 2. Rejestracja aplikacji i service principal

```bash
az ad app create --display-name gh-inq-hub-deploy --query appId -o tsv
az ad sp create --id <APP_ID>
```

`<APP_ID>` to wynik pierwszej komendy.

## 3. Poświadczenie federacyjne dla środowiska `production`

```bash
az ad app federated-credential create --id <APP_ID> --parameters '{
  "name": "gh-production-ids",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:Chopparini@43728674/inq-hub@1403051110:environment:production",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

## 4. Rola Contributor tylko na grupie zasobów projektu

```bash
az role assignment create --assignee <APP_ID> --role Contributor \
  --scope /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/rg-wsb-projekt
```

`<SUBSCRIPTION_ID>` to `subscriptionId` z kroku 1.

## 5. Sekrety w GitHubie

**Settings → Environments → `production` → Environment secrets**:

| Sekret | Wartość |
|---|---|
| `AZURE_CLIENT_ID` | `<APP_ID>` z kroku 2 |
| `AZURE_TENANT_ID` | `tenantId` z kroku 1 |
| `AZURE_SUBSCRIPTION_ID` | `subscriptionId` z kroku 1 |
