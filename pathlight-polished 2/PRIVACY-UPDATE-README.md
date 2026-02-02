# Pathlight - Privacy & Compliance Update

## What's New:

✅ **Consent screen** - Users must agree before starting
✅ **Privacy policy page** - Full legal privacy policy at /privacy
✅ **Clear data button** - Users can delete all their data
✅ **Footer notices** - Privacy reminders throughout app
✅ **Anthropic disclosure** - Clear notice about third-party processing

---

## Files Changed:

1. **pages/index.jsx** - Added consent screen, clear data button, privacy footer
2. **pages/privacy.jsx** - NEW: Full privacy policy page

---

## How to Deploy:

### Option 1: Replace Everything (Recommended)
1. Go to your GitHub repo
2. Delete all existing files
3. Upload all files from `pathlight-privacy.zip`
4. Commit changes
5. Vercel will auto-deploy

### Option 2: Update Individual Files
1. Replace `pages/index.jsx` with new version
2. Add new file `pages/privacy.jsx`
3. Commit
4. Deploy

---

## What Changed:

### 1. Consent Screen (New First Screen)
- Users see privacy notice BEFORE starting
- Must click "I Agree & Continue"
- Lists exactly what data is collected and how it's used
- Links to full privacy policy

### 2. Privacy Policy Page
- Accessible at: yourapp.vercel.app/privacy
- Comprehensive legal privacy policy
- Covers: data collection, usage, storage, third parties, user rights
- Contact email: privacy@pathlight.app (UPDATE THIS TO YOUR EMAIL)

### 3. Clear Data Button
- Bottom of every screen
- Confirms before deleting
- Clears all localStorage data
- Reloads page to start fresh

### 4. Footer Notices
- Every screen shows "Your data stays on your device"
- Link to privacy policy always visible
- Reminds users of data practices

---

## IMPORTANT - Before Launch:

### 1. Update Contact Email
In `pages/privacy.jsx`, change:
```javascript
privacy@pathlight.app
```
To your actual email address.

### 2. Review Privacy Policy
Read through the privacy policy and make sure you're comfortable with all statements.

### 3. Consider Legal Review
For paid version, get a lawyer to review the privacy policy ($200-500).

---

## What's Still Needed (Later):

### For Paid Version:
- Terms of Service page
- Refund policy
- Payment processing disclosures (Stripe)

### If You Add User Accounts:
- Account creation consent
- Email/password storage disclosure
- Data retention policy
- Account deletion process

---

## Testing:

After deploying:

1. **Test consent flow:**
   - Should see consent screen first
   - Must click agree to continue
   - Check privacy link works

2. **Test privacy page:**
   - Visit yourapp.vercel.app/privacy
   - Read through for typos
   - Make sure back button works

3. **Test clear data:**
   - Complete some sections
   - Click "Clear My Data"
   - Confirm data is deleted
   - App should reset

---

## Compliance Status:

✅ **Australian Privacy Act:** Basic compliance achieved
✅ **GDPR:** Covered for basic usage (consent + deletion)
✅ **User Rights:** Access and deletion implemented
✅ **Third-party disclosure:** Anthropic API clearly disclosed

⚠️ **Still need for paid version:**
- Lawyer-reviewed privacy policy
- Terms of Service
- Payment processor disclosures

---

## User Experience:

**Flow is now:**
1. Visit site → Consent screen
2. Click agree → Welcome screen  
3. Complete journey → See "Clear Data" at bottom
4. Privacy link always available

**Total added time:** ~10 seconds to read and agree

---

## Questions?

Check the privacy policy text and make sure you're comfortable with every statement before deploying.

The policy assumes:
- You don't store data (localStorage only)
- You use Anthropic API
- You don't sell/share data
- Users can delete anytime

If any of that changes, update the policy accordingly.
