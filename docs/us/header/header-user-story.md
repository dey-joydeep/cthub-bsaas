# Header User Story

## Date: 2025-07-26

### Status: Draft

#### Acceptance Criteria

    Header left side items
        [ ] Header will have a logo on the left side

    Header right side items will have a
        [ ] language selection dropdown.
        [ ] user profile icon (if logged in).
        [ ] notification icon (if logged in).
        [ ] cart icon.
        [ ] login/signup button (if not logged in).

    About language
        [ ] Language selection dropdown will have active languages as options.
        [ ] User locale will be used to set default language.
        [ ] If user locale is not in active languages, default language will be English.
        [ ] Language selection will be saved in the browser's local storage.

    About user profile icon
        [ ] On click user profile icon, a sbu menu will be opened. Submenu has below icons/menu name.
            [ ] Settings
            [ ] Logout
        [ ] On click of Settings, user will be redirected to the settings page.
        [ ] On click of Logout, user will be logged out and redirected to login page.
    
    About notification icon
        [ ] Icon will show numbers of unread notifications. No numbers if there are no unread notifications.
        [ ] On click of notification icon, a list of last 10 notifications will be opened.
        [ ] On click of any notification, user will be redirected to the notification page.
        [ ] If there are more than 10 notifications, a "See all" option will be shown at the bottom of the list at a fixed position.
        [ ] On click of "See all", user will be redirected to the notification page.
        [ ] If there are no notifications, a "No notifications" message will be shown in the same list.
    
    About cart icon
        [ ] Icon will show numbers of items in the cart. No numbers if there are no items in the cart.
        [ ] On click of cart icon, a list of items in the cart will be opened.
        [ ] On click of any item, user will be redirected to the product page.
        [ ] Cart item will be show as- 
            [ ] Image
            [ ] Name
            [ ] Price
            [ ] Quantity
            [ ] Qantity increase and decrease button
            [ ] Remove/Delete button
            [ ] Total price
        [ ] A "See all" option will be shown at the bottom of the list at a fixed position.
        [ ] On click of "See all", user will be redirected to the cart page.
        [ ] If there are no items in the cart, a "No items in cart" message will be shown in the same list.
    Note: Details of the cart operation from cart page and heaedr too wil be documented and managed from cart user story.

    About login/signup button
        [ ] On click of login/signup button, a login/signup modal will be opened.
    Note: Details of the login/signup operation from login/signup page and header too wil be documented and managed from auth user story.
