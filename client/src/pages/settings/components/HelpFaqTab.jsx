import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import {
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiCompass,
  FiPieChart,
  FiTarget,
  FiZap,
  FiShield,
  FiHelpCircle
} from 'react-icons/fi';

const FAQ_ITEMS = [
  {
    id: 'daily-safe-limit',
    icon: FiClock,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    question: 'How is the Daily Safe Limit calculated?',
    answer:
      'Your Daily Safe Limit is calculated deterministically from your current real-time net balance divided by the exact days remaining in the current calendar month:\n\n' +
      '• Safe Daily Limit = Current Net Balance ÷ Days Remaining\n' +
      '• If today is the final day of the month, the entire remaining balance is available as your limit.\n' +
      '• If your balance is zero or negative, the safe limit displays 0 to prevent compounding student debt.',
  },
  {
    id: 'safe-runway',
    icon: FiCompass,
    color: 'text-info-400',
    bg: 'bg-info-400/10',
    question: 'What is "Safe Runway" and how does "Will My Money Last?" work?',
    answer:
      'The "Will My Money Last?" model estimates your cash runway before your next pocket money arrival:\n\n' +
      '• Daily Burn Rate: Calculated from your recent weighted daily spending rate so far this month.\n' +
      '• Estimated Days Runway = Current Balance ÷ Daily Burn Rate.\n' +
      '• If your projected runway is fewer days than the days left until your next allowance date, SmartExpense warns you of a projected shortfall and advises an adjusted daily cap to safely finish the month.',
  },
  {
    id: 'monthly-budgets',
    icon: FiPieChart,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    question: 'How do Monthly Budgets and category limits operate?',
    answer:
      'Budgets allow you to set an overall monthly ceiling as well as individual category caps (e.g. Food, Transport, Hostel):\n\n' +
      '• When category spending crosses 80%, a Caution status is triggered.\n' +
      '• When category spending crosses 100%, an Overspent alert is flagged.\n' +
      '• Past months retain their historical records so you can navigate back and analyze previous spending patterns.',
  },
  {
    id: 'savings-goals',
    icon: FiTarget,
    color: 'text-income-400',
    bg: 'bg-income-400/10',
    question: 'How do Savings Goals track feasibility?',
    answer:
      'Each Savings Goal tracks your target amount against your accumulated contributions:\n\n' +
      '• Daily Needed Savings = (Target Amount - Current Amount) ÷ Days Remaining until Target Date.\n' +
      '• Feasibility Indicator: Evaluates whether your monthly savings target accommodates the required monthly rate for this goal alongside your other obligations.',
  },
  {
    id: 'smart-saving-plan',
    icon: FiZap,
    color: 'text-warning-400',
    bg: 'bg-warning-400/10',
    question: 'How does the Smart Saving Planner generate reduction plans?',
    answer:
      'The Smart Saving Planner examines discretionary spending habits (e.g. Dining Out, Entertainment, Gadgets) versus non-negotiable obligations (e.g. Hostel Fees, Tuition, Rent):\n\n' +
      '• It measures the financial gap between your current savings rate and your target goal.\n' +
      '• It generates targeted, realistic percentage reductions (e.g. 15% off Cafe & Dining) specifically on flexible categories while leaving your fixed survival obligations untouched.',
  },
  {
    id: 'data-privacy',
    icon: FiShield,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    question: 'How is my student financial data protected?',
    answer:
      'SmartExpense follows modern web security standards:\n\n' +
      '• Passwords are cryptographically hashed using bcrypt (12 salt rounds) prior to storage.\n' +
      '• User sessions use JSON Web Tokens (JWT) with strict user-scoped database access controls (queries strictly isolated by user ID).\n' +
      '• Zero third-party advertising trackers and zero data brokering.\n' +
      '• Please note: SmartExpense is an educational financial planning tool and does not connect to external banking credentials.',
  },
];

const HelpFaqTab = () => {
  const [openId, setOpenId] = useState('daily-safe-limit');

  const toggleItem = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2">
              <FiHelpCircle className="text-info-400 text-lg" />
              <CardTitle>Help & Financial FAQs</CardTitle>
            </div>
            <CardDescription>
              Understand how SmartExpense calculates your safe spending limits, burn rates, and financial health scores.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {FAQ_ITEMS.map((item) => {
            const Icon = item.icon;
            const isOpen = openId === item.id;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all ${
                  isOpen
                    ? 'bg-dark-900 border-dark-700 shadow-lg shadow-dark-950/40'
                    : 'bg-dark-900/50 border-dark-800 hover:border-dark-750'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between p-4 text-left gap-3"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center ${item.color} shrink-0`}
                    >
                      <Icon className="text-base" />
                    </div>
                    <span className="text-sm font-semibold text-white tracking-tight">
                      {item.question}
                    </span>
                  </div>
                  <div className="text-dark-400 shrink-0">
                    {isOpen ? <FiChevronUp className="text-base" /> : <FiChevronDown className="text-base" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-dark-300 leading-relaxed border-t border-dark-800/80 whitespace-pre-line">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpFaqTab;
