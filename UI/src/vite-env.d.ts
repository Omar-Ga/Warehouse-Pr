/// <reference types="vite/client" />

// Augment the Navigator interface to include the WebUSB API
interface Navigator {
    readonly usb: USB;
}

interface USB extends EventTarget {
    onconnect: ((this: this, ev: USBConnectionEvent) => any) | null;
    ondisconnect: ((this: this, ev: USBConnectionEvent) => any) | null;
    getDevices(): Promise<USBDevice[]>;
    requestDevice(options?: USBDeviceRequestOptions): Promise<USBDevice>;
    addEventListener(type: "connect" | "disconnect", listener: (this: this, ev: USBConnectionEvent) => any, useCapture?: boolean): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: "connect" | "disconnect", listener: (this: this, ev: USBConnectionEvent) => any, useCapture?: boolean): void;
    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void;
}
