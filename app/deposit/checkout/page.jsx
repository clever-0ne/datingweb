import PaymentCheckout from '@/components/PaymentCheckout';

export const metadata = { title: 'Deposit Checkout — Tesla Capital' };

export default function Page() {
  return <PaymentCheckout kind="deposit" context="Deposit" defaultAmount={500} backHref="/deposit" />;
}
