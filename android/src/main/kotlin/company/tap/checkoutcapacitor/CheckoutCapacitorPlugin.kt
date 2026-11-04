package company.tap.checkoutcapacitor

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * The `CheckoutCapacitor` plugin: opens the Tap checkout (Checkout-Android) and reports its
 * outcome as events (`onSuccess`, `onError`, `onClose`, `onReady`, `onChargeCreated`).
 */
@CapacitorPlugin(name = "CheckoutCapacitor")
class CheckoutCapacitorPlugin : Plugin() {

    private val implementation = CheckoutCapacitor { event, data ->
        notifyListeners(event, JSObject().apply { data?.let { put("data", it) } })
    }

    @PluginMethod
    fun startCheckout(call: PluginCall) {
        val configurations = call.getObject("configurations")
        if (configurations == null) {
            call.reject("configurations is required", "INVALID_CONFIGURATION")
            return
        }

        val currentActivity = activity
        if (currentActivity == null) {
            call.reject("No activity available", "NO_ACTIVITY")
            return
        }

        val publicKey = configurations.optJSONObject("gateway")?.optString("publicKey").orEmpty()
        if (publicKey.isEmpty()) {
            call.reject("Public key is required", "INVALID_CONFIGURATION")
            return
        }

        currentActivity.runOnUiThread {
            try {
                implementation.start(currentActivity, publicKey, configurations)
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to start checkout: ${e.message}", "CHECKOUT_ERROR", e)
            }
        }
    }

    override fun handleOnDestroy() {
        implementation.dismiss()
        super.handleOnDestroy()
    }
}
