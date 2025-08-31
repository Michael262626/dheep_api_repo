# ZawadiTap API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Users](#users)
3. [Organizations](#organizations)
4. [Events](#events)
5. [Event Participation](#event-participation)
6. [Gifts](#gifts)
7. [Admin Portal](#admin-portal)
8. [Reports](#reports)
9. [Audit Logs](#audit-logs)

---

## Authentication

### Base URL: `/auth`

#### Request OTP
- **POST** `/auth/request-otp`
- **Description**: Request OTP for phone verification
- **Request Body**:
```typescript
{
  phone: string;        // Phone number (e.g., "+1234567890")
  deviceId: string;     // Unique device identifier
}
```
- **Response**:
```typescript
{
  success: boolean;     // Always true if request successful
}
```

#### Verify OTP
- **POST** `/auth/verify-otp`
- **Description**: Verify OTP and authenticate user
- **Request Body**:
```typescript
{
  phone: string;        // Phone number
  deviceId: string;     // Device identifier
  otp: string;          // 6-digit OTP code
}
```
- **Response**:
```typescript
{
  success: boolean;
  token?: string;       // JWT token if verification successful
  user?: {
    _id: string;
    phone: string;
    deviceId: string;
    isVerified: boolean;
  };
}
```

#### Admin Registration
- **POST** `/auth/admin/register`
- **Description**: Register a new admin organization
- **Request Body**:
```typescript
{
  name: string;                 // Organization name
  country: string;              // Country code
  adminEmail: string;           // Admin email address
  password: string;             // Admin password
  contactFirstName: string;     // Contact person first name
  contactLastName: string;      // Contact person last name
  contactMobile: string;        // Contact mobile number
}
```
- **Response**:
```typescript
{
  success: boolean;
  organization: {
    _id: string;
    name: string;
    adminEmail: string;
    country: string;
    contactFirstName: string;
    contactLastName: string;
    contactMobile: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    createdAt: Date;
  };
  message: string;
}
```

#### Admin Login
- **POST** `/auth/admin/login`
- **Description**: Authenticate admin user
- **Request Body**:
```typescript
{
  adminEmail: string;    // Admin email
  password: string;      // Admin password
  mfaCode?: string;      // MFA code if MFA is enabled
}
```
- **Response**:
```typescript
{
  success: boolean;
  token?: string;        // JWT token
  organization?: {
    _id: string;
    name: string;
    adminEmail: string;
    mfaEnabled: boolean;
    logo?: string;
  };
  requiresMfa?: boolean; // If MFA code is required
  message?: string;
}
```

#### Email Verification
- **GET** `/auth/verify-email/:token`
- **Description**: Verify email address using token
- **Parameters**:
  - `token`: Email verification token
- **Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

#### Forgot Password
- **POST** `/auth/forgot-password`
- **Description**: Request password reset
- **Request Body**:
```typescript
{
  email: string;         // Admin email address
}
```
- **Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

#### Reset Password
- **POST** `/auth/reset-password`
- **Description**: Reset password using token
- **Request Body**:
```typescript
{
  token: string;         // Password reset token
  newPassword: string;   // New password
}
```
- **Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

#### MFA Setup
- **POST** `/auth/mfa/setup`
- **Description**: Setup MFA for admin account
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**:
```typescript
{
  success: boolean;
  qrCode: string;        // QR code data URL
  secret: string;        // MFA secret key
  message: string;
}
```

#### Enable MFA
- **POST** `/auth/mfa/enable`
- **Description**: Enable MFA after setup
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
```typescript
{
  mfaCode: string;       // 6-digit MFA code
}
```
- **Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

#### Disable MFA
- **POST** `/auth/mfa/disable`
- **Description**: Disable MFA
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
```typescript
{
  mfaCode: string;       // 6-digit MFA code
}
```
- **Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

## Users

### Base URL: `/users`

#### Create User
- **POST** `/users`
- **Description**: Create a new user
- **Request Body**:
```typescript
{
  phone: string;         // Phone number
  deviceId: string;      // Device identifier
  name?: string;         // User name (optional)
}
```
- **Response**:
```typescript
{
  _id: string;
  phone: string;
  deviceId: string;
  name?: string;
  isVerified: boolean;
  participatedEvents: string[];
  completedEvents: string[];
  termsAccepted: boolean;
  termsAcceptedAt?: Date;
  tilesInteracted: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Get All Users
- **GET** `/users`
- **Description**: Get all users (admin only)
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**: Array of user objects

#### Get User by ID
- **GET** `/users/:id`
- **Description**: Get user by ID
- **Parameters**:
  - `id`: User ID
- **Response**: User object

#### Update User
- **PATCH** `/users/:id`
- **Description**: Update user information
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: User ID
- **Request Body**: Partial user object
- **Response**: Updated user object

#### Delete User
- **DELETE** `/users/:id`
- **Description**: Delete user
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: User ID
- **Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

## Organizations

### Base URL: `/organizations`

#### Create Organization
- **POST** `/organizations`
- **Description**: Create a new organization
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
```typescript
{
  name: string;                 // Organization name
  country: string;              // Country code
  adminEmail: string;           // Admin email
  contactFirstName: string;     // Contact first name
  contactLastName: string;      // Contact last name
  contactMobile: string;        // Contact mobile
  logo?: string;                // Logo URL (optional)
}
```
- **Response**: Organization object

#### Get All Organizations
- **GET** `/organizations`
- **Description**: Get all organizations
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**: Array of organization objects

#### Get Organization by ID
- **GET** `/organizations/:id`
- **Description**: Get organization by ID
- **Parameters**:
  - `id`: Organization ID
- **Response**: Organization object

#### Update Organization
- **PATCH** `/organizations/:id`
- **Description**: Update organization
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: Organization ID
- **Request Body**: Partial organization object
- **Response**: Updated organization object

#### Delete Organization
- **DELETE** `/organizations/:id`
- **Description**: Delete organization
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: Organization ID
- **Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

## Events

### Base URL: `/events`

#### Create Event
- **POST** `/events`
- **Description**: Create a new event
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
```typescript
{
  title: string;                // Event title
  description: string;          // Event description
  date: Date;                   // Event date and time
  instructions: string;         // Event instructions (HTML)
  termsAndConditions: string;   // Terms and conditions (HTML)
  tileBackgroundImage?: string; // Tile background image URL
  totalTiles: number;           // Total number of tiles
}
```
- **Response**: Event object

#### Get All Events
- **GET** `/events`
- **Description**: Get all events
- **Response**: Array of event objects

#### Get Organization Events
- **GET** `/events/organization/:orgId`
- **Description**: Get events for specific organization
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `orgId`: Organization ID
- **Response**: Array of event objects

#### Get Event by ID
- **GET** `/events/:id`
- **Description**: Get event by ID
- **Parameters**:
  - `id`: Event ID
- **Response**: Event object

#### Get Event Statistics
- **GET** `/events/:id/statistics`
- **Description**: Get event statistics
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: Event ID
- **Response**:
```typescript
{
  eventId: string;
  totalTiles: number;
  successfulDeeps: number;
  undeeped: number;
  giftsRedeemed: number;
  giftsUnredeemed: number;
  participationRate: number;
  completionRate: number;
}
```

#### Update Event
- **PATCH** `/events/:id`
- **Description**: Update event
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: Event ID
- **Request Body**: Partial event object
- **Response**: Updated event object

#### Update Event Status
- **PATCH** `/events/:id/status`
- **Description**: Update event status
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: Event ID
- **Request Body**:
```typescript
{
  status: 'active' | 'completed' | 'cancelled';
}
```
- **Response**: Updated event object

#### Delete Event
- **DELETE** `/events/:id`
- **Description**: Delete event
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: Event ID
- **Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

#### Participate in Event
- **POST** `/events/:id/participate`
- **Description**: User participates in event
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: Event ID
- **Response**:
```typescript
{
  success: boolean;
  eventId: string;
  userId: string;
  status: 'participating';
  message: string;
}
```

#### Complete Event
- **POST** `/events/:id/complete`
- **Description**: User completes event
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: Event ID
- **Response**:
```typescript
{
  success: boolean;
  eventId: string;
  userId: string;
  status: 'completed';
  qrCode: string;        // QR code for gift redemption
  message: string;
}
```

#### Get User Event History
- **GET** `/events/user/history`
- **Description**: Get user's event participation history
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**: Array of event objects

---

## Event Participation

### Base URL: `/event-participation`

#### Start Event Participation
- **POST** `/event-participation/:eventId/start`
- **Description**: Start participating in an event
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `eventId`: Event ID
- **Response**:
```typescript
{
  success: boolean;
  eventId: string;
  userId: string;
  status: 'started';
  message: string;
}
```

#### Accept Terms
- **POST** `/event-participation/:eventId/accept-terms`
- **Description**: Accept event terms and conditions
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `eventId`: Event ID
- **Response**:
```typescript
{
  success: boolean;
  eventId: string;
  userId: string;
  status: 'terms_accepted';
  termsAccepted: boolean;
  termsAcceptedAt: Date;
  message: string;
}
```

#### Interact with Tiles
- **POST** `/event-participation/:eventId/interact-tiles`
- **Description**: Interact with event tiles
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `eventId`: Event ID
- **Request Body**:
```typescript
{
  tileCount?: number;    // Number of tiles to interact with (default: 1)
}
```
- **Response**:
```typescript
{
  success: boolean;
  eventId: string;
  userId: string;
  tilesInteracted: number;
  totalTiles: number;
  message: string;
}
```

#### Complete Event Participation
- **POST** `/event-participation/:eventId/complete`
- **Description**: Complete event participation
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `eventId`: Event ID
- **Response**:
```typescript
{
  success: boolean;
  eventId: string;
  userId: string;
  status: 'completed';
  qrCode: string;        // QR code for gift redemption
  completionCertificate: string; // Completion certificate URL
  message: string;
}
```

#### Get Participation Status
- **GET** `/event-participation/:eventId/status`
- **Description**: Get user's participation status for an event
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `eventId`: Event ID
- **Response**:
```typescript
{
  eventId: string;
  userId: string;
  status: 'not_started' | 'started' | 'terms_accepted' | 'tiles_interacted' | 'completed';
  termsAccepted: boolean;
  termsAcceptedAt?: Date;
  tilesInteracted: number;
  totalTiles: number;
  completionDate?: Date;
  qrCode?: string;
}
```

---

## Gifts

### Base URL: `/gifts`

#### Create Gift
- **POST** `/gifts`
- **Description**: Create a new gift
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Request Body**:
```typescript
{
  name: string;          // Gift name
  description: string;   // Gift description
  event: string;         // Event ID
  quantity: number;      // Available quantity
  claimed: boolean;      // Whether gift is claimed
  redeemed: boolean;     // Whether gift is redeemed
  claimedBy?: string;    // User ID who claimed it
  redeemedBy?: string;   // Organization ID who redeemed it
  claimedAt?: Date;      // When gift was claimed
  redeemedAt?: Date;     // When gift was redeemed
}
```
- **Response**: Gift object

#### Get All Gifts
- **GET** `/gifts`
- **Description**: Get all gifts
- **Response**: Array of gift objects

#### Get Gift by ID
- **GET** `/gifts/:id`
- **Description**: Get gift by ID
- **Parameters**:
  - `id`: Gift ID
- **Response**: Gift object

#### Update Gift
- **PATCH** `/gifts/:id`
- **Description**: Update gift
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: Gift ID
- **Request Body**: Partial gift object
- **Response**: Updated gift object

#### Delete Gift
- **DELETE** `/gifts/:id`
- **Description**: Delete gift
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: Gift ID
- **Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

#### Upload Gift Inventory
- **POST** `/gifts/upload/:eventId`
- **Description**: Upload gift inventory file (Excel/CSV)
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `eventId`: Event ID
- **Request Body**: Form data with file
- **Response**:
```typescript
{
  success: boolean;
  message: string;
  giftsCreated: number;
  giftsUpdated: number;
  errors?: string[];
}
```

#### Claim Gift
- **POST** `/gifts/:id/claim`
- **Description**: User claims a gift
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: Gift ID
- **Response**:
```typescript
{
  success: boolean;
  giftId: string;
  userId: string;
  claimed: boolean;
  claimedAt: Date;
  message: string;
}
```

#### Redeem Gift
- **POST** `/gifts/:id/redeem`
- **Description**: Organization redeems a claimed gift
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `id`: Gift ID
- **Response**:
```typescript
{
  success: boolean;
  giftId: string;
  orgId: string;
  redeemed: boolean;
  redeemedAt: Date;
  message: string;
}
```

#### Get User Gift History
- **GET** `/gifts/user/history`
- **Description**: Get user's gift claim history
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Response**: Array of gift objects

#### Get Event Gift Statistics
- **GET** `/gifts/event/:eventId/statistics`
- **Description**: Get gift statistics for an event
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `eventId`: Event ID
- **Response**:
```typescript
{
  eventId: string;
  totalGifts: number;
  claimedGifts: number;
  redeemedGifts: number;
  availableGifts: number;
  claimRate: number;
  redemptionRate: number;
}
```

#### Get Organization Gift Statistics
- **GET** `/gifts/organization/:orgId/statistics`
- **Description**: Get gift statistics for an organization
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `orgId`: Organization ID
- **Response**:
```typescript
{
  orgId: string;
  totalGifts: number;
  redeemedGifts: number;
  pendingGifts: number;
  redemptionRate: number;
}
```

---

## Admin Portal

### Base URL: `/admin`

#### Admin Portal UI
- **GET** `/admin/portal`
- **Description**: Serve admin portal HTML interface
- **Response**: HTML page

#### Dashboard
- **GET** `/admin/dashboard`
- **Description**: Get admin dashboard statistics
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`
- **Response**:
```typescript
{
  totalOrganizations: number;
  totalEvents: number;
  totalUsers: number;
  totalGifts: number;
  activeEvents: number;
  completedEvents: number;
  recentActivity: Array<{
    action: string;
    user: string;
    target: string;
    timestamp: Date;
  }>;
}
```

#### Organization Dashboard
- **GET** `/admin/dashboard/organization/:orgId`
- **Description**: Get organization-specific dashboard
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`
- **Parameters**:
  - `orgId`: Organization ID
- **Response**: Organization dashboard data

#### System Overview
- **GET** `/admin/system/overview`
- **Description**: Get system overview (super admin only)
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Roles**: `SUPER_ADMIN`
- **Response**:
```typescript
{
  systemStats: {
    totalOrganizations: number;
    totalEvents: number;
    totalUsers: number;
    totalGifts: number;
  };
  recentRegistrations: Array<Organization>;
  systemHealth: {
    status: string;
    uptime: number;
    version: string;
  };
}
```

#### System Health
- **GET** `/admin/system/health`
- **Description**: Get system health status
- **Roles**: `SUPER_ADMIN`
- **Response**:
```typescript
{
  status: string;
  uptime: number;
  timestamp: Date;
  version: string;
}
```

#### Get All Organizations
- **GET** `/admin/organizations`
- **Description**: Get all organizations with pagination
- **Roles**: `SUPER_ADMIN`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
- **Response**:
```typescript
{
  organizations: Organization[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

#### Get Organization
- **GET** `/admin/organizations/:id`
- **Description**: Get organization details
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`
- **Parameters**:
  - `id`: Organization ID
- **Response**: Organization object with analytics

#### Update Organization Status
- **PUT** `/admin/organizations/:id/status`
- **Description**: Update organization status
- **Roles**: `SUPER_ADMIN`
- **Parameters**:
  - `id`: Organization ID
- **Request Body**:
```typescript
{
  status: 'active' | 'suspended' | 'deleted';
}
```
- **Response**: Updated organization object

#### Upload Organization Logo
- **POST** `/admin/organizations/:id/logo`
- **Description**: Upload organization logo
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`
- **Parameters**:
  - `id`: Organization ID
- **Request Body**: Form data with logo file
- **Response**:
```typescript
{
  success: boolean;
  logoUrl: string;
  organization: Organization;
}
```

#### Search Organizations
- **GET** `/admin/organizations/search`
- **Description**: Search organizations
- **Roles**: `SUPER_ADMIN`
- **Query Parameters**:
  - `q`: Search query (minimum 2 characters)
- **Response**: Array of matching organizations

#### Get All Events
- **GET** `/admin/events`
- **Description**: Get all events with filtering and pagination
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`, `EVENT_MANAGER`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `status`: Event status filter
  - `organization`: Organization filter
- **Response**:
```typescript
{
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

#### Get Event
- **GET** `/admin/events/:id`
- **Description**: Get event with analytics
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`, `EVENT_MANAGER`
- **Parameters**:
  - `id`: Event ID
- **Response**: Event object with analytics

#### Update Event Status
- **PUT** `/admin/events/:id/status`
- **Description**: Update event status
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`, `EVENT_MANAGER`
- **Parameters**:
  - `id`: Event ID
- **Request Body**:
```typescript
{
  status: 'active' | 'completed' | 'cancelled';
}
```
- **Response**: Updated event object

#### Delete Event
- **DELETE** `/admin/events/:id`
- **Description**: Delete event
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`
- **Parameters**:
  - `id`: Event ID
- **Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

#### Get All Users
- **GET** `/admin/users`
- **Description**: Get all users with filtering and pagination
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `verified`: Filter by verification status
- **Response**:
```typescript
{
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

#### Get User
- **GET** `/admin/users/:id`
- **Description**: Get user with analytics
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`
- **Parameters**:
  - `id`: User ID
- **Response**: User object with analytics

#### Search Users
- **GET** `/admin/users/search`
- **Description**: Search users
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`
- **Query Parameters**:
  - `q`: Search query (minimum 2 characters)
- **Response**: Array of matching users

#### Get All Gifts
- **GET** `/admin/gifts`
- **Description**: Get all gifts with filtering and pagination
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`, `GIFT_MANAGER`
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `claimed`: Filter by claimed status
  - `event`: Filter by event
- **Response**:
```typescript
{
  gifts: Gift[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

#### Get Gift Statistics
- **GET** `/admin/gifts/statistics`
- **Description**: Get gift statistics
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`, `GIFT_MANAGER`
- **Query Parameters**:
  - `event`: Event ID (optional)
  - `organization`: Organization ID (optional)
- **Response**: Gift statistics object

#### Get Audit Logs
- **GET** `/admin/audit-logs`
- **Description**: Get audit logs with filtering
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`
- **Query Parameters**:
  - `action`: Action filter
  - `user`: User filter
  - `organization`: Organization filter
  - `startDate`: Start date filter
  - `endDate`: End date filter
  - `limit`: Maximum results (default: 100)
- **Response**: Array of audit log objects

#### Export Organizations Report
- **GET** `/admin/reports/organizations`
- **Description**: Export organizations report
- **Roles**: `SUPER_ADMIN`
- **Response**:
```typescript
{
  success: boolean;
  message: string;
  data: Organization[];
  format: string;
}
```

#### Export Events Report
- **GET** `/admin/reports/events`
- **Description**: Export events report
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`
- **Query Parameters**:
  - `organization`: Organization ID (optional)
- **Response**:
```typescript
{
  success: boolean;
  message: string;
  data: Event[];
  format: string;
}
```

#### Export Users Report
- **GET** `/admin/reports/users`
- **Description**: Export users report
- **Roles**: `SUPER_ADMIN`, `ORGANIZATION_ADMIN`
- **Query Parameters**:
  - `organization`: Organization ID (optional)
- **Response**:
```typescript
{
  success: boolean;
  message: string;
  data: User[];
  format: string;
}
```

---

## Reports

### Base URL: `/reports`

#### Event Participation Report
- **GET** `/reports/event/:eventId/participation`
- **Description**: Download event participation report as CSV
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Parameters**:
  - `eventId`: Event ID
- **Response**: CSV file download

---

## Audit Logs

### Base URL: `/audit-logs`

#### Get Audit Logs
- **GET** `/audit-logs`
- **Description**: View/filter audit logs
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Query Parameters**:
  - `action`: Action filter
  - `user`: User filter
  - `organization`: Organization filter
  - `target`: Target filter
- **Response**: Array of audit log objects

---

## Common Response Types

### Error Response
```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

### Pagination Response
```typescript
{
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
```

### Success Response
```typescript
{
  success: boolean;
  message?: string;
  data?: any;
}
```

---

## Authentication & Authorization

### JWT Token Format
- **Header**: `Authorization: Bearer <JWT_TOKEN>`
- **Token Expiry**: 7 days (configurable)

### Role-Based Access Control
- **SUPER_ADMIN**: Full system access
- **ORGANIZATION_ADMIN**: Organization-level access
- **EVENT_MANAGER**: Event management access
- **GIFT_MANAGER**: Gift management access

### MFA Support
- **Setup**: QR code generation for authenticator apps
- **Verification**: 6-digit TOTP codes
- **Enforcement**: Configurable per organization

---

## Rate Limiting & Security

### OTP Rate Limiting
- **Request Limit**: 3 attempts per phone number per 15 minutes
- **Verification Limit**: 5 attempts per phone number per 15 minutes
- **OTP Expiry**: 10 minutes

### File Upload Limits
- **Logo Files**: Max 5MB, JPG/PNG only
- **Gift Inventory**: Max 10MB, Excel/CSV only

### Security Headers
- **CORS**: Configured for mobile and web clients
- **Helmet**: Security headers enabled
- **Rate Limiting**: Per IP address

---

## Development & Testing

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/zawaditap

# JWT
JWT_SECRET=your-secret-key

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-number

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Testing
- **Unit Tests**: Jest framework
- **E2E Tests**: Supertest with Jest
- **Coverage**: Minimum 80% required

### API Documentation
- **Swagger UI**: Available at `/api` endpoint
- **OpenAPI Spec**: Generated automatically
- **Postman Collection**: Available in `/docs` folder
