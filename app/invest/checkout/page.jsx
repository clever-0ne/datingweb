import BalancePurchase from '@/components/BalancePurchase';

export const metadata = { title: 'Investment Checkout — Tesla Capital' };

export default function Page() {
  return <BalancePurchase name="Investment Plan" price={100} backHref="/invest" meta="Plan purchase" />;
}
