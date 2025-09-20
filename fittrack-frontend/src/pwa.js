// PWA Service Worker Registration
import { Workbox } from "workbox-window";

let wb;

if ("serviceWorker" in navigator) {
    wb = new Workbox("/sw.js");

    wb.addEventListener("controlling", () => {
        window.location.reload();
    });

    wb.register();
}

// PWA Install Prompt
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show install button or notification
    showInstallPrompt();
});

function showInstallPrompt() {
    // You can customize this to show a custom install button
    console.log("PWA install prompt available");

    // Example: Show a custom install button
    const installButton = document.createElement("button");
    installButton.textContent = "Install FitTrack";
    installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #1f2937;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    z-index: 1000;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;

    installButton.addEventListener("click", async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            installButton.remove();
        }
    });

    document.body.appendChild(installButton);

    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (installButton.parentNode) {
            installButton.remove();
        }
    }, 10000);
}

// Handle app installed
window.addEventListener("appinstalled", () => {
    console.log("PWA was installed");
    deferredPrompt = null;
});

export { wb };
