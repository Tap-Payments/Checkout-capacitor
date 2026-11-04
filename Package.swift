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
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "CheckoutCapacitorPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/CheckoutCapacitorPlugin"),
        .testTarget(
            name: "CheckoutCapacitorPluginTests",
            dependencies: ["CheckoutCapacitorPlugin"],
            path: "ios/Tests/CheckoutCapacitorPluginTests")
    ]
)