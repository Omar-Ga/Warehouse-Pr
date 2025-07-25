// Type definitions for WebUSB API
// Project: https://wicg.github.io/webusb/
// Definitions by: Lars <https://github.com/lars-vc>
//                 Rob Wu <https://github.com/Rob--W>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

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

interface Navigator {
    readonly usb: USB;
} 