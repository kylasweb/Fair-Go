# Prisma Schema Configuration

## Issue Resolution: Multiple Schema Conflicts

This workspace contains multiple Prisma schemas that were causing conflicts:

1. **Main Application Schema**: `./prisma/schema.prisma` (primary)
2. **IVR Service Schema**: `./ivr-service/prisma/schema.prisma` (separate microservice)
3. **Production Schema**: `./deployment/schema.production.prisma` (deployment template)

## Solution Applied

### VS Code Settings Configuration

- Updated `.vscode/settings.json` to exclude conflicting schema paths
- Set `prisma.schemaPath` to point only to main application schema
- Added file watchers and search exclusions for ivr-service and deployment folders

### Directory Structure

```
├── prisma/schema.prisma           # Main application schema (ACTIVE)
├── ivr-service/
│   └── prisma/schema.prisma       # IVR microservice schema (EXCLUDED)
└── deployment/
    └── schema.production.prisma   # Production template (EXCLUDED)
```

### Workspace Configuration

- Created `fairgo-workspace.code-workspace` for multi-folder development
- Separate `.vscode/settings.json` in ivr-service directory for isolated development

## Development Guidelines

1. **Main Application**: Use `./prisma/schema.prisma` for all main app changes
2. **IVR Service**: Open `./ivr-service` as separate VS Code workspace when needed
3. **Production Deployment**: Use `./deployment/schema.production.prisma` as template

## Commands

```bash
# Main application
npx prisma generate
npx prisma migrate dev

# IVR service (from ivr-service directory)
cd ivr-service
npx prisma generate
npx prisma migrate dev
```

This configuration ensures clean development environment without schema conflicts while maintaining all functionality.
