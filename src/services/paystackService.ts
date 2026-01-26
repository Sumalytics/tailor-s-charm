interface PaystackPaymentData {
  email: string;
  amount: number; // in kobo (100 kobo = 1 GHS)
  reference: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}

interface PaystackResponse {
  status: boolean;
  message: string;
  data: {
    status?: string;
    reference?: string;
    access_code?: string;
    authorization_url?: string;
    amount?: number;
    currency?: string;
    paid_at?: string;
    metadata?: any;
    gateway_response?: string;
    channel?: string;
    customer?: any;
    plan?: any;
  };
}

class PaystackService {
  private secretKey: string;
  private publicKey: string;

  constructor() {
    this.secretKey = import.meta.env.VITE_PAYSTACK_SECRET_KEY || '';
    this.publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
  }

  // Initialize payment
  async initializePayment(paymentData: PaystackPaymentData): Promise<PaystackResponse> {
    console.log('Paystack Service - Initializing payment with data:', paymentData);
    console.log('Paystack Service - Secret Key exists:', !!this.secretKey);
    console.log('Paystack Service - Secret Key length:', this.secretKey.length);
    console.log('Paystack Service - Public Key exists:', !!this.publicKey);
    
    if (!this.secretKey) {
      throw new Error('Paystack secret key is not configured');
    }

    // Validate required fields
    if (!paymentData.email) {
      throw new Error('Email is required for payment');
    }
    if (!paymentData.amount || paymentData.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Format amount to pesewas (multiply by 100 for GHS)
    const amountInPesewas = Math.round(paymentData.amount * 100);
    console.log('Paystack Service - Amount in GHS:', paymentData.amount);
    console.log('Paystack Service - Amount in pesewas:', amountInPesewas);

    const payload = {
      email: paymentData.email,
      amount: amountInPesewas,
      reference: paymentData.reference || this.generateReference('PAYMENT'),
      currency: 'GHS',
      callback_url: paymentData.callback_url,
      metadata: paymentData.metadata || {},
      channels: ['card', 'mobile_money'],
    };

    console.log('Paystack Service - Final payload:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Paystack Response Status:', response.status);
      console.log('Paystack Response Headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Paystack Error Response:', errorText);
        throw new Error(`Paystack API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Paystack Success Response:', result);
      
      if (!result.status) {
        throw new Error(result.message || 'Payment initialization failed');
      }

      return result;
    } catch (error) {
      console.error('Paystack Service Error:', error);
      throw error;
    }
  }

  // Verify payment (server-side only, but included for completeness)
  async verifyPayment(reference: string) {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Paystack verification error:', error);
      throw error;
    }
  }

  // Get public key for frontend use
  getPublicKey(): string {
    return this.publicKey;
  }

  // Generate unique reference
  generateReference(prefix: string = 'TFLOW'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  // Format amount to pesewas (for GHS currency)
  formatAmountToPesewas(amount: number): number {
    return Math.round(amount * 100);
  }

  // Verify transaction
  async verifyTransaction(reference: string): Promise<PaystackResponse> {
    console.log('Paystack Service - Verifying transaction:', reference);
    
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Paystack Service - Verification error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(`Paystack verification failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Paystack Service - Verification response:', data);
      return data;
    } catch (error) {
      console.error('Paystack Service - Verification error:', error);
      throw error;
    }
  }
}

export const paystackService = new PaystackService();
