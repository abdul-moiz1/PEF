# Firestore Security Rules for PEF

These security rules should be configured in your Firebase Console under Firestore Database > Rules.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             (request.auth.token.email == 'admin@pef.com' || 
              request.auth.token.email == 'administrator@pef.com' ||
              request.auth.token.email == 'admin@pef.world');
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone can read approved users
      allow read: if resource.data.status == 'approved';
      
      // Users can read their own document regardless of status
      allow read: if isOwner(userId);
      
      // Admins can read all users
      allow read: if isAdmin();
      
      // Users can only create their own document during registration
      allow create: if isOwner(userId) && 
                       request.resource.data.status == 'pending';
      
      // Users can update their own document (but not change status)
      allow update: if isOwner(userId) && 
                       request.resource.data.status == resource.data.status;
      
      // Admins can update any user (including status changes)
      allow update: if isAdmin();
      
      // Only admins can delete users
      allow delete: if isAdmin();
    }
    
    // Job listings collection
    match /jobs/{jobId} {
      // Anyone can read approved job listings
      allow read: if resource.data.status == 'approved';
      
      // Users can read their own job listings regardless of status
      allow read: if isAuthenticated() && 
                     resource.data.employerId == request.auth.uid;
      
      // Admins can read all job listings
      allow read: if isAdmin();
      
      // Authenticated users can create job listings (pending approval)
      allow create: if isAuthenticated() && 
                       request.resource.data.employerId == request.auth.uid &&
                       request.resource.data.status == 'pending';
      
      // Users can update their own job listings (but not change status)
      allow update: if isAuthenticated() && 
                       resource.data.employerId == request.auth.uid &&
                       request.resource.data.status == resource.data.status;
      
      // Admins can update any job listing (including status changes)
      allow update: if isAdmin();
      
      // Users can delete their own job listings
      allow delete: if isAuthenticated() && 
                       resource.data.employerId == request.auth.uid;
      
      // Admins can delete any job listing
      allow delete: if isAdmin();
    }
    
    // Opportunities collection
    match /opportunities/{oppId} {
      // Anyone can read approved opportunities
      allow read: if resource.data.status == 'approved';
      
      // Users can read their own opportunities regardless of status
      allow read: if isAuthenticated() && 
                     resource.data.userId == request.auth.uid;
      
      // Admins can read all opportunities
      allow read: if isAdmin();
      
      // Authenticated users can create opportunities (pending approval)
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.status == 'pending';
      
      // Users can update their own opportunities (but not change status)
      allow update: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid &&
                       request.resource.data.status == resource.data.status;
      
      // Admins can update any opportunity (including status changes)
      allow update: if isAdmin();
      
      // Users can delete their own opportunities
      allow delete: if isAuthenticated() && 
                       resource.data.userId == request.auth.uid;
      
      // Admins can delete any opportunity
      allow delete: if isAdmin();
    }
    
    // Business listings collection
    match /businessListings/{bizId} {
      // Anyone can read approved business listings
      allow read: if resource.data.status == 'approved';
      
      // Users can read their own business listings regardless of status
      allow read: if isAuthenticated() && 
                     resource.data.ownerId == request.auth.uid;
      
      // Admins can read all business listings
      allow read: if isAdmin();
      
      // Authenticated users can create business listings (pending approval)
      allow create: if isAuthenticated() && 
                       request.resource.data.ownerId == request.auth.uid &&
                       request.resource.data.status == 'pending';
      
      // Users can update their own business listings (but not change status)
      allow update: if isAuthenticated() && 
                       resource.data.ownerId == request.auth.uid &&
                       request.resource.data.status == resource.data.status;
      
      // Admins can update any business listing (including status changes)
      allow update: if isAdmin();
      
      // Users can delete their own business listings
      allow delete: if isAuthenticated() && 
                       resource.data.ownerId == request.auth.uid;
      
      // Admins can delete any business listing
      allow delete: if isAdmin();
    }
    
    // Investment listings collection
    match /investmentListings/{invId} {
      // Anyone can read approved investment listings
      allow read: if resource.data.status == 'approved';
      
      // Users can read their own investment listings regardless of status
      allow read: if isAuthenticated() && 
                     resource.data.investorId == request.auth.uid;
      
      // Admins can read all investment listings
      allow read: if isAdmin();
      
      // Authenticated users can create investment listings (pending approval)
      allow create: if isAuthenticated() && 
                       request.resource.data.investorId == request.auth.uid &&
                       request.resource.data.status == 'pending';
      
      // Users can update their own investment listings (but not change status)
      allow update: if isAuthenticated() && 
                       resource.data.investorId == request.auth.uid &&
                       request.resource.data.status == resource.data.status;
      
      // Admins can update any investment listing (including status changes)
      allow update: if isAdmin();
      
      // Users can delete their own investment listings
      allow delete: if isAuthenticated() && 
                       resource.data.investorId == request.auth.uid;
      
      // Admins can delete any investment listing
      allow delete: if isAdmin();
    }
  }
}
```

## Key Security Features

1. **Role-Based Access Control**
   - Admin users (defined by email) have full access to all documents
   - Regular users can only modify their own data
   - Users cannot change their own approval status

2. **Public vs Private Data**
   - Only approved content is visible to the public
   - Users can always see their own content regardless of status
   - Pending/rejected content is hidden from non-owners

3. **Write Protection**
   - All new listings start with "pending" status
   - Users cannot self-approve their own content
   - Only admins can change approval status

4. **Data Integrity**
   - Users must be authenticated to create/modify content
   - Created documents must include correct user IDs
   - Status field is protected from user modification

## Admin Configuration

To add admin users:
1. Update the `isAdmin()` function in the security rules
2. Add admin email addresses to the condition
3. Alternatively, use Firebase Custom Claims for more scalable admin management

## Testing

Before deploying these rules:
1. Test with Firebase Emulator Suite
2. Verify authenticated users can create their own content
3. Verify users cannot modify others' content
4. Verify only admins can approve/reject content
5. Verify public can only see approved content
