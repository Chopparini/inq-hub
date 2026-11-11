### 1.Logowanie oraz wyświetleie tenantId i subscriptionId
az login
az account show --query "{subscriptionId:id, tenantId:tenantId}" -o table

### 2.Rejestracja aplikacji i service principal:
az ad app create --display-name gh-inq-hub-deploy --query appId -o tsv
az ad sp create --id <APP_ID>

// (<APP_ID> = wynik pierwszej komendy)

### 3.Poświadczenie federacyjne dla środowiska GitHub production
az ad app federated-credential create --id <APP_ID-do-podmiany> --parameters '{
  "name": "gh-production",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:Chopparini/inq-hub:environment:production",
  "audiences": ["api://AzureADTokenExchange"]
}'

### 4.Ustawienie roli Contributor tylko na grupie zasobów projektu (minimalne uprawnienia)
az role assignment create --assignee <APP_ID> --role Contributor \
  --scope /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/rg-wsb-projekt

/// <SUBSCRIPTION_ID> = wynik komendy az account show --query "{subscriptionId:id, tenantId:tenantId}" -o table z kroku 1 
