# Contact section

The contact section is a presentation and validation layer. Delivery goes through Web3Forms (free plan), which emails each message to the inbox the owner set up in the Web3Forms dashboard. No recipient address or mailto link is included in the client.

## Delivery: Web3Forms

ContactSection takes an async onSend(details) prop with name, email (the visitor's reply address), and message. StudioPortfolio passes src/lib/sendMessage.js, which POSTs JSON to https://api.web3forms.com/submit with a 12 second timeout and returns { ok: true } only when Web3Forms answers success: true. Anything else (rejection, network failure, timeout) returns { ok: false }.

The Web3Forms access key sits in src/lib/sendMessage.js. It is public by design (Web3Forms puts it in the HTML snippet it hands out) and only routes to the dashboard inbox, so it is not a VITE_ variable and the recipient address never ships. To change the inbox, change it in the Web3Forms dashboard. To rotate the key, generate a new one there and replace the constant.

Failed submissions retain their contents and can be retried; a successful send cannot repeat until an edit. Without an onSend prop, Send a note is disabled and visitors see Messaging opens soon. All service inquiry links lead to #contact.

## Verification

Run npm run build and node scripts/check-contact.cjs with PLAYWRIGHT_MODULE pointing to an available Playwright installation. Browser checks cover keyboard access, responsive layout, absence of public email links, and the send flow (rejection keeps input and allows retry, success sends once with the visitor's details). The Web3Forms endpoint is mocked, so no email is sent.

Each service inquiry button scrolls to contact, focuses the message, and prefills an editable message for that package. Name and reply email are preserved. Edited messages are remembered per package during the current page visit, so switching packages does not discard them.

## Publication — October 13, 2026

Uploaded the built assets and then index.html to the existing Hostinger Agency site for hechoporjs.com. Verified the served asset hashes and origin entry page. The public contact flow passed browser checks with a fresh query URL, and the TK Industrial card opened https://tkindustrial.org/ successfully. No private recipient address or removed delivery provider remains in the public bundle.

Hostinger CDN still intermittently serves the previous HTML at the ordinary root/www URLs. Agency website-cache clearing was accepted twice, but did not consistently invalidate the CDN. Separate CDN Flush cache in the website dashboard remains necessary. Updated version verified at https://hechoporjs.com/?verify=contact-release.

## Web3Forms release — October 13, 2026

Connected delivery through Web3Forms and published release 9c7ab8b79784 (bundle index-DnnTjKl-.js). One labelled live test sent from https://hechoporjs.com returned success: true and showed Message sent.

Web3Forms (behind Cloudflare) rejects headless browsers: requests whose user agent says HeadlessChrome get a 403 with no CORS header, so the form reports a failed send. Real browsers are unaffected. Any live browser check must override the user agent to plain Chrome. The local check mocks the endpoint and is unaffected.
