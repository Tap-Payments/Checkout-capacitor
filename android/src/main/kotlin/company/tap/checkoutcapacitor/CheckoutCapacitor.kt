package company.tap.checkoutcapacitor

import android.app.Activity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import company.tap.tapcheckout_android.CheckoutConfiguration
import company.tap.tapcheckout_android.TapCheckout
import company.tap.tapcheckout_android.TapCheckoutStatusDelegate
import org.json.JSONArray
import org.json.JSONObject

/**
 * Shows Checkout-Android full screen over the app's content view and forwards its delegate calls
 * through [emit] (event name, optional `data` payload).
 */
class CheckoutCapacitor(private val emit: (event: String, data: String?) -> Unit) {

    private var activity: Activity? = null
    private var fullscreenView: View? = null

    /** Must be called on the UI thread. */
    fun start(activity: Activity, publicKey: String, configurations: JSONObject) {
        // Only one checkout is shown at a time.
        removeFullscreenView()
        this.activity = activity

        val view = LayoutInflater.from(activity).inflate(R.layout.tap_checkout_kit_layout, null)
        val tapCheckoutView = view.findViewById<TapCheckout>(R.id.redirect_pay)
        val layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT,
        )
        view.layoutParams = layoutParams
        activity.findViewById<ViewGroup>(android.R.id.content).addView(view, layoutParams)
        fullscreenView = view

        val androidConfiguration = toSDKFormat(configurations)
        // Android-specific configuration
        androidConfiguration["open"] = true
        androidConfiguration.putIfAbsent("checkoutMode", "page")
        androidConfiguration["isApplePayAvailableOnClient"] = false
        handleTransactionMode(androidConfiguration)

        CheckoutConfiguration.configureWithTapCheckoutDictionary(
            activity,
            publicKey,
            tapCheckoutView,
            androidConfiguration,
            delegate,
        )
    }

    fun dismiss() {
        removeFullscreenView()
    }

    private val delegate = object : TapCheckoutStatusDelegate {
        override fun onCheckoutSuccess(data: String) {
            emit("onSuccess", data)
            removeFullscreenView()
        }

        override fun onCheckoutReady() {
            emit("onReady", null)
        }

        override fun onCheckoutClick() {
            // Not exposed
        }

        override fun onCheckoutOrderCreated(data: String) {
            // Not exposed
        }

        override fun onCheckoutChargeCreated(data: String) {
            // An event, so it fires for every charge (e.g. again after coming back from KNET)
            emit("onChargeCreated", data)
        }

        override fun onCheckoutError(error: String) {
            removeFullscreenView()
            emit("onError", error)
        }

        override fun onCheckoutcancel() {
            emit("onClose", null)
            removeFullscreenView()
        }
    }

    private fun removeFullscreenView() {
        val view = fullscreenView ?: return
        val currentActivity = activity ?: return
        fullscreenView = null
        currentActivity.runOnUiThread {
            (view.parent as? ViewGroup)?.removeView(view)
        }
    }

    /**
     * The SDK expects `transaction.authorize` instead of `transaction.charge` for authorizations,
     * so in authorize mode the charge object is moved there.
     */
    private fun handleTransactionMode(configuration: LinkedHashMap<String, Any>) {
        val transaction = configuration["transaction"] as? JSONObject ?: return
        val mode = transaction.optString("mode", "charge")
        if (!mode.contains("authorize", ignoreCase = true)) return
        val charge = transaction.optJSONObject("charge") ?: return
        transaction.remove("charge")
        transaction.put("authorize", charge)
    }

    /**
     * The SDK takes a LinkedHashMap whose nested values are JSONObjects / JSONArrays. Nulls are
     * sent as empty strings, like the React Native wrapper.
     */
    private fun toSDKFormat(json: JSONObject): LinkedHashMap<String, Any> {
        val result = LinkedHashMap<String, Any>()
        for (key in json.keys()) {
            result[key] = copy(json.opt(key))
        }
        return result
    }

    private fun copy(value: Any?): Any = when (value) {
        is JSONObject -> JSONObject().also { copy ->
            for (key in value.keys()) copy.put(key, copy(value.opt(key)))
        }
        is JSONArray -> JSONArray().also { copy ->
            for (i in 0 until value.length()) copy.put(copy(value.opt(i)))
        }
        null, JSONObject.NULL -> ""
        else -> value
    }
}
