# How to Import Billing Plans Manually

## 📋 Overview
This guide shows you how to manually import the billing plans into your Firestore database using the provided JSON file.

## 📁 Files
- `billing-plans.json` - Contains the two billing plans (Free Trial and Standard Plan)

## 🚀 Import Methods

### Method 1: Firebase Console (Recommended)

1. **Open Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `tailorflow-bfc99`

2. **Navigate to Firestore**
   - Click "Firestore Database" in the left sidebar
   - Go to the "Data" tab

3. **Import the JSON file**
   - Click the three dots (⋮) next to your project name
   - Select "Import JSON"
   - Choose the `billing-plans.json` file
   - Set the collection name to: `billingPlans`
   - Click "Import"

4. **Verify Import**
   - You should see 2 documents in the `billingPlans` collection
   - Each plan should have all fields populated correctly

### Method 2: Firebase CLI

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Import the data**
   ```bash
   firebase firestore:import billing-plans.json --project tailorflow-bfc99 -c billingPlans
   ```

### Method 3: Using the Seed Page

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Navigate to seed page**
   - Open your browser
   - Go to: `http://localhost:5173/seed-plans`

3. **Click the seed button**
   - Click "Seed Billing Plans"
   - The plans will be created automatically

## 📊 Billing Plans Details

### Plan 1: Free Trial
- **Name**: Free Trial
- **Type**: FREE
- **Price**: 0 GHS
- **Billing Cycle**: DAILY
- **Recommended Duration**: 3 days
- **Features**: Full access to all features
- **Limits**: 
  - 50 customers
  - 100 orders
  - 3 team members
  - 500MB storage

### Plan 2: Standard Plan
- **Name**: Standard Plan
- **Type**: PROFESSIONAL
- **Price**: 43 GHS
- **Billing Cycle**: MONTHLY
- **Features**: Full access + premium features
- **Limits**:
  - 200 customers
  - 500 orders
  - 5 team members
  - 2GB storage

## ✅ Verification

After importing, verify the plans by:

1. **Check Firestore Console**
   - Go to Firestore Database → Data tab
   - Look for `billingPlans` collection
   - Should contain 2 documents

2. **Check in App**
   - Start the app and login as super admin
   - Go to Settings → Billing Plans Management
   - You should see both plans listed

3. **Test Plan Selection**
   - Try creating a new shop
   - You should be able to select from the imported plans

## 🔧 Troubleshooting

### Common Issues

1. **Import Fails**
   - Ensure you're using the correct project ID: `tailorflow-bfc99`
   - Check that the JSON file is properly formatted
   - Verify you have the necessary permissions

2. **Plans Not Showing**
   - Refresh the browser
   - Check that `isActive` is set to `true`
   - Verify the collection name is exactly `billingPlans`

3. **Date Format Issues**
   - The JSON uses Firestore Timestamp format
   - If needed, you can update dates manually in the console

### Manual Entry Alternative

If import fails, you can manually create the documents:

1. Go to Firestore Console → `billingPlans` collection
2. Click "Add document"
3. Copy-paste the fields from the JSON file for each plan
4. Save each document

## 📞 Support

If you encounter any issues:
1. Check the Firebase Console for error messages
2. Verify your project permissions
3. Ensure the JSON file is not corrupted
4. Try the alternative import methods

## 🎉 Success!

Once imported successfully:
- ✅ Free Trial plan available for 3-day trials
- ✅ Standard Plan available at 43 GHS/month
- ✅ Both plans provide full feature access
- ✅ Ready for customer onboarding
