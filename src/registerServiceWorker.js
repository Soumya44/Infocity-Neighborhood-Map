// In production, we register a service worker to serve assets from local cache.
// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on the "N+1" visit to a page, since previously
// cached resources are updated in the background.

// To learn more about the benefits of this model, read https://goo.gl/KwvDNy.
// This link also includes instructions on opting out of this behavior.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost'
    // [::1] is the IPv6 localhost address.
    || window.location.hostname === '[::1]'
    // 127.0.0.1/8 is considered localhost for IPv4.
    || window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/),
);

export default function register() {
  if ('serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebookincubator/create-react-app/issues/2374
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // This is running on localhost. Lets check if a service worker still exists or not.
        checkValidServiceWorker(swUrl);

        // Add some additional logging to localhost, pointing developers to the
        // service worker/PWA documentation.
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service ' +
              'worker. To learn more, visit https://goo.gl/SC7cgQ'
          );
        });
      } else {
        // Is not local host. Just register service worker
        registerValidSW(swUrl);
      }
    });
  }
}

function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
      /**
       * If there is no controller means this page didn't load using
       * service worker hence the content is loaded from the n/w
       */
      if (!navigator.serviceWorker.controller) {
        return;
      }

      // Check if there is a waiting worker if so then inform the user about the update
      if (registration.waiting) {
        updateReady(registration.waiting);
        return;
      }

      // Check if there is a installing service worker if so then track it's state
      if (registration.installing) {
        const installingWorker = registration.installing;
        trackInstalling(installingWorker);
        return;
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        trackInstalling(installingWorker);
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });

  /**
   * This fires when the service worker controlling this page
   * changes, eg a new worker has skipped waiting and become
   * the new active worker.
   */
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

function checkValidServiceWorker(swUrl) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl)
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      if (
        response.status === 404
        || response.headers.get('content-type').indexOf('javascript') === -1
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}

/**
 * listen for the installing service worker state
 * and if installed we inform the user about update
 */
function trackInstalling(installingWorker) {
  installingWorker.addEventListener('statechange', () => {
    // newWorker.state has changed
    if (installingWorker.state === 'installed') {
      if (navigator.serviceWorker.controller) {
        // At this point, the old content will have been purged and
        // the fresh content will have been added to the cache.
        // It's the perfect time to display a "New content is
        // available; please refresh." message in your web app.
        console.log('New content is available; please refresh.');
        updateReady(installingWorker);
      } else {
        // At this point, everything has been precached.
        // It's the perfect time to display a
        // "Content is cached for offline use." message.
        console.log('Content is cached for offline use.');
      }
    }
  });
}

function updateReady(worker) {
  let userConsent = false;
  userConsent = window.confirm('New version available. Do you want to update?');
  if (!userConsent) return;
  // tell the service worker to skipWaiting
  // console.log('updateSW');
  worker.postMessage('updateSW');
}
