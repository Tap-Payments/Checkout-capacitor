import Foundation
import Capacitor

/// The `CheckoutCapacitor` plugin: opens the Tap checkout (Checkout-IOS) and reports its outcome
/// as events (`onSuccess`, `onError`, `onClose`, `onReady`, `onChargeCreated`).
@objc(CheckoutCapacitorPlugin)
public class CheckoutCapacitorPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CheckoutCapacitorPlugin"
    public let jsName = "CheckoutCapacitor"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startCheckout", returnType: CAPPluginReturnPromise)
    ]

    /// The SDK holds its delegate weakly, so the current checkout is kept here.
    private var checkout: CheckoutCapacitor?

    @objc func startCheckout(_ call: CAPPluginCall) {
        guard let configurations = call.getObject("configurations") else {
            call.reject("configurations is required", "INVALID_CONFIGURATION")
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            guard let presenter = self.topViewController() else {
                call.reject("No view controller to present the checkout from", "NO_VIEW_CONTROLLER")
                return
            }

            let checkout = CheckoutCapacitor(presenter: presenter) { [weak self] event, data in
                self?.notifyListeners(event, data: data)
            }
            self.checkout = checkout
            checkout.start(configurations: configurations)
            call.resolve()
        }
    }

    /// The top-most presented view controller, so the sheet also opens over another modal.
    private func topViewController() -> UIViewController? {
        guard var top = bridge?.viewController else { return nil }
        while let presented = top.presentedViewController { top = presented }
        return top
    }
}
