# Minecraft Location Bot & Admin Panel Specification

## Project Overview
A combined Discord bot and web application system for managing Minecraft Dynmap location markers. The system allows users to submit location requests via Discord, which administrators can review and approve through either Discord or a web interface.

## Core Components

### 1. Discord Bot
#### Features
- Monitors specific Discord channel for `!add` command
- Interactive dialogue with users to collect:
  - Minecraft username
  - Location name
  - X coordinates
  - Z coordinates
- Notifies admins of new requests
- Allows Discord admin approval via reactions or commands

#### Command Flow
1. User types `!add` in designated channel
2. Bot initiates DM conversation with user
3. Bot sequentially asks for required information
4. Data is stored in database
5. Notification sent to admin channel

### 2. Web Application
#### Admin Panel Features
- User authentication system
  - Basic username/password authentication
  - Admin role management
- Location request management
  - View pending requests
  - Approve/deny requests
  - Edit existing locations
  - Delete locations
- Location history tracking
  - Modification logs
  - Deletion logs

#### Database Schema
```sql
Users:
- id (PK)
- username
- password_hash
- role

Locations:
- id (PK)
- minecraft_username
- location_name
- x_coord
- y_coord
- status (pending/approved/denied)
- created_at
- modified_at
- approved_by
- discord_message_id

AuditLog:
- id (PK)
- location_id (FK)
- action_type
- modified_by
- modified_at
- old_values
- new_values
```

### 3. RCON Integration
#### Features
- Secure connection to Minecraft server
- Executes Dynmap marker commands
- Command template:
  ```
  dmarker add "location_name" "x:y"
  ```
- Error handling for failed connections
- Retry mechanism for failed commands

## Technical Requirements

### Backend
- Node.js/Express.js for API
- Discord.js for bot functionality
- MySQL/PostgreSQL for database
- RCON protocol implementation
- JWT for API authentication

### Frontend
- React.js for admin panel
- Material-UI or Tailwind for styling
- Responsive design
- Real-time updates for new requests

### Security
- Password hashing
- Rate limiting for Discord commands
- Input validation
- CSRF protection
- Secure RCON credentials storage

## API Endpoints

### Authentication
```
POST /api/auth/login
POST /api/auth/logout
```

### Location Management
```
GET /api/locations
GET /api/locations/:id
POST /api/locations
PUT /api/locations/:id
DELETE /api/locations/:id
```

### Admin Actions
```
POST /api/locations/:id/approve
POST /api/locations/:id/deny
GET /api/audit-log
```

## Deployment Requirements
- Node.js runtime environment
- Database server
- Discord bot token
- RCON access to Minecraft server
- SSL certificate for secure connections
- Environment variables for sensitive data

## Future Enhancements
1. OAuth2 integration
2. Advanced permission system
3. Bulk location management
4. Location categories/tags
5. API rate limiting
6. Automated backups
7. Discord role-based permissions
8. Multiple Minecraft server support

## Implementation Steps
1. Set up Discord bot framework
2. Create basic database schema
3. Implement user authentication
4. Build location submission flow
5. Create admin panel frontend
6. Implement RCON integration
7. Add audit logging
8. Deploy MVP
9. Gather feedback
10. Implement improvements

## Notes
- All coordinates should be validated before submission
- Consider implementing cooldown for Discord commands
- Backup database regularly
- Monitor RCON connection stability
- Document all commands and APIs
