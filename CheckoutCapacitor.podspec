require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'CheckoutCapacitor'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = package['repository']['url']
  s.author = package['author']
  s.source = { :git => package['repository']['url'], :tag => s.version.to_s }
  s.source_files = 'ios/Sources/**/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target = '15.0'
  s.swift_version = '5.9'

  s.dependency 'Capacitor'
  # Keep in step with the Checkout-IOS version in Package.swift.
  checkout_ios_version = '1.0.7'
  s.dependency 'Checkout-IOS', checkout_ios_version
end
