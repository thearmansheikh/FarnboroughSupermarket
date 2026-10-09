# Manual test checklist

Automated checks run with `npm test` (and in CI). The items below need a person, a phone and an inbox, so run them before each launch and after any change to the contact form.

## Contact form (needs `FORMSUBMIT_ALIAS` set and activated)

Do each test on **desktop** and on a **phone**, on the live site.

- [ ] Open `/contact`. The form shows Name, Email and Message, and a "Send enquiry" button.
- [ ] Press **Send enquiry** with everything empty. Messages appear under each field ("Please enter your name." ...), focus moves to the first problem, and nothing is sent.
- [ ] Type a bad email (`abc`). The message "Please enter a valid email address" appears.
- [ ] Type a message of 3 characters. "Please write a little more" appears.
- [ ] Fill in valid details and press **Send enquiry**. The button changes to "Sending..." and the page moves to `/thank-you`.
- [ ] The thank-you page shows the opening hours, a Call button and a link to the homepage.
- [ ] **The email arrives** at the shop inbox within a few minutes (check spam on the first one). It lists Name, Email and Message in a table, and the subject is "New website enquiry".
- [ ] Press the browser Back button from the thank-you page. The form is usable again (the button does not stay on "Sending...").
- [ ] Turn off JavaScript in the browser and repeat a valid enquiry. It still sends and reaches `/thank-you`.
- [ ] With a screen reader (VoiceOver, TalkBack or NVDA), move through the form. Only Name, Email and Message are announced. **No "Leave this field blank" field is read out.**
- [ ] Spam check: using the browser developer tools, fill the hidden `_honey` field and submit. No email should arrive.

First use only: FormSubmit emails an activation link to the shop address after the very first submission. Click it, then send a second test.

## Other quick checks

- [ ] Cookie banner: **Reject optional** and **Accept all** look equally easy to press. After choosing, the banner stays away on reload.
- [ ] Contact page map: it stays a "Load map" button until pressed.
- [ ] Mobile menu opens, closes with the button and with the Esc key.
- [ ] `/offers` shows offers or "Ask in store for this week's deals." and never an error.
