/**
 * Professional Order Status System
 * Based on industry standards used by FedEx, UPS, DHL, and Amazon
 */

export interface OrderStatusConfig {
  code: string;
  label: string;
  description: string;
  category: 'pre_shipment' | 'fulfillment' | 'shipping' | 'delivery' | 'completion' | 'exception';
  isMilestone: boolean;
  color: string;
}

// Professional order status definitions
export const PROFESSIONAL_ORDER_STATUSES: Record<string, OrderStatusConfig> = {
  // Pre-Shipment
  ORDER_RECEIVED: {
    code: 'ORDER_RECEIVED',
    label: 'Order Received',
    description: 'Order placed and received in system',
    category: 'pre_shipment',
    isMilestone: true,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
  },
  PAYMENT_AUTHORIZED: {
    code: 'PAYMENT_AUTHORIZED',
    label: 'Payment Authorized',
    description: 'Payment processed successfully',
    category: 'pre_shipment',
    isMilestone: true,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  },
  ORDER_VERIFIED: {
    code: 'ORDER_VERIFIED',
    label: 'Order Verified',
    description: 'Customer and shipping details verified',
    category: 'pre_shipment',
    isMilestone: true,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  },
  INVENTORY_ALLOCATED: {
    code: 'INVENTORY_ALLOCATED',
    label: 'Inventory Allocated',
    description: 'Items reserved from stock',
    category: 'pre_shipment',
    isMilestone: false,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
  },
  
  // Fulfillment
  ORDER_PROCESSING: {
    code: 'ORDER_PROCESSING',
    label: 'Order Processing',
    description: 'Starting fulfillment process',
    category: 'fulfillment',
    isMilestone: true,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
  },
  PICKING_STARTED: {
    code: 'PICKING_STARTED',
    label: 'Picking Started',
    description: 'Warehouse staff gathering items',
    category: 'fulfillment',
    isMilestone: false,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
  },
  PICKING_COMPLETED: {
    code: 'PICKING_COMPLETED',
    label: 'Picking Completed',
    description: 'All items collected',
    category: 'fulfillment',
    isMilestone: false,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
  },
  PACKING_STARTED: {
    code: 'PACKING_STARTED',
    label: 'Packing Started',
    description: 'Items being packaged',
    category: 'fulfillment',
    isMilestone: false,
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'
  },
  PACKING_COMPLETED: {
    code: 'PACKING_COMPLETED',
    label: 'Packing Completed',
    description: 'Package ready for shipping',
    category: 'fulfillment',
    isMilestone: true,
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'
  },
  READY_TO_SHIP: {
    code: 'READY_TO_SHIP',
    label: 'Ready to Ship',
    description: 'Packaged, awaiting carrier pickup',
    category: 'fulfillment',
    isMilestone: true,
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'
  },
  
  // Shipping
  CARRIER_PICKUP_SCHEDULED: {
    code: 'CARRIER_PICKUP_SCHEDULED',
    label: 'Pickup Scheduled',
    description: 'Carrier scheduled for pickup',
    category: 'shipping',
    isMilestone: false,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  },
  PICKED_UP: {
    code: 'PICKED_UP',
    label: 'Picked Up',
    description: 'Carrier has collected package',
    category: 'shipping',
    isMilestone: true,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  },
  IN_TRANSIT: {
    code: 'IN_TRANSIT',
    label: 'In Transit',
    description: 'Package moving through carrier network',
    category: 'shipping',
    isMilestone: false,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  },
  ARRIVED_AT_ORIGIN: {
    code: 'ARRIVED_AT_ORIGIN',
    label: 'Arrived at Origin Facility',
    description: 'At initial sorting center',
    category: 'shipping',
    isMilestone: false,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  },
  DEPARTED_ORIGIN: {
    code: 'DEPARTED_ORIGIN',
    label: 'Departed Origin Facility',
    description: 'Left initial facility',
    category: 'shipping',
    isMilestone: false,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  },
  ARRIVED_AT_SORT: {
    code: 'ARRIVED_AT_SORT',
    label: 'Arrived at Sort Facility',
    description: 'At regional sorting center',
    category: 'shipping',
    isMilestone: false,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  },
  PROCESSED_AT_SORT: {
    code: 'PROCESSED_AT_SORT',
    label: 'Processed at Sort Facility',
    description: 'Sorted for destination',
    category: 'shipping',
    isMilestone: false,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  },
  DEPARTED_SORT: {
    code: 'DEPARTED_SORT',
    label: 'Departed Sort Facility',
    description: 'En route to destination',
    category: 'shipping',
    isMilestone: false,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  },
  ARRIVED_AT_DESTINATION: {
    code: 'ARRIVED_AT_DESTINATION',
    label: 'Arrived at Destination',
    description: 'At local delivery facility',
    category: 'shipping',
    isMilestone: false,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  },
  
  // Delivery
  OUT_FOR_DELIVERY: {
    code: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    description: 'On delivery vehicle today',
    category: 'delivery',
    isMilestone: true,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
  },
  DELIVERY_ATTEMPTED: {
    code: 'DELIVERY_ATTEMPTED',
    label: 'Delivery Attempted',
    description: 'Attempt made, may need retry',
    category: 'delivery',
    isMilestone: false,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
  },
  DELIVERED: {
    code: 'DELIVERED',
    label: 'Delivered',
    description: 'Package successfully delivered',
    category: 'delivery',
    isMilestone: true,
    color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
  },
  
  // Completion
  DELIVERY_CONFIRMED: {
    code: 'DELIVERY_CONFIRMED',
    label: 'Delivery Confirmed',
    description: 'Customer confirmed receipt',
    category: 'completion',
    isMilestone: false,
    color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
  },
  ORDER_COMPLETED: {
    code: 'ORDER_COMPLETED',
    label: 'Order Completed',
    description: 'Order finalized, customer satisfied',
    category: 'completion',
    isMilestone: true,
    color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
  },
  
  // Exceptions
  DELAYED: {
    code: 'DELAYED',
    label: 'Delayed',
    description: 'Delivery delayed due to external factors',
    category: 'exception',
    isMilestone: false,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
  },
  WEATHER_DELAY: {
    code: 'WEATHER_DELAY',
    label: 'Weather Delay',
    description: 'Severe weather affecting delivery',
    category: 'exception',
    isMilestone: false,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
  },
  MECHANICAL_DELAY: {
    code: 'MECHANICAL_DELAY',
    label: 'Mechanical Delay',
    description: 'Vehicle/equipment issues',
    category: 'exception',
    isMilestone: false,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
  },
  ADDRESS_ISSUE: {
    code: 'ADDRESS_ISSUE',
    label: 'Address Issue',
    description: 'Incorrect or incomplete address',
    category: 'exception',
    isMilestone: false,
    color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
  },
  CUSTOMER_UNAVAILABLE: {
    code: 'CUSTOMER_UNAVAILABLE',
    label: 'Customer Unavailable',
    description: 'No one available to receive',
    category: 'exception',
    isMilestone: false,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
  },
  SECURITY_DELAY: {
    code: 'SECURITY_DELAY',
    label: 'Security Delay',
    description: 'Security screening required',
    category: 'exception',
    isMilestone: false,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
  },
  CUSTOMS_HOLD: {
    code: 'CUSTOMS_HOLD',
    label: 'Customs Hold',
    description: 'International customs clearance',
    category: 'exception',
    isMilestone: false,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'
  },
  DAMAGED: {
    code: 'DAMAGED',
    label: 'Package Damaged',
    description: 'Package damaged in transit',
    category: 'exception',
    isMilestone: false,
    color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
  },
  LOST: {
    code: 'LOST',
    label: 'Package Lost',
    description: 'Package cannot be located',
    category: 'exception',
    isMilestone: false,
    color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
  },
  CANCELLED: {
    code: 'CANCELLED',
    label: 'Order Cancelled',
    description: 'Order cancelled by customer or system',
    category: 'exception',
    isMilestone: true,
    color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
  },
  RETURNED: {
    code: 'RETURNED',
    label: 'Returned to Sender',
    description: 'Package returned to origin',
    category: 'exception',
    isMilestone: false,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300'
  }
};

// Status flow progression
export const STATUS_FLOW = {
  ORDER_RECEIVED: ['PAYMENT_AUTHORIZED'],
  PAYMENT_AUTHORIZED: ['ORDER_VERIFIED'],
  ORDER_VERIFIED: ['INVENTORY_ALLOCATED'],
  INVENTORY_ALLOCATED: ['ORDER_PROCESSING'],
  ORDER_PROCESSING: ['PICKING_STARTED', 'CANCELLED'],
  PICKING_STARTED: ['PICKING_COMPLETED'],
  PICKING_COMPLETED: ['PACKING_STARTED'],
  PACKING_STARTED: ['PACKING_COMPLETED'],
  PACKING_COMPLETED: ['READY_TO_SHIP'],
  READY_TO_SHIP: ['CARRIER_PICKUP_SCHEDULED'],
  CARRIER_PICKUP_SCHEDULED: ['PICKED_UP'],
  PICKED_UP: ['IN_TRANSIT', 'DELAYED', 'LOST'],
  IN_TRANSIT: ['ARRIVED_AT_ORIGIN', 'DEPARTED_ORIGIN', 'DELAYED', 'LOST'],
  ARRIVED_AT_ORIGIN: ['DEPARTED_ORIGIN'],
  DEPARTED_ORIGIN: ['ARRIVED_AT_SORT'],
  ARRIVED_AT_SORT: ['PROCESSED_AT_SORT'],
  PROCESSED_AT_SORT: ['DEPARTED_SORT'],
  DEPARTED_SORT: ['ARRIVED_AT_DESTINATION'],
  ARRIVED_AT_DESTINATION: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_ATTEMPTED', 'ADDRESS_ISSUE', 'CUSTOMER_UNAVAILABLE'],
  DELIVERY_ATTEMPTED: ['DELIVERED', 'OUT_FOR_DELIVERY'],
  DELIVERED: ['DELIVERY_CONFIRMED'],
  DELIVERY_CONFIRMED: ['ORDER_COMPLETED'],
  ORDER_COMPLETED: [],
  
  // Exception flows
  DELAYED: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'],
  ADDRESS_ISSUE: ['OUT_FOR_DELIVERY', 'RETURNED'],
  CUSTOMER_UNAVAILABLE: ['OUT_FOR_DELIVERY'],
  LOST: ['CANCELLED'],
  DAMAGED: ['CANCELLED'],
  CANCELLED: [],
  RETURNED: []
};

// Status categories for grouping
export const STATUS_CATEGORIES = {
  pre_shipment: ['ORDER_RECEIVED', 'PAYMENT_AUTHORIZED', 'ORDER_VERIFIED', 'INVENTORY_ALLOCATED'],
  fulfillment: ['ORDER_PROCESSING', 'PICKING_STARTED', 'PICKING_COMPLETED', 'PACKING_STARTED', 'PACKING_COMPLETED', 'READY_TO_SHIP'],
  shipping: ['CARRIER_PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_ORIGIN', 'DEPARTED_ORIGIN', 'ARRIVED_AT_SORT', 'PROCESSED_AT_SORT', 'DEPARTED_SORT', 'ARRIVED_AT_DESTINATION'],
  delivery: ['OUT_FOR_DELIVERY', 'DELIVERY_ATTEMPTED', 'DELIVERED'],
  completion: ['DELIVERY_CONFIRMED', 'ORDER_COMPLETED'],
  exception: ['DELAYED', 'WEATHER_DELAY', 'MECHANICAL_DELAY', 'ADDRESS_ISSUE', 'CUSTOMER_UNAVAILABLE', 'SECURITY_DELAY', 'CUSTOMS_HOLD', 'DAMAGED', 'LOST', 'CANCELLED', 'RETURNED']
};

// Helper functions
export const getStatusConfig = (status: string): OrderStatusConfig => {
  return PROFESSIONAL_ORDER_STATUSES[status] || PROFESSIONAL_ORDER_STATUSES.ORDER_RECEIVED;
};

export const getStatusColor = (status: string): string => {
  return getStatusConfig(status).color;
};

export const isMilestoneStatus = (status: string): boolean => {
  return getStatusConfig(status).isMilestone;
};

export const getStatusCategory = (status: string): string => {
  return getStatusConfig(status).category;
};

export const getNextStatuses = (currentStatus: string): string[] => {
  return STATUS_FLOW[currentStatus as keyof typeof STATUS_FLOW] || [];
};

export const canTransitionTo = (fromStatus: string, toStatus: string): boolean => {
  const allowedNext = getNextStatuses(fromStatus);
  return allowedNext.includes(toStatus);
};

// Professional status mapping from current system
export const CURRENT_TO_PROFESSIONAL_MAPPING: Record<string, string> = {
  'pending': 'ORDER_RECEIVED',
  'waiting_confirmation': 'ORDER_VERIFIED',
  'confirmed': 'ORDER_VERIFIED',
  'processing': 'ORDER_PROCESSING',
  'shipped': 'IN_TRANSIT',
  'delivered': 'DELIVERED',
  'completed': 'ORDER_COMPLETED',
  'cancelled': 'CANCELLED'
};

export const PROFESSIONAL_TO_CURRENT_MAPPING: Record<string, string> = {
  'ORDER_RECEIVED': 'pending',
  'PAYMENT_AUTHORIZED': 'confirmed',
  'ORDER_VERIFIED': 'waiting_confirmation',
  'INVENTORY_ALLOCATED': 'processing',
  'ORDER_PROCESSING': 'processing',
  'PICKING_STARTED': 'processing',
  'PICKING_COMPLETED': 'processing',
  'PACKING_STARTED': 'processing',
  'PACKING_COMPLETED': 'processing',
  'READY_TO_SHIP': 'processing',
  'CARRIER_PICKUP_SCHEDULED': 'shipped',
  'PICKED_UP': 'shipped',
  'IN_TRANSIT': 'shipped',
  'ARRIVED_AT_ORIGIN': 'shipped',
  'DEPARTED_ORIGIN': 'shipped',
  'ARRIVED_AT_SORT': 'shipped',
  'PROCESSED_AT_SORT': 'shipped',
  'DEPARTED_SORT': 'shipped',
  'ARRIVED_AT_DESTINATION': 'shipped',
  'OUT_FOR_DELIVERY': 'shipped',
  'DELIVERY_ATTEMPTED': 'shipped',
  'DELIVERED': 'delivered',
  'DELIVERY_CONFIRMED': 'delivered',
  'ORDER_COMPLETED': 'completed',
  'DELAYED': 'shipped',
  'WEATHER_DELAY': 'shipped',
  'MECHANICAL_DELAY': 'shipped',
  'ADDRESS_ISSUE': 'shipped',
  'CUSTOMER_UNAVAILABLE': 'shipped',
  'SECURITY_DELAY': 'shipped',
  'CUSTOMS_HOLD': 'shipped',
  'DAMAGED': 'cancelled',
  'LOST': 'cancelled',
  'CANCELLED': 'cancelled',
  'RETURNED': 'cancelled'
};
