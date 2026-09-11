import WithdrawCheckout from '@/components/WithdrawCheckout';

export const metadata = { title: 'Withdrawal Checkout — Tesla Capital' };

export default function Page() {
  return <WithdrawCheckout backHref="/withdraw" />;
}
