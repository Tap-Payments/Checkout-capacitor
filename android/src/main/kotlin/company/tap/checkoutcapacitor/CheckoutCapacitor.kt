package company.tap.checkoutcapacitor

import com.getcapacitor.Logger

class CheckoutCapacitor {

    fun echo(value: String): String {
        Logger.info("Echo", value)

        return value
    }
}
