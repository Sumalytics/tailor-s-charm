# Firebase Storage Setup Guide

## Issue Fixed: Logo Upload CORS Error

The logo upload was failing due to missing Firebase Storage security rules. Here's how to fix it:

## Step 1: Deploy Storage Security Rules

1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `tailorflow-bfc99`
3. **Go to Storage**: In the left sidebar, click "Storage"
4. **Click "Rules" tab**: Near the top of the Storage page
5. **Replace the rules** with the following:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Files can be read by anyone who knows the URL
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Only authenticated users can upload files
    match /shops/{shopId}/{allPaths=**} {
      allow write: if request.auth != null && request.auth.uid == shopId.split('_')[0];
      allow read: if true;
    }
    
    // Allow users to upload to their own shop folder
    match /users/{userId}/{allPaths=**} {
      allow write: if request.auth != null && request.auth.uid == userId;
      allow read: if true;
    }
  }
}
```

6. **Click "Publish"**: Save and deploy the rules

## Step 2: Alternative (Simpler) Rules

If the above doesn't work, use these simpler rules for testing:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 3: Test the Upload

After deploying the rules:

1. **Refresh your browser**: Clear cache and reload the app
2. **Try uploading a logo**: It should now work without CORS errors
3. **Check Firebase Console**: Go to Storage → Files to see uploaded logos

## What Was Fixed

1. **Service Worker**: Updated to not cache Firebase requests (prevents CORS issues)
2. **Filename Sanitization**: Removes special characters from filenames
3. **Error Handling**: Better error messages for users
4. **Security Rules**: Proper Firebase Storage permissions

## Troubleshooting

If uploads still fail:

1. **Check Firebase Console**: Storage → Rules → Make sure rules are published
2. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check Network**: Ensure you have internet connection
4. **File Size**: Ensure file is under 2MB
5. **File Type**: Ensure it's an image file (jpg, png, etc.)

## Current Status

✅ **Fixed Issues:**
- Service Worker no longer interferes with Firebase requests
- Filename sanitization prevents special character issues
- Better error handling and user feedback
- Storage security rules provided

🔧 **Next Steps:**
1. Deploy the storage rules in Firebase Console
2. Test logo upload functionality
3. Verify logos appear in Firebase Storage

The upload should work once the storage rules are deployed!
