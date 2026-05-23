Need to correct few flows amd develop admin dashboard

correction flow in current project :

1. Modify the registrations minimal data collection merge (Apartment / Society, Flat number), remove Address / Landmark and make it optional
   1. Remove name, email, confirm password , just mobile number and password and apartment and flat number (just 3 fields), design should be mobile responsive
   2. Dheera image is looking bigger, use the standard size format
2. Greeting based on the current time (good morning)
3. After login - small load glitch is there - check the react query loading - give proper skeleton or good visible loading
4. If user is already subscribed - we can give modify subscribtion flow with edit options
5. If user is not subscribed, let the current flow
6. Pause is not working, pause functionality selcted days or whole month options (think all cases and add this feature like a product engineer)
7. Modify should redirect to the modification flow if user is already subscribed
8. After modifying the current plan, instant update is not happening(check the react query invalidate and new data update) - use standard tanstack query patterns
9. also add contact us if any support required or queries 9620544988 (whatsapp)

admin dashboard :

Think like a product owner, based on the current features and product, all possible actions in the product should be noted in the admin dashboard
All user actions should be noted in the admin dashboard
for admin user seed the data 9620544988 and superadmin123 (seed in the super base)
all users should be visible in the admin dashbaord
each user inetraction should be present after visiting user
add notification features for daily update checks
billing should be included in the super admin panel
include super admin flow in the login itself (if super admin logs in - show the different dashboard)
