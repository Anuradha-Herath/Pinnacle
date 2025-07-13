# Coupon Status Automation

## Overview
This system automatically updates coupon statuses based on their start and end dates. Coupons with `Future` status will automatically become `Active` when their start date arrives, and `Active` coupons will automatically become `Expired` when their end date passes.

## Features

### 1. Automatic Status Updates
- **Future → Active**: Coupons with status "Future" are automatically activated when their start date arrives
- **Active → Expired**: Active coupons are automatically expired when their end date passes
- **Future → Expired**: Future coupons that have both start and end dates in the past are directly set to expired

### 2. Multiple Triggering Methods
- **Middleware**: Updates run automatically when accessing coupon-related pages
- **React Hook**: Periodic updates every 30 minutes in the admin panel
- **Manual Button**: Admin can manually trigger updates from the coupon list page
- **API Endpoint**: Can be called by external cron services

### 3. User Interface Updates
- **Enhanced Coupon List**: Shows Active, Future, and Expired coupon counts
- **Status Indicators**: Clear visual indicators for each coupon status
- **Notifications**: Shows when coupons need status updates
- **Manual Update Button**: Allows admin to trigger immediate updates

## Files Created/Modified

### New Files Created:
1. **`/lib/couponStatusUpdater.ts`** - Core logic for updating coupon statuses
2. **`/app/api/coupons/update-status/route.ts`** - API endpoint for manual updates
3. **`/app/api/coupons/scheduler/route.ts`** - API endpoint for scheduled updates
4. **`/hooks/useCouponStatusUpdater.ts`** - React hook for periodic updates
5. **`/app/admin/components/CouponStatusNotification.tsx`** - Notification component

### Modified Files:
1. **`/middleware.ts`** - Added automatic status updates for coupon routes
2. **`/app/admin/couponlist/page.tsx`** - Enhanced with status updates and notifications

## API Endpoints

### GET /api/coupons/update-status
- Returns a list of coupons that need status updates
- Useful for checking what would be updated without making changes

### POST /api/coupons/update-status
- Triggers manual coupon status updates
- Returns the number of coupons updated and their details

### GET /api/coupons/scheduler
- Health check endpoint for the scheduler
- Returns system status and timestamp

### POST /api/coupons/scheduler
- Endpoint for scheduled updates (can be called by external cron services)
- Supports optional authorization header for security

## Status Logic

### Future Coupons
- Status: `Future`
- Condition: Start date is in the future
- Action: Automatically becomes `Active` when start date arrives

### Active Coupons
- Status: `Active`
- Condition: Current date is between start date and end date
- Action: Automatically becomes `Expired` when end date passes

### Expired Coupons
- Status: `Expired`
- Condition: End date has passed
- Action: Remains expired

## Implementation Details

### Date Comparison
- All date comparisons reset time to start of day (00:00:00) for accurate comparison
- Uses JavaScript Date objects for reliable date handling

### Performance
- Updates run in background without blocking the UI
- Efficient database queries using MongoDB's `findByIdAndUpdate`
- Batched updates using `Promise.all`

### Error Handling
- Comprehensive error handling with detailed logging
- Graceful fallbacks if database connection fails
- User-friendly error messages in the UI

## Usage

### For Administrators:
1. **Creating Future Coupons**: Set status to "Future" and specify start/end dates
2. **Manual Updates**: Click "Update Status" button in the coupon list
3. **Monitoring**: View notifications when coupons need updates
4. **Dashboard**: See counts of Active, Future, and Expired coupons

### For Developers:
1. **API Integration**: Use the update-status endpoint for manual triggers
2. **Scheduling**: Set up external cron jobs to call the scheduler endpoint
3. **Monitoring**: Check logs for automatic update activities
4. **Customization**: Modify the update logic in `couponStatusUpdater.ts`

## Security Considerations

### Optional Authorization
- Scheduler endpoint supports optional `CRON_SECRET` environment variable
- Add `Authorization: Bearer <CRON_SECRET>` header when calling scheduler endpoint
- Prevents unauthorized access to automated updates

### Environment Variables
```bash
# Optional: Add to .env.local for enhanced security
CRON_SECRET=your-secret-key-here
```

## External Cron Setup

### Vercel Cron (Recommended)
Create `vercel.json` in project root:
```json
{
  "crons": [
    {
      "path": "/api/coupons/scheduler",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### GitHub Actions
Create `.github/workflows/coupon-scheduler.yml`:
```yaml
name: Coupon Status Scheduler
on:
  schedule:
    - cron: '0 */6 * * *'
jobs:
  update-coupons:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger coupon status update
        run: |
          curl -X POST https://your-domain.com/api/coupons/scheduler \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Troubleshooting

### Common Issues:
1. **Database Connection**: Ensure MongoDB connection is stable
2. **Date Formats**: Verify date strings are in proper format
3. **Timezone**: Consider timezone differences in date comparisons
4. **Performance**: Monitor for high database load with many coupons

### Debugging:
- Check browser console for client-side errors
- Review server logs for API endpoint errors
- Test individual functions using the GET endpoints
- Verify MongoDB connection and data integrity

## Future Enhancements

### Potential Improvements:
1. **Timezone Support**: Add timezone-aware date handling
2. **Batch Processing**: Optimize for large numbers of coupons
3. **Audit Trail**: Log all status changes for tracking
4. **Email Notifications**: Notify admins of status changes
5. **Advanced Scheduling**: More granular control over update frequency
