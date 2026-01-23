import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { orderService } from '@/lib/supabase/order-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PaymentOptions from '@/components/Payment/PaymentOptions';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  const [shippingAddress, setShippingAddress] = useState({
    full_name: user?.user_metadata?.full_name || '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    phone: '',
  });

  useEffect(() => {
    // Generate order ID on component mount
    setOrderId(`ORD-${Date.now()}`);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const subtotal = getTotal();
  const shipping = subtotal >= 500 ? 0 : 25;
  const total = subtotal + shipping;

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to complete checkout.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    // Store shipping address and proceed to payment
    navigate('/checkout/payment', {
      state: {
        shippingAddress,
        orderId,
        total,
      },
    });
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    setLoading(true);

    try {
      // Prepare order data
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        partner_product_id: item.partner_product?.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      const orderData = {
        customer_id: user!.id,
        items: orderItems,
        shipping_address: {
          full_name: shippingAddress.full_name,
          address_line1: shippingAddress.address_line1,
          address_line2: shippingAddress.address_line2 || undefined,
          city: shippingAddress.city,
          state: shippingAddress.state || undefined,
          postal_code: shippingAddress.postal_code,
          country: shippingAddress.country,
          phone: shippingAddress.phone || undefined,
        },
        payment_method: paymentData.method || 'card',
        payment_intent_id: paymentData.paymentIntentId,
      };

      const { data: order, error } = await orderService.createOrder(orderData);

      console.log('=== ORDER CREATION DEBUG ===');
      console.log('Order creation result:', { data: order, error });
      console.log('Order data:', orderData);
      console.log('User ID:', user!.id);
      console.log('Items count:', orderItems.length);

      if (error) {
        console.error('Order creation failed:', error);
        throw error;
      }

      if (!order) {
        console.error('Order creation returned null data');
        throw new Error('Order creation failed: No order data returned');
      }

      console.log('Order created successfully:', {
        id: order.id,
        order_number: order.order_number,
        customer_id: order.customer_id,
        total_amount: order.total_amount
      });

      toast({
        title: 'Order placed successfully!',
        description: `Your order #${order?.order_number} has been confirmed.`,
      });

      clearCart();
      navigate(`/order-success`, {
        state: {
          orderId: order?.order_number || orderId, // Use order_number instead of id
          orderData: order,
          paymentData,
        },
      });
    } catch (error: any) {
      toast({
        title: 'Order creation failed',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: 'Payment failed',
      description: error,
      variant: 'destructive',
    });
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  // Check if we're on the payment step or shipping step
  const isPaymentStep = location.pathname.includes('/checkout/payment');
  const checkoutShippingAddress = location.state?.shippingAddress || shippingAddress;
  const checkoutOrderId = location.state?.orderId || orderId;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container-wide max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
            {isPaymentStep ? 'Payment' : 'Checkout'}
          </h1>

          {isPaymentStep ? (
            // Payment Step
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Payment Options */}
              <div className="lg:col-span-2">
                {!user ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                          Login Required
                        </h3>
                        <p className="text-yellow-700 dark:text-yellow-400 mb-4">
                          Please login or create an account to continue with payment.
                        </p>
                        <Button
                          onClick={() =>
                            navigate('/auth', { state: { from: location.pathname } })
                          }
                        >
                          Sign In to Continue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <PaymentOptions
                    amount={total}
                    orderId={checkoutOrderId}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                )}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {items.map((item) => (
                        <div key={item.product.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {item.product.title} × {item.quantity}
                          </span>
                          <span>{formatPrice(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-border pt-4 space-y-2 mb-6">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Shipping</span>
                        <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full mb-2"
                      onClick={() => navigate('/checkout')}
                    >
                      Back to Shipping
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            // Shipping Step
            <form onSubmit={handleShippingSubmit}>
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Shipping Form */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Address</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Full Name *</Label>
                          <Input
                            id="full_name"
                            value={shippingAddress.full_name}
                            onChange={(e) =>
                              setShippingAddress({
                                ...shippingAddress,
                                full_name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={shippingAddress.phone}
                            onChange={(e) =>
                              setShippingAddress({
                                ...shippingAddress,
                                phone: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_line1">Address Line 1 *</Label>
                        <Input
                          id="address_line1"
                          value={shippingAddress.address_line1}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              address_line1: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_line2">Address Line 2</Label>
                        <Input
                          id="address_line2"
                          value={shippingAddress.address_line2}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              address_line2: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={shippingAddress.city}
                            onChange={(e) =>
                              setShippingAddress({
                                ...shippingAddress,
                                city: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State/Province</Label>
                          <Input
                            id="state"
                            value={shippingAddress.state}
                            onChange={(e) =>
                              setShippingAddress({
                                ...shippingAddress,
                                state: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postal_code">Postal Code *</Label>
                          <Input
                            id="postal_code"
                            value={shippingAddress.postal_code}
                            onChange={(e) =>
                              setShippingAddress({
                                ...shippingAddress,
                                postal_code: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          value={shippingAddress.country}
                          onChange={(e) =>
                            setShippingAddress({
                              ...shippingAddress,
                              country: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <Card className="sticky top-24">
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {items.map((item) => (
                          <div key={item.product.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              {item.product.title} × {item.quantity}
                            </span>
                            <span>{formatPrice(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-border pt-4 space-y-2 mb-6">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Shipping</span>
                          <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                          <span>Total</span>
                          <span>{formatPrice(total)}</span>
                        </div>
                      </div>

                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? 'Processing...' : `Continue to Payment • ${formatPrice(total)}`}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center mt-4">
                        Secure checkout with multiple payment options
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
