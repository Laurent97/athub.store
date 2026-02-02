import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { orderService } from '@/lib/supabase/order-service';
import { supabase } from '@/lib/supabase/client';
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
    country: 'United States', // Default country
    phone: user?.user_metadata?.phone || '',
  });

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [useSavedAddress, setUseSavedAddress] = useState(false);

  useEffect(() => {
    // Generate order ID on component mount
    setOrderId(`ORD-${Date.now()}`);
    
    // Load saved addresses from user metadata
    if (user?.user_metadata?.shipping_addresses) {
      const addresses = user.user_metadata.shipping_addresses;
      setSavedAddresses(addresses);
      
      // If there's a default address, use it
      const defaultAddress = addresses.find((addr: any) => addr.is_default);
      if (defaultAddress) {
        setShippingAddress({
          full_name: defaultAddress.full_name || user?.user_metadata?.full_name || '',
          address_line1: defaultAddress.address_line1 || '',
          address_line2: defaultAddress.address_line2 || '',
          city: defaultAddress.city || '',
          state: defaultAddress.state || '',
          postal_code: defaultAddress.postal_code || '',
          country: defaultAddress.country || 'United States',
          phone: defaultAddress.phone || user?.user_metadata?.phone || '',
        });
        setUseSavedAddress(true);
      }
    }
  }, [user]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const subtotal = getTotal();
  const shipping = 0; // Shipping now charged after order in new payment system
  const total = subtotal; // No shipping added at checkout

  const saveCurrentAddress = async () => {
    if (!user) return;
    
    try {
      const currentAddresses = user.user_metadata?.shipping_addresses || [];
      const newAddress = {
        ...shippingAddress,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        is_default: currentAddresses.length === 0, // First address is default
      };
      
      const updatedAddresses = [...currentAddresses, newAddress];
      
      // Update user metadata with new address
      const { error } = await supabase.auth.updateUser({
        data: {
          user_metadata: {
            ...user.user_metadata,
            shipping_addresses: updatedAddresses,
          },
        },
      });
      
      if (error) throw error;
      
      setSavedAddresses(updatedAddresses);
      toast({
        title: 'Address saved',
        description: 'Your shipping address has been saved for future orders.',
      });
    } catch (error: any) {
      toast({
        title: 'Error saving address',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const selectSavedAddress = (address: any) => {
    setShippingAddress({
      full_name: address.full_name,
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone,
    });
    setUseSavedAddress(true);
  };

  const setAsDefaultAddress = async (addressId: string) => {
    if (!user) return;
    
    try {
      const updatedAddresses = savedAddresses.map((addr) => ({
        ...addr,
        is_default: addr.id === addressId,
      }));
      
      const { error } = await supabase.auth.updateUser({
        data: {
          user_metadata: {
            ...user.user_metadata,
            shipping_addresses: updatedAddresses,
          },
        },
      });
      
      if (error) throw error;
      
      setSavedAddresses(updatedAddresses);
      toast({
        title: 'Default address updated',
        description: 'Your default shipping address has been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating default address',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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

    // Validate shipping address
    const requiredFields = ['full_name', 'address_line1', 'city', 'postal_code', 'country', 'phone'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field as keyof typeof shippingAddress]);
    
    if (missingFields.length > 0) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required shipping address fields.',
        variant: 'destructive',
      });
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
        partner_product_id: item.partner_product?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.partner_product.id) ? item.partner_product.id : null,
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
                        <span>Shipping & Tax</span>
                        <span className="text-orange-600 font-semibold">Added after order</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                        <span>Total (Today)</span>
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
                  {/* Saved Addresses */}
                  {savedAddresses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          Saved Addresses
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setUseSavedAddress(!useSavedAddress)}
                          >
                            {useSavedAddress ? 'Use New Address' : 'Use Saved Address'}
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {savedAddresses.map((address) => (
                          <div
                            key={address.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              useSavedAddress &&
                              JSON.stringify(shippingAddress) === JSON.stringify({
                                full_name: address.full_name,
                                address_line1: address.address_line1,
                                address_line2: address.address_line2,
                                city: address.city,
                                state: address.state,
                                postal_code: address.postal_code,
                                country: address.country,
                                phone: address.phone,
                              })
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-border hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => selectSavedAddress(address)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{address.full_name}</span>
                                  {address.is_default && (
                                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <p>{address.address_line1}</p>
                                  {address.address_line2 && <p>{address.address_line2}</p>}
                                  <p>
                                    {address.city}, {address.state} {address.postal_code}
                                  </p>
                                  <p>{address.country}</p>
                                  <p>{address.phone}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                {!address.is_default && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAsDefaultAddress(address.id);
                                    }}
                                  >
                                    Set Default
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {useSavedAddress && savedAddresses.length > 0 
                          ? 'New Address (Optional)' 
                          : 'Shipping Address'
                        }
                      </CardTitle>
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
                      
                      {/* Save Address Button */}
                      {user && !useSavedAddress && (
                        <div className="pt-4 border-t border-border">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={saveCurrentAddress}
                            disabled={
                              !shippingAddress.full_name ||
                              !shippingAddress.address_line1 ||
                              !shippingAddress.city ||
                              !shippingAddress.postal_code ||
                              !shippingAddress.country ||
                              !shippingAddress.phone
                            }
                          >
                            Save Address for Future Orders
                          </Button>
                        </div>
                      )}
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
                          <span>Shipping & Tax</span>
                          <span className="text-orange-600 font-semibold">Added after order</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                          <span>Total (Today)</span>
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
