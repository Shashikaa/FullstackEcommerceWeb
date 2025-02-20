import Address from "@/components/shopping-view/address";
import img from "../../assets/account.jpg";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createNewOrder } from "@/store/shop/order-slice";
import { useToast } from "@/components/ui/use-toast";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const { approvalURL } = useSelector((state) => state.shopOrder);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [isPaymentStart, setIsPaymemntStart] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const dispatch = useDispatch();
  const { toast } = useToast();

  const stripe = useStripe();
  const elements = useElements();

  const totalCartAmount =
    cartItems && cartItems.items && cartItems.items.length > 0
      ? cartItems.items.reduce(
          (sum, currentItem) =>
            sum +
            (currentItem?.salePrice > 0
              ? currentItem?.salePrice
              : currentItem?.price) *
              currentItem?.quantity,
          0
        )
      : 0;

  // Handle PayPal payment
  function handleInitiatePaypalPayment() {
    // PayPal implementation as before
    // ...
  }

  // Handle Stripe payment
  const handleStripePayment = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Your cart is empty. Please add items to proceed",
        variant: "destructive",
      });
      return;
    }

    if (currentSelectedAddress === null) {
      toast({
        title: "Please select one address to proceed.",
        variant: "destructive",
      });
      return;
    }

    setPaymentProcessing(true);

    try {
      // Create a payment intent
      const { data } = await axios.post("http://localhost:5000/api/create-payment-intent", {
        amount: totalCartAmount * 100, // Convert to cents
        currency: "usd",
      });

      const clientSecret = data.clientSecret;
      const cardElement = elements.getElement(CardElement);

      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.name,
          },
        },
      });

      if (error) {
        toast({
          title: "Payment failed",
          description: error.message,
          variant: "destructive",
        });
        setPaymentProcessing(false);
      } else if (paymentIntent.status === "succeeded") {
        toast({
          title: "Payment successful",
          description: "Your payment was processed successfully!",
        });

        const orderData = {
          userId: user?.id,
          cartId: cartItems?._id,
          cartItems: cartItems.items.map((singleCartItem) => ({
            productId: singleCartItem?.productId,
            title: singleCartItem?.title,
            image: singleCartItem?.image,
            price: singleCartItem?.salePrice > 0 ? singleCartItem?.salePrice : singleCartItem?.price,
            quantity: singleCartItem?.quantity,
          })),
          addressInfo: {
            addressId: currentSelectedAddress?._id,
            address: currentSelectedAddress?.address,
            city: currentSelectedAddress?.city,
            pincode: currentSelectedAddress?.pincode,
            phone: currentSelectedAddress?.phone,
            notes: currentSelectedAddress?.notes,
          },
          orderStatus: "pending",
          paymentMethod: "stripe",
          paymentStatus: "completed",
          totalAmount: totalCartAmount,
          orderDate: new Date(),
          orderUpdateDate: new Date(),
          paymentId: paymentIntent.id,
        };

        dispatch(createNewOrder(orderData));
        setPaymentProcessing(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setPaymentProcessing(false);
    }
  };

  useEffect(() => {
    if (approvalURL) {
      window.location.href = approvalURL;
    }
  }, [approvalURL]);

  return (
    <div className="flex flex-col">
      <div className="relative h-[300px] w-full overflow-hidden">
        <img src={img} className="h-full w-full object-cover object-center" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5 p-5">
        <Address
          selectedId={currentSelectedAddress}
          setCurrentSelectedAddress={setCurrentSelectedAddress}
        />
        <div className="flex flex-col gap-4">
          {cartItems && cartItems.items && cartItems.items.length > 0
            ? cartItems.items.map((item) => (
                <UserCartItemsContent cartItem={item} key={item.productId} />
              ))
            : null}
          <div className="mt-8 space-y-4">
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold">${totalCartAmount.toFixed(2)}</span> {/* Ensuring 2 decimal places */}
            </div>
          </div>

          {/* Stripe Payment Form */}
          <div className="mt-4">
            <CardElement options={{ hidePostalCode: true }} /> {/* Option to hide postal code */}
          </div>

          {/* Stripe Checkout Button */}
          <div className="mt-4 w-full">
            <Button
              onClick={handleStripePayment}
              className="w-full"
              disabled={paymentProcessing}
            >
              {paymentProcessing
                ? "Processing Stripe Payment..."
                : "Checkout with Stripe"}
            </Button>
          </div>

          {/* PayPal Checkout Button */}
          <div className="mt-4 w-full">
            <Button onClick={handleInitiatePaypalPayment} className="w-full">
              {isPaymentStart ? "Processing PayPal Payment..." : "Checkout with PayPal"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
