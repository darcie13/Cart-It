/** 
 * Background script for Chrome extension authentication sync
 *  Receives login data from the web app and securely stores session info in Chrome storage
 */

chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {

    // Handle login success message from web app
    if (request.type === "LOGIN_SUCCESS") {

      // Clean token to prevent formatting issues (newlines / whitespace)
      const cleanToken = request.token.trim().replace(/\n|\r/g, "");

      // Store authentication session in Chrome local storage
      chrome.storage.local.set({
        authToken: cleanToken,
        userData: request.user
      }, () => {
        console.log("Session synchronized and cleaned.");
        sendResponse({ success: true });
      });

      // Keeps message channel open for async response
      return true;
    }
  }
);