let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export const registerServiceWorker = (): Promise<ServiceWorkerRegistration | null> => {
  if (registrationPromise) return registrationPromise;

  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    registrationPromise = Promise.resolve(null);
    return registrationPromise;
  }

  const scriptUrl = new URL("sw.js", document.baseURI);
  const scope = new URL("./", document.baseURI).pathname;

  registrationPromise = navigator.serviceWorker
    .register(scriptUrl, { scope, updateViaCache: "none" })
    .catch(() => null);

  return registrationPromise;
};
