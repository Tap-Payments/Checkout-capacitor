import { CheckoutCapacitor } from 'checkout-capacitor';

window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    CheckoutCapacitor.echo({ value: inputValue })
}
