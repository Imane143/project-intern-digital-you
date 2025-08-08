# CollabSpace Storage Configuration

## Overview
CollabSpace now uses a centralized storage system for all uploaded files. This keeps project files separate from application code and provides better organization.

## Storage Location
By default, files are stored in: `~/collabspace-storage/`

The structure is:
```
collabspace-storage/
├── workspaces/
│   ├── workspace-1/
│   │   └── documents/
│   └── workspace-2/
│       └── documents/
├── avatars/           # User profile pictures (future feature)
│   └── user-1/
└── temp/             # Temporary files (auto-cleaned)
```

## Configuration

### Environment Variable
You can customize the storage location by setting the `COLLABSPACE_STORAGE_PATH` environment variable in your `.env` file:

```bash
# Use default (~/collabspace-storage/)
COLLABSPACE_STORAGE_PATH=

# Or specify custom path
COLLABSPACE_STORAGE_PATH=/path/to/my/storage
```

### Migration
If you have existing files in the old `uploads/` directory, run:
```bash
npm run migrate-storage
```

This will:
1. Create the new storage directory structure
2. Move all existing files to the new location
3. Update database references
4. Clean up the old uploads directory

## Benefits
1. **Separation of Concerns**: Application code and user data are kept separate
2. **Better Organization**: Files are organized by workspace
3. **Easier Backups**: All user data in one location
4. **Scalability**: Easy to move to cloud storage later
5. **Security**: Storage can be placed outside web root

## Future Enhancements
- Cloud storage support (S3, Google Cloud Storage)
- File versioning
- Automatic backups
- Storage quotas per workspace