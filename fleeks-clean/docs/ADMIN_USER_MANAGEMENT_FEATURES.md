# Admin User Management Features

## Overview
The admin panel now includes enhanced user management features for managing memberships, creating accounts, and setting restrictions.

## Features Implemented

### 1. Membership Management
- **Change Membership Type**: Admins can change users between Free, Premium, and VIP memberships
- **Automatic Expiration**: Premium and VIP memberships are automatically set to expire after 30 days
- **Dropdown Selection**: Easy dropdown interface to change membership types

### 2. Create New User Accounts
- **Create User Button**: Green "新規ユーザー作成" (Create New User) button in the top right
- **User Creation Form**:
  - Email address (required)
  - Password (required, minimum 8 characters)
  - Full name (optional)
  - Username (optional)
  - Membership type selection (Free/Premium/VIP)
  - Role selection (User/Admin)
- **Validation**: Ensures email and password requirements are met
- **Success Feedback**: Toast notifications for successful creation

### 3. Account Restrictions
- **Account Status**: Each user now has an active/suspended status
- **Status Toggle**: Easy button to suspend or activate accounts
- **Visual Indicators**:
  - Green checkmark for active accounts
  - Red ban icon for suspended accounts
- **Real-time Updates**: Status changes are immediately reflected

## API Endpoints

### POST /api/admin/users
Supports the following actions:
- `createUser`: Create a new user account
- `updateMembership`: Change user membership type
- `updateRole`: Change user role (user/admin)
- `updateStatus`: Change account status (active/suspended)
- `updatePassword`: Set a new password for a user

## Database Changes

### New Column: status
- Added `status` column to `fleeks_profiles` table
- Values: 'active' or 'suspended'
- Default: 'active'
- Indexed for performance

## Security
- All operations require admin authentication
- API endpoints verify admin role before processing
- Service role key used for admin operations

## Usage Instructions

### To Apply Database Changes:
1. Go to Supabase SQL Editor
2. Run the script in `/scripts/add-user-status-column.sql`

### To Create a New User:
1. Click the green "新規ユーザー作成" button
2. Fill in the required fields
3. Select membership type and role
4. Click "ユーザーを作成"

### To Change Membership:
1. Find the user in the list
2. Use the dropdown next to their current membership
3. Select the new membership type

### To Suspend/Activate Account:
1. Find the user in the list
2. Click the ban/checkmark button in the actions column
3. Account status changes immediately

## Error Handling
- Duplicate email detection
- Password validation (minimum 8 characters)
- Network error handling with retry logic
- Clear error messages in Japanese