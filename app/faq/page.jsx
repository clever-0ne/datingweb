import LandingShell, { PageHeader } from '@/components/LandingShell';
import { SITE } from '@/lib/plans';

export const metadata = {
  title: `F.A.Q || ${SITE.name}`,
};

/** Port of the Archive 2 `home/faq.blade.php` page. */
const FAQS = [
  {
    q: `What is ${SITE.name}?`,
    a: `${SITE.name} is a strategy that targets investment opportunities intended to create both financial returns and positive social and/or environmental impact. The company is managed by a team of investment experts who work day and night to sure constant returns from our investments.`,
  },
  {
    q: `Who may open an account with ${SITE.name}?`,
    a: 'Any individual 18 or over, The investor country is not limited to the United Kingdom, We allow investors from all parts of the world. The account cannot be created for anyone below 18 or legal investment age.',
  },
  {
    q: 'What if I forgot my password?',
    a: 'Click the login button, On the form function, there is an option to reset your password if you forget your previous password.',
  },
  {
    q: `What is the minimum amount required to invest with ${SITE.name}?`,
    a: 'Our program minimum deposit is $10, You can invest $10 from your eWallet account. Profit from the $10 deposit can be withdrawn at the end of the investment period or you can re-invest from your account balance.',
  },
  {
    q: 'Which e-currencies do you accept?',
    a: 'Members can invest with Bitcoin, Tron, Ethereum, Usdt, Perfect Money, Payeer, and Bitcoin Cash. Kindly note that you can contact us for other deposit options if you cannot use any of the options listed on this page.',
  },
  {
    q: 'How can I withdraw funds?',
    a: 'Login to your account using your username and password and check the Withdraw section. Withdrawal are processed manually all 7 days of the week and within 0 - 24 hours after withdrawal submission. You must withdraw into same payment method use for the website (e.g Bitcoin Deposit must be withdrawn into Bitcoin wallet)',
  },
  {
    q: 'How long does it take for my deposit to be added to my account?',
    a: 'All deposits made on this site are logged instantly, you should also get an instant email notification about this deposit.',
  },
  {
    q: 'Do you have any fees for my withdrawal?',
    a: 'We do not charge a fee for withdrawal, The payment fee for withdrawal is determined by your payment processor, we do not have control over such fee. We send exactly the amount submitted by you.',
  },
  {
    q: 'What is the minimum and maximum Withdrawal amount?',
    a: 'The minimum withdrawal amount is only $0.10 for Perfectmoney and Payeer, and for crypto-currency like bitcoin and bitcoin cash minimum withdrawal is $0.5. The maximum withdrawal amount has no limit.',
  },
  {
    q: 'How will I receive my referral commission?',
    a: 'The commission for a referral is added to the account balance as soon as they are earned. You can make withdraw of the commission from your account balance. Processing of commission takes between 0 - 24 hours as it is processed manually by our team.',
  },
  {
    q: 'Can change my account Email and Wallet Addresses?',
    a: 'We always change account email manually from our office for security reason, You may need to contact us to change your email address. eWallets address/accounts can be modified directly from your account area by clicking the "Edit Account" button.',
  },
  {
    q: 'How Reliable is this program?',
    a: 'Our investment resource is equipped with advanced methods of protection against DDoS-attacks and reliable data encryption this is an assurance that this website will always available to member. You can be completely sure that our team of experts will always guarantee returns from an investment of all members without any form of risk.',
  },
];

export default function FaqPage() {
  return (
    <LandingShell>
      <PageHeader title="F.A.Q" crumb="Faq" />

      <section className="get-to-know">
        <div className="container">
          <div className="row">
            <div className="col-xl-12">
              <div className="get-to-know__left">
                <div className="section-title text-left">
                  <h2 className="section-title__title">Frequently Asked Questions</h2>
                </div>

                {FAQS.map((item) => (
                  <div className="faqWrapper" key={item.q}>
                    <h5>{item.q}</h5>
                    <blockquote>
                      <p>{item.a}</p>
                    </blockquote>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
