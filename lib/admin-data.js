// Admin seed data (mirrors data/db.json). This is the file-backed "database" the
// admin panel reads from until a real MySQL backend is wired up.

export const ADMIN_STATS = [
  { label: 'Total Users', value: '12,458', icon: 'users', chip: 'chip-b', delta: '+128 this week' },
  { label: 'Total Deposits', value: '$2,841,320', icon: 'arrow-down', chip: 'chip-g', delta: '+$45,210 today' },
  { label: 'Total Withdrawals', value: '$1,124,554', icon: 'arrow-up', chip: 'chip-r', delta: '$5,000 pending' },
  { label: 'Active Investments', value: '3,204', icon: 'briefcase', chip: 'chip-p', delta: '12 plans running' },
];

export const USERS = [
  { id: 'TC-48-2091', name: 'Alexander Carter', email: 'alexander.carter@teslacapital.io', balance: '$43,753.13', kyc: 'Verified', joined: 'Mar 2024', status: 'Active' },
  { id: 'TC-48-2092', name: 'Paul Morgan', email: 'paul.morgan@teslacapital.io', balance: '$842,100.00', kyc: 'Verified', joined: 'Jan 2025', status: 'Active' },
  { id: 'TC-48-2093', name: 'Sarah Chen', email: 'sarah.chen@teslacapital.io', balance: '$12,450.00', kyc: 'Pending', joined: 'Aug 2025', status: 'Active' },
  { id: 'TC-48-2094', name: 'Michael Ross', email: 'michael.ross@teslacapital.io', balance: '$5,200.00', kyc: 'Not Submitted', joined: 'Nov 2025', status: 'Suspended' },
  { id: 'TC-48-2095', name: 'Amara Okafor', email: 'amara.okafor@teslacapital.io', balance: '$98,760.00', kyc: 'Verified', joined: 'Feb 2026', status: 'Active' },
];

export const DEPOSITS = [
  { id: 'D-1001', user: 'Alexander Carter', amount: '$25,000.00', method: 'Bitcoin', status: 'Confirmed', date: 'Sep 5, 2026' },
  { id: 'D-1002', user: 'Paul Morgan', amount: '$120,000.00', method: 'Ethereum', status: 'Confirmed', date: 'Sep 4, 2026' },
  { id: 'D-1003', user: 'Sarah Chen', amount: '$3,500.00', method: 'Tether', status: 'Pending', date: 'Sep 8, 2026' },
  { id: 'D-1004', user: 'Amara Okafor', amount: '$18,000.00', method: 'Solana', status: 'Confirmed', date: 'Sep 2, 2026' },
];

export const WITHDRAWALS = [
  { id: 'W-2001', user: 'Alexander Carter', amount: '$5,000.00', method: 'USDT · TRC-20', status: 'Pending', date: 'Sep 3, 2026' },
  { id: 'W-2002', user: 'Paul Morgan', amount: '$40,000.00', method: 'Bitcoin', status: 'Processed', date: 'Aug 30, 2026' },
  { id: 'W-2003', user: 'Amara Okafor', amount: '$2,500.00', method: 'Ethereum', status: 'Pending', date: 'Sep 7, 2026' },
];

export const PLANS = [
  { id: 'P-01', name: 'Tesla Growth Fund', min: '$100', interest: '28.5%', duration: 'Flexible', status: 'Active' },
  { id: 'P-02', name: 'Blue Chip Staking', min: '$500', interest: '18.4%', duration: '12 months', status: 'Active' },
  { id: 'P-03', name: 'Crypto Yield', min: '$1,000', interest: '22.0%', duration: '3 months', status: 'Active' },
  { id: 'P-04', name: 'Starter Mining · 50 TH/s', min: '$2,500', interest: '0.000156 BTC/day', duration: '180 days', status: 'Active' },
];

export const RECENT_ACTIVITY = [
  { text: 'Alexander Carter made a deposit of $25,000.00', time: '2h ago' },
  { text: 'New withdrawal request from Paul Morgan ($40,000.00)', time: '5h ago' },
  { text: 'Sarah Chen registered a new account', time: '1d ago' },
  { text: 'KYC application submitted by Michael Ross', time: '1d ago' },
];

export const KYC = [
  { id: 'KYC-01', name: 'Sarah Chen', email: 'sarah.chen@teslacapital.io', type: 'Passport', date: 'Sep 8, 2026', status: 'Pending' },
  { id: 'KYC-02', name: 'Michael Ross', email: 'michael.ross@teslacapital.io', type: 'ID Card', date: 'Sep 7, 2026', status: 'Pending' },
  { id: 'KYC-03', name: 'Amara Okafor', email: 'amara.okafor@teslacapital.io', type: 'Drivers License', date: 'Sep 1, 2026', status: 'Approved' },
  { id: 'KYC-04', name: 'James Wilson', email: 'james.wilson@teslacapital.io', type: 'Passport', date: 'Aug 28, 2026', status: 'Rejected' },
];

export const TICKETS = [
  { id: '#4821', subject: 'Deposit not credited', user: 'Sarah Chen', priority: 'High', status: 'Open', date: 'Sep 8, 2026' },
  { id: '#4820', subject: 'Withdrawal pending for 3 days', user: 'Amara Okafor', priority: 'Medium', status: 'Open', date: 'Sep 7, 2026' },
  { id: '#4819', subject: 'Login issue after 2FA', user: 'Michael Ross', priority: 'Low', status: 'Resolved', date: 'Sep 5, 2026' },
];

export const MINING_PLANS = [
  { name: 'Starter · 50 TH/s', coin: 'BTC', hashrate: '50 TH/s', price: '$2,500', duration: '180 days', status: 'Active' },
  { name: 'Growth · 200 TH/s', coin: 'ETH', hashrate: '200 TH/s', price: '$9,800', duration: '365 days', status: 'Active' },
  { name: 'Pro · 1 PH/s', coin: 'SOL', hashrate: '1 PH/s', price: '$46,000', duration: '730 days', status: 'Active' },
];

export const ACTIVE_INVESTMENTS = [
  { user: 'Alexander Carter', plan: 'Growth Fund', amount: '$50,000', start: 'Aug 1, 2026', end: 'Sep 1, 2026', status: 'Active' },
  { user: 'Paul Morgan', plan: 'Blue Chip Staking', amount: '$120,000', start: 'Aug 20, 2026', end: 'Nov 20, 2026', status: 'Active' },
  { user: 'Sarah Chen', plan: 'Crypto Yield', amount: '$30,000', start: 'Jun 15, 2026', end: 'Jul 15, 2026', status: 'Expired' },
];
