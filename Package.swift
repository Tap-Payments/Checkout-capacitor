// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CheckoutCapacitor",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CheckoutCapacitor",
            targets: ["CheckoutCapacitorPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        // Keep in step with checkoutIOSVersion in CheckoutCapacitor.podspec.
        .package(url: "https://github.com/Tap-Payments/Checkout-IOS.git", exact: "1.0.7")
    ],
    targets: [
        .target(
            name: "CheckoutCapacitorPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "Checkout-IOS", package: "Checkout-IOS")
            ],
            path: "ios/Sources/CheckoutCapacitorPlugin")
    ]
)
