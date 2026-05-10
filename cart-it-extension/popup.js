/**
 * Cart-It Chrome Extension popup script
 * Handles product scraping, wishlist loading, authentication validation, and saving items to backend
 */

document.addEventListener('DOMContentLoaded', async () => {
  const listSelect = document.getElementById('listSelect');
  const saveBtn = document.getElementById('saveBtn');
  const loader = document.getElementById('loader');
  const mainUI = document.getElementById('main-ui');

  // Get active browser tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // SITE DETECTION (used to choose scraping strategy)
  const getSite = (url) => {
    let host = '';

    try {
      host = new URL(url).hostname;
    } catch (err) {
      return "generic";
    }

    if (host.includes("amazon")) return "amazon";
    if (host.includes("target")) return "target";
    if (host.includes("ebay")) return "ebay";
    if (host.includes("zara")) return "zara";

    return "generic";
  };

  // PRICE NORMALIZATION
  // Converts scraped price strings into numeric values
  const normalizePrice = (p) => {
    if (!p) return null;

    const num = parseFloat(String(p).replace(/[^\d.]/g, ''));
    return isNaN(num) ? null : num;
  };

  // AMAZON DOM SCRAPER (content script execution)
  const scrapeAmazonDOM = async (tabId) => {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const clean = (el) => el ? el.innerText.trim() : null;

        return {
          name: clean(document.querySelector('#productTitle')),
          price:
            clean(document.querySelector('.a-price .a-offscreen')) ||
            clean(document.querySelector('#corePriceDisplay_desktop_feature_div .a-offscreen')),
          img:
            document.querySelector('#landingImage')?.src ||
            document.querySelector('#imgTagWrapperId img')?.src
        };
      }
    });

    return results[0]?.result;
  };

  // EBAY DOM SCRAPER (content script execution)
  const scrapeEbayDOM = async (tabId) => {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const safeText = (el) => el ? el.innerText?.trim() : null;

        const rawPrice =
          safeText(document.querySelector('.x-price-primary')) ||
          safeText(document.querySelector('#prcIsum')) ||
          safeText(document.querySelector('[itemprop="price"]'));

        const price = rawPrice
          ? rawPrice.replace(/[^\d.]/g, '')
          : null;

        return {
          name: document.querySelector('#itemTitle')
            ?.innerText
            ?.replace("Details about  ", "")
            .trim(),
          price,
          img: document.querySelector('#icImg')?.src
        };
      }
    });

    return results[0]?.result;
  };

  // AUTH STATE LOADING
  // Retrieves stored login session from Chrome storage
  let session = {};
  let storageError = false;

  try {
    const api = typeof browser !== 'undefined' ? browser : chrome;
    session = await api.storage.local.get(['authToken', 'userData']);

    if (session.userData && typeof session.userData === 'string') {
      try {
        session.userData = JSON.parse(session.userData);
      } catch (err) {
        console.warn('Could not parse stored userData', err);
      }
    }
  } catch (e) {
    console.error("Storage access failed:", e);
    storageError = true;
  }

  const productNameEl = document.getElementById('product-name');
  const productPriceEl = document.getElementById('product-price');
  const notesField = document.getElementById('notes');

  const loginUrl = 'https://cart-it.app/login';

  const showLoginUI = (message) => {
    loader.style.display = 'none';
    productNameEl.innerHTML = message || `Please <a href="${loginUrl}" target="_blank">log in</a> to try Cart-It.`;
    productPriceEl.textContent = '';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Log in to use Cart-It';
    listSelect.disabled = true;
    notesField.disabled = true;
    document.getElementById('product-img').style.opacity = '0.45';
  };

  const isAuthValid = !storageError &&
    session.authToken &&
    session.authToken.trim() &&
    session.userData &&
    Number(session.userData.user_id) > 0;

  if (!isAuthValid) {
    showLoginUI();
    return;
  }

  const token = session.authToken.trim();
  const userId = session.userData.user_id;

  const clearSession = async () => {
    try {
      const api = typeof browser !== 'undefined' ? browser : chrome;
      await api.storage.local.remove(['authToken', 'userData']);
    } catch (err) {
      console.warn('Failed to clear session storage', err);
    }
  };

  // LOAD WISHLISTS
  // Fetch user's wishlists from backend
  try {
    const resp = await fetch(
      `https://cart-it-aflx.onrender.com/api/wishlists?owner_id=${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!resp.ok) {
      if (resp.status === 401 || resp.status === 403) {
        await clearSession();
        showLoginUI('Session expired. Please <a href="' + loginUrl + '" target="_blank">log in</a> again.');
        return;
      }
      throw new Error(`Wishlist fetch failed: ${resp.status}`);
    }

    const lists = await resp.json();

    lists.forEach(list => {
      const opt = document.createElement('option');
      opt.value = list.wishlist_id;
      opt.textContent = list.name || list.wishlist_name;
      listSelect.appendChild(opt);
    });

  } catch (e) {
    console.error("Wishlist fetch failed", e);
    if (!listSelect.querySelector('option[value=""]')) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'My Cart (Default)';
      listSelect.appendChild(opt);
    }
  }

  // SCRAPING PIPELINE
  // Uses site-specific scraping first, then backend fallback
  const tabUrl = tab?.url || '';
  const unsupportedTab =
    !tabUrl ||
    tabUrl.startsWith('chrome:') ||
    tabUrl.startsWith('about:') ||
    tabUrl.startsWith('about:blank') ||
    tabUrl.startsWith('edge:') ||
    tabUrl.startsWith('moz-extension:') ||
    tabUrl.startsWith('chrome-extension:') ||
    tabUrl.startsWith('data:') ||
    tabUrl.startsWith('file:') ||
    tabUrl.startsWith('view-source:');

  if (unsupportedTab) {
    loader.style.display = 'none';
    productNameEl.innerHTML = `Open a product page to use Cart-It.`;
    productPriceEl.textContent = '';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Open a supported page';
    listSelect.disabled = true;
    notesField.disabled = true;
    document.getElementById('product-img').style.opacity = '0.45';
    return;
  }

  loader.style.display = 'block';

  let productData = null;
  const site = getSite(tabUrl);

  try {
    // Tier 1: DOM scraping for supported sites
    if (site === "amazon") {
      productData = await scrapeAmazonDOM(tab.id);
    } else if (site === "ebay") {
      productData = await scrapeEbayDOM(tab.id);
    }

    // Fallback trigger condition
    const isBad =
      !productData ||
      !productData.name ||
      productData.name.includes("undetected") ||
      (site === "amazon" && !productData.price);

    // Tier 2/3: backend scraper fallback
    if (isBad) {
      const response = await fetch(
        'https://cart-it-aflx.onrender.com/api/scrape/preview-scrape',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ url: tab.url })
        }
      );

      const data = await response.json();

      productData = {
        name: data.name,
        price: normalizePrice(data.price)
          ? `$${normalizePrice(data.price).toFixed(2)}`
          : null,
        img: data.img
      };
    }

    // UI RENDERING
    loader.style.display = 'none';

    document.getElementById('product-name').textContent =
      productData.name || "Unable To Detect Product.";

    document.getElementById('product-price').textContent =
      productData.price || "Price Unavailable";

    if (productData.img) {
      document.getElementById('product-img').src = productData.img;
    }

  } catch (e) {
    loader.style.display = 'none';
    console.error("Scraping failed:", e);
  }

  // SAVE ITEM TO BACKEND
  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      const response = await fetch(
        'https://cart-it-aflx.onrender.com/api/scrape/scrape-and-save',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            url: tab.url,           
            product_url: tab.url,
            user_id: userId,
            wishlist_id: listSelect.value || null,
            notes: document.getElementById('notes').value,
            product_name: productData?.name,
            price: normalizePrice(productData?.price), 
            image_url: productData?.img,
            store_name: getSite(tab.url)
          })
        }
      );

      if (response.ok) {
        showSuccessUI(
          listSelect.options[listSelect.selectedIndex].text,
          listSelect.value
        );
      } else {
        throw new Error("Save failed");
      }

    } catch (err) {
      console.error("Save failed", err);
      saveBtn.disabled = false;
      saveBtn.textContent = "Cart It!";
    }
  });

  // SUCCESS UI STATE 
  function showSuccessUI(listName, listId) {
    mainUI.style.display = 'none';
    document.getElementById('success-ui').style.display = 'block';

    const msg = document.getElementById('success-msg');
    const link = document.getElementById('redirect-link');

    const isWishlist = !!listId;
    const cleanName =
      listName && listName !== "My Cart (Default)"
        ? listName
        : "your wishlist";

    if (isWishlist) {
      msg.textContent = `This item has been saved to your ${cleanName} wishlist.`;
      link.textContent = "See your list.";
      link.dataset.url = `https://cart-it.app/wishlist/${listId}`;
    } else {
      msg.textContent = "This item has been saved to your cart.";
      link.textContent = "See your cart.";
      link.dataset.url = "https://cart-it.app/cart";
    }

    link.style.fontStyle = "italic";
  }

  // Open dashboard/cart in new tab when success link is clicked
  document.getElementById('redirect-link').addEventListener('click', (e) => {
    chrome.tabs.create({ url: e.target.dataset.url });
    window.close();
  });
});