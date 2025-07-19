#!/bin/bash

# List of user pages that need protection
USER_PAGES=(
  "app/(user)/wishlist/page.tsx"
  "app/(user)/orderdetails/page.tsx" 
  "app/(user)/profile/edit/page.tsx"
  "app/(user)/ordertracking/page.tsx"
)

# List of admin pages that need protection  
ADMIN_PAGES=(
  "app/admin/productlist/page.tsx"
  "app/admin/productcreate/page.tsx"
  "app/admin/discountlist/page.tsx"
  "app/admin/inventorylist/page.tsx"
  "app/admin/salesreport/page.tsx"
)

echo "Route protection has been implemented via:"
echo "1. Middleware.ts - Server-side route protection"
echo "2. withAuth HOC - Client-side component protection"
echo "3. useRequireAuth hook - Custom authentication hook"
echo ""
echo "Protected user routes:"
for page in "${USER_PAGES[@]}"; do
  echo "  - $page"
done
echo ""
echo "Protected admin routes:"
for page in "${ADMIN_PAGES[@]}"; do
  echo "  - $page"
done
echo ""
echo "To apply protection to additional pages:"
echo "1. Import withAuth from '../../components/withAuth'"
echo "2. Replace 'export default ComponentName' with:"
echo "   'export default withAuth(ComponentName, { requireAdmin: false/true })'"
