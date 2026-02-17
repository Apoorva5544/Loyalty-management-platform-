# Loyalty Program Setup Instructions

## Overview
This setup includes:
1. **Signup Form** - Awards 100 points automatically when customers join
2. **Review Form** - Awards 50 points automatically + manual bonus points via admin dashboard
3. **Reviews Dashboard** - Admin can view all reviews and award additional points

## Setup Steps

### 1. Create Default Campaigns
First, run the setup script to create the default campaigns that will automatically award points:

```bash
cd backend
python setup_campaigns.py
```

This creates:
- **Welcome Bonus Campaign**: 100 points for SIGNUP events
- **Review Reward Campaign**: 50 points for REVIEW events

### 2. Configure the Forms
Update the configuration in both HTML forms:

#### In `signup_form.html`:
```javascript
const STORE_ID = "your-actual-store-id"; // Replace with your store ID
const API_BASE_URL = "http://localhost:8000"; // Replace with your API URL
```

#### In `review_form.html`:
```javascript
const STORE_ID = "your-actual-store-id"; // Replace with your store ID  
const API_BASE_URL = "http://localhost:8000"; // Replace with your API URL
```

### 3. Deploy the Forms
You can use these forms in several ways:

#### Option A: Embed in Your Website
Copy the form HTML and integrate it into your existing website pages.

#### Option B: Standalone Pages
Host the HTML files directly on your web server.

#### Option C: Iframe Integration
Embed the forms using iframes:
```html
<iframe src="signup_form.html" width="400" height="600"></iframe>
<iframe src="review_form.html" width="400" height="700"></iframe>
```

### 4. Access the Reviews Dashboard
1. Login to your admin dashboard at `/admin`
2. Navigate to "Reviews" in the sidebar
3. View all customer reviews
4. Award additional points (50 or 100) for excellent reviews

## How It Works

### Signup Flow
1. Customer fills out signup form
2. Form sends SIGNUP event to `/api/public/track`
3. System automatically creates user account
4. Welcome Bonus campaign awards 100 points
5. Customer receives confirmation

### Review Flow
1. Customer fills out review form
2. Form sends REVIEW event to `/api/public/track`
3. System records review in activities table
4. Review Reward campaign awards 50 points automatically
5. Admin can award additional points via dashboard

### Points Tracking
- All points are tracked in the `points_transactions` table
- User balances are updated automatically
- Admin can view all transactions and award manual bonuses

## Customization

### Modify Point Values
Edit the campaigns in your admin dashboard or update the setup script:
- Signup bonus: Default 100 points
- Review reward: Default 50 points
- Manual bonuses: 50 or 100 points (customizable)

### Form Styling
Both forms use Tailwind CSS and can be easily customized:
- Colors, fonts, layout
- Add your branding/logo
- Modify field requirements
- Add additional fields

### Integration
The forms work with the existing loyalty system API:
- `/api/public/track` - Records activities and awards points
- `/api/admin/reviews` - Lists reviews for admin
- `/api/admin/award-points` - Manual point awards

## Testing

1. **Test Signup**:
   - Fill out signup form
   - Check user appears in admin customers list
   - Verify 100 points awarded

2. **Test Review**:
   - Fill out review form  
   - Check review appears in admin reviews dashboard
   - Verify 50 points awarded automatically
   - Test manual point awards from dashboard

3. **Test Points**:
   - Check user points balance updates correctly
   - Verify transactions appear in system

## Troubleshooting

### Common Issues
1. **CORS Errors**: Make sure your API allows requests from your form domain
2. **Store ID Not Found**: Verify the STORE_ID in the forms matches your actual store
3. **Points Not Awarded**: Check that campaigns are active and properly configured

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify API endpoints are accessible
3. Check database for activity records
4. Confirm campaigns are active in admin dashboard

## Security Notes
- Forms validate email addresses
- API endpoints have proper error handling
- User data is stored securely in the database
- Admin authentication required for point awards

## Next Steps
- Add email notifications for point awards
- Create additional campaigns for other activities
- Customize form designs to match your brand
- Add more review fields (product categories, images, etc.)