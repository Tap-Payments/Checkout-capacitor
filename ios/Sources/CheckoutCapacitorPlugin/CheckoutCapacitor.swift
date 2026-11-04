import Foundation
import UIKit
import Checkout_IOS

/// One checkout: starts Checkout-IOS and forwards its delegate calls as plugin events.
final class CheckoutCapacitor: NSObject {
    typealias Emit = (_ event: String, _ data: [String: Any]) -> Void

    private let sdk = CheckoutSDK()
    private weak var presenter: UIViewController?
    private let emit: Emit

    init(presenter: UIViewController, emit: @escaping Emit) {
        self.presenter = presenter
        self.emit = emit
    }

    func start(configurations: [String: Any]) {
        sdk.start(configurations: configurations, delegate: self)
    }
}

// MARK: - CheckoutSDKDelegate
extension CheckoutCapacitor: CheckoutSDKDelegate {
    var controller: UIViewController {
        presenter ?? UIViewController()
    }

    func onClose() {
        emit("onClose", [:])
    }

    func onReady() {
        emit("onReady", [:])
    }

    func onSuccess(data: String) {
        emit("onSuccess", ["data": data])
    }

    func onError(data: String) {
        emit("onError", ["data": data])
    }

    func onChargeCreated(data: String) {
        // An event, so it fires for every charge (e.g. again after coming back from KNET)
        emit("onChargeCreated", ["data": data])
    }
}
